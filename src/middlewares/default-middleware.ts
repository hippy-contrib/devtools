import { ProtocolErrorCode } from '@/@types/enum';
import { MiddleWare } from './middleware-context';

/**
 * 默认下行中间件，发送至 devtools
 */
export const defaultDownwardMiddleware: MiddleWare = async ({ msg, sendToDevtools }, next) => {
  await next();
  return sendToDevtools(msg as Adapter.CDP.Res);
};

/**
 * 默认上行中间件，发送至 app
 */
export const defaultUpwardMiddleware: MiddleWare = async ({ msg, sendToApp }, next) => {
  await next();
  return sendToApp(msg as Adapter.CDP.Req);
};

/**
 * 发送空包至 devtools
 */
export const sendEmptyResultToDevtools: MiddleWare = async ({ msg, sendToDevtools }, next) => {
  const req = msg as Adapter.CDP.Req;
  return sendToDevtools({
    id: req.id,
    method: req.method,
    result: {},
  });
};

/**
 * 发送失败回包至 devtools
 */
export const sendFailResultToDevtools: MiddleWare = async ({ msg, sendToDevtools }, next) => {
  const req = msg as Adapter.CDP.Req;
  return sendToDevtools({
    id: req.id,
    method: req.method,
    error: {
      code: ProtocolErrorCode.ProtocolNotFound,
      message: `'${req.method}' wasn't found`,
    },
  });
};
