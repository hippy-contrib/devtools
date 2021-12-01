import path from 'path';
import cors from '@koa/cors';
import staticCache from 'koa-static-cache';
import Koa from 'koa';
import { Logger } from '@/utils/log';
import { getDebugTargetsRouter } from '@/router/debug-targets';

const log = new Logger('router');

export const routeApp = (app: Koa) => {
  const { staticPath, entry } = global.appArgv;

  app.use(cors());

  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (e) {
      log.error('koa error: %s', (e as Error)?.stack);
      return (ctx.body = (e as Error)?.stack);
    }
  });

  const debugTargetsRouter = getDebugTargetsRouter();
  app.use(debugTargetsRouter.routes()).use(debugTargetsRouter.allowedMethods());

  let servePath;
  if (staticPath) servePath = path.resolve(staticPath);
  else servePath = path.resolve(path.dirname(entry));
  log.info(`serve bundle: ${entry}; serve folder: ${servePath}`);

  const defaultStaicOption = {
    buffer: false,
    dynamic: true,
  };
  // bundle 静态资源，禁用缓存
  app.use(staticCache(servePath, defaultStaicOption));
  // devtools 静态资源，优先强缓存，强缓存过期后协商缓存
  app.use(
    staticCache(path.join(__dirname, '../public'), {
      ...defaultStaicOption,
      maxAge: 60 * 60,
    }),
  );
};
