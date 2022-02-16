export const DEFAULT_REMOTE = {
  protocol: 'https',
  host: process.env.DOMAIN?.replace(/https?:\/\//, '') || 'devtools.hippy.myqcloud.com',
  port: 443,
};

export const PUBLIC_RESOURCE = 'https://devtools.hippy.myqcloud.com/';
