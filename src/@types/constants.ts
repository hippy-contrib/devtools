export const DEFAULT_REMOTE = {
  protocol: 'https',
  host: process.env.DOMAIN?.replace(/https?:\/\//, '') || 'devtools.qq.com',
  port: 443,
};

export const SIMULATOR_DEVICE_NAME = 'SIMULATOR';
