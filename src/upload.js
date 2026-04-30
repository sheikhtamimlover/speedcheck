'use strict';

/**
 * Upload speed measurement module
 * POSTs generated binary payloads to public echo/discard endpoints.
 */

const https = require('https');

// Public endpoints that accept POST data and discard it
const UPLOAD_TARGETS = [
  {
    host: 'speed.cloudflare.com',
    path: '/__up',
    label: 'Cloudflare',
  },
  {
    host: 'httpbin.org',
    path: '/post',
    label: 'httpbin',
  },
];

const CHUNK_SIZE = 64 * 1024; // 64 KB per chunk

/**
 * Upload data to a target for a fixed duration and measure throughput.
 * @param {{host: string, path: string, label: string}} target
 * @param {number} durationMs
 * @param {boolean} verbose
 * @returns {Promise<{bytesSent: number, elapsedMs: number}>}
 */
function streamUpload(target, durationMs, verbose) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let bytesSent = 0;
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      resolve({ bytesSent, elapsedMs: Date.now() - startTime });
    };

    const options = {
      hostname: target.host,
      path: target.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Transfer-Encoding': 'chunked',
      },
      timeout: durationMs + 3000,
    };

    const req = https.request(options, (res) => {
      res.resume(); // drain response
      res.on('end', finish);
    });

    req.on('error', (err) => {
      if (!settled) {
        settled = true;
        reject(err);
      }
    });

    req.on('timeout', () => {
      req.destroy();
      finish();
    });

    // Generate and send random chunks until duration expires
    const chunk = Buffer.alloc(CHUNK_SIZE, 0x41); // fill with 'A'

    const sendChunk = () => {
      if (Date.now() - startTime >= durationMs) {
        req.end();
        finish();
        return;
      }

      const canContinue = req.write(chunk);
      bytesSent += chunk.length;

      if (verbose) {
        const elapsed = (Date.now() - startTime) / 1000;
        const mbps = ((bytesSent * 8) / 1e6 / elapsed).toFixed(2);
        process.stdout.write(`\r  ↑ ${mbps} Mbps  `);
      }

      if (canContinue) {
        setImmediate(sendChunk);
      } else {
        req.once('drain', sendChunk);
      }
    };

    sendChunk();
  });
}

/**
 * Measure upload speed by trying targets in order.
 *
 * @param {number} [durationMs=6000]
 * @param {boolean} [verbose=false]
 * @returns {Promise<SpeedResult>}
 */
async function measureUpload(durationMs = 6000, verbose = false) {
  const errors = [];

  for (const target of UPLOAD_TARGETS) {
    try {
      const { bytesSent, elapsedMs } = await streamUpload(target, durationMs, verbose);

      if (verbose) process.stdout.write('\n');

      if (bytesSent < 1024) {
        errors.push(`${target.label}: too little data sent`);
        continue;
      }

      const mbps = parseFloat(((bytesSent * 8) / 1e6 / (elapsedMs / 1000)).toFixed(2));
      const kbps = parseFloat(((bytesSent * 8) / 1e3 / (elapsedMs / 1000)).toFixed(2));
      const MBs = parseFloat((bytesSent / 1e6 / (elapsedMs / 1000)).toFixed(2));

      return {
        mbps,
        kbps,
        MBs,
        bytesSent,
        elapsedMs,
        source: target.label,
        unit: 'Mbps',
      };
    } catch (err) {
      if (verbose) process.stdout.write('\n');
      errors.push(`${target.label}: ${err.message}`);
    }
  }

  throw new Error('All upload targets failed: ' + errors.join(' | '));
}

module.exports = { measureUpload, streamUpload };
