import fs from 'fs';
import path from 'path';
import { TdfCommand } from 'tdf-devtools-protocol/dist/types';
import { config } from '@/config';
import { Logger } from '@/utils/log';
import { MiddleWareManager } from '../middleware-context';

const log = new Logger('tdf-heap-middleware');

// TODO 文件路径 加clientId
export const tdfHeapMiddleWareManager: MiddleWareManager = {
  downwardMiddleWareListMap: {
    [TdfCommand.TDFMemoryGetHeapMeta]: async (ctx, next) => {
      try {
        if (!('id' in ctx.msg)) {
          return next();
        }
        const { cachePath } = config;
        const fpath = path.join(cachePath, `${ctx.msg.id}.json`);
        await fs.promises.writeFile(fpath, JSON.stringify(ctx.msg));
        return ctx.sendToDevtools(ctx.msg as Adapter.CDP.Res);
      } catch (e) {
        log.error('write heap failed! %s', (e as Error)?.stack);
        return Promise.reject(e);
      }
    },
  },
  upwardMiddleWareListMap: {
    [TdfCommand.TDFMemoryFetchHeapCache]: async (ctx, next) => {
      try {
        if (!('id' in ctx.msg)) {
          return next();
        }
        const req = ctx.msg as Adapter.CDP.Req;
        const { cachePath } = config;
        const fpath = path.join(cachePath, `${req.params.id}.json`);
        const cacheMsgStr = await fs.promises.readFile(fpath, 'utf8');
        const cacheMsg: Adapter.CDP.CommandRes = JSON.parse(cacheMsgStr);
        return ctx.sendToDevtools({
          id: ctx.msg.id,
          method: ctx.msg.method,
          result: cacheMsg.result,
        });
      } catch (e) {
        log.error('write heap failed! %s', (e as Error)?.stack);
        return Promise.reject(e);
      }
    },
  },
};
