'use strict';

/**
 * Ping / latency measurement module
 * Uses HTTP HEAD requests to measure round-trip time.
 */

const https = require('https');

const PING_TARGETS = [
  'https://www.google.com',
  'https://www.cloudflare.com',
  'https://www.amazon.com',
  'https://www.microsoft.com',
  'https://www.apple.com',
];

/**
 * Measure a single HTTP round-trip time to a URL.
 * @param {string} url
 * @param {number} [timeoutMs=5000]
 * @returns {Promise<number>} RTT in milliseconds
 */
function pingOnce(url, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const req = https.request(url, { method: 'HEAD', timeout: timeoutMs }, (res) => {
      res.resume(); // drain
      resolve(Date.now() - start);
    });
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Ping timeout: ' + url));
    });
    req.on('error', reject);
    req.end();
  });
}

/**
 * Run multiple ping rounds across several targets and compute statistics.
 *
 * @param {number} [rounds=5]
 * @returns {Promise<PingResult>}
 */
async function measurePing(rounds = 5) {
  const samples = [];
  const targets = PING_TARGETS.slice(0, Math.min(rounds, PING_TARGETS.length));

  // Run pings sequentially to avoid network congestion skewing results
  for (const target of targets) {
    try {
      const rtt = await pingOnce(target);
      samples.push(rtt);
    } catch (_) {
      // skip failed targets
    }
  }

  // If we need more rounds than targets, cycle through again
  let idx = 0;
  while (samples.length < rounds && targets.length > 0) {
    try {
      const rtt = await pingOnce(targets[idx % targets.length]);
      samples.push(rtt);
    } catch (_) {
      // skip
    }
    idx++;
    if (idx > rounds * 2) break; // safety guard
  }

  if (samples.length === 0) {
    throw new Error('All ping targets unreachable');
  }

  const sorted = [...samples].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const avg = Math.round(samples.reduce((s, v) => s + v, 0) / samples.length);
  const median = sorted[Math.floor(sorted.length / 2)];

  // Jitter = mean absolute deviation from average
  const jitter = Math.round(
    samples.reduce((s, v) => s + Math.abs(v - avg), 0) / samples.length
  );

  return {
    min,
    max,
    avg,
    median,
    jitter,
    samples,
    unit: 'ms',
  };
}

module.exports = { measurePing, pingOnce };
