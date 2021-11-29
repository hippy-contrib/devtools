import { ChromeCommand, ChromeEvent, IOS100Command, IOS100Event } from 'tdf-devtools-protocol/dist/types';
import { Logger } from '@/utils/log';
import { requestId } from '../global-id';
import { MiddleWareManager } from '../middleware-context';
import TraceAdapter from './adapter/trace-adapter';

const log = new Logger('trace-middleware');

export const traceMiddleWareManager: MiddleWareManager = {
  downwardMiddleWareListMap: {
    [IOS100Event.ScriptProfilerTrackingComplete]: ({ msg, sendToDevtools }) => {
      const eventRes = msg as Adapter.CDP.EventRes;
      log.info(`onPerformanceProfileCompleteEvent, msg = ${eventRes}`);
      const traceAdapter = new TraceAdapter();
      const v8json = traceAdapter.jsc2v8(eventRes.params);
      return sendToDevtools({
        method: ChromeEvent.TracingDataCollected,
        params: {
          value: v8json,
        },
      });
    },
  },
  upwardMiddleWareListMap: {
    [ChromeCommand.TracingStart]: ({ sendToApp }) =>
      sendToApp({
        id: requestId.create(),
        method: IOS100Command.ScriptProfilerStartTracking,
        params: { includeSamples: true },
      }),
    [ChromeCommand.TracingEnd]: ({ sendToApp }) =>
      sendToApp({
        id: requestId.create(),
        method: IOS100Command.ScriptProfilerStopTracking,
        params: {},
      }),
  },
};
