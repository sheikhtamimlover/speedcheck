<div align="center">

<!-- Animated banner -->
<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=32&duration=2800&pause=2000&color=00D9FF&center=true&vCenter=true&width=600&lines=⚡+speedcheck;Internet+Speed+%26+Network+Diagnostics;Download+%7C+Upload+%7C+Ping+%7C+IP+%7C+Location" alt="speedcheck animated title" />

<br/>

[![npm version](https://img.shields.io/npm/v/speedcheck?color=00d9ff&style=flat-square&logo=npm)](https://www.npmjs.com/package/speedcheck)
[![license](https://img.shields.io/github/license/sheikhtamimlover/speedcheck?color=00d9ff&style=flat-square)](LICENSE)
[![node](https://img.shields.io/node/v/speedcheck?color=00d9ff&style=flat-square&logo=node.js)](https://nodejs.org)
[![repo size](https://img.shields.io/github/repo-size/sheikhtamimlover/speedcheck?color=00d9ff&style=flat-square)](https://github.com/sheikhtamimlover/speedcheck)
[![downloads](https://img.shields.io/npm/dm/speedcheck?color=00d9ff&style=flat-square)](https://www.npmjs.com/package/speedcheck)
[![stars](https://img.shields.io/github/stars/sheikhtamimlover/speedcheck?color=00d9ff&style=flat-square)](https://github.com/sheikhtamimlover/speedcheck/stargazers)
[![issues](https://img.shields.io/github/issues/sheikhtamimlover/speedcheck?color=00d9ff&style=flat-square)](https://github.com/sheikhtamimlover/speedcheck/issues)
[![author](https://img.shields.io/badge/author-Sheikh%20Tamim-00d9ff?style=flat-square)](https://github.com/sheikhtamimlover)

<br/>

> **A modern, full-featured CommonJS package for internet speed testing and network diagnostics.**  
> Measure download, upload, ping, latency, jitter — and get your public IP, geo-location, ISP, ASN, and network zone classification, all in one call.

<br/>

<!-- Animated feature pills -->
<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=14&duration=1500&pause=500&color=888888&center=true&vCenter=true&multiline=true&width=700&height=60&lines=Download+Speed+%7C+Upload+Speed+%7C+Ping+%2F+Latency+%7C+Jitter;IP+Address+%7C+Geo-Location+%7C+ISP+%7C+ASN+%7C+Network+Zone" alt="features" />

</div>

---

## ✨ Features

| Feature | Details |
|---|---|
| ⬇️ **Download Speed** | Streams from CDN endpoints (Cloudflare, OVH, Hetzner) with auto-fallback |
| ⬆️ **Upload Speed** | POSTs binary payloads to discard endpoints, measures real throughput |
| 📡 **Ping / Latency** | Multi-target HTTP RTT with min / max / avg / median / jitter |
| 🌐 **IP Address** | Public IPv4 detection via multiple providers with fallback |
| 📍 **Geo-Location** | City, region, country, coordinates, timezone, postal code |
| 🏢 **ISP & ASN** | Internet Service Provider name, organisation, and ASN number |
| 🗺️ **Network Zone** | Classifies connection as residential / mobile / datacenter / VPN |
| 🔒 **Privacy Detection** | Detects VPN, proxy, Tor, and anonymisation services |
| 📱 **Mobile Detection** | Identifies cellular / LTE / 5G connections |
| 🎨 **Pretty Output** | Coloured terminal output with ASCII speed bars |
| 🔄 **Auto-Fallback** | Every module tries multiple providers — never a single point of failure |
| 📦 **Zero native deps** | Pure Node.js `https` for core logic; optional `chalk` / `ora` for CLI |

---

## 📦 Installation

```bash
# npm
npm install speedcheck

# yarn
yarn add speedcheck

# pnpm
pnpm add speedcheck
```

> Requires **Node.js ≥ 14**

---

## 🚀 Quick Start

### Run as CLI

```bash
node node_modules/speedcheck/src/index.js
```

Or add to your `package.json` scripts and run `npm start`.

### Programmatic — full test

```js
const { SpeedCheck, formatResults } = require('speedcheck');

(async () => {
  const checker = new SpeedCheck();
  const results = await checker.runAll();

  console.log(formatResults(results));
  // or use the raw object:
  console.log(results);
})();
```

---

## 📖 API Reference

### `new SpeedCheck(options?)`

Main class that orchestrates all diagnostics.

```js
const checker = new SpeedCheck({
  pingRounds:       5,     // number of ping samples (default: 5)
  downloadDuration: 8000,  // download test duration in ms (default: 8000)
  uploadDuration:   6000,  // upload test duration in ms (default: 6000)
  verbose:          false, // print live progress to stdout (default: false)
});
```

#### Methods

| Method | Returns | Description |
|---|---|---|
| `checker.runAll()` | `Promise<SpeedCheckResult>` | Run all tests in parallel and return unified result |
| `checker.checkIP()` | `Promise<IPInfo>` | IP address + geo-location only |
| `checker.checkPing()` | `Promise<PingResult>` | Ping / latency only |
| `checker.checkDownload()` | `Promise<SpeedResult>` | Download speed only |
| `checker.checkUpload()` | `Promise<SpeedResult>` | Upload speed only |
| `checker.classifyZone(ipInfo)` | `object` | Classify network zone from an IPInfo object |

---

### Individual modules

```js
const {
  getIPInfo,       // IP + geo-location lookup
  measurePing,     // Ping / latency measurement
  measureDownload, // Download speed measurement
  measureUpload,   // Upload speed measurement
  getNetworkZone,  // Network zone classification
  formatResults,   // Pretty-print a result object
} = require('speedcheck');
```

#### `getIPInfo()`

```js
const info = await getIPInfo();
// {
//   ip:          '203.0.113.42',
//   city:        'Dhaka',
//   region:      'Dhaka Division',
//   country:     'Bangladesh',
//   countryCode: 'BD',
//   lat:         23.7104,
//   lon:         90.4074,
//   timezone:    'Asia/Dhaka',
//   postalCode:  '1000',
//   isp:         'Grameenphone Ltd.',
//   org:         'AS24389 Grameenphone Ltd.',
//   asn:         'AS24389',
//   isProxy:     false,
//   isMobile:    false,
//   provider:    'ipapi.co'
// }
```

#### `measurePing(rounds?)`

```js
const ping = await measurePing(5);
// {
//   min:     12,
//   max:     48,
//   avg:     24,
//   median:  22,
//   jitter:  6,
//   samples: [12, 18, 22, 30, 48],
//   unit:    'ms'
// }
```

#### `measureDownload(durationMs?, verbose?)`

```js
const dl = await measureDownload(8000);
// {
//   mbps:          94.32,
//   kbps:          94320,
//   MBs:           11.79,
//   bytesReceived: 94320000,
//   elapsedMs:     8012,
//   source:        'Cloudflare 25MB',
//   unit:          'Mbps'
// }
```

#### `measureUpload(durationMs?, verbose?)`

```js
const ul = await measureUpload(6000);
// {
//   mbps:      42.10,
//   kbps:      42100,
//   MBs:       5.26,
//   bytesSent: 31575000,
//   elapsedMs: 6003,
//   source:    'Cloudflare',
//   unit:      'Mbps'
// }
```

#### `getNetworkZone(ipInfo)`

```js
const zone = getNetworkZone(ipInfo);
// {
//   type:        'residential',  // 'residential' | 'mobile' | 'datacenter' | 'vpn'
//   privacy:     'standard',     // 'standard' | 'high' | 'low'
//   hosting:     false,
//   mobile:      false,
//   vpn:         false,
//   description: 'Standard home or office internet connection'
// }
```

---

### `SpeedCheckResult` shape

```js
{
  startedAt:   '2026-04-30T10:00:00.000Z',
  finishedAt:  '2026-04-30T10:00:22.000Z',
  ip:          '203.0.113.42',
  location: {
    city, region, country, countryCode,
    lat, lon, timezone, postalCode
  },
  isp:         'Grameenphone Ltd.',
  org:         'AS24389 Grameenphone Ltd.',
  asn:         'AS24389',
  networkZone: { type, privacy, hosting, mobile, vpn, description },
  ping:        { min, max, avg, median, jitter, samples, unit },
  download:    { mbps, kbps, MBs, bytesReceived, elapsedMs, source, unit },
  upload:      { mbps, kbps, MBs, bytesSent, elapsedMs, source, unit },
  errors:      { ip, ping, download, upload }  // null if no error
}
```

---

## 🧪 Running Tests

```bash
node test.js
```

The test suite covers:

- Unit tests (no network required) — formatters, zone classifier, constructor defaults
- Integration tests (network required) — IP lookup, ping, download, upload, full `runAll()`

---

## 📁 Project Structure

```
speedcheck/
├── src/
│   ├── index.js        ← Entry point & CLI runner
│   ├── speedcheck.js   ← Main SpeedCheck class
│   ├── ipinfo.js       ← IP & geo-location lookup
│   ├── ping.js         ← Ping / latency measurement
│   ├── download.js     ← Download speed measurement
│   ├── upload.js       ← Upload speed measurement
│   ├── zone.js         ← Network zone classification
│   └── formatter.js    ← Terminal output formatter
├── test.js             ← Full test suite
├── package.json
└── README.md
```

---

## 🔧 How It Works

```
speedcheck.runAll()
    │
    ├─► getIPInfo()        → tries ipapi.co → ipwho.is → ipify.org
    │
    ├─► measurePing()      → HTTP HEAD to Google, Cloudflare, Amazon, Microsoft, Apple
    │
    ├─► measureDownload()  → streams from Cloudflare → OVH → Hetzner
    │
    └─► measureUpload()    → POST to Cloudflare → httpbin
            │
            └─► getNetworkZone(ipInfo)  → classifies connection type
```

All four run in **parallel** via `Promise.allSettled` — a failure in one never blocks the others.

---

## 🌍 Provider Fallback Chain

| Module | Primary | Fallback 1 | Fallback 2 |
|---|---|---|---|
| IP Info | ipapi.co | ipwho.is | ipify.org |
| Download | Cloudflare | OVH | Hetzner |
| Upload | Cloudflare | httpbin | — |
| Ping | google.com | cloudflare.com | amazon.com + more |

---

## 📄 License

[MIT](LICENSE) © [Sheikh Tamim](https://github.com/sheikhtamimlover)

---

<div align="center">

Made with ❤️ by **Sheikh Tamim**

[![GitHub](https://img.shields.io/badge/GitHub-sheikhtamimlover-181717?style=flat-square&logo=github)](https://github.com/sheikhtamimlover)
[![Repo](https://img.shields.io/badge/Repo-speedcheck-00d9ff?style=flat-square&logo=github)](https://github.com/sheikhtamimlover/speedcheck)

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=13&duration=3000&pause=1000&color=444444&center=true&vCenter=true&width=400&lines=Star+⭐+the+repo+if+you+find+it+useful!" alt="star prompt" />

</div>
