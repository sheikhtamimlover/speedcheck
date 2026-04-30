'use strict';

/**
 * Download speed measurement module
 * Streams large test files from CDN endpoints and measures throughput.
 */

const https = require('https');

// Public CDN test files of various sizes (bytes)
const DOWNLOAD_SOURCES = [
  {
    url: 'https://speed.cloudflare.com/__down?bytes=25000000',
    label: 'Cloudflare 25MB',
    bytes: 25_000_000,
  },
  {
    url: 'https://proof.ovh.net/files/10Mb.dat',
    label: 'OVH 10MB',
    bytes: 10_000_000,
  },
  {
    url: 'https://speed.hetzner.de/10MB.bin',
    label: 'Hetzner 10MB',
    bytes: 10_000_000,
  },
];

/**
 * Stream a URL and measure download throughput.
 * @param {string} url
 * @param {number} durationMs  - Stop after this many ms
 * @param {boolean} verbose
 * @returns {Promise<{bytesReceived: number, elapsedMs: number}>}
 */
function streamDownload(url, durationMs, verbose) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let bytesReceived = 0;
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      resolve({ bytesReceived, elapsedMs: Date.now() - startTime });
    };

    const timer = setTimeout(finish, durationMs);

    const req = https.get(url, { timeout: durationMs + 2000 }, (res) => {
      if (res.statusCode !== 200) {
        clearTimeout(timer);
        reject(new Error(`HTTP ${res.statusCode} from ${url}`));
        return;
      }

      res.on('data', (chunk) => {
        bytesReceived += chunk.length;
        if (verbose) {
          const elapsed = (Date.now() - startTime) / 1000;
          const mbps = ((bytesReceived * 8) / 1e6 / elapsed).toFixed(2);
          process.stdout.write(`\r  ↓ ${mbps} Mbps  `);
        }
      });

      res.on('end', () => {
        clearTimeout(timer);
        finish();
      });

      res.on('error', (err) => {
        clearTimeout(timer);
        if (!settled) {
          settled = true;
          reject(err);
        }
      });
    });

    req.on('error', (err) => {
      clearTimeout(timer);
      if (!settled) {
        settled = true;
        reject(err);
      }
    });

    req.on('timeout', () => {
      req.destroy();
      finish();
    });
  });
}

/**
 * Measure download speed by trying sources in order.
 *
 * @param {number} [durationMs=8000]
 * @param {boolean} [verbose=false]
 * @returns {Promise<SpeedResult>}
 */
async function measureDownload(durationMs = 8000, verbose = false) {
  const errors = [];

  for (const source of DOWNLOAD_SOURCES) {
    try {
      const { bytesReceived, elapsedMs } = await streamDownload(source.url, durationMs, verbose);

      if (verbose) process.stdout.write('\n');

      if (bytesReceived < 1024) {
        errors.push(`${source.label}: too little data received`);
        continue;
      }

      const mbps = parseFloat(((bytesReceived * 8) / 1e6 / (elapsedMs / 1000)).toFixed(2));
      const kbps = parseFloat(((bytesReceived * 8) / 1e3 / (elapsedMs / 1000)).toFixed(2));
      const MBs = parseFloat((bytesReceived / 1e6 / (elapsedMs / 1000)).toFixed(2));

      return {
        mbps,
        kbps,
        MBs,
        bytesReceived,
        elapsedMs,
        source: source.label,
        unit: 'Mbps',
      };
    } catch (err) {
      if (verbose) process.stdout.write('\n');
      errors.push(`${source.label}: ${err.message}`);
    }
  }

  throw new Error('All download sources failed: ' + errors.join(' | '));
}

module.exports = { measureDownload, streamDownload };
