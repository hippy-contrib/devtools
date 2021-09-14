import { contextId, requestId } from '../global-id';
import { MiddleWareManager } from '../middleware-context';
import { lastScriptEval } from './debugger-middleware';

let lastPageExecutionContextId;

export const runtimeMiddleWareManager: MiddleWareManager = {
  upwardMiddleWareListMap: {
    'Runtime.executionContextCreated': ({ msg, sendToDevtools }) => {
      const eventRes = msg as Adapter.CDP.EventRes;
      if (eventRes.params?.context) {
        if (!eventRes.params.context.origin) {
          eventRes.params.context.origin = eventRes.params.context.name;
        }

        if (eventRes.params.context.isPageContext) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          lastPageExecutionContextId = eventRes.params.context.id;
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
    'Runtime.evaluate': ({ msg, sendToDevtools }) => {
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
    'Runtime.getProperties': ({ msg, sendToDevtools }) => {
      const commandRes = msg as Adapter.CDP.CommandRes;
      const newPropertyDescriptors = [];
      for (let i = 0; i < commandRes.result?.properties?.length; i += 1) {
        if (commandRes.result.properties[i].isOwn || commandRes.result.properties[i].nativeGetter) {
          commandRes.result.properties[i].isOwn = true;
          newPropertyDescriptors.push(commandRes.result.properties[i]);
        }
      }
      commandRes.result.result = null;
      commandRes.result.result = newPropertyDescriptors;
      return sendToDevtools(commandRes);
    },
    'Runtime.enable': ({ msg, sendToDevtools }) => {
      sendToDevtools({
        method: 'Runtime.executionContextCreated',
        params: {
          context: {
            id: contextId.create(),
            name: 'tdf',
            origin: '',
          },
        },
      });
      return sendToDevtools(msg);
    }
  },
  downwardMiddleWareListMap: {
    // 'Runtime.enable': sendEmptyResultToDevtools as MiddleWare,
    'Runtime.compileScript': ({ msg, sendToApp, sendToDevtools }) =>
      sendToApp({
        id: requestId.create(),
        method: 'Runtime.evaluate',
        params: {
          expression: (msg as any).params.expression,
          contextId: (msg as any).params.executionContextId,
        },
      }).then(() => {
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
      }),
  },
};
