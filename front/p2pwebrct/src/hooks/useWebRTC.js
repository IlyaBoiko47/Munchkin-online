import {useEffect, useRef, useCallback} from 'react';
import freeice from 'freeice';
import useStateWithCallback from './useStateWithCallback';
import socket from '../socket';
import ACTIONS from '../socket/actions';
import { consumeRoomTitleForJoin } from '../roomTitleBridge.js';
import { getOrCreateTabPlayerToken } from '../profileSession.js';

export const LOCAL_AUDIO = 'LOCAL_AUDIO';


export default function useWebRTC(roomID) {
  const [clients, updateClients] = useStateWithCallback([]);

  function getOrCreatePlayerToken() {
    return getOrCreateTabPlayerToken(roomID || 'global');
  }

  // Токен вкладки: profileSession.js (тот же префикс sessionStorage, что и для профиля)

  const addNewClient = useCallback((newClient, cb) => {
    updateClients(list => {
      if (!list.includes(newClient)) {
        return [...list, newClient]
      }

      return list;
    }, cb);
  }, [clients, updateClients]);

  const peerConnections = useRef({});
  // Perfect Negotiation flags
  const makingOffer = useRef({});
  const ignoreOffer = useRef({});
  const politePeer = useRef({});
  // ICE кандидаты могут прийти до SDP (remoteDescription ещё null) — накапливаем и применяем позже.
  const pendingIceCandidates = useRef({});
  const localMediaStream = useRef(null);
  const peerMediaElements = useRef({
    [LOCAL_AUDIO]: null,
  });

  /** getUserMedia в Chrome может разрешаться позже, чем с сервера придёт ADD_PEER — без ожидания localMediaStream ещё null. */
  async function waitForLocalStream(maxMs = 15000) {
    const step = 50;
    let waited = 0;
    while (!localMediaStream.current && waited < maxMs) {
      await new Promise((r) => setTimeout(r, step));
      waited += step;
    }
    return localMediaStream.current;
  }

  useEffect(() => {
    async function handleNewPeer({peerID, createOffer}) {
      if (peerID in peerConnections.current) {
        return console.warn(`Already connected to peer ${peerID}`);
      }

      const stream = await waitForLocalStream();
      if (!stream || !stream.getTracks) {
        console.warn(
          `useWebRTC: нет локального потока для пира ${peerID} (микрофон не выдан или ещё не готов)`,
        );
        // Комната/сигналинг должны работать даже без микрофона.
        // Просто создаём peerConnection без треков.
      }

      peerConnections.current[peerID] = new RTCPeerConnection({
        iceServers: freeice(),
      });
      // "Вежливый" пир: детерминированно выбираем по id сокета,
      // чтобы при одновременных offer избежать glare.
      politePeer.current[peerID] = String(socket.id) < String(peerID);
      makingOffer.current[peerID] = false;
      ignoreOffer.current[peerID] = false;
      pendingIceCandidates.current[peerID] = [];

      peerConnections.current[peerID].onicecandidate = event => {
        if (event.candidate) {
          socket.emit(ACTIONS.RELAY_ICE, {
            peerID,
            iceCandidate: event.candidate,
          });
        }
      }

      let tracksNumber = 0;
      peerConnections.current[peerID].ontrack = ({streams: [remoteStream]}) => {
        tracksNumber++

        if (tracksNumber === 1) { // video & audio tracks received
          tracksNumber = 0;
          addNewClient(peerID, () => {
            if (peerMediaElements.current[peerID]) {
              peerMediaElements.current[peerID].srcObject = remoteStream;
            } else {
              // FIX LONG RENDER IN CASE OF MANY CLIENTS
              let settled = false;
              const interval = setInterval(() => {
                if (peerMediaElements.current[peerID]) {
                  peerMediaElements.current[peerID].srcObject = remoteStream;
                  settled = true;
                }

                if (settled) {
                  clearInterval(interval);
                }
              }, 1000);
            }
          });
        }
      }

      if (stream && stream.getTracks) {
        stream.getTracks().forEach(track => {
          peerConnections.current[peerID].addTrack(track, stream);
        });
      }

      if (createOffer) {
        const pc = peerConnections.current[peerID];
        if (!pc) {
          return;
        }
        try {
          makingOffer.current[peerID] = true;
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
      }
    }

    socket.on(ACTIONS.ADD_PEER, handleNewPeer);

    return () => {
      socket.off(ACTIONS.ADD_PEER);
    }
  }, []);

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
          // Поздний/дубликат answer — игнорируем.
          return;
        }

        if (desc.type === 'offer' && pc.signalingState !== 'stable') {
          // Вежливый пир откатывает своё состояние.
          await pc.setLocalDescription({ type: 'rollback' });
        }

        await pc.setRemoteDescription(desc);

        // Если до SDP уже пришли ICE кандидаты — применяем их после remoteDescription.
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

    socket.on(ACTIONS.SESSION_DESCRIPTION, setRemoteMedia)

    return () => {
      socket.off(ACTIONS.SESSION_DESCRIPTION);
    }
  }, []);

  useEffect(() => {
    socket.on(ACTIONS.ICE_CANDIDATE, ({peerID, iceCandidate}) => {
      const pc = peerConnections.current[peerID];
      if (!pc) {
        return;
      }
      // Если remoteDescription ещё нет — кладём в очередь.
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
    }
  }, []);

  useEffect(() => {
    const handleRemovePeer = ({peerID}) => {
      if (peerConnections.current[peerID]) {
        peerConnections.current[peerID].close();
      }

      delete peerConnections.current[peerID];
      delete peerMediaElements.current[peerID];
      delete pendingIceCandidates.current[peerID];

      updateClients(list => list.filter(c => c !== peerID));
    };

    socket.on(ACTIONS.REMOVE_PEER, handleRemovePeer);

    return () => {
      socket.off(ACTIONS.REMOVE_PEER);
    }
  }, []);

  useEffect(() => {
    if (!roomID) {
      return undefined;
    }

    const startCapture = async () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
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
        } else {
            console.error('getUserMedia API is not supported');
            return false;
        }
    };

    // Важно: на http (не localhost) браузеры часто блокируют getUserMedia.
    // Но комната и игра должны работать и без микрофона — поэтому JOIN выполняем всегда.
    const token = getOrCreatePlayerToken();
    const roomDisplayName = consumeRoomTitleForJoin(roomID) || undefined;
    socket.emit(ACTIONS.JOIN, {
      room: roomID,
      token,
      roomDisplayName,
    });
    startCapture().catch((e) => console.error('Error getting userMedia:', e));

    return () => {
        if (localMediaStream.current) {
            localMediaStream.current.getTracks().forEach((track) => track.stop());
            localMediaStream.current = null;
        }
        socket.emit(ACTIONS.LEAVE);
    };
	}, [roomID]);

  const provideMediaRef = useCallback((id, node) => {
    peerMediaElements.current[id] = node;
  }, []);

  return {
    clients,
    provideMediaRef
  };
}