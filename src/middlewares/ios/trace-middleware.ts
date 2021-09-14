import { requestId } from '../global-id';
import { MiddleWareManager } from '../middleware-context';
import TraceAdapter from './trace-adapter';

export const traceMiddleWareManager: MiddleWareManager = {
  upwardMiddleWareListMap: {
    'ScriptProfiler.trackingComplete': ({ msg, sendToDevtools }) => {
      const eventRes = msg as Adapter.CDP.EventRes;
      console.log(`onPerformanceProfileCompleteEvent, msg = ${eventRes}`);
      const traceAdapter = new TraceAdapter();
      const v8json = traceAdapter.jsc2v8(eventRes.params);
      return sendToDevtools({
        method: 'Tracing.dataCollected',
        params: {
          value: v8json,
        },
      });
    },
  },
  downwardMiddleWareListMap: {
    'Tracing.start': ({ sendToApp }) =>
      sendToApp({
        id: requestId.create(),
        method: 'ScriptProfiler.startTracking',
        params: { includeSamples: true },
      }),
    'Tracing.end': ({ sendToApp }) =>
      sendToApp({
        id: requestId.create(),
        method: 'ScriptProfiler.stopTracking',
        params: {},
      }),
  },
};
