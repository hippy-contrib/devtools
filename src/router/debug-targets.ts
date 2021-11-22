import Router from 'koa-router';
import { DebugTargetManager } from 'src/controller/debug-targets';

export const getDebugTargetsRouter = () => {
  const router = new Router();

  router.get('/json/version', (ctx) => {
    ctx.body = { Browser: 'Hippy/v1.0.0', 'Protocol-Version': '1.1' };
  });

  router.get('/json', async (ctx) => {
    const rst = await DebugTargetManager.getDebugTargets();
    ctx.body = rst;
  });

  router.get('/json/list', async (ctx) => {
    const rst = await DebugTargetManager.getDebugTargets();
    ctx.body = rst;
  });

  return router;
};
