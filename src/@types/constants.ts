export const DEFAULT_REMOTE = {
  protocol: 'https',
  host: process.env.DOMAIN?.replace(/https?:\/\//, '') || 'devtools.qq.com',
  port: 443,
};

export const SIMULATOR_DEVICE_NAME = 'SIMULATOR';

/**
 * add host header in IAS nginx config
 * so server could distinguish intranet and extranet
 */
export const HOST_HEADER = 'X-IAS-HOST';

// custom implement domain list
export const customDomains = [
  'Page',
  'DOM',
  'CSS',
  'Overlay',
  'TDFInspector',
  'TDFPerformance',
  'TDFMemory',
  'TDFLog',
  'TDFRuntime',
];
