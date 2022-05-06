import path from 'path';
import cors from '@koa/cors';
import staticCache from 'koa-static-cache';
import serve from 'koa-static';
import bodyParser from 'koa-bodyparser';
import Koa from 'koa';
import { Logger } from '@/utils/log';
import { getDebugTargetsRouter } from '@/router/debug-targets';
import { config } from '@/config';

const log = new Logger('router');

export const routeApp = (app: Koa) => {
  const { static: staticPath, entry } = global.debugAppArgv;

  app.use(bodyParser());

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

  const defaultStaticOption = {
    buffer: false,
    dynamic: true,
    preload: false,
  };
  // devtools frontend resources
  app.use(
    staticCache(path.join(__dirname, '../public'), {
      ...defaultStaticOption,
      maxAge: 60 * 60,
    }),
  );
  // hmr resources
  app.use(serve(config.hmrStaticPath));

  // bundle resources
  let servePath;
  if (staticPath) servePath = path.resolve(staticPath);
  else servePath = path.resolve(path.dirname(entry));
  log.info(`serve bundle: ${entry}; serve folder: ${servePath}`);
  app.use(serve(servePath));
};
