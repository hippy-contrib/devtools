import fs from 'fs';
import path from 'path';
import { TdfCommand } from 'tdf-devtools-protocol/dist/types/enum-tdf-mapping';
import { config } from '@/config';
import { Logger } from '@/utils/log';
import { MiddleWareManager } from '../middleware-context';

const log = new Logger('tdf-heap-middleware');

// TODO 暂只缓存本地。后续缓存到 redis，或者容器外部挂载数据卷
export const tdfHeapMiddleWareManager: MiddleWareManager = {
  downwardMiddleWareListMap: {
    [TdfCommand.TDFMemoryGetHeapMeta]: async ({ msg, sendToDevtools }) => {
      try {
        const commandRes = msg as Adapter.CDP.CommandRes<ProtocolTdf.TDFMemory.GetHeapMetaResponse>;
        const { cachePath } = config;
        const fpath = path.join(cachePath, `${commandRes.id}.json`);
        await fs.promises.writeFile(fpath, JSON.stringify(commandRes));
        return sendToDevtools(commandRes);
      } catch (e) {
        log.error('write heap failed! %s', (e as Error)?.stack);
        return Promise.reject(e);
      }
    },
  },
  upwardMiddleWareListMap: {
    [TdfCommand.TDFMemoryFetchHeapCache]: async ({ msg, sendToDevtools }) => {
      try {
        const req = msg as Adapter.CDP.Req<ProtocolTdf.TDFMemory.FetchHeapCacheRequest>;
        const { cachePath } = config;
        const fpath = path.join(cachePath, `${req.params.id}.json`);
        const cacheMsgStr = await fs.promises.readFile(fpath, 'utf8');
        const cacheMsg: Adapter.CDP.CommandRes = JSON.parse(cacheMsgStr);
        return sendToDevtools({
          id: req.id,
          method: req.method,
          result: cacheMsg.result,
        });
      } catch (e) {
        log.error('write heap failed! %s', (e as Error)?.stack);
        return Promise.reject(e);
      }
    },
  },
};
