import { requestId } from '../global-id';
import { MiddleWareManager } from '../middleware-context';
import TraceAdapter from './trace-adapter';
import { ChromeCommand, ChromeEvent, Ios100Command, Ios100Event } from 'tdf-devtools-protocol/types';

export const traceMiddleWareManager: MiddleWareManager = {
  upwardMiddleWareListMap: {
    [Ios100Event.ScriptProfilerTrackingComplete]: ({ msg, sendToDevtools }) => {
      const eventRes = msg as Adapter.CDP.EventRes;
      console.log(`onPerformanceProfileCompleteEvent, msg = ${eventRes}`);
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
  downwardMiddleWareListMap: {
    [ChromeCommand.TracingStart]: ({ sendToApp }) =>
      sendToApp({
        id: requestId.create(),
        method: Ios100Command.ScriptProfilerStartTracking,
        params: { includeSamples: true },
      }),
    [ChromeCommand.TracingEnd]: ({ sendToApp }) =>
      sendToApp({
        id: requestId.create(),
        method: Ios100Command.ScriptProfilerStopTracking,
        params: {},
      }),
  },
};
