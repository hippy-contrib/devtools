import { ChromeCommand, ChromeEvent } from 'tdf-devtools-protocol/dist/types/enum-chrome-mapping';
import { IOS90Command } from 'tdf-devtools-protocol/dist/types/enum-ios-9.0-mapping';
import { contextId, requestId } from '../global-id';
import { MiddleWareManager } from '../middleware-context';
import { getLastScriptEval } from './debugger-middleware';

export const runtimeMiddleWareManager: MiddleWareManager = {
  downwardMiddleWareListMap: {
    [ChromeEvent.RuntimeExecutionContextCreated]: ({ msg, sendToDevtools }) => {
      const eventRes = msg as Adapter.CDP.EventRes;
      if (eventRes.params?.context) {
        if (!eventRes.params.context.origin) {
          eventRes.params.context.origin = eventRes.params.context.name;
        }

        if (eventRes.params.context.frameId) {
          eventRes.params.context.auxData = {
            frameId: eventRes.params.context.frameId,
            isDefault: true,
          };
          delete eventRes.params.context.frameId;
        }
      }

      return sendToDevtools(eventRes);
    },
    [ChromeCommand.RuntimeEvaluate]: ({ msg, sendToDevtools }) => {
      const lastScriptEval = getLastScriptEval();
      const commandRes = msg as Adapter.CDP.CommandRes;
      if (commandRes.result?.wasThrown) {
        commandRes.result.result.subtype = 'error';
        commandRes.result.exceptionDetails = {
          text: commandRes.result.result.description,
          url: '',
          scriptId: lastScriptEval,
          line: 1,
          column: 0,
          stack: {
            callFrames: [
              {
                functionName: '',
                scriptId: lastScriptEval,
                url: '',
                lineNumber: 1,
                columnNumber: 1,
              },
            ],
          },
        };
      } else if (commandRes.result?.result?.preview) {
        commandRes.result.result.preview.description = commandRes.result.result.description;
        commandRes.result.result.preview.type = 'object';
      }
      return sendToDevtools(commandRes);
    },
    [ChromeCommand.RuntimeGetProperties]: ({ msg, sendToDevtools }) => {
      const commandRes = msg as Adapter.CDP.CommandRes;
      const newPropertyDescriptors = [];
      const properties = commandRes.result?.properties || [];
      for (let i = 0; i < properties?.length; i += 1) {
        if (properties[i].isOwn || properties[i].nativeGetter) {
          properties[i].isOwn = true;
          newPropertyDescriptors.push(properties[i]);
        }
      }
      commandRes.result.result = null;
      commandRes.result.result = newPropertyDescriptors;
      return sendToDevtools(commandRes);
    },
    [ChromeCommand.RuntimeEnable]: ({ msg, sendToDevtools }) => {
      sendToDevtools({
        method: ChromeEvent.RuntimeExecutionContextCreated,
        params: {
          context: {
            id: contextId.create(),
            name: 'tdf',
            origin: '',
          },
        },
      });
      return sendToDevtools(msg);
    },
  },
  upwardMiddleWareListMap: {
    [ChromeCommand.RuntimeCompileScript]: async ({ msg, sendToApp, sendToDevtools }) => {
      const eventRes = msg as Adapter.CDP.EventRes;
      await sendToApp({
        id: requestId.create(),
        method: IOS90Command.RuntimeEvaluate,
        params: {
          expression: eventRes.params.expression,
          contextId: eventRes.params.executionContextId,
        },
      });
      const convertedRes = {
        id: (msg as Adapter.CDP.Req).id,
        method: msg.method,
        result: {
          scriptId: null,
          exceptionDetails: null,
        },
      };
      sendToDevtools(convertedRes);
      return convertedRes;
    },
  },
};
