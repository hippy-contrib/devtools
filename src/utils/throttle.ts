import { throttle as lodashThrottle } from 'lodash';

export const throttle = (
  fn: Function,
  wait: number,
  option = {
    leading: true,
    trailing: false,
  },
) => {
  const throttled = lodashThrottle(
    async (...args) => {
      const AsyncFunction = (async () => {}).constructor;
      if (fn instanceof AsyncFunction) {
        await fn(...args);
      } else {
        fn(...args);
      }

      return Date.now();
    },
    wait,
    option,
  );

  let prevTs;
  let currTs;
  let isThrottled;
  const thunk = (...args) => {
    currTs = throttled(...args);
    isThrottled = prevTs === currTs;
    prevTs = currTs;
  };

  return {
    throttledFn: thunk,
    isThrottled: () => isThrottled,
  };
};
