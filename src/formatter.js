'use strict';

/**
 * Result formatter — pretty-prints SpeedCheck results to the terminal.
 */

let chalk;
try {
  chalk = require('chalk');
} catch (_) {
  // Fallback: no colours
  chalk = new Proxy({}, {
    get: () => (str) => str,
  });
}

const BARS = ['▏', '▎', '▍', '▌', '▋', '▊', '▉', '█'];

/**
 * Render a simple ASCII bar for a speed value.
 * @param {number} value  - current value
 * @param {number} max    - max expected value (for scaling)
 * @param {number} width  - bar width in chars
 */
function speedBar(value, max = 1000, width = 20) {
  const ratio = Math.min(value / max, 1);
  const filled = Math.floor(ratio * width);
  const partial = Math.floor((ratio * width - filled) * BARS.length);
  const bar =
    BARS[BARS.length - 1].repeat(filled) +
    (filled < width ? BARS[partial] || '' : '') +
    ' '.repeat(Math.max(0, width - filled - 1));
  return bar;
}

/**
 * Format a full SpeedCheck result object into a human-readable string.
 * @param {object} result
 * @returns {string}
 */
function formatResults(result) {
  const lines = [];

  const sep = chalk.gray('─'.repeat(52));
  const header = (title) => chalk.cyan.bold(`  ${title}`);
  const label = (l) => chalk.gray(l.padEnd(20));
  const value = (v) => chalk.white.bold(v);
  const na = () => chalk.gray('N/A');

  lines.push('');
  lines.push(sep);
  lines.push(chalk.cyan.bold('  ⚡  speedcheck Results'));
  lines.push(sep);

  // Timestamps
  lines.push(header('⏱  Timing'));
  lines.push(`  ${label('Started:')}  ${value(result.startedAt || na())}`);
  lines.push(`  ${label('Finished:')} ${value(result.finishedAt || na())}`);
  lines.push('');

  // IP & Location
  lines.push(header('🌐  IP & Location'));
  lines.push(`  ${label('IP Address:')}  ${value(result.ip || na())}`);

  if (result.location) {
    const loc = result.location;
    const city = [loc.city, loc.region, loc.country].filter(Boolean).join(', ');
    lines.push(`  ${label('Location:')}   ${value(city || na())}`);
    lines.push(`  ${label('Country Code:')}${value(loc.countryCode || na())}`);
    lines.push(`  ${label('Coordinates:')} ${value(loc.lat && loc.lon ? `${loc.lat}, ${loc.lon}` : na())}`);
    lines.push(`  ${label('Timezone:')}   ${value(loc.timezone || na())}`);
    lines.push(`  ${label('Postal Code:')} ${value(loc.postalCode || na())}`);
  }

  lines.push('');

  // ISP / Network
  lines.push(header('🏢  ISP & Network'));
  lines.push(`  ${label('ISP:')}         ${value(result.isp || na())}`);
  lines.push(`  ${label('Organisation:')}${value(result.org || na())}`);
  lines.push(`  ${label('ASN:')}         ${value(result.asn || na())}`);

  if (result.networkZone) {
    const z = result.networkZone;
    lines.push(`  ${label('Network Type:')}${value(z.type || na())}`);
    lines.push(`  ${label('Privacy:')}    ${value(z.privacy || na())}`);
    lines.push(`  ${label('Hosting:')}    ${value(z.hosting ? chalk.yellow('Yes') : chalk.green('No'))}`);
    lines.push(`  ${label('VPN/Proxy:')}  ${value(z.vpn ? chalk.yellow('Yes') : chalk.green('No'))}`);
    lines.push(`  ${label('Mobile:')}     ${value(z.mobile ? chalk.yellow('Yes') : chalk.green('No'))}`);
    lines.push(`  ${label('Description:')}${chalk.gray(z.description || '')}`);
  }

  lines.push('');

  // Ping
  lines.push(header('📡  Ping / Latency'));
  if (result.ping) {
    const p = result.ping;
    lines.push(`  ${label('Average:')}    ${value(p.avg + ' ms')}`);
    lines.push(`  ${label('Min:')}        ${value(p.min + ' ms')}`);
    lines.push(`  ${label('Max:')}        ${value(p.max + ' ms')}`);
    lines.push(`  ${label('Median:')}     ${value(p.median + ' ms')}`);
    lines.push(`  ${label('Jitter:')}     ${value(p.jitter + ' ms')}`);
  } else {
    lines.push(`  ${chalk.red('Ping test failed')}${result.errors.ping ? ': ' + result.errors.ping : ''}`);
  }

  lines.push('');

  // Download
  lines.push(header('⬇️   Download Speed'));
  if (result.download) {
    const d = result.download;
    const bar = speedBar(d.mbps, 1000, 24);
    lines.push(`  ${label('Speed:')}      ${value(d.mbps + ' Mbps')}  ${chalk.cyan(bar)}`);
    lines.push(`  ${label('Speed (kbps):')}${value(d.kbps + ' kbps')}`);
    lines.push(`  ${label('Speed (MB/s):')}${value(d.MBs + ' MB/s')}`);
    lines.push(`  ${label('Data received:')}${value(formatBytes(d.bytesReceived))}`);
    lines.push(`  ${label('Duration:')}   ${value((d.elapsedMs / 1000).toFixed(1) + ' s')}`);
    lines.push(`  ${label('Source:')}     ${chalk.gray(d.source)}`);
  } else {
    lines.push(`  ${chalk.red('Download test failed')}${result.errors.download ? ': ' + result.errors.download : ''}`);
  }

  lines.push('');

  // Upload
  lines.push(header('⬆️   Upload Speed'));
  if (result.upload) {
    const u = result.upload;
    const bar = speedBar(u.mbps, 1000, 24);
    lines.push(`  ${label('Speed:')}      ${value(u.mbps + ' Mbps')}  ${chalk.cyan(bar)}`);
    lines.push(`  ${label('Speed (kbps):')}${value(u.kbps + ' kbps')}`);
    lines.push(`  ${label('Speed (MB/s):')}${value(u.MBs + ' MB/s')}`);
    lines.push(`  ${label('Data sent:')}  ${value(formatBytes(u.bytesSent))}`);
    lines.push(`  ${label('Duration:')}   ${value((u.elapsedMs / 1000).toFixed(1) + ' s')}`);
    lines.push(`  ${label('Source:')}     ${chalk.gray(u.source)}`);
  } else {
    lines.push(`  ${chalk.red('Upload test failed')}${result.errors.upload ? ': ' + result.errors.upload : ''}`);
  }

  lines.push('');
  lines.push(sep);
  lines.push(chalk.gray('  speedcheck · by Sheikh Tamim · https://github.com/sheikhtamimlover/speedcheck'));
  lines.push(sep);
  lines.push('');

  return lines.join('\n');
}

/**
 * Format bytes into a human-readable string.
 * @param {number} bytes
 * @returns {string}
 */
function formatBytes(bytes) {
  if (bytes >= 1e9) return (bytes / 1e9).toFixed(2) + ' GB';
  if (bytes >= 1e6) return (bytes / 1e6).toFixed(2) + ' MB';
  if (bytes >= 1e3) return (bytes / 1e3).toFixed(2) + ' KB';
  return bytes + ' B';
}

module.exports = { formatResults, formatBytes, speedBar };
