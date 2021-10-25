import { ChromeEvent, TdfCommand, TdfEvent } from 'tdf-devtools-protocol/types';
import { cssMiddleWareManager } from '../css-middleware';
import { onFetchHeapCache, onGetHeapMeta } from '../heap-middleware';
import { MiddleWareManager } from '../middleware-context';
import { onReceiveTDFLog } from '../tdf-log-middleware';

export const androidMiddleWareManager: MiddleWareManager = {
  upwardMiddleWareListMap: {
    [TdfCommand.TDFMemoryGetHeapMeta]: [onGetHeapMeta],
    [TdfEvent.TDFLogGetLog]: [onReceiveTDFLog],
    [ChromeEvent.DebuggerScriptParsed]: ({ msg, sendToDevtools }) => sendToDevtools(msg),
    ...cssMiddleWareManager.upwardMiddleWareListMap,
  },
  downwardMiddleWareListMap: {
    [TdfCommand.TDFMemoryFetchHeapCache]: [onFetchHeapCache],
    ...cssMiddleWareManager.downwardMiddleWareListMap,
  },
};
