import { ChromeCommand, ChromeEvent, ScriptLanguage } from 'tdf-devtools-protocol/dist/types';
import { requestId } from '../global-id';
import { MiddleWareManager } from '../middleware-context';

let lastScriptEval;

export const getLastScriptEval = () => lastScriptEval;

export const debuggerMiddleWareManager: MiddleWareManager = {
  downwardMiddleWareListMap: {
    [ChromeEvent.DebuggerScriptParsed]: ({ msg, sendToDevtools }) => {
      const eventRes = msg as Adapter.CDP.EventRes;
      delete eventRes.params.module;
      eventRes.params = {
        ...eventRes.params,
        hasSourceURL: !!eventRes.params.sourceURL,
        isModule: eventRes.params.module,
        scriptLanguage: ScriptLanguage.JavaScript,
        url: eventRes.params.url || eventRes.params.sourceURL,
      };
      lastScriptEval = eventRes.params.scriptId;
      return sendToDevtools(eventRes);
    },
  },
  upwardMiddleWareListMap: {
    [ChromeCommand.DebuggerEnable]: async ({ sendToApp, msg }) => {
      sendToApp({
        id: requestId.create(),
        method: ChromeCommand.DebuggerSetBreakpointsActive,
        params: { active: true },
      });
      return sendToApp(msg as Adapter.CDP.Req);
    },
    [ChromeCommand.DebuggerSetBlackboxPatterns]: async ({ msg, sendToDevtools }) => {
      const res = {
        id: (msg as Adapter.CDP.Req).id,
        method: msg.method,
        result: {},
      };
      sendToDevtools(res);
      return res;
    },
    [ChromeCommand.RuntimeSetAsyncCallStackDepth]: async ({ msg, sendToDevtools }) => {
      const res = {
        id: (msg as Adapter.CDP.Req).id,
        method: msg.method,
        result: true,
      };
      sendToDevtools(res);
      return res;
    },
  },
};
