import path from 'path';
import cors from '@koa/cors';
import serve from 'koa-static';
import conditional from 'koa-conditional-get';
import etag from 'koa-etag';
import Koa from 'koa';
import { Logger } from '@/utils/log';
import { getDebugTargetsRouter } from '@/router/debug-targets';

const log = new Logger('router');

export const createRouter = (app: Koa) => {
  const { staticPath, entry, publicPath } = global.appArgv;

  app.use(cors());
  app.use(conditional());
  app.use(etag());
  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (e) {
      log.error(`koa error: ${JSON.stringify(e)}`);
      return (ctx.body = (e as any).msg);
    }
  });

  const debugTargetsRouter = getDebugTargetsRouter();
  app.use(debugTargetsRouter.routes()).use(debugTargetsRouter.allowedMethods());

  let servePath;
  if (staticPath) servePath = path.resolve(staticPath);
  else servePath = path.resolve(path.dirname(entry));
  log.info(`serve bundle: ${entry}; serve folder: ${servePath}`);
  app.use(
    serve(servePath, {
      setHeaders: (res, path) => {
        if (/index\.bundle$/.test(path)) {
          res.setHeader('Content-Type', 'application/javascript');
        }
      },
    }),
  );
  app.use(serve(publicPath || path.join(__dirname, 'public')));
};
