import { ChromeCommand, ChromeEvent } from 'tdf-devtools-protocol/types/enum-chrome-mapping';
import { sendEmptyResultToDevtools } from '../default-middleware';
import { getRequestId } from '../global-id';
import { MiddleWareManager, MiddleWare } from '../middleware-context';

export let lastScriptEval;

export const debuggerMiddleWareManager: MiddleWareManager = {
  upwardMiddleWareListMap: {
    [ChromeEvent.DebuggerScriptParsed]: ({ msg, sendToDevtools }) => {
      const eventRes = msg as Adapter.CDP.EventRes;
      lastScriptEval = eventRes.params.scriptId;
      return sendToDevtools(eventRes);
    },
    'Inspector.inspect': ({ msg, sendToDevtools }) => {
      const res = msg as UnionToIntersection<Adapter.CDP.Res>;
      res.method = 'DOM.inspectNodeRequested';
      res.params.backendNodeId = res.params.object.objectId;
      delete res.params.object;
      delete res.params.hints;
      return sendToDevtools(res);
    },
    'Debugger.enable': sendEmptyResultToDevtools as MiddleWare,
    'Debugger.setBlackboxPatterns': sendEmptyResultToDevtools as MiddleWare,
    'Debugger.setPauseOnExceptions': sendEmptyResultToDevtools as MiddleWare,
  },
  downwardMiddleWareListMap: {
    [ChromeCommand.DebuggerEnable]: ({ sendToApp, msg }) => {
      sendToApp({
        id: getRequestId(),
        method: 'Debugger.setBreakpointsActive',
        params: { active: true },
      });
      return sendToApp(msg);
    },
    ['Debugger.canSetScriptSource']: ({ msg, sendToDevtools }) => {
      const res = {
        id: (msg as Adapter.CDP.Req).id,
        method: msg.method,
        result: false,
      };
      sendToDevtools(res);
      return Promise.resolve(res);
    },
    [ChromeCommand.DebuggerSetBlackboxPatterns]: ({ msg, sendToDevtools }) => {
      const res = {
        id: (msg as Adapter.CDP.Req).id,
        method: msg.method,
        result: {},
      };
      sendToDevtools(res);
      return Promise.resolve(res);
    },
    'Debugger.setAsyncCallStackDepth': ({ msg, sendToDevtools }) => {
      const res = {
        id: (msg as Adapter.CDP.Req).id,
        method: msg.method,
        result: true,
      };
      sendToDevtools(res);
      return Promise.resolve(res);
    },
  },
};
