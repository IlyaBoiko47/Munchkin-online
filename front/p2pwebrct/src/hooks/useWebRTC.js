import {useEffect, useRef, useCallback, useState} from 'react';
import useStateWithCallback from './useStateWithCallback';
import socket from '../socket';
import ACTIONS from '../socket/actions';
import { consumeRoomTitleForJoin } from '../roomTitleBridge.js';
import { getOrCreateTabPlayerToken } from '../profileSession.js';

export const LOCAL_AUDIO = 'LOCAL_AUDIO';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

const RTC_CONFIG = {
  iceServers: ICE_SERVERS,
  iceCandidatePoolSize: 10,
  bundlePolicy: 'max-bundle',
};

function shouldCreateOffer(localSocketId, remotePeerId) {
  return String(localSocketId) < String(remotePeerId);
}

export default function useWebRTC(roomID) {
  const [clients, updateClients] = useStateWithCallback([]);
  const [micMuted, setMicMuted] = useState(true);
  const micMutedRef = useRef(true);

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
  const reconnectTimers = useRef({});
  const localMediaStream = useRef(null);
  const peerMediaElements = useRef({
    [LOCAL_AUDIO]: null,
  });

  const playAllRemoteAudio = useCallback(() => {
    Object.entries(peerMediaElements.current).forEach(([id, audioEl]) => {
      if (id === LOCAL_AUDIO || !audioEl?.srcObject) {
        return;
      }
      audioEl.volume = 1;
      audioEl.muted = false;
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
    stream.getAudioTracks().forEach((track) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === 'audio');
      if (sender) {
        if (sender.track?.id !== track.id) {
          sender.replaceTrack(track).catch((e) => {
            console.warn('replaceTrack failed:', e);
          });
        }
      } else {
        pc.addTrack(track, stream);
      }
    });
    return true;
  }, []);

  const sendOfferToPeer = useCallback(async (peerID) => {
    const pc = peerConnections.current[peerID];
    if (!pc || pc.signalingState === 'closed') {
      return;
    }
    if (makingOffer.current[peerID]) {
      return;
    }
    try {
      makingOffer.current[peerID] = true;
      attachLocalTracksToPeer(peerID);
      await pc.setLocalDescription(await pc.createOffer({ iceRestart: pc.connectionState === 'failed' }));
      socket.emit(ACTIONS.RELAY_SDP, {
        peerID,
        sessionDescription: pc.localDescription,
      });
    } catch (e) {
      console.error('WebRTC offer failed:', e);
    } finally {
      makingOffer.current[peerID] = false;
    }
  }, [attachLocalTracksToPeer]);

  const schedulePeerHeal = useCallback((peerID) => {
    if (reconnectTimers.current[peerID]) {
      clearTimeout(reconnectTimers.current[peerID]);
    }
    reconnectTimers.current[peerID] = setTimeout(() => {
      delete reconnectTimers.current[peerID];
      const pc = peerConnections.current[peerID];
      if (!pc || pc.signalingState === 'closed') {
        return;
      }
      if (pc.connectionState === 'connected' || pc.connectionState === 'connecting') {
        return;
      }
      if (pc.signalingState === 'stable' || pc.connectionState === 'failed') {
        sendOfferToPeer(peerID).catch(() => {});
      }
    }, 2500);
  }, [sendOfferToPeer]);

  const renegotiateAllPeersWithLocalTracks = useCallback(async () => {
    const peerIDs = Object.keys(peerConnections.current);
    for (const peerID of peerIDs) {
      const pc = peerConnections.current[peerID];
      if (!pc || pc.signalingState === 'closed') {
        continue;
      }
      attachLocalTracksToPeer(peerID);
      if (pc.signalingState === 'stable' && shouldCreateOffer(socket.id, peerID)) {
        // eslint-disable-next-line no-await-in-loop
        await sendOfferToPeer(peerID);
      }
    }
  }, [attachLocalTracksToPeer, sendOfferToPeer]);

  const flushPendingOffers = useCallback(async () => {
    const pending = { ...pendingOffers.current };
    pendingOffers.current = {};
    for (const peerID of Object.keys(pending)) {
      if (pending[peerID] && peerConnections.current[peerID]) {
        // eslint-disable-next-line no-await-in-loop
        await sendOfferToPeer(peerID);
      }
    }
  }, [sendOfferToPeer]);

  const onLocalStreamReady = useCallback(async () => {
    await renegotiateAllPeersWithLocalTracks();
    await flushPendingOffers();
  }, [renegotiateAllPeersWithLocalTracks, flushPendingOffers]);

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

  async function waitForLocalStream(maxMs = 20000) {
    const step = 50;
    let waited = 0;
    while (!localMediaStream.current && waited < maxMs) {
      // eslint-disable-next-line no-await-in-loop
      await ensureLocalAudioStream();
      if (localMediaStream.current) {
        return localMediaStream.current;
      }
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, step));
      waited += step;
    }
    return localMediaStream.current;
  }

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
          } else if (attempts > 30) {
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
    }
    bindRemoteTrack(peerID, stream);
  }, [bindRemoteTrack]);

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
      return;
    }
    const desc = new RTCSessionDescription(remoteDescription);

    const offerCollision = desc.type === 'offer'
      && (makingOffer.current[peerID] || pc.signalingState !== 'stable');

    ignoreOffer.current[peerID] = !politePeer.current[peerID] && offerCollision;
    if (ignoreOffer.current[peerID]) {
      return;
    }

    try {
      if (desc.type === 'answer' && pc.signalingState !== 'have-local-offer') {
        return;
      }

      if (desc.type === 'offer' && pc.signalingState !== 'stable') {
        await pc.setLocalDescription({ type: 'rollback' });
      }

      await pc.setRemoteDescription(desc);
      await flushQueuedIceCandidates(peerID);

      if (desc.type === 'offer') {
        attachLocalTracksToPeer(peerID);
        await pc.setLocalDescription(await pc.createAnswer());
        socket.emit(ACTIONS.RELAY_SDP, {
          peerID,
          sessionDescription: pc.localDescription,
        });
      }
    } catch (e) {
      console.error('WebRTC setRemoteMedia failed:', e);
      schedulePeerHeal(peerID);
    }
  }, [attachLocalTracksToPeer, flushQueuedIceCandidates, schedulePeerHeal]);

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

  const createPeerConnection = useCallback((peerID) => {
    const pc = new RTCPeerConnection(RTC_CONFIG);
    peerConnections.current[peerID] = pc;
    politePeer.current[peerID] = !shouldCreateOffer(socket.id, peerID);
    makingOffer.current[peerID] = false;
    ignoreOffer.current[peerID] = false;
    pendingIceCandidates.current[peerID] = [];

    try {
      pc.addTransceiver('audio', { direction: 'sendrecv' });
    } catch (e) {
      console.warn('addTransceiver failed:', e);
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit(ACTIONS.RELAY_ICE, {
          peerID,
          iceCandidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      handleRemoteTrack(peerID, event);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        playAllRemoteAudio();
        return;
      }
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        schedulePeerHeal(peerID);
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
        schedulePeerHeal(peerID);
      }
    };

    return pc;
  }, [handleRemoteTrack, playAllRemoteAudio, schedulePeerHeal]);

  useEffect(() => {
    async function handleNewPeer({ peerID, createOffer }) {
      if (peerID in peerConnections.current) {
        return;
      }

      await waitForLocalStream();

      const pc = createPeerConnection(peerID);
      attachLocalTracksToPeer(peerID);
      await flushPendingSignalingForPeer(peerID);

      // Один offerer на пару: меньший socket.id (совпадает с флагом createOffer от сервера).
      if (shouldCreateOffer(socket.id, peerID)) {
        if (localMediaStream.current) {
          await sendOfferToPeer(peerID);
        } else {
          pendingOffers.current[peerID] = true;
        }
      }

      schedulePeerHeal(peerID);
    }

    socket.on(ACTIONS.ADD_PEER, handleNewPeer);

    return () => {
      socket.off(ACTIONS.ADD_PEER);
    };
  }, [
    attachLocalTracksToPeer,
    sendOfferToPeer,
    flushPendingSignalingForPeer,
    createPeerConnection,
    schedulePeerHeal,
  ]);

  useEffect(() => {
    async function setRemoteMedia({ peerID, sessionDescription: remoteDescription }) {
      const pc = peerConnections.current[peerID];
      if (!pc) {
        if (!pendingRemoteDescriptions.current[peerID]) {
          pendingRemoteDescriptions.current[peerID] = [];
        }
        pendingRemoteDescriptions.current[peerID].push(remoteDescription);
        return;
      }
      await applyRemoteMedia(peerID, remoteDescription);
    }

    socket.on(ACTIONS.SESSION_DESCRIPTION, setRemoteMedia);

    return () => {
      socket.off(ACTIONS.SESSION_DESCRIPTION);
    };
  }, [applyRemoteMedia]);

  useEffect(() => {
    socket.on(ACTIONS.ICE_CANDIDATE, ({ peerID, iceCandidate }) => {
      const pc = peerConnections.current[peerID];
      if (!pc) {
        if (!pendingIceBeforePc.current[peerID]) {
          pendingIceBeforePc.current[peerID] = [];
        }
        pendingIceBeforePc.current[peerID].push(iceCandidate);
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
  }, []);

  useEffect(() => {
    const handleRemovePeer = ({ peerID }) => {
      if (reconnectTimers.current[peerID]) {
        clearTimeout(reconnectTimers.current[peerID]);
        delete reconnectTimers.current[peerID];
      }

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

      updateClients((list) => list.filter((c) => c !== peerID));
    };

    socket.on(ACTIONS.REMOVE_PEER, handleRemovePeer);

    return () => {
      socket.off(ACTIONS.REMOVE_PEER);
    };
  }, [updateClients]);

  useEffect(() => {
    if (!roomID) {
      return undefined;
    }

    let cancelled = false;

    (async () => {
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
      socket.emit('message', { method: 'RequestRoomLobby', roomID });
    })().catch((e) => console.error('useWebRTC room join failed:', e));

    return () => {
      cancelled = true;
      Object.values(reconnectTimers.current).forEach((t) => clearTimeout(t));
      reconnectTimers.current = {};
      if (localMediaStream.current) {
        localMediaStream.current.getTracks().forEach((track) => track.stop());
        localMediaStream.current = null;
      }
      socket.emit(ACTIONS.LEAVE);
    };
  }, [roomID, ensureLocalAudioStream, onLocalStreamReady]);

  /** Только вкл/выкл захват микрофона — peer connections не трогаем. */
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
        await onLocalStreamReady();
      }
      setLocalMicEnabled(true);
    } else {
      setLocalMicEnabled(false);
    }
    playAllRemoteAudio();
  }, [ensureLocalAudioStream, onLocalStreamReady, setLocalMicEnabled, playAllRemoteAudio]);

  useEffect(() => {
    micMutedRef.current = micMuted;
  }, [micMuted]);

  useEffect(() => {
    const unlock = () => playAllRemoteAudio();
    document.addEventListener('click', unlock);
    document.addEventListener('keydown', unlock);
    return () => {
      document.removeEventListener('click', unlock);
      document.removeEventListener('keydown', unlock);
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
