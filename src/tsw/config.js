'use strict';

if (global.window) {
  global.window.disable();
}

module.exports = {
  httpPort: 8080,
  appid: 'tsw1930',
  appkey: 'AQ6cAtkNj8ZTNmnystNNCPA4',
  workerUid: 'root',
  modAct: {
    getModAct(req) {
      return req.REQUEST.pathname;
    },
  },
  // 模块映射
  modMap: {
    find() {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require(process.env.APP_ENTRY);
    },
  },
  extendMod: {
    getUin(request) {
      const req = request;
      const uin = req.cookies.p_uin || req.cookies.uin || '';
      return uin.replace(/o0*/, '');
    },
  },
};
