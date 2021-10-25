import { ChromeCommand, ChromeEvent, Ios100Event, Ios90Command } from 'tdf-devtools-protocol/types';
import { MiddleWareManager } from '../middleware-context';

export const logMiddleWareManager: MiddleWareManager = {
  upwardMiddleWareListMap: {
    [Ios100Event.ConsoleMessageAdded]: ({ msg, sendToDevtools }) => {
      const eventRes = msg as Adapter.CDP.EventRes;
      const { message } = eventRes.params;
      let type;
      if (message.type === 'log') {
        switch (message.level) {
          case 'log':
            type = 'info';
            break;
          case 'info':
            type = 'info';
            break;
          case 'error':
            type = 'error';
            break;
          default:
            type = 'info';
        }
      } else {
        type = message.type;
      }

      const consoleMessage = {
        source: message.source,
        level: type,
        text: message.text,
        lineNumber: message.line,
        timestamp: new Date().getTime(),
        url: message.url,
        args: message.parameters,
        stackTrace: message.stackTrace
          ? {
              callFrames: message.stackTrace,
            }
          : undefined,
        networkRequestId: message.networkRequestId,
      };

      return sendToDevtools({
        method: ChromeEvent.LogEntryAdded,
        params: {
          entry: consoleMessage,
        },
      });
    },
  },
  downwardMiddleWareListMap: {
    [ChromeCommand.LogClear]: ({ msg, sendToApp }) =>
      sendToApp({
        id: (msg as Adapter.CDP.Req).id,
        method: ChromeCommand.ConsoleClearMessages,
        params: {},
      }),
    [ChromeCommand.LogDisable]: ({ msg, sendToApp }) =>
      sendToApp({
        id: (msg as Adapter.CDP.Req).id,
        method: 'Console.disable',
        params: {},
      }),
    [ChromeCommand.LogEnable]: ({ msg, sendToApp, sendToDevtools }) => {
      sendToDevtools({
        id: (msg as Adapter.CDP.Req).id,
        method: msg.method,
        result: {},
      });
      return sendToApp({
        id: (msg as Adapter.CDP.Req).id,
        method: Ios90Command.ConsoleEnable,
        params: {},
      });
    },
  },
};
