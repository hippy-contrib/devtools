import { TdfEvent } from 'tdf-devtools-protocol/dist/types/enum-tdf-mapping';
import { Logger } from '@/utils/log';
import { updateDebugTarget } from '@/utils/debug-target';
import { MiddleWareManager } from '../middleware-context';

const log = new Logger('tdf-runtime-middleware');

export const tdfRuntimeMiddleWareManager: MiddleWareManager = {
  downwardMiddleWareListMap: {
    [TdfEvent.TDFRuntimeUpdateContextInfo]: async ({ clientId, msg }) => {
      const eventRes = msg as Adapter.CDP.EventRes<ProtocolTdf.TDFRuntime.UpdateContextInfoEvent>;
      const { contextName } = eventRes.params;
      try {
        await updateDebugTarget(clientId, { title: contextName });
      } catch (e) {
        log.error('update DebugTarget contextName fail', (e as any).stack);
      }
      return msg;
    },
  },
  upwardMiddleWareListMap: {},
};
