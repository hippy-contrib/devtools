import path from 'path';

export const config = {
  domain: 'tdf-devtools.woa.com',
  wsPath: '/debugger-proxy',
  cachePath: path.join(__dirname, 'cache'),
  logPath: path.join(__dirname, 'log'),
  redis: {
    url: 'redis://127.0.0.1:6379/0',
    key: 'tdf:debugtargets',
  },
};
