import { MiddleWare } from '@/middlewares';

/**
 * 中间件数组 -> 链式调用的一个中间件
 */
export const composeMiddlewares = (middlewareList: MiddleWare[]): MiddleWare => {
  if (!Array.isArray(middlewareList)) throw new Error('middlewareList 必须是数组');
  for (const fn of middlewareList) {
    if (typeof fn !== 'function') throw new Error('Middleware 必须是函数');
  }

  return (context, next?) => {
    let lastMiddlewareIndex = -1;
    return dispatch(0);
    function dispatch(i: number) {
      if (i <= lastMiddlewareIndex) return Promise.reject(new Error('next() 不能调用多次'));
      lastMiddlewareIndex = i;
      let fn = middlewareList[i];
      if (i === middlewareList.length) fn = next;
      if (!fn) return Promise.resolve();
      try {
        return fn(context, dispatch.bind(null, i + 1));
      } catch (err) {
        return Promise.reject(err);
      }
    }
  };
};
