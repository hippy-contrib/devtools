/**
 * 注意 addon.ts 文件的路径不能修改，保持在 npm 包、electron dev 环境和 electron prod 环境都能找到 Tunnel.node
 * electron build 后目录结构为：
 *    ├── app.asar              (压缩包，app.getAppPath() 指向这里)
 *        ├── background.js
 *    ├── app.asar.unpacked
 *    ├── build
 *        ├── Tunnel.node
 */

import addon from '@/build/Tunnel.node';
global.addon = addon;
export const { addEventListener, tunnelStart, getDeviceList, selectDevice, exit, sendMsg } = global.addon;
