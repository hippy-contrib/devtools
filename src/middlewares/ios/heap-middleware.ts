import { ChromeCommand, ChromeEvent, Ios100Command } from 'tdf-devtools-protocol/dist/types';
import { Logger } from '@/utils/log';
import { requestId } from '../global-id';
import { MiddleWareManager } from '../middleware-context';
import HeapAdapter from './adapter/heap-adapter';

const log = new Logger('heap-middleware');

export const heapMiddleWareManager: MiddleWareManager = {
  downwardMiddleWareListMap: {},
  upwardMiddleWareListMap: {
    [ChromeCommand.HeapProfilerEnable]: async ({ msg, sendToApp, sendToDevtools }) => {
      const res = await sendToApp({
        id: requestId.create(),
        method: Ios100Command.HeapEnable,
        params: {},
      });
      log.info(`${Ios100Command.HeapEnable} res: `, msg);
      const convertedRes = {
        id: (msg as Adapter.CDP.Req).id,
        method: msg.method,
        result: res,
      };
      sendToDevtools(convertedRes);
      return convertedRes;
    },
    [ChromeCommand.HeapProfilerDisable]: ({ sendToApp }) =>
      sendToApp({
        id: requestId.create(),
        method: Ios100Command.HeapDisable,
        params: {},
      }),
    [ChromeCommand.HeapProfilerTakeHeapSnapshot]: async ({ msg, sendToApp, sendToDevtools }) => {
      const req = msg as Adapter.CDP.Req;
      const { reportProgress } = req.params;
      const res = await sendToApp({
        id: requestId.create(),
        method: Ios100Command.HeapSnapshot,
        params: {},
      });
      const commandRes = res as Adapter.CDP.CommandRes;
      const { snapshotData } = commandRes.result;
      const snapshot = JSON.parse(snapshotData);
      const v8snapshot = HeapAdapter.jsc2v8(snapshot);
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
    },
    [ChromeCommand.HeapProfilerCollectGarbage]: ({ sendToApp }) =>
      sendToApp({
        id: requestId.create(),
        method: Ios100Command.HeapGc,
        params: {},
      }),
  },
};
