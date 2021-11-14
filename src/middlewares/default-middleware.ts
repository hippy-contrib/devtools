import { PROTOCOL_ERROR_CODE } from '@/@types/enum';
import { Logger } from '@/utils/log';
import { MiddleWare } from './middleware-context';

const log = new Logger('default-middleware');

/**
 * 默认下行中间件，发送至 devtools
 */
export const defaultDownwardMiddleware: MiddleWare = async ({ msg, sendToDevtools }, next) => {
  await next();
  log.info('sendToDevtools %j', msg);
  return sendToDevtools(msg as Adapter.CDP.Res);
};

/**
 * 默认上行中间件，发送至 app
 */
export const defaultUpwardMiddleware: MiddleWare = async ({ msg, sendToApp }, next) => {
  await next();
  log.info('sendToApp %j', msg);
  return sendToApp(msg as Adapter.CDP.Req);
};

export const sendEmptyResultToDevtools: MiddleWare = async ({ msg, sendToDevtools }, next) => {
  await next();
  const req = msg as Adapter.CDP.Req;
  return sendToDevtools({
    id: req.id,
    method: req.method,
    result: {},
  });
};

export const sendFailResultToDevtools: MiddleWare = async ({ msg, sendToDevtools }, next) => {
  await next();
  const req = msg as Adapter.CDP.Req;
  return sendToDevtools({
    id: req.id,
    method: req.method,
    error: {
      code: PROTOCOL_ERROR_CODE.ProtocolNotFound,
      message: `'${req.method}' wasn't found`,
    },
  });
};
