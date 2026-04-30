'use strict';

/**
 * SpeedCheck — Main orchestrator class
 */

const { getIPInfo } = require('./ipinfo');
const { measurePing } = require('./ping');
const { measureDownload } = require('./download');
const { measureUpload } = require('./upload');
const { getNetworkZone } = require('./zone');

class SpeedCheck {
  /**
   * @param {object} [options]
   * @param {number} [options.pingRounds=5]          - Number of ping rounds
   * @param {number} [options.downloadDuration=8000] - Download test duration (ms)
   * @param {number} [options.uploadDuration=6000]   - Upload test duration (ms)
   * @param {boolean} [options.verbose=false]        - Print progress to stdout
   */
  constructor(options = {}) {
    this.options = Object.assign(
      {
        pingRounds: 5,
        downloadDuration: 8000,
        uploadDuration: 6000,
        verbose: false,
      },
      options
    );
  }

  /**
   * Run all diagnostics and return a unified result object.
   * @returns {Promise<SpeedCheckResult>}
   */
  async runAll() {
    const startedAt = new Date().toISOString();

    const [ipInfo, pingResult, downloadResult, uploadResult] = await Promise.allSettled([
      getIPInfo(),
      measurePing(this.options.pingRounds),
      measureDownload(this.options.downloadDuration, this.options.verbose),
      measureUpload(this.options.uploadDuration, this.options.verbose),
    ]);

    const ip = ipInfo.status === 'fulfilled' ? ipInfo.value : null;
    const ping = pingResult.status === 'fulfilled' ? pingResult.value : null;
    const download = downloadResult.status === 'fulfilled' ? downloadResult.value : null;
    const upload = uploadResult.status === 'fulfilled' ? uploadResult.value : null;

    const zone = ip ? getNetworkZone(ip) : null;

    return {
      startedAt,
      finishedAt: new Date().toISOString(),
      ip: ip ? ip.ip : null,
      location: ip
        ? {
            city: ip.city,
            region: ip.region,
            country: ip.country,
            countryCode: ip.countryCode,
            lat: ip.lat,
            lon: ip.lon,
            timezone: ip.timezone,
            postalCode: ip.postalCode,
          }
        : null,
      isp: ip ? ip.isp : null,
      org: ip ? ip.org : null,
      asn: ip ? ip.asn : null,
      networkZone: zone,
      ping: ping,
      download: download,
      upload: upload,
      errors: {
        ip: ipInfo.status === 'rejected' ? ipInfo.reason.message : null,
        ping: pingResult.status === 'rejected' ? pingResult.reason.message : null,
        download: downloadResult.status === 'rejected' ? downloadResult.reason.message : null,
        upload: uploadResult.status === 'rejected' ? uploadResult.reason.message : null,
      },
    };
  }

  /**
   * Run only the IP / location lookup.
   * @returns {Promise<object>}
   */
  async checkIP() {
    return getIPInfo();
  }

  /**
   * Run only the ping test.
   * @returns {Promise<PingResult>}
   */
  async checkPing() {
    return measurePing(this.options.pingRounds);
  }

  /**
   * Run only the download speed test.
   * @returns {Promise<SpeedResult>}
   */
  async checkDownload() {
    return measureDownload(this.options.downloadDuration, this.options.verbose);
  }

  /**
   * Run only the upload speed test.
   * @returns {Promise<SpeedResult>}
   */
  async checkUpload() {
    return measureUpload(this.options.uploadDuration, this.options.verbose);
  }

  /**
   * Get network zone classification for a given IP info object.
   * @param {object} ipInfo
   * @returns {object}
   */
  classifyZone(ipInfo) {
    return getNetworkZone(ipInfo);
  }
}

module.exports = SpeedCheck;
