import { ChromeCommand, ChromeEvent, IOS100Event, IOS90Command } from 'tdf-devtools-protocol/dist/types';
import { ChromeLogLevel } from '@/@types/enum';
import { MiddleWareManager } from '../middleware-context';

export const logMiddleWareManager: MiddleWareManager = {
  downwardMiddleWareListMap: {
    [IOS100Event.ConsoleMessageAdded]: ({ msg, sendToDevtools }) => {
      const eventRes = msg as Adapter.CDP.EventRes<ProtocolIOS100.Console.MessageAddedEvent>;
      const { message } = eventRes.params;

      let type;
      if (message.type === 'log') {
        type = {
          log: ChromeLogLevel.Info,
          [ChromeLogLevel.Info]: ChromeLogLevel.Info,
          [ChromeLogLevel.Error]: ChromeLogLevel.Error,
          [ChromeLogLevel.Warning]: ChromeLogLevel.Warning,
        }[message.level];
        if (!type) type = ChromeLogLevel.Info;
      } else {
        type = message.type;
      }

      // if (message.source === 'console-api') {
      //   const logEntry: ProtocolChrome.Runtime.ConsoleAPICalledEvent = {
      //     type: type as any,
      //     stackTrace: transformStacktrace(message.stackTrace),
      //     timestamp: Math.floor(new Date().getTime()),
      //     executionContextId: 1,
      //     args: (message.parameters || []) as any,
      //   };
      //   setContext('lastConsoleMessage', logEntry);
      //   return sendToDevtools({
      //     method: ChromeEvent.RuntimeConsoleAPICalled,
      //     params: logEntry,
      //   });
      // }

      const consoleMessage: ProtocolChrome.Log.LogEntry = {
        // 这里自动生成的类型没有定义 enum，而是用的联合类型，导致类型不同，所以使用 any 转换
        source: message.source as any,
        level: type,
        text: '',
        lineNumber: message.line,
        timestamp: new Date().getTime(),
        url: message.url,
        args: message.parameters as unknown as ProtocolChrome.Runtime.RemoteObject[],
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
    [IOS90Command.ConsoleEnable]: ({ msg, sendToDevtools }) =>
      sendToDevtools({
        id: (msg as Adapter.CDP.Req).id,
        method: ChromeCommand.LogEnable,
        result: {},
      }),
  },
  upwardMiddleWareListMap: {
    [ChromeCommand.LogClear]: ({ msg, sendToApp }) =>
      sendToApp({
        id: (msg as Adapter.CDP.Req).id,
        method: ChromeCommand.ConsoleClearMessages,
        params: {},
      }),
    [ChromeCommand.LogDisable]: ({ msg, sendToApp }) =>
      sendToApp({
        id: (msg as Adapter.CDP.Req).id,
        method: IOS90Command.ConsoleDisable,
        params: {},
      }),
    [ChromeCommand.LogEnable]: ({ msg, sendToApp }) =>
      sendToApp({
        id: (msg as Adapter.CDP.Req).id,
        method: IOS90Command.ConsoleEnable,
        params: {},
      }),
  },
};

function transformStacktrace(callFrames): ProtocolChrome.Runtime.StackTrace {
  if (!callFrames) {
    return;
  }

  return {
    callFrames,
    // Optional
    // description?: string;
    // parent?: StackTrace;
    // parentId?: StackTraceId;
  };
}
