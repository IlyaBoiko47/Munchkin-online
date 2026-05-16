/** ICE/TURN для signaling-сервера (CommonJS). */

function buildWebRtcIceServers() {
  const servers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
  ];

  const turnUrls = process.env.TURN_URLS || process.env.TURN_URL;
  const turnUser = process.env.TURN_USERNAME;
  const turnPass = process.env.TURN_PASSWORD || process.env.TURN_CREDENTIAL;

  if (turnUrls && turnUser && turnPass) {
    servers.unshift({
      urls: String(turnUrls).split(',').map((s) => s.trim()).filter(Boolean),
      username: turnUser,
      credential: turnPass,
    });
  }

  servers.push(
    {
      urls: [
        'turn:openrelay.metered.ca:80?transport=udp',
        'turn:openrelay.metered.ca:80?transport=tcp',
        'turn:openrelay.metered.ca:443?transport=tcp',
        'turns:openrelay.metered.ca:443?transport=tcp',
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: [
        'turn:relay.metered.ca:80',
        'turn:relay.metered.ca:443',
        'turn:relay.metered.ca:443?transport=tcp',
        'turns:relay.metered.ca:443?transport=tcp',
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  );

  return servers;
}

module.exports = { buildWebRtcIceServers };
