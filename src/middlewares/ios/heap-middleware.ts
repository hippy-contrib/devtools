import { ChromeCommand, ChromeEvent, Ios100Command } from 'tdf-devtools-protocol/types';
import { requestId } from '../global-id';
import { MiddleWareManager } from '../middleware-context';
import HeapAdapter from './heap-adapter';

export const heapMiddleWareManager: MiddleWareManager = {
  upwardMiddleWareListMap: {},
  downwardMiddleWareListMap: {
    [ChromeCommand.HeapProfilerEnable]: ({ msg, sendToApp, sendToDevtools }) =>
      sendToApp({
        id: requestId.create(),
        method: Ios100Command.HeapEnable,
        params: {},
      }).then((res) => {
        console.log(`${Ios100Command.HeapEnable} res`, msg);
        const convertedRes = {
          id: (msg as Adapter.CDP.Req).id,
          method: msg.method,
          result: res,
        };
        sendToDevtools(convertedRes);
        return convertedRes;
      }),
    [ChromeCommand.HeapProfilerDisable]: ({ sendToApp }) =>
      sendToApp({
        id: requestId.create(),
        method: Ios100Command.HeapDisable,
        params: {},
      }),
    [ChromeCommand.HeapProfilerTakeHeapSnapshot]: ({ msg, sendToApp, sendToDevtools }) => {
      const req = msg as Adapter.CDP.Req;
      const { reportProgress } = req.params;
      return sendToApp({
        id: requestId.create(),
        method: Ios100Command.HeapSnapshot,
        params: {},
      }).then((res) => {
        const commandRes = res as Adapter.CDP.CommandRes;
        const { snapshotData } = commandRes.result;
        const snapshot = JSON.parse(snapshotData);
        const v8snapshot = new HeapAdapter().jsc2v8(snapshot);
        const wholeChunk = JSON.stringify(v8snapshot);
        if (reportProgress)
          sendToDevtools({
            method: ChromeEvent.HeapProfilerReportHeapSnapshotProgress,
            params: {
              finished: true,
              done: wholeChunk.length,
              total: wholeChunk.length,
            },
          });
        sendToDevtools({
          method: ChromeEvent.HeapProfilerAddHeapSnapshotChunk,
          params: {
            chunk: wholeChunk,
          },
        });
        const convertedRes = {
          id: (msg as Adapter.CDP.Req).id,
          method: msg.method,
          result: {},
        };
        sendToDevtools(convertedRes);
        return convertedRes;
      });
    },
    [ChromeCommand.HeapProfilerCollectGarbage]: ({ sendToApp }) =>
      sendToApp({
        id: requestId.create(),
        method: Ios100Command.HeapGc,
        params: {},
      }),
  },
};
