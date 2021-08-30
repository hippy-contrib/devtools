import { MiddleWare } from './middleware-context';

export const defaultUpwardMiddleware: MiddleWare = async ({ msg, sendToDevtools }, next) => {
  await next();
  return sendToDevtools(msg as Adapter.CDP.Res);
};

export const defaultDownwardMiddleware: MiddleWare = async ({ msg, sendToApp }, next) => {
  await next();
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
      code: -32601,
      message: `'${req.method}' wasn't found`,
    },
  });
};
