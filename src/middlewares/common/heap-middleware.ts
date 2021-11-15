import fs from 'fs';
import path from 'path';
import { TdfCommand } from 'tdf-devtools-protocol/dist/types';
import { config } from '@/config';
import { MiddleWareManager } from '../middleware-context';

export const tdfHeapMiddleWareManager: MiddleWareManager = {
  upwardMiddleWareListMap: {
    [TdfCommand.TDFMemoryGetHeapMeta]: async (ctx, next) => {
      try {
        if (!('id' in ctx.msg)) {
          return next();
        }
        const fpath = path.join(config.cachePath, `${ctx.msg.id}.json`);
        await fs.promises.writeFile(fpath, JSON.stringify(ctx.msg));
        return ctx.sendToDevtools(ctx.msg as Adapter.CDP.Res);
      } catch (e) {
        console.error('write heap failed!', e);
        return Promise.reject(e);
      }
    },
  },
  downwardMiddleWareListMap: {
    [TdfCommand.TDFMemoryFetchHeapCache]: async (ctx, next) => {
      try {
        if (!('id' in ctx.msg)) {
          return next();
        }
        const req = ctx.msg as Adapter.CDP.Req;
        const fpath = path.join(config.cachePath, `${req.params.id}.json`);
        const cacheMsgStr = await fs.promises.readFile(fpath, 'utf8');
        const cacheMsg: Adapter.CDP.CommandRes = JSON.parse(cacheMsgStr);
        return ctx.sendToDevtools({
          id: ctx.msg.id,
          method: ctx.msg.method,
          result: cacheMsg.result,
        });
      } catch (e) {
        console.error('write heap failed!', e);
        return Promise.reject(e);
      }
    },
  },
};
