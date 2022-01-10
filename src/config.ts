import path from 'path';

const host =
  !global.debugAppArgv?.host || global.debugAppArgv?.host === '0.0.0.0' ? 'localhost' : global.debugAppArgv?.host;
const domain = `${host}:${global.debugAppArgv?.port || 38989}`;

export const config: Config = {
  domain,
  wsPath: '/debugger-proxy',
  cachePath: path.join(__dirname, 'cache'),
  logPath: path.join(__dirname, 'log'),
  hmrPortPath: path.join(__dirname, 'cache/hmr-port.txt'),
  iWDPStartPort: 9200,
  iWDPEndPort: 9300,
  redis: {
    // ⚠️ redis-server 6 以下，username 需要置空
    url: `redis://:${process.env.REDIS_PWD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/0`,
    key: 'tdf:debugtargets',
  },
};

interface Config {
  domain: string;
  wsPath: string;
  cachePath: string;
  logPath: string;
  hmrPortPath: string;
  iWDPStartPort: number;
  iWDPEndPort: number;
  redis: {
    url: string;
    key: string;
  };
}
