/** Публичные STUN/TURN + опционально REACT_APP_TURN_* из сборки. */

const PUBLIC_TURN = {
  urls: [
    'turn:openrelay.metered.ca:80?transport=udp',
    'turn:openrelay.metered.ca:80?transport=tcp',
    'turn:openrelay.metered.ca:443?transport=tcp',
    'turns:openrelay.metered.ca:443?transport=tcp',
  ],
  username: 'openrelayproject',
  credential: 'openrelayproject',
};

const PUBLIC_TURN_BACKUP = {
  urls: [
    'turn:relay.metered.ca:80',
    'turn:relay.metered.ca:443',
    'turn:relay.metered.ca:443?transport=tcp',
    'turns:relay.metered.ca:443?transport=tcp',
  ],
  username: 'openrelayproject',
  credential: 'openrelayproject',
};

export function buildDefaultIceServers() {
  const servers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
  ];

  const envUrls = process.env.REACT_APP_TURN_URLS || process.env.REACT_APP_TURN_URL;
  const envUser = process.env.REACT_APP_TURN_USERNAME;
  const envCred = process.env.REACT_APP_TURN_CREDENTIAL || process.env.REACT_APP_TURN_PASSWORD;

  if (envUrls && envUser && envCred) {
    servers.push({
      urls: String(envUrls).split(',').map((s) => s.trim()).filter(Boolean),
      username: envUser,
      credential: envCred,
    });
  }

  servers.push(PUBLIC_TURN, PUBLIC_TURN_BACKUP);
  return servers;
}

export function buildRtcConfiguration(iceServers, { relayOnly = false } = {}) {
  return {
    iceServers: iceServers || buildDefaultIceServers(),
    iceCandidatePoolSize: 10,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
    iceTransportPolicy: relayOnly ? 'relay' : 'all',
  };
}

export async function fetchIceServersFromApi() {
  const explicit = process.env.REACT_APP_SOCKET_URL;
  const base = explicit
    ? String(explicit).replace(/\/$/, '')
    : (typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'http://localhost:3001');

  try {
    const res = await fetch(`${base}/api/webrtc-ice`, { credentials: 'same-origin' });
    if (!res.ok) {
      return buildDefaultIceServers();
    }
    const data = await res.json();
    if (Array.isArray(data?.iceServers) && data.iceServers.length > 0) {
      return data.iceServers;
    }
  } catch (e) {
    console.warn('[WebRTC] ICE config API unavailable, using built-in TURN list', e);
  }
  return buildDefaultIceServers();
}

/** Свой TURN на VPS — для разных сетей (Wi‑Fi ↔ мобильный) сразу relay. */
export function iceServersIncludePrivateTurn(iceServers) {
  if (!Array.isArray(iceServers)) {
    return false;
  }
  return iceServers.some((entry) => {
    const user = String(entry?.username || '');
    if (user && user !== 'openrelayproject') {
      return true;
    }
    const urls = Array.isArray(entry?.urls) ? entry.urls : [entry?.urls];
    return urls.some((u) => String(u || '').includes('153.80.194.115'));
  });
}

export function ensureAudioTransceiver(pc, hasLocalAudio) {
  if (!pc?.addTransceiver) {
    return;
  }
  const hasAudio = pc.getTransceivers().some(
    (t) => t.sender?.track?.kind === 'audio' || t.receiver?.track?.kind === 'audio',
  );
  if (!hasAudio) {
    pc.addTransceiver('audio', {
      direction: hasLocalAudio ? 'sendrecv' : 'recvonly',
    });
  }
}
