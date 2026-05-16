import {useEffect, useRef, useCallback, useState} from 'react';
import useStateWithCallback from './useStateWithCallback';
import socket from '../socket';
import ACTIONS from '../socket/actions';
import { consumeRoomTitleForJoin } from '../roomTitleBridge.js';
import { getOrCreateTabPlayerToken } from '../profileSession.js';
import {
  buildDefaultIceServers,
  buildRtcConfiguration,
  ensureAudioTransceiver,
  fetchIceServersFromApi,
  iceServersIncludePrivateTurn,
} from '../webrtcIceConfig.js';
import {
  logPeerConnectionStats,
  summarizeIceCandidate,
  webrtcLog,
  webrtcWarn,
} from '../webrtcDebug.js';

export const LOCAL_AUDIO = 'LOCAL_AUDIO';

const WATCHDOG_INTERVAL_MS = 2500;
const WATCHDOG_MAX_MS = 10 * 60 * 1000;
const MEDIA_STATS_INTERVAL_MS = 3000;
const NO_INBOUND_AUDIO_MS = 8000;

function shouldCreateOffer(localSocketId, remotePeerId) {
  return String(localSocketId) < String(remotePeerId);
}

function hasLiveRemoteAudio(pc) {
  if (!pc) {
    return false;
  }
  const receivers = pc.getReceivers?.() || [];
  return receivers.some((r) => r.track?.kind === 'audio' && r.track.readyState === 'live');
}

function isPeerIceUp(pc) {
  if (!pc || pc.signalingState === 'closed') {
    return false;
  }
  if (pc.connectionState === 'connected' || pc.iceConnectionState === 'connected') {
    return true;
  }
  return pc.iceConnectionState === 'completed';
}

function hasRemoteAudioTrack(pc) {
  if (!pc) {
    return false;
  }
  const receivers = pc.getReceivers?.() || [];
  return receivers.some((r) => r.track?.kind === 'audio');
}

function isPeerConnectionUp(pc) {
  return isPeerIceUp(pc);
}

