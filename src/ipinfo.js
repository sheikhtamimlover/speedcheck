'use strict';

/**
 * IP & Geo-location lookup module
 * Uses multiple free providers with automatic fallback.
 */

const https = require('https');

/**
 * Fetch JSON from a URL using the built-in https module (no extra deps).
 * @param {string} url
 * @param {number} [timeoutMs=5000]
 * @returns {Promise<object>}
 */
function fetchJSON(url, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: timeoutMs }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Failed to parse JSON from ' + url));
        }
      });
    });
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out: ' + url));
    });
    req.on('error', reject);
  });
}

/**
 * Normalise raw API responses into a unified shape.
 */
function normalise(raw, provider) {
  if (provider === 'ipapi') {
    return {
      ip: raw.ip,
      city: raw.city,
      region: raw.region,
      country: raw.country_name,
      countryCode: raw.country_code,
      lat: raw.latitude,
      lon: raw.longitude,
      timezone: raw.timezone,
      postalCode: raw.postal,
      isp: raw.org,
      org: raw.org,
      asn: raw.asn,
      isProxy: raw.proxy || false,
      isMobile: raw.mobile || false,
      provider: 'ipapi.co',
    };
  }

  if (provider === 'ipwho') {
    return {
      ip: raw.ip,
      city: raw.city,
      region: raw.region,
      country: raw.country,
      countryCode: raw.country_code,
      lat: raw.latitude,
      lon: raw.longitude,
      timezone: raw.timezone ? raw.timezone.id : null,
      postalCode: raw.postal,
      isp: raw.connection ? raw.connection.isp : null,
      org: raw.connection ? raw.connection.org : null,
      asn: raw.connection ? String(raw.connection.asn) : null,
      isProxy: false,
      isMobile: false,
      provider: 'ipwho.is',
    };
  }

  if (provider === 'ipify') {
    // ipify only returns the IP; we enrich with a second call
    return {
      ip: raw.ip,
      city: null,
      region: null,
      country: null,
      countryCode: null,
      lat: null,
      lon: null,
      timezone: null,
      postalCode: null,
      isp: null,
      org: null,
      asn: null,
      isProxy: false,
      isMobile: false,
      provider: 'ipify.org',
    };
  }

  return raw;
}

/**
 * Get full IP information with geo-location, ISP, ASN, etc.
 * Tries multiple providers and returns the first successful result.
 *
 * @returns {Promise<IPInfo>}
 */
async function getIPInfo() {
  const providers = [
    {
      name: 'ipapi',
      url: 'https://ipapi.co/json/',
    },
    {
      name: 'ipwho',
      url: 'https://ipwho.is/',
    },
    {
      name: 'ipify',
      url: 'https://api.ipify.org?format=json',
    },
  ];

  const errors = [];

  for (const p of providers) {
    try {
      const raw = await fetchJSON(p.url);
      if (raw.error || raw.reason) {
        errors.push(`${p.name}: ${raw.reason || raw.error}`);
        continue;
      }
      return normalise(raw, p.name);
    } catch (err) {
      errors.push(`${p.name}: ${err.message}`);
    }
  }

  throw new Error('All IP providers failed: ' + errors.join(' | '));
}

module.exports = { getIPInfo, fetchJSON };
