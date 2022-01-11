import Router from 'koa-router';
import { DebugTargetManager } from '@/controller/debug-targets';

export const getDebugTargetsRouter = () => {
  const router = new Router();

  router.get('/json/version', (ctx) => {
    ctx.body = {
      Browser: 'Hippy/v1.0.0',
      'Protocol-Version': '1.1',
    };
  });

  const getDebugTargets = async (ctx) => {
    const { hash = '' } = ctx.query;
    const rst = await DebugTargetManager.getDebugTargets(hash);
    ctx.body = rst;
  };

  router.get('/json', getDebugTargets);
  router.get('/json/list', getDebugTargets);

  return router;
};
