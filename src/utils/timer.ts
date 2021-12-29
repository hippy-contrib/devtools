/**
 * timers/promises 版 setTimeout
 * 运行环境 node 版本为 12，还不支持 node16 的新特性 promise timer，故封装一遍
 */
export const sleep = (time: number) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve(null);
    }, time);
  });
