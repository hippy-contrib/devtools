import path from 'path';

export const config = {
  domain: 'localhost:38989',
  wsPath: '/debugger-proxy',
  cachePath: path.join(__dirname, 'cache'),
  logPath: path.join(__dirname, 'log'),
  redis: {
    // ‼️ redis-server 6 以下，username 需要置空
    // url: 'redis://:tdf~jl80;-asd@gz-crs-a7miptxr.sql.tencentcdb.com:29804/0',
    // url: 'redis://:tdf~jl80;-asd@11.167.18.162:7760/0',
    url: 'redis://127.0.0.1:6379/0',
    key: 'tdf:debugtargets',
  },
};
