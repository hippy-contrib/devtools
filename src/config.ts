export const config = {
  domain: 'tdf-devtools.woa.com',
  wsPath: '/debugger-proxy',
  redis: {
    url: 'redis://127.0.0.1:6379/0',
    key: 'tdf:debugtargets',
  },
};