export const sleep = (time: number) =>
  // 运行环境 node 版本为 12，还不支持node16的新特性 promise timer，故封装一遍
  new Promise((resolve) => {
    setTimeout(() => {
      resolve(null);
    }, time);
  });
