/** Логи WebRTC в консоль браузера (фильтр: WebRTC). */

const PREFIX = '[WebRTC]';

export function webrtcLog(peerId, event, ...args) {
  const peer = peerId ? String(peerId).slice(0, 8) : '—';
  console.log(`${PREFIX} [${peer}] ${event}`, ...args);
}

export function webrtcWarn(peerId, event, ...args) {
  const peer = peerId ? String(peerId).slice(0, 8) : '—';
  console.warn(`${PREFIX} [${peer}] ${event}`, ...args);
}

export function summarizeIceCandidate(candidate) {
  if (!candidate) {
    return null;
  }
  const c = candidate.candidate || String(candidate);
  const typeMatch = c.match(/typ (\w+)/);
  return {
    type: candidate.type || typeMatch?.[1] || '?',
    protocol: candidate.protocol || (c.includes(' UDP ') ? 'udp' : c.includes(' TCP ') ? 'tcp' : '?'),
    address: candidate.address || '',
  };
}

export async function logPeerConnectionStats(peerId, pc) {
  if (!pc?.getStats) {
    return { inboundAudioBytes: 0, outboundAudioBytes: 0, pathString: '' };
  }
  let inboundAudioBytes = 0;
  let outboundAudioBytes = 0;
  let selectedPair = null;
  let pathString = '';

  try {
    const stats = await pc.getStats();
    stats.forEach((report) => {
      if (report.type === 'inbound-rtp' && report.kind === 'audio') {
        inboundAudioBytes += report.bytesReceived || 0;
      }
      if (report.type === 'outbound-rtp' && report.kind === 'audio') {
        outboundAudioBytes += report.bytesSent || 0;
      }
      if (report.type === 'candidate-pair' && report.state === 'succeeded' && report.nominated) {
        selectedPair = {
          local: report.localCandidateId,
          remote: report.remoteCandidateId,
        };
      }
    });

    const lines = [];
    stats.forEach((report) => {
      if (report.type === 'local-candidate' && selectedPair?.local === report.id) {
        lines.push(`local ${report.candidateType} ${report.protocol} ${report.address || ''}`);
      }
      if (report.type === 'remote-candidate' && selectedPair?.remote === report.id) {
        lines.push(`remote ${report.candidateType} ${report.protocol} ${report.address || ''}`);
      }
    });

    pathString = lines.join(' | ') || '';
    webrtcLog(peerId, 'stats', {
      ice: pc.iceConnectionState,
      connection: pc.connectionState,
      signaling: pc.signalingState,
      inboundAudioBytes,
      outboundAudioBytes,
      path: pathString || 'n/a',
      receivers: pc.getReceivers?.().filter((r) => r.track?.kind === 'audio').length || 0,
      senders: pc.getSenders?.().filter((s) => s.track?.kind === 'audio').length || 0,
    });
  } catch (e) {
    webrtcWarn(peerId, 'getStats failed', e);
  }

  return { inboundAudioBytes, outboundAudioBytes, pathString };
}
