'use strict';

/**
 * speedcheck — Test Suite
 * Run: node test.js
 */

const {
  SpeedCheck,
  getIPInfo,
  measurePing,
  measureDownload,
  measureUpload,
  getNetworkZone,
  formatResults,
} = require('./src/index');

const { formatBytes, speedBar } = require('./src/formatter');

// ─── Tiny test runner ────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅  ${message}`);
    passed++;
  } else {
    console.error(`  ❌  ${message}`);
    failed++;
  }
}

async function test(name, fn) {
  console.log(`\n🧪  ${name}`);
  try {
    await fn();
  } catch (err) {
    console.error(`  ❌  Threw: ${err.message}`);
    failed++;
  }
}

// ─── Unit tests (no network) ─────────────────────────────────────────────────

test('formatBytes', () => {
  assert(formatBytes(500) === '500 B', '500 → 500 B');
  assert(formatBytes(1500) === '1.50 KB', '1500 → 1.50 KB');
  assert(formatBytes(1_500_000) === '1.50 MB', '1.5M → 1.50 MB');
  assert(formatBytes(1_500_000_000) === '1.50 GB', '1.5G → 1.50 GB');
});

test('speedBar', () => {
  const bar = speedBar(500, 1000, 20);
  assert(typeof bar === 'string', 'returns a string');
  assert(bar.length > 0, 'non-empty bar');
});

test('getNetworkZone — residential', () => {
  const zone = getNetworkZone({ isp: 'Comcast Cable', org: 'AS7922', isProxy: false, isMobile: false });
  assert(zone.type === 'residential', 'type is residential');
  assert(zone.hosting === false, 'hosting is false');
  assert(zone.vpn === false, 'vpn is false');
});

test('getNetworkZone — datacenter', () => {
  const zone = getNetworkZone({ isp: 'Amazon AWS', org: 'Amazon.com Inc.', isProxy: false, isMobile: false });
  assert(zone.type === 'datacenter', 'type is datacenter');
  assert(zone.hosting === true, 'hosting is true');
});

test('getNetworkZone — mobile', () => {
  const zone = getNetworkZone({ isp: 'T-Mobile LTE', org: 'T-Mobile USA', isProxy: false, isMobile: true });
  assert(zone.type === 'mobile', 'type is mobile');
  assert(zone.mobile === true, 'mobile is true');
});

test('getNetworkZone — vpn', () => {
  const zone = getNetworkZone({ isp: 'NordVPN', org: 'NordVPN', isProxy: true, isMobile: false });
  assert(zone.type === 'vpn', 'type is vpn');
  assert(zone.vpn === true, 'vpn is true');
});

test('getNetworkZone — null input', () => {
  const zone = getNetworkZone(null);
  assert(zone.type === 'unknown', 'type is unknown for null input');
});

test('formatResults — handles missing data gracefully', () => {
  const result = {
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    ip: null,
    location: null,
    isp: null,
    org: null,
    asn: null,
    networkZone: null,
    ping: null,
    download: null,
    upload: null,
    errors: { ip: 'test', ping: 'test', download: 'test', upload: 'test' },
  };
  const output = formatResults(result);
  assert(typeof output === 'string', 'returns a string');
  assert(output.includes('speedcheck'), 'contains brand name');
});

test('SpeedCheck constructor defaults', () => {
  const sc = new SpeedCheck();
  assert(sc.options.pingRounds === 5, 'default pingRounds = 5');
  assert(sc.options.downloadDuration === 8000, 'default downloadDuration = 8000');
  assert(sc.options.uploadDuration === 6000, 'default uploadDuration = 6000');
  assert(sc.options.verbose === false, 'default verbose = false');
});

test('SpeedCheck constructor custom options', () => {
  const sc = new SpeedCheck({ pingRounds: 3, verbose: true });
  assert(sc.options.pingRounds === 3, 'custom pingRounds = 3');
  assert(sc.options.verbose === true, 'custom verbose = true');
});

// ─── Network tests (require internet) ────────────────────────────────────────

console.log('\n\n🌐  Network tests (require internet connection)\n');

test('getIPInfo — returns valid IP info', async () => {
  const info = await getIPInfo();
  assert(typeof info.ip === 'string' && info.ip.length > 0, 'ip is a non-empty string');
  assert(typeof info.provider === 'string', 'provider is set');
  console.log(`     IP: ${info.ip} | City: ${info.city} | Country: ${info.country}`);
});

test('measurePing — returns valid ping stats', async () => {
  const result = await measurePing(3);
  assert(typeof result.avg === 'number', 'avg is a number');
  assert(result.avg > 0, 'avg > 0');
  assert(result.min <= result.avg, 'min <= avg');
  assert(result.avg <= result.max, 'avg <= max');
  assert(Array.isArray(result.samples), 'samples is an array');
  console.log(`     avg: ${result.avg}ms  min: ${result.min}ms  max: ${result.max}ms  jitter: ${result.jitter}ms`);
});

test('measureDownload — returns valid speed', async () => {
  const result = await measureDownload(5000, false);
  assert(typeof result.mbps === 'number', 'mbps is a number');
  assert(result.mbps > 0, 'mbps > 0');
  assert(result.bytesReceived > 0, 'bytesReceived > 0');
  console.log(`     ${result.mbps} Mbps  (${formatBytes(result.bytesReceived)} in ${(result.elapsedMs / 1000).toFixed(1)}s)`);
});

test('measureUpload — returns valid speed', async () => {
  const result = await measureUpload(4000, false);
  assert(typeof result.mbps === 'number', 'mbps is a number');
  assert(result.mbps > 0, 'mbps > 0');
  assert(result.bytesSent > 0, 'bytesSent > 0');
  console.log(`     ${result.mbps} Mbps  (${formatBytes(result.bytesSent)} in ${(result.elapsedMs / 1000).toFixed(1)}s)`);
});

test('SpeedCheck.runAll — full integration', async () => {
  const sc = new SpeedCheck({ pingRounds: 3, downloadDuration: 5000, uploadDuration: 4000 });
  const result = await sc.runAll();

  assert(typeof result === 'object', 'result is an object');
  assert(typeof result.startedAt === 'string', 'startedAt is set');
  assert(typeof result.finishedAt === 'string', 'finishedAt is set');
  assert(result.ip !== null, 'ip is not null');
  assert(result.ping !== null, 'ping is not null');
  assert(result.download !== null, 'download is not null');
  assert(result.upload !== null, 'upload is not null');
  assert(result.networkZone !== null, 'networkZone is not null');

  console.log(formatResults(result));
});

// ─── Summary ─────────────────────────────────────────────────────────────────

process.on('exit', () => {
  console.log('\n' + '─'.repeat(40));
  console.log(`  Tests: ${passed + failed}  ✅ ${passed} passed  ❌ ${failed} failed`);
  console.log('─'.repeat(40) + '\n');
  if (failed > 0) process.exitCode = 1;
});
