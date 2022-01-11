import path from 'path';

export const config: Config = {
  ...getPublicDomain(),
  wsPath: '/debugger-proxy',
  cachePath: path.join(__dirname, 'cache'),
  hmrStaticPath: path.join(__dirname, 'hmr'),
  logPath: path.join(__dirname, 'log'),
  hmrPortPath: path.join(__dirname, 'cache/hmr-port.txt'),
  iWDPStartPort: 9200,
  iWDPEndPort: 9300,
  redis: {
    // ⚠️ redis-server 6 以下，username 需要置空
    url: `redis://:${process.env.REDIS_PWD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/0`,
    debugTargetTable: 'tdf:debugtargets',
    bundleTable: 'tdf:bundles',
  },
  isRemote: process.env.IS_REMOTE === 'true',
};

interface Config {
  domain: string;
  wsDomain: string;
  wsPath: string;
  cachePath: string;
  hmrStaticPath: string;
  logPath: string;
  hmrPortPath: string;
  iWDPStartPort: number;
  iWDPEndPort: number;
  redis: {
    url: string;
    debugTargetTable: string;
    bundleTable: string;
  };
  isRemote: boolean;
}

function getPublicDomain() {
  const hostFromArgv =
    !global.debugAppArgv?.host || global.debugAppArgv?.host === '0.0.0.0' ? 'localhost' : global.debugAppArgv?.host;
  const portFromArgv = global.debugAppArgv?.port || 38989;
  const host = process.env.PUBLIC_HOST || hostFromArgv;
  const port = process.env.PUBLIC_PORT || portFromArgv;
  const domain = `http://${host}:${port}`;
  const wsDomain = domain.replace('https://', 'wss://').replace('http://', 'ws://');
  return { domain, wsDomain };
}
