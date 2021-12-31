// import fs from 'fs';
// import path from 'path';
import Router from 'koa-router';
// import staticCache from 'koa-static-cache';
// import { BundleManager } from '@/controller/bundles';
// import { config } from '@/config';

export const getBundleRouter = () => {
  const router = new Router();

  //   router.get('/index.bundle', async (ctx) => {

  //     const hash = ctx.query.hash as string;
  //     if (!hash) return res404();

  //     const bundle = await BundleManager.get(hash);
  //     if (!bundle) return res404();

  //     const fullFpath = path.join(config.hmrStaticPath, hash, 'index.bundle');
  //     ctx.body = fs.createReadStream();

  //     function res404() {
  //       ctx.status = 404;
  //       ctx.body = '';
  //       return;
  //     }
  //   });

  return router;
};
