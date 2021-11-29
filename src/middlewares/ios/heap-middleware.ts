import { ChromeCommand, ChromeEvent, IOS100Command } from 'tdf-devtools-protocol/dist/types';
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
        method: IOS100Command.HeapEnable,
        params: {},
      });
      log.info(`${IOS100Command.HeapEnable} res: `, msg);
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
        method: IOS100Command.HeapDisable,
        params: {},
      }),
    [ChromeCommand.HeapProfilerTakeHeapSnapshot]: async ({ msg, sendToApp, sendToDevtools }) => {
      const req = msg as Adapter.CDP.Req;
      const { reportProgress } = req.params;
      const res = await sendToApp({
        id: requestId.create(),
        method: IOS100Command.HeapSnapshot,
        params: {},
      });
      const commandRes = res as Adapter.CDP.CommandRes;
      const snapshot = JSON.parse(commandRes.result.snapshotData);
      const wholeChunk = JSON.stringify(HeapAdapter.jsc2v8(snapshot));
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
        method: IOS100Command.HeapGc,
        params: {},
      }),
  },
};