export default function useWebRTC(roomID) {
  const [clients, updateClients] = useStateWithCallback([]);
  const [micMuted, setMicMuted] = useState(true);
  const micMutedRef = useRef(true);
  const joinedRoomRef = useRef(null);
  const joinGenerationRef = useRef(0);
  const knownPeersRef = useRef(new Set());
  const iceServersRef = useRef(buildDefaultIceServers());
  const peerForceRelayRef = useRef({});
  const peerMediaStatsRef = useRef({});
  const mediaStatsTimers = useRef({});
  const hasPrivateTurnRef = useRef(false);

  function getOrCreatePlayerToken() {
    return getOrCreateTabPlayerToken(roomID || 'global');
  }

  const addNewClient = useCallback((newClient, cb) => {
    updateClients((list) => {
      if (!list.includes(newClient)) {
        return [...list, newClient];
      }
      return list;
    }, cb);
  }, [updateClients]);

  const peerConnections = useRef({});
  const remoteStreams = useRef({});
  const makingOffer = useRef({});
  const ignoreOffer = useRef({});
  const politePeer = useRef({});
  const pendingIceCandidates = useRef({});
  const pendingRemoteDescriptions = useRef({});
  const pendingIceBeforePc = useRef({});
  const pendingOffers = useRef({});
  const connectionWatchdogs = useRef({});
  const localMediaStream = useRef(null);
  const peerMediaElements = useRef({
    [LOCAL_AUDIO]: null,
  });

  const isPeerConnected = useCallback((peerID) => {
    return isPeerConnectionUp(peerConnections.current[peerID]);
  }, []);

  const playAllRemoteAudio = useCallback(() => {
    Object.entries(peerMediaElements.current).forEach(([id, audioEl]) => {
      if (id === LOCAL_AUDIO || !audioEl?.srcObject) {
        return;
      }
      audioEl.volume = 1;
      audioEl.muted = false;
      audioEl.setAttribute('playsinline', 'true');
      audioEl.setAttribute('webkit-playsinline', 'true');
      if (typeof audioEl.play === 'function') {
        audioEl.play().catch(() => {});
      }
    });
  }, []);

  const attachLocalTracksToPeer = useCallback((peerID) => {
    const pc = peerConnections.current[peerID];
    const stream = localMediaStream.current;
    if (!pc || pc.signalingState === 'closed' || !stream?.getTracks) {
      return false;
    }
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) {
      return false;
    }
    const sender = pc.getSenders().find((s) => s.track?.kind === 'audio');
    if (sender) {
      if (sender.track?.id !== audioTrack.id) {
        sender.replaceTrack(audioTrack).catch((e) => {
          webrtcWarn(peerID, 'replaceTrack failed', e);
        });
      }
    } else {
      const tr = pc.getTransceivers().find((t) => (
        t.sender?.track?.kind === 'audio' || t.receiver?.track?.kind === 'audio' || !t.mid
      ));
      if (tr?.sender) {
        tr.direction = 'sendrecv';
        tr.sender.replaceTrack(audioTrack).catch(() => {
          pc.addTrack(audioTrack, stream);
        });
      } else {
        pc.addTrack(audioTrack, stream);
      }
    }
    ensureAudioTransceiver(pc, true);
    return true;
  }, []);

  const ensureLocalAudioStream = useCallback(async () => {
    if (localMediaStream.current) {
      return localMediaStream.current;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      console.error('getUserMedia API is not supported');
      return null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });
      localMediaStream.current = stream;
      addNewClient(LOCAL_AUDIO, () => {});
      return stream;
    } catch (e) {
      console.error('Error getting userMedia:', e);
      return null;
    }
  }, [addNewClient]);

  const sendOfferToPeer = useCallback(async (peerID, { force = false } = {}) => {
    const pc = peerConnections.current[peerID];
    if (!pc || pc.signalingState === 'closed') {
      return false;
    }
    if (makingOffer.current[peerID]) {
      return false;
    }
    if (!force && pc.signalingState !== 'stable' && pc.signalingState !== 'have-local-offer') {
      return false;
    }
    try {
      makingOffer.current[peerID] = true;
      attachLocalTracksToPeer(peerID);
      ensureAudioTransceiver(pc, Boolean(localMediaStream.current?.getAudioTracks?.().length));
      const needsRestart = pc.connectionState === 'failed'
        || pc.iceConnectionState === 'failed'
        || pc.iceConnectionState === 'disconnected';
      await pc.setLocalDescription(await pc.createOffer({
        offerToReceiveAudio: true,
        iceRestart: needsRestart,
      }));
      socket.emit(ACTIONS.RELAY_SDP, {
        peerID,
        sessionDescription: pc.localDescription,
      });
      return true;
    } catch (e) {
      console.error('WebRTC offer failed:', e);
      return false;
    } finally {
      makingOffer.current[peerID] = false;
    }
  }, [attachLocalTracksToPeer]);

  const stopConnectionWatchdog = useCallback((peerID) => {
    const wd = connectionWatchdogs.current[peerID];
    if (wd?.timerId) {
      clearInterval(wd.timerId);
    }
    delete connectionWatchdogs.current[peerID];
  }, []);

  const stopMediaStatsMonitor = useCallback((peerID) => {
    if (mediaStatsTimers.current[peerID]) {
      clearInterval(mediaStatsTimers.current[peerID]);
      delete mediaStatsTimers.current[peerID];
    }
    delete peerMediaStatsRef.current[peerID];
  }, []);

  const connectToPeerRef = useRef(null);
  const startConnectionWatchdogRef = useRef(null);
  const escalatePeerToRelayRef = useRef(null);
  const escalatePeerToDirectRef = useRef(null);

  const resetPeerConnection = useCallback((peerID) => {
    const pc = peerConnections.current[peerID];
    if (pc) {
      try {
        pc.close();
      } catch (_) {
        /* ignore */
      }
    }
    stopMediaStatsMonitor(peerID);
    delete peerConnections.current[peerID];
    delete remoteStreams.current[peerID];
    delete makingOffer.current[peerID];
    delete politePeer.current[peerID];
    delete ignoreOffer.current[peerID];
    delete pendingIceCandidates.current[peerID];
    delete pendingRemoteDescriptions.current[peerID];
    delete pendingIceBeforePc.current[peerID];
    delete pendingOffers.current[peerID];
    updateClients((list) => list.filter((c) => c !== peerID));
  }, [updateClients, stopMediaStatsMonitor]);

  const handleRemoteTrackRef = useRef(() => {});

  const bindRemoteTrack = useCallback((peerID, remoteStream) => {
    if (!remoteStream) {
      return;
    }
    addNewClient(peerID, () => {
      const attachToElement = (audioEl) => {
        if (!audioEl) {
          return;
        }
        audioEl.volume = 1;
        audioEl.muted = false;
        audioEl.srcObject = remoteStream;
        if (typeof audioEl.play === 'function') {
          audioEl.play().catch(() => {});
        }
        playAllRemoteAudio();
      };
      const el = peerMediaElements.current[peerID];
      if (el) {
        attachToElement(el);
      } else {
        let attempts = 0;
        const interval = setInterval(() => {
          attempts += 1;
          const audioEl = peerMediaElements.current[peerID];
          if (audioEl) {
            attachToElement(audioEl);
            clearInterval(interval);
          } else if (attempts > 60) {
            clearInterval(interval);
          }
        }, 200);
      }
    });
  }, [addNewClient, playAllRemoteAudio]);

  const handleRemoteTrack = useCallback((peerID, event) => {
    let stream = remoteStreams.current[peerID];
    if (!stream) {
      stream = event.streams?.[0] || new MediaStream();
      remoteStreams.current[peerID] = stream;
    }
    if (event.track && !stream.getTracks().some((t) => t.id === event.track.id)) {
      stream.addTrack(event.track);
      event.track.enabled = true;
    }
    const onTrackReady = () => {
      webrtcLog(peerID, 'track-ready', {
        id: event.track?.id,
        muted: event.track?.muted,
        readyState: event.track?.readyState,
      });
      playAllRemoteAudio();
    };
    event.track.onunmute = onTrackReady;
    event.track.onended = () => webrtcWarn(peerID, 'track-ended');
    webrtcLog(peerID, 'remote-track', {
      id: event.track?.id,
      readyState: event.track?.readyState,
      muted: event.track?.muted,
    });
    if (!event.track.muted && event.track.readyState === 'live') {
      onTrackReady();
    }
    bindRemoteTrack(peerID, stream);
    playAllRemoteAudio();
    if (hasLiveRemoteAudio(peerConnections.current[peerID])) {
      stopConnectionWatchdog(peerID);
    }
  }, [bindRemoteTrack, playAllRemoteAudio, stopConnectionWatchdog]);

  handleRemoteTrackRef.current = handleRemoteTrack;

  const createPeerConnection = useCallback((peerID, { isPolite = false, forceRelay = false } = {}) => {
    const pc = new RTCPeerConnection(buildRtcConfiguration(iceServersRef.current, {
      relayOnly: forceRelay,
    }));
    peerConnections.current[peerID] = pc;
    politePeer.current[peerID] = isPolite;
    makingOffer.current[peerID] = false;
    ignoreOffer.current[peerID] = false;
    pendingIceCandidates.current[peerID] = [];

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        webrtcLog(peerID, 'local-candidate', summarizeIceCandidate(event.candidate));
        socket.emit(ACTIONS.RELAY_ICE, {
          peerID,
          iceCandidate: event.candidate,
        });
      } else {
        webrtcLog(peerID, 'local-candidates-done');
      }
    };

    ensureAudioTransceiver(pc, Boolean(localMediaStream.current?.getAudioTracks?.().length));

    pc.ontrack = (event) => {
      handleRemoteTrackRef.current(peerID, event);
    };

    pc.onconnectionstatechange = () => {
      webrtcLog(peerID, 'connection-state', pc.connectionState);
      if (isPeerIceUp(pc)) {
        playAllRemoteAudio();
      }
      if (hasLiveRemoteAudio(pc)) {
        stopConnectionWatchdog(peerID);
      }
    };

    pc.oniceconnectionstatechange = () => {
      webrtcLog(peerID, 'ice-state', pc.iceConnectionState);
      if (isPeerIceUp(pc)) {
        playAllRemoteAudio();
      }
      if (hasLiveRemoteAudio(pc)) {
        stopConnectionWatchdog(peerID);
      }
    };

    webrtcLog(peerID, 'pc-created', { forceRelay, isPolite });
    return pc;
  }, [playAllRemoteAudio, stopConnectionWatchdog]);

  const flushQueuedIceCandidates = useCallback(async (peerID) => {
    const pc = peerConnections.current[peerID];
    if (!pc?.remoteDescription) {
      return;
    }
    const queued = pendingIceCandidates.current[peerID];
    if (!Array.isArray(queued) || queued.length === 0) {
      return;
    }
    pendingIceCandidates.current[peerID] = [];
    for (const c of queued) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await pc.addIceCandidate(new RTCIceCandidate(c));
      } catch (e) {
        console.warn('ICE candidate (queued) add failed:', e);
      }
    }
  }, []);

  const applyRemoteMedia = useCallback(async (peerID, remoteDescription) => {
    const pc = peerConnections.current[peerID];
    if (!pc) {
      return false;
    }
    const desc = new RTCSessionDescription(remoteDescription);

    const offerCollision = desc.type === 'offer'
      && (makingOffer.current[peerID] || pc.signalingState !== 'stable');

    ignoreOffer.current[peerID] = !politePeer.current[peerID] && offerCollision;
    if (ignoreOffer.current[peerID]) {
      return false;
    }

    try {
      if (desc.type === 'answer' && pc.signalingState !== 'have-local-offer') {
        return false;
      }

      if (desc.type === 'offer' && pc.signalingState !== 'stable') {
        await pc.setLocalDescription({ type: 'rollback' });
      }

      await pc.setRemoteDescription(desc);
      await flushQueuedIceCandidates(peerID);

      if (desc.type === 'offer') {
        attachLocalTracksToPeer(peerID);
        ensureAudioTransceiver(pc, Boolean(localMediaStream.current?.getAudioTracks?.().length));
        await pc.setLocalDescription(await pc.createAnswer());
        socket.emit(ACTIONS.RELAY_SDP, {
          peerID,
          sessionDescription: pc.localDescription,
        });
      }
      return true;
    } catch (e) {
      console.error('WebRTC setRemoteMedia failed:', e);
      return false;
    }
  }, [attachLocalTracksToPeer, flushQueuedIceCandidates]);

  const flushPendingSignalingForPeer = useCallback(async (peerID) => {
    const earlyIce = pendingIceBeforePc.current[peerID];
    if (Array.isArray(earlyIce) && earlyIce.length > 0) {
      if (!pendingIceCandidates.current[peerID]) {
        pendingIceCandidates.current[peerID] = [];
      }
      pendingIceCandidates.current[peerID].push(...earlyIce);
      delete pendingIceBeforePc.current[peerID];
    }
    const queue = pendingRemoteDescriptions.current[peerID];
    if (Array.isArray(queue) && queue.length > 0) {
      pendingRemoteDescriptions.current[peerID] = [];
      for (const pendingDesc of queue) {
        // eslint-disable-next-line no-await-in-loop
        await applyRemoteMedia(peerID, pendingDesc);
      }
    }
  }, [applyRemoteMedia]);

  const connectToPeer = useCallback(async (peerID, { shouldOffer } = {}) => {
    if (!peerID || peerID === socket.id) {
      return;
    }

    knownPeersRef.current.add(peerID);

    const wantOffer = shouldOffer === true
      || (shouldOffer !== false && shouldCreateOffer(socket.id, peerID));

    if (peerID in peerConnections.current) {
      const pc = peerConnections.current[peerID];
      if (isPeerIceUp(pc) && hasRemoteAudioTrack(pc)) {
        return;
      }
      if (wantOffer && pc.signalingState === 'stable') {
        await sendOfferToPeer(peerID, { force: true });
      }
      return;
    }

    void ensureLocalAudioStream();

    const forceRelay = Boolean(peerForceRelayRef.current[peerID]);
    webrtcLog(peerID, forceRelay ? 'connect ICE policy: relay' : 'connect ICE policy: all', {
      wantOffer,
    });
    createPeerConnection(peerID, { isPolite: !wantOffer, forceRelay });
    attachLocalTracksToPeer(peerID);
    await flushPendingSignalingForPeer(peerID);

    if (wantOffer) {
      if (localMediaStream.current) {
        await sendOfferToPeer(peerID, { force: true });
      } else {
        pendingOffers.current[peerID] = true;
      }
    }
  }, [
    attachLocalTracksToPeer,
    sendOfferToPeer,
    flushPendingSignalingForPeer,
    createPeerConnection,
    ensureLocalAudioStream,
  ]);

  connectToPeerRef.current = connectToPeer;

  const startConnectionWatchdog = useCallback((peerID, { preferredOfferer = false } = {}) => {
    if (!peerID || peerID === socket.id) {
      return;
    }
    stopConnectionWatchdog(peerID);

    const startedAt = Date.now();
    let attempt = 0;

    const tick = async () => {
      if (!knownPeersRef.current.has(peerID)) {
        stopConnectionWatchdog(peerID);
        return;
      }
      if (Date.now() - startedAt > WATCHDOG_MAX_MS) {
        stopConnectionWatchdog(peerID);
        return;
      }
      const pc = peerConnections.current[peerID];
      if (pc && isPeerIceUp(pc)) {
        attachLocalTracksToPeer(peerID);
        playAllRemoteAudio();
        if (hasLiveRemoteAudio(pc)) {
          stopConnectionWatchdog(peerID);
          return;
        }
      }

      attempt += 1;
      const shouldTryOffer = preferredOfferer
        || shouldCreateOffer(socket.id, peerID)
        || attempt % 2 === 0;

      if (!pc) {
        await connectToPeerRef.current?.(peerID, { shouldOffer: shouldTryOffer });
        return;
      }

      const failed = pc.connectionState === 'failed'
        || pc.iceConnectionState === 'failed'
        || pc.signalingState === 'closed';

      const stuck = failed
        || (attempt > 6 && !isPeerIceUp(pc));

      if (stuck) {
        if (attempt >= 5 && !peerForceRelayRef.current[peerID]) {
          peerForceRelayRef.current[peerID] = true;
        } else if (attempt >= 10 && peerForceRelayRef.current[peerID]) {
          peerForceRelayRef.current[peerID] = false;
        }
        resetPeerConnection(peerID);
        await connectToPeerRef.current?.(peerID, { shouldOffer: shouldTryOffer });
        return;
      }

      attachLocalTracksToPeer(peerID);
      playAllRemoteAudio();

      if (shouldTryOffer && pc.signalingState === 'stable') {
        await sendOfferToPeer(peerID, { force: true });
      }
    };

    tick().catch(() => {});
    const timerId = setInterval(() => {
      tick().catch(() => {});
    }, WATCHDOG_INTERVAL_MS);
    connectionWatchdogs.current[peerID] = { timerId, startedAt };
  }, [
    isPeerConnected,
    stopConnectionWatchdog,
    resetPeerConnection,
    attachLocalTracksToPeer,
    sendOfferToPeer,
    playAllRemoteAudio,
  ]);

  startConnectionWatchdogRef.current = startConnectionWatchdog;

  const startMediaStatsMonitor = useCallback((peerID) => {
    stopMediaStatsMonitor(peerID);
    peerMediaStatsRef.current[peerID] = {
      lastInbound: 0,
      lastGrowthAt: Date.now(),
      iceUpSince: null,
      pcStartedAt: Date.now(),
    };

    mediaStatsTimers.current[peerID] = setInterval(async () => {
      const pc = peerConnections.current[peerID];
      if (!pc || pc.signalingState === 'closed') {
        return;
      }

      const { inboundAudioBytes, pathString } = await logPeerConnectionStats(peerID, pc);
      const st = peerMediaStatsRef.current[peerID];
      if (!st) {
        return;
      }

      if (isPeerIceUp(pc)) {
        if (!st.iceUpSince) {
          st.iceUpSince = Date.now();
          webrtcLog(peerID, 'ice connected (stats)');
        }
        if (inboundAudioBytes > st.lastInbound) {
          st.lastInbound = inboundAudioBytes;
          st.lastGrowthAt = Date.now();
        }

        if (hasLiveRemoteAudio(pc)) {
          webrtcLog(peerID, 'remote audio OK', pathString || 'n/a');
          stopConnectionWatchdog(peerID);
        } else if (
          Date.now() - st.lastGrowthAt > NO_INBOUND_AUDIO_MS
          && Date.now() - (st.iceUpSince || 0) > NO_INBOUND_AUDIO_MS
        ) {
          if (!peerForceRelayRef.current[peerID]) {
            await escalatePeerToRelayRef.current?.(peerID, 'нет входящего звука → пробуем TURN');
          } else {
            await escalatePeerToDirectRef.current?.(peerID, 'TURN не даёт звук → пробуем all');
          }
        }
      } else if (
        peerForceRelayRef.current[peerID]
        && (pc.iceConnectionState === 'new' || pc.iceConnectionState === 'checking')
        && Date.now() - (st.pcStartedAt || 0) > 12000
      ) {
        await escalatePeerToDirectRef.current?.(peerID, 'TURN не подключается (ice new)');
      }
    }, MEDIA_STATS_INTERVAL_MS);
  }, [stopMediaStatsMonitor, stopConnectionWatchdog]);

  const escalatePeerToDirect = useCallback(async (peerID, reason) => {
    webrtcWarn(peerID, 'switch to all ICE', reason);
    peerForceRelayRef.current[peerID] = false;
    resetPeerConnection(peerID);
    const shouldOffer = shouldCreateOffer(socket.id, peerID);
    await connectToPeerRef.current?.(peerID, { shouldOffer });
    startConnectionWatchdogRef.current?.(peerID, { preferredOfferer: shouldOffer });
    startMediaStatsMonitor(peerID);
  }, [resetPeerConnection, startMediaStatsMonitor]);

  const escalatePeerToRelay = useCallback(async (peerID, reason) => {
    webrtcWarn(peerID, 'switch to TURN relay', reason);
    peerForceRelayRef.current[peerID] = true;
    resetPeerConnection(peerID);
    const shouldOffer = shouldCreateOffer(socket.id, peerID);
    await connectToPeerRef.current?.(peerID, { shouldOffer });
    startConnectionWatchdogRef.current?.(peerID, { preferredOfferer: shouldOffer });
    startMediaStatsMonitor(peerID);
  }, [resetPeerConnection, startMediaStatsMonitor]);

  escalatePeerToRelayRef.current = escalatePeerToRelay;
  escalatePeerToDirectRef.current = escalatePeerToDirect;

  const registerPeer = useCallback(async (peerID, { shouldOffer, preferredOfferer } = {}) => {
    knownPeersRef.current.add(peerID);
    webrtcLog(peerID, 'register-peer', { shouldOffer, preferredOfferer });
    await connectToPeer(peerID, { shouldOffer });
    startConnectionWatchdog(peerID, { preferredOfferer: Boolean(preferredOfferer || shouldOffer) });
    startMediaStatsMonitor(peerID);
  }, [connectToPeer, startConnectionWatchdog, startMediaStatsMonitor]);

  const renegotiateAllPeersWithLocalTracks = useCallback(async () => {
    const peerIDs = [...knownPeersRef.current];
    for (const peerID of peerIDs) {
      const pc = peerConnections.current[peerID];
      if (!pc || pc.signalingState === 'closed') {
        continue;
      }
      attachLocalTracksToPeer(peerID);
      if (pc.signalingState === 'stable' && shouldCreateOffer(socket.id, peerID)) {
        // eslint-disable-next-line no-await-in-loop
        await sendOfferToPeer(peerID, { force: true });
      }
      startConnectionWatchdog(peerID, { preferredOfferer: shouldCreateOffer(socket.id, peerID) });
    }
  }, [attachLocalTracksToPeer, sendOfferToPeer, startConnectionWatchdog]);

  const flushPendingOffers = useCallback(async () => {
    const pending = { ...pendingOffers.current };
    pendingOffers.current = {};
    for (const peerID of Object.keys(pending)) {
      if (pending[peerID] && peerConnections.current[peerID]) {
        // eslint-disable-next-line no-await-in-loop
        await sendOfferToPeer(peerID, { force: true });
      }
    }
  }, [sendOfferToPeer]);

  const onLocalStreamReady = useCallback(async () => {
    await renegotiateAllPeersWithLocalTracks();
    await flushPendingOffers();
  }, [renegotiateAllPeersWithLocalTracks, flushPendingOffers]);

  useEffect(() => {
    async function handleNewPeer({ peerID, createOffer }) {
      await registerPeer(peerID, {
        shouldOffer: Boolean(createOffer),
        preferredOfferer: Boolean(createOffer),
      });
    }

    async function handleSyncPeers({ peerIds }) {
      if (!Array.isArray(peerIds)) {
        return;
      }
      for (const peerID of peerIds) {
        if (!peerID || peerID === socket.id) {
          continue;
        }
        if (isPeerConnected(peerID)) {
          knownPeersRef.current.add(peerID);
          continue;
        }
        const hasPc = Boolean(peerConnections.current[peerID]);
        const shouldOffer = hasPc ? false : shouldCreateOffer(socket.id, peerID);
        // eslint-disable-next-line no-await-in-loop
        await registerPeer(peerID, {
          shouldOffer,
          preferredOfferer: shouldOffer,
        });
      }
    }

    socket.on(ACTIONS.ADD_PEER, handleNewPeer);
    socket.on(ACTIONS.SYNC_PEERS, handleSyncPeers);

    return () => {
      socket.off(ACTIONS.ADD_PEER, handleNewPeer);
      socket.off(ACTIONS.SYNC_PEERS, handleSyncPeers);
    };
  }, [registerPeer, isPeerConnected]);

  useEffect(() => {
    async function setRemoteMedia({ peerID, sessionDescription: remoteDescription }) {
      if (!peerID || peerID === socket.id) {
        return;
      }
      knownPeersRef.current.add(peerID);

      let pc = peerConnections.current[peerID];
      if (!pc) {
        if (!pendingRemoteDescriptions.current[peerID]) {
          pendingRemoteDescriptions.current[peerID] = [];
        }
        pendingRemoteDescriptions.current[peerID].push(remoteDescription);
        await connectToPeer(peerID, { shouldOffer: false });
        startConnectionWatchdog(peerID, { preferredOfferer: false });
        return;
      }
      await applyRemoteMedia(peerID, remoteDescription);
    }

    socket.on(ACTIONS.SESSION_DESCRIPTION, setRemoteMedia);

    return () => {
      socket.off(ACTIONS.SESSION_DESCRIPTION, setRemoteMedia);
    };
  }, [applyRemoteMedia, connectToPeer, startConnectionWatchdog]);

  useEffect(() => {
    socket.on(ACTIONS.ICE_CANDIDATE, async ({ peerID, iceCandidate }) => {
      if (!peerID || peerID === socket.id) {
        return;
      }
      knownPeersRef.current.add(peerID);

      let pc = peerConnections.current[peerID];
      if (!pc) {
        if (!pendingIceBeforePc.current[peerID]) {
          pendingIceBeforePc.current[peerID] = [];
        }
        pendingIceBeforePc.current[peerID].push(iceCandidate);
        await connectToPeer(peerID, { shouldOffer: false });
        startConnectionWatchdog(peerID, { preferredOfferer: false });
        pc = peerConnections.current[peerID];
      }
      if (!pc) {
        return;
      }
      if (!pc.remoteDescription) {
        if (!pendingIceCandidates.current[peerID]) {
          pendingIceCandidates.current[peerID] = [];
        }
        pendingIceCandidates.current[peerID].push(iceCandidate);
        return;
      }
      pc.addIceCandidate(new RTCIceCandidate(iceCandidate)).catch((e) => {
        console.warn('ICE candidate add failed:', e);
      });
    });

    return () => {
      socket.off(ACTIONS.ICE_CANDIDATE);
    };
  }, [connectToPeer, startConnectionWatchdog]);

  useEffect(() => {
    const handleRemovePeer = ({ peerID }) => {
      knownPeersRef.current.delete(peerID);
      stopConnectionWatchdog(peerID);
      stopMediaStatsMonitor(peerID);

      if (peerConnections.current[peerID]) {
        peerConnections.current[peerID].close();
      }

      delete peerConnections.current[peerID];
      delete remoteStreams.current[peerID];
      delete peerMediaElements.current[peerID];
      delete pendingIceCandidates.current[peerID];
      delete pendingRemoteDescriptions.current[peerID];
      delete pendingIceBeforePc.current[peerID];
      delete pendingOffers.current[peerID];
      delete makingOffer.current[peerID];
      delete politePeer.current[peerID];
      delete ignoreOffer.current[peerID];
      delete peerForceRelayRef.current[peerID];

      updateClients((list) => list.filter((c) => c !== peerID));
    };

    socket.on(ACTIONS.REMOVE_PEER, handleRemovePeer);

    return () => {
      socket.off(ACTIONS.REMOVE_PEER, handleRemovePeer);
    };
  }, [updateClients, stopConnectionWatchdog]);

  useEffect(() => {
    if (!roomID) {
      return undefined;
    }

    const joinGen = ++joinGenerationRef.current;
    let cancelled = false;

    (async () => {
      iceServersRef.current = await fetchIceServersFromApi();
      hasPrivateTurnRef.current = iceServersIncludePrivateTurn(iceServersRef.current);
      webrtcLog('room', 'ice-servers-ready', {
        count: iceServersRef.current.length,
        privateTurn: hasPrivateTurnRef.current,
        roomID,
      });
      if (cancelled) {
        return;
      }
      await ensureLocalAudioStream();
      if (cancelled) {
        return;
      }
      await onLocalStreamReady();
      if (cancelled) {
        return;
      }

      const token = getOrCreatePlayerToken();
      const roomDisplayName = consumeRoomTitleForJoin(roomID) || undefined;
      socket.emit(ACTIONS.JOIN, {
        room: roomID,
        token,
        roomDisplayName,
      });
      joinedRoomRef.current = roomID;
      socket.emit('message', { method: 'RequestRoomLobby', roomID });
    })().catch((e) => console.error('useWebRTC room join failed:', e));

    return () => {
      cancelled = true;
      if (joinGen !== joinGenerationRef.current) {
        return;
      }
      Object.keys(connectionWatchdogs.current).forEach((peerID) => {
        stopConnectionWatchdog(peerID);
      });
      if (localMediaStream.current) {
        localMediaStream.current.getTracks().forEach((track) => track.stop());
        localMediaStream.current = null;
      }
      if (joinedRoomRef.current) {
        socket.emit(ACTIONS.LEAVE);
        joinedRoomRef.current = null;
      }
      knownPeersRef.current.clear();
    };
  }, [roomID, ensureLocalAudioStream, onLocalStreamReady, stopConnectionWatchdog]);

  const setLocalMicEnabled = useCallback((enabled) => {
    const stream = localMediaStream.current;
    if (stream?.getAudioTracks) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
    Object.keys(peerConnections.current).forEach((peerID) => {
      const pc = peerConnections.current[peerID];
      pc?.getSenders?.().forEach((sender) => {
        if (sender.track?.kind === 'audio') {
          sender.track.enabled = enabled;
        }
      });
    });
  }, []);

  const toggleMicMute = useCallback(async () => {
    const willMute = !micMutedRef.current;
    micMutedRef.current = willMute;
    setMicMuted(willMute);

    if (!willMute) {
      if (!localMediaStream.current) {
        await ensureLocalAudioStream();
      }
      setLocalMicEnabled(true);
      webrtcLog('mic', 'unmuted — renegotiate peers');
      await onLocalStreamReady();
    } else {
      setLocalMicEnabled(false);
      webrtcLog('mic', 'muted');
    }
    playAllRemoteAudio();
  }, [ensureLocalAudioStream, onLocalStreamReady, setLocalMicEnabled, playAllRemoteAudio]);

  useEffect(() => {
    micMutedRef.current = micMuted;
  }, [micMuted]);

  useEffect(() => {
    const unlock = () => playAllRemoteAudio();
    document.addEventListener('click', unlock, { passive: true });
    document.addEventListener('keydown', unlock);
    document.addEventListener('touchstart', unlock, { passive: true });
    const playTimer = setInterval(() => playAllRemoteAudio(), 3000);
    return () => {
      document.removeEventListener('click', unlock);
      document.removeEventListener('keydown', unlock);
      document.removeEventListener('touchstart', unlock);
      clearInterval(playTimer);
    };
  }, [playAllRemoteAudio]);

  const provideMediaRef = useCallback((id, node) => {
    peerMediaElements.current[id] = node;
    if (node && id !== LOCAL_AUDIO && remoteStreams.current[id]) {
      node.srcObject = remoteStreams.current[id];
      node.play?.().catch(() => {});
    }
  }, []);

  return {
    clients,
    provideMediaRef,
    micMuted,
    toggleMicMute,
  };
}
