import { ChromeCommand, ChromeEvent } from 'tdf-devtools-protocol/dist/types';
import { getDBOperator } from '@/db';
import { createUpwardChannel, createDownwardChannel } from '@/utils/pub-sub-channel';
import { DebugTarget } from '@/@types/debug-target';
import { GlobalId } from './global-id';

const reloadCommandId = new GlobalId(-10000, -1);
const reloadCommand = [
  {
    id: reloadCommandId.create(),
    method: ChromeCommand.NetworkEnable,
    params: {
      maxPostDataSize: 65536,
    },
  },
  {
    id: reloadCommandId.create(),
    method: ChromeCommand.NetworkSetAttachDebugStack,
    params: {
      enabled: true,
    },
  },
  {
    id: reloadCommandId.create(),
    method: ChromeCommand.PageEnable,
    params: {},
  },
  {
    id: reloadCommandId.create(),
    method: ChromeCommand.PageGetResourceTree,
    params: {},
  },
  {
    id: reloadCommandId.create(),
    method: ChromeCommand.RuntimeEnable,
    params: {},
  },
  {
    id: reloadCommandId.create(),
    method: ChromeCommand.DOMEnable,
    params: {},
  },
  {
    id: reloadCommandId.create(),
    method: ChromeCommand.CSSEnable,
    params: {},
  },
  {
    id: reloadCommandId.create(),
    method: ChromeCommand.DebuggerEnable,
    params: {
      maxScriptsCacheSize: 10000000,
    },
  },
  {
    id: reloadCommandId.create(),
    method: ChromeCommand.DebuggerSetPauseOnExceptions,
    params: {
      state: 'none',
    },
  },
  {
    id: reloadCommandId.create(),
    method: ChromeCommand.DebuggerSetAsyncCallStackDepth,
    params: {
      state: 'none',
    },
  },
  {
    id: reloadCommandId.create(),
    method: ChromeCommand.ProfilerEnable,
    params: {},
  },
  {
    id: reloadCommandId.create(),
    method: ChromeCommand.LogEnable,
    params: {},
  },
  {
    id: reloadCommandId.create(),
    method: ChromeCommand.LogStartViolationsReport,
    params: {
      config: [
        {
          name: 'longTask',
          threshold: 200,
        },
        {
          name: 'longLayout',
          threshold: 30,
        },
        {
          name: 'blockedEvent',
          threshold: 100,
        },
        {
          name: 'blockedParser',
          threshold: -1,
        },
        {
          name: 'handler',
          threshold: 150,
        },
        {
          name: 'recurringHandler',
          threshold: 50,
        },
        {
          name: 'discouragedAPIUse',
          threshold: -1,
        },
      ],
    },
  },
  {
    id: reloadCommandId.create(),
    method: ChromeCommand.InspectorEnable,
    params: {},
  },
  {
    id: reloadCommandId.create(),
    method: ChromeCommand.TargetSetAutoAttach,
    params: {
      autoAttach: true,
      waitForDebuggerOnStart: true,
      flatten: true,
    },
  },
  {
    id: reloadCommandId.create(),
    method: ChromeCommand.TargetSetDiscoverTargets,
    params: {
      discover: true,
    },
  },
  {
    id: reloadCommandId.create(),
    method: ChromeCommand.RuntimeGetIsolateId,
    params: {},
  },
  {
    id: reloadCommandId.create(),
    method: ChromeCommand.DebuggerSetBlackboxPatterns,
    params: {
      patterns: [],
    },
  },
  {
    id: reloadCommandId.create(),
    method: ChromeCommand.PageStartScreencast,
    params: {
      format: 'jpeg',
      quality: 60,
      maxWidth: 1522,
      maxHeight: 1682,
    },
  },
  {
    id: reloadCommandId.create(),
    method: ChromeCommand.RuntimeRunIfWaitingForDebugger,
    params: {},
  },
  {
    id: reloadCommandId.create(),
    method: ChromeCommand.DOMGetDocument,
    params: {},
  },
];

const reloadEvent = [
  {
    method: ChromeEvent.DOMDocumentUpdated,
    params: {},
  },
];

export const publishReloadCommand = (debugTarget: DebugTarget) => {
  setTimeout(() => {
    const { clientId } = debugTarget;
    const upwardChannelId = createUpwardChannel(clientId);
    const downwardChannelId = createDownwardChannel(clientId);
    const { Publisher } = getDBOperator();
    const publisher = new Publisher(upwardChannelId);
    const downPublisher = new Publisher(downwardChannelId);
    reloadCommand.forEach((command) => {
      publisher.publish(JSON.stringify(command));
    });
    reloadEvent.forEach((event) => {
      downPublisher.publish(JSON.stringify(event));
    });
  }, 2000);
};

export const publishRes = (clientId: string, res: Adapter.CDP.Res) => {
  const downwardChannelId = createDownwardChannel(clientId);
  const { Publisher } = getDBOperator();
  const downPublisher = new Publisher(downwardChannelId);
  downPublisher.publish(JSON.stringify(res));
};
