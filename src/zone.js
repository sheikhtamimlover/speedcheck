'use strict';

/**
 * Network zone classification module
 * Determines network type, privacy level, and hosting classification.
 */

/**
 * Classify the network zone based on IP info.
 *
 * @param {object} ipInfo
 * @returns {object} zone classification
 */
function getNetworkZone(ipInfo) {
  if (!ipInfo) {
    return {
      type: 'unknown',
      privacy: 'unknown',
      hosting: false,
      description: 'No IP information available',
    };
  }

  const { isp = '', org = '', asn = '', isProxy = false, isMobile = false } = ipInfo;

  const ispLower = isp.toLowerCase();
  const orgLower = org.toLowerCase();
  const combined = `${ispLower} ${orgLower}`;

  // Detect hosting / datacenter
  const hostingKeywords = [
    'amazon',
    'aws',
    'google cloud',
    'gcp',
    'microsoft azure',
    'azure',
    'digitalocean',
    'linode',
    'vultr',
    'ovh',
    'hetzner',
    'cloudflare',
    'akamai',
    'fastly',
    'hosting',
    'datacenter',
    'data center',
    'server',
    'colocation',
    'colo',
  ];

  const isHosting = hostingKeywords.some((kw) => combined.includes(kw));

  // Detect VPN / Proxy
  const vpnKeywords = [
    'vpn',
    'proxy',
    'private relay',
    'nordvpn',
    'expressvpn',
    'protonvpn',
    'mullvad',
    'tor',
    'anonymizer',
  ];

  const isVPN = isProxy || vpnKeywords.some((kw) => combined.includes(kw));

  // Detect mobile
  const mobileKeywords = ['mobile', 'cellular', 'wireless', 'lte', '5g', '4g', '3g'];
  const isMobileNetwork = isMobile || mobileKeywords.some((kw) => combined.includes(kw));

  // Classify type
  let type = 'residential';
  if (isHosting) type = 'datacenter';
  else if (isMobileNetwork) type = 'mobile';
  else if (isVPN) type = 'vpn';

  // Privacy level
  let privacy = 'standard';
  if (isVPN) privacy = 'high';
  else if (isHosting) privacy = 'low';

  // Description
  const descriptions = {
    residential: 'Standard home or office internet connection',
    mobile: 'Mobile cellular network (3G/4G/5G)',
    datacenter: 'Datacenter or cloud hosting provider',
    vpn: 'VPN, proxy, or anonymization service',
  };

  return {
    type,
    privacy,
    hosting: isHosting,
    mobile: isMobileNetwork,
    vpn: isVPN,
    description: descriptions[type] || 'Unknown network type',
  };
}

module.exports = { getNetworkZone };
