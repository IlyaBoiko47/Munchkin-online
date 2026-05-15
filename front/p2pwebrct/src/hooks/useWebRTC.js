import {useEffect, useRef, useCallback, useState} from 'react';
import freeice from 'freeice';
import useStateWithCallback from './useStateWithCallback';
import socket from '../socket';
import ACTIONS from '../socket/actions';
import { consumeRoomTitleForJoin } from '../roomTitleBridge.js';
import { getOrCreateTabPlayerToken } from '../profileSession.js';

export const LOCAL_AUDIO = 'LOCAL_AUDIO';

export default function useWebRTC(roomID) {
  const [clients, updateClients] = useStateWithCallback([]);
  const [micMuted, setMicMuted] = useState(false);

  function getOrCreatePlayerToken() {
    return getOrCreateTabPlayerToken(roomID || 'global');
  }

  const addNewClient = useCallback((newClient, cb) => {
    updateClients(list => {
      if (!list.includes(newClient)) {
        return [...list, newClient];
      }
      return list;
    }, cb);
  }, [updateClients]);

  const peerConnections = useRef({});
  const makingOffer = useRef({});
  const ignoreOffer = useRef({});
  const politePeer = useRef({});
  const pendingIceCandidates = useRef({});
  /** Пиры, для которых нужно отправить offer после появления локального потока. */
  const pendingOffers = useRef({});
  const localMediaStream = useRef(null);
  const peerMediaElements = useRef({
    [LOCAL_AUDIO]: null,
  });

  const attachLocalTracksToPeer = useCallback((peerID) => {
    const pc = peerConnections.current[peerID];
    const stream = localMediaStream.current;
    if (!pc || !stream?.getTracks) {
      return false;
    }
    stream.getTracks().forEach((track) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === track.kind);
      if (sender) {
        if (sender.track?.id !== track.id) {
          sender.replaceTrack(track);
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
      await pc.setLocalDescription(await pc.createOffer());
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

  const renegotiateAllPeersWithLocalTracks = useCallback(async () => {
    const peerIDs = Object.keys(peerConnections.current);
    for (const peerID of peerIDs) {
      const pc = peerConnections.current[peerID];
      if (!pc || pc.signalingState === 'closed') {
        continue;
      }
      attachLocalTracksToPeer(peerID);
      if (pc.signalingState === 'stable') {
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

  async function waitForLocalStream(maxMs = 20000) {
    const step = 50;
    let waited = 0;
    while (!localMediaStream.current && waited < maxMs) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, step));
      waited += step;
    }
    return localMediaStream.current;
  }

  function bindRemoteTrack(peerID, remoteStream) {
    if (!remoteStream) {
      return;
    }
    addNewClient(peerID, () => {
      const el = peerMediaElements.current[peerID];
      if (el) {
        el.srcObject = remoteStream;
        if (typeof el.play === 'function') {
          el.play().catch(() => {});
        }
      } else {
        let settled = false;
        const interval = setInterval(() => {
          const audioEl = peerMediaElements.current[peerID];
          if (audioEl) {
            audioEl.srcObject = remoteStream;
            if (typeof audioEl.play === 'function') {
              audioEl.play().catch(() => {});
            }
            settled = true;
          }
          if (settled) {
            clearInterval(interval);
          }
        }, 1000);
      }
    });
  }

  useEffect(() => {
    async function handleNewPeer({peerID, createOffer}) {
      if (peerID in peerConnections.current) {
        return console.warn(`Already connected to peer ${peerID}`);
      }

      await waitForLocalStream();

      const pc = new RTCPeerConnection({
        iceServers: freeice(),
      });
      peerConnections.current[peerID] = pc;
      politePeer.current[peerID] = String(socket.id) < String(peerID);
      makingOffer.current[peerID] = false;
      ignoreOffer.current[peerID] = false;
      pendingIceCandidates.current[peerID] = [];

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit(ACTIONS.RELAY_ICE, {
            peerID,
            iceCandidate: event.candidate,
          });
        }
      };

      pc.ontrack = ({streams: [remoteStream]}) => {
        bindRemoteTrack(peerID, remoteStream);
      };

      attachLocalTracksToPeer(peerID);

      if (createOffer) {
        if (localMediaStream.current) {
          await sendOfferToPeer(peerID);
        } else {
          pendingOffers.current[peerID] = true;
        }
      }
    }

    socket.on(ACTIONS.ADD_PEER, handleNewPeer);

    return () => {
      socket.off(ACTIONS.ADD_PEER);
    };
  }, [attachLocalTracksToPeer, sendOfferToPeer]);

  useEffect(() => {
    async function setRemoteMedia({peerID, sessionDescription: remoteDescription}) {
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

        const queued = pendingIceCandidates.current[peerID];
        if (Array.isArray(queued) && queued.length > 0 && pc.remoteDescription) {
          pendingIceCandidates.current[peerID] = [];
          for (const c of queued) {
            try {
              // eslint-disable-next-line no-await-in-loop
              await pc.addIceCandidate(new RTCIceCandidate(c));
            } catch (e) {
              console.warn('ICE candidate (queued) add failed:', e);
            }
          }
        }

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
      }
    }

    socket.on(ACTIONS.SESSION_DESCRIPTION, setRemoteMedia);

    return () => {
      socket.off(ACTIONS.SESSION_DESCRIPTION);
    };
  }, [attachLocalTracksToPeer]);

  useEffect(() => {
    socket.on(ACTIONS.ICE_CANDIDATE, ({peerID, iceCandidate}) => {
      const pc = peerConnections.current[peerID];
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
  }, []);

  useEffect(() => {
    const handleRemovePeer = ({peerID}) => {
      if (peerConnections.current[peerID]) {
        peerConnections.current[peerID].close();
      }

      delete peerConnections.current[peerID];
      delete peerMediaElements.current[peerID];
      delete pendingIceCandidates.current[peerID];
      delete pendingOffers.current[peerID];
      delete makingOffer.current[peerID];
      delete politePeer.current[peerID];
      delete ignoreOffer.current[peerID];

      updateClients(list => list.filter(c => c !== peerID));
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

    const startCapture = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        console.error('getUserMedia API is not supported');
        return false;
      }
      try {
        localMediaStream.current = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        addNewClient(LOCAL_AUDIO, () => {
          const localAudioElement = peerMediaElements.current[LOCAL_AUDIO];
          if (localAudioElement) {
            localAudioElement.volume = 0;
            localAudioElement.srcObject = localMediaStream.current;
          }
        });
        return true;
      } catch (e) {
        console.error('Error getting userMedia:', e);
        return false;
      }
    };

    (async () => {
      await startCapture();
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
    })().catch((e) => console.error('useWebRTC room join failed:', e));

    return () => {
      cancelled = true;
      if (localMediaStream.current) {
        localMediaStream.current.getTracks().forEach((track) => track.stop());
        localMediaStream.current = null;
      }
      socket.emit(ACTIONS.LEAVE);
    };
  }, [roomID, addNewClient, onLocalStreamReady]);

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

  const toggleMicMute = useCallback(() => {
    setMicMuted((prev) => {
      const next = !prev;
      setLocalMicEnabled(!next);
      return next;
    });
  }, [setLocalMicEnabled]);

  const provideMediaRef = useCallback((id, node) => {
    peerMediaElements.current[id] = node;
  }, []);

  return {
    clients,
    provideMediaRef,
    micMuted,
    toggleMicMute,
  };
}
