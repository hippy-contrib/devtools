import path from 'path';

export const config: Config = {
  domain: 'localhost:38989',
  wsPath: '/debugger-proxy',
  cachePath: path.join(__dirname, 'cache'),
  logPath: path.join(__dirname, 'log'),
  hmrPortPath: path.join(__dirname, 'cache/hmr-port.txt'),
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
  redis: {
    url: string;
    key: string;
  };
}
