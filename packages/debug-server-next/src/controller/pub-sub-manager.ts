/*
 * Tencent is pleased to support the open source community by making
 * Hippy available.
 *
 * Copyright (C) 2017-2019 THL A29 Limited, a Tencent company.
 * All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import WebSocket from 'ws';
import { differenceBy } from 'lodash';
import { IWDPAppClient } from '@debug-server-next/client/iwdp-app-client';
import {
  AppClientType,
  AppClientEvent,
  ErrorCode,
  InternalChannelEvent,
  WinstonColor,
  DevicePlatform,
  ReportEvent,
} from '@debug-server-next/@types/enum';
import { getDBOperator } from '@debug-server-next/db';
import { appClientManager, AppClient } from '@debug-server-next/client';
import { AppClientOption } from '@debug-server-next/client/app-client';
import { AppClientFullOptionOmicCtx } from '@debug-server-next/client/app-client-manager';
import { debugTargetToUrlParsedContext } from '@debug-server-next/middlewares';
import { DebugTarget } from '@debug-server-next/@types/debug-target';
import {
  upwardChannelToDownwardChannel,
  createUpwardChannel,
  createInternalChannel,
  createDownwardChannel,
  vueDevtoolsExtensionName,
  reactDevtoolsExtensionName,
} from '@debug-server-next/utils/pub-sub-channel';
import { Logger } from '@debug-server-next/utils/log';
import { IPublisher, ISubscriber, PSubCallback, SubCallback } from '@debug-server-next/db/pub-sub';
import { decreaseRefAndSave, removeDebugTarget } from '@debug-server-next/utils/debug-target';
import { report } from '@debug-server-next/utils/report';
import {
  saveHistoryProtocol,
  isHistoryProtocol,
  getHistoryProtocol,
} from '@debug-server-next/utils/history-event-protocol';

const log = new Logger('pub-sub-manager', WinstonColor.BrightGreen);

// store the data of a DebugTarget, key: clientId
const channelMap: Map<
  string,
  {
    downwardChannelSet: Set<string>;
    // key: command id, value: downward channelId
    cmdIdChannelIdMap: Map<number, string>;
    // key: downward channelId
    publisherMap: Map<string, IPublisher>;
    // channel for multiple node publisher, when the WSAppClient is closed, we could publish close event to devtools
    internalPublisher: IPublisher;
    // channel for multiple node publisher, when devtools connect, we could re-Pub all history log
    internalSubscriber: ISubscriber;
    // subscriber with glob character '*', subscribe all devtools client message
    upwardSubscriber: ISubscriber;
    debugTarget: DebugTarget;
    appClientList: AppClient[];
    upwardSubHandlerMap: Map<string, { [key: string]: PSubCallback | SubCallback }>;
  }
> = new Map();

/**
 * subscribe to the upward command, trigger occasion:
 *  1. tunnel appConnect event
 *  2. app ws connection: maybe repeat subscribe because the iOS close event is later connect event
 *  3. get IWDP pages: should filter this situation, because frontend will request every 2s
 */
export const subscribeCommand = async (debugTarget: DebugTarget, ws?: WebSocket) => {
  const { clientId, title, platform } = debugTarget;
  if (!channelMap.has(clientId)) addChannelItem(debugTarget);
  else if (isIWDPPage(clientId)) return;

  const { appClientList, upwardSubHandlerMap, upwardSubscriber, internalSubscriber } = channelMap.get(clientId);

  createAppClientList(debugTarget, ws);

  /**
   * subscribe upward message.
   * because there maybe multiple devtools client, such as multiple chrome extensions,
   * we need use batch subscribe (pSubscribe)
   */
  if (!upwardSubHandlerMap.has(clientId)) {
    const upwardSubHandler = createUpwardSubHandler(clientId);
    const internalHandler = createInternalHandler(clientId);
    upwardSubHandlerMap.set(clientId, { upwardSubHandler, internalHandler });
  }
  const { upwardSubHandler, internalHandler } = upwardSubHandlerMap.get(clientId);

  // must unsubscribe first to avoid subscribe multiple times
  upwardSubscriber.pUnsubscribe(upwardSubHandler);
  upwardSubscriber.pSubscribe(upwardSubHandler);

  // publish downward message to devtools frontend
  appClientList.forEach((appClient) => {
    appClient.removeAllListeners(AppClientEvent.Message);
    appClient.on(AppClientEvent.Message, (msg) => {
      const handler = getAppClientMessageHandler(debugTarget);
      if (handler) handler(msg);
    });
  });

  // publish history logs
  await internalSubscriber.unsubscribe(internalHandler as SubCallback);
  await internalSubscriber.subscribe(internalHandler as SubCallback);
};

/**
 * clean cache of one DebugTarget
 * should invoke when tunnel appDisconnect event, or WSAppClient ws close event.
 */
export const cleanDebugTarget = async (clientId: string, closeDevtools: boolean, cleanCache = false) => {
  if (cleanCache) {
    await removeDebugTarget(clientId);
    log.verbose('removeDebugTarget %s', clientId);
    return;
  }

  const debugTarget = await decreaseRefAndSave(clientId);
  if (debugTarget) return;

  const channelInfo = channelMap.get(clientId);
  if (!channelInfo) return;

  const { publisherMap, upwardSubscriber, internalPublisher, internalSubscriber } = channelInfo;
  if (closeDevtools) {
    await internalPublisher.publish(InternalChannelEvent.AppWSClose);
  }

  process.nextTick(() => {
    Array.from(publisherMap.values()).forEach((publisher) => publisher.disconnect());
    upwardSubscriber.disconnect();
    internalPublisher.disconnect();
    internalSubscriber.disconnect();
    channelMap.delete(clientId);
  });
};

/**
 * clean all cache of DebugTarget
 */
export const cleanAllDebugTargets = async () =>
  Promise.all(
    Array.from(channelMap.values()).map(({ debugTarget }) => cleanDebugTarget(debugTarget.clientId, true, true)),
  );

let oldIWDPDebugTargets: DebugTarget[] = [];
/**
 * subscribe upward message from IWDP, and clean the outdated IWDP page
 */
export const subscribeByIWDP = (debugTargets: DebugTarget[]) => {
  const outdatedDebugTargets = differenceBy(oldIWDPDebugTargets, debugTargets, 'clientId');
  if (outdatedDebugTargets.length) log.verbose('outdatedDebugTargets %j', outdatedDebugTargets);
  outdatedDebugTargets.forEach(({ clientId }) => {
    cleanDebugTarget(clientId, true);
  });
  debugTargets.forEach((debugTarget) => {
    const oldDebugTarget = oldIWDPDebugTargets.find((item) => item.clientId === debugTarget.clientId);
    if (oldDebugTarget) debugTarget.ts = oldDebugTarget.ts;
    subscribeCommand(debugTarget);
  });
  oldIWDPDebugTargets = debugTargets;
};

const addChannelItem = (debugTarget: DebugTarget) => {
  const { clientId } = debugTarget;
  const { Publisher, Subscriber } = getDBOperator();
  const internalChannelId = createInternalChannel(clientId, '');
  const upwardSubscriber = createUpwardSubscriber(clientId);
  const internalPublisher = new Publisher(internalChannelId);
  const internalSubscriber = new Subscriber(internalChannelId);
  channelMap.set(clientId, {
    downwardChannelSet: new Set(),
    cmdIdChannelIdMap: new Map(),
    publisherMap: new Map(),
    upwardSubscriber,
    internalPublisher,
    internalSubscriber,
    debugTarget,
    appClientList: [],
    upwardSubHandlerMap: new Map(),
  });
};

const createUpwardSubscriber = (clientId) => {
  const { Subscriber } = getDBOperator();
  const upwardChannelId = createUpwardChannel(clientId, '*');
  log.verbose('subscribe to redis channel %s', upwardChannelId);
  return new Subscriber(upwardChannelId);
};

/**
 * create matched debug tunnels by DebugTarget
 */
const createAppClientList = (debugTarget: DebugTarget, ws?: WebSocket): AppClient[] => {
  const { clientId } = debugTarget;
  const { appClientList } = channelMap.get(clientId);
  const options: AppClientFullOptionOmicCtx[] = appClientManager.getAppClientOptions(debugTarget.platform);
  return options
    .map(({ Ctor: AppClientCtor, ...option }: AppClientFullOptionOmicCtx) => {
      try {
        const outdatedAppClientIndex = appClientList.findIndex(
          (appClient) => appClient.constructor.name === AppClientCtor.name,
        );
        if (outdatedAppClientIndex !== -1) {
          const outdatedAppClient = appClientList.splice(outdatedAppClientIndex, 1)[0];
          outdatedAppClient.destroy();
          log.verbose('%s is outdated, re-constructor now', outdatedAppClient.constructor.name);
        }
        const urlParsedContext = debugTargetToUrlParsedContext(debugTarget);
        const newOption: AppClientOption = {
          ...option,
          urlParsedContext,
          iWDPWsUrl: debugTarget.iWDPWsUrl,
          ws,
        };
        if (AppClientCtor.name === AppClientType.WS && !ws) {
          log.verbose('WSAppClient constructor option need ws');
          return;
        }
        if (AppClientCtor.name === AppClientType.IWDP && !debugTarget.iWDPWsUrl) {
          log.verbose(
            'IWDPAppClient constructor option need iWDPWsUrl, if you are debug iOS without USB, please ignore this warning.',
          );
          return;
        }
        log.verbose(`create app client ${AppClientCtor.name}`);
        const appClient = new AppClientCtor(clientId, newOption);
        appClientList.push(appClient);
        return appClient;
      } catch (e) {
        log.error('create app client error: %s', (e as Error)?.stack);
        return null;
      }
    })
    .filter((v) => v);
};

/**
 * when re-plug iOS device, IWDPAppClient ws url will change, so need update new IWDPAppClient
 */
export const updateIWDPAppClient = (debugTarget: DebugTarget) => {
  const { clientId } = debugTarget;
  if (debugTarget.platform !== DevicePlatform.IOS || !channelMap.has(clientId)) return;

  const { appClientList } = channelMap.get(clientId);
  const options: AppClientFullOptionOmicCtx[] = appClientManager.getAppClientOptions(debugTarget.platform);
  const iWDPOption = options.find(({ Ctor: AppClientCtor }) => AppClientCtor.name === AppClientType.IWDP);
  if (!iWDPOption) return;

  const { Ctor: AppClientCtor, ...option } = iWDPOption;
  const hasIWDPAppClient = debugTarget.appClientTypeList.indexOf(AppClientType.IWDP) !== -1;
  const outdatedIWDPAppClientIndex = appClientList.findIndex((item) => item.constructor.name === AppClientType.IWDP);
  if (hasIWDPAppClient) {
    if (outdatedIWDPAppClientIndex === -1) {
      appendIWDPAppClient();
    } else {
      updateIWDPAppClient();
    }
  } else if (outdatedIWDPAppClientIndex !== -1) {
    removeIWDPAppClient();
  } else {
    appendIWDPAppClient();
  }

  function appendIWDPAppClient() {
    log.verbose('append IWDPAppClient');
    if (!debugTarget.iWDPWsUrl) {
      return log.verbose('debugTarget.iWDPWsUrl is null, could not debug jscore');
    }
    const {} = iWDPOption;
    const iWDPAppClient = new AppClientCtor(clientId, {
      ...option,
      urlParsedContext: debugTargetToUrlParsedContext(debugTarget),
      iWDPWsUrl: debugTarget.iWDPWsUrl,
    });
    appClientList.push(iWDPAppClient);
    iWDPAppClient.on(AppClientEvent.Message, (msg) => getAppClientMessageHandler(debugTarget)(msg));
  }

  function updateIWDPAppClient() {
    const iWDPAppClient = appClientList[outdatedIWDPAppClientIndex] as IWDPAppClient;
    if (iWDPAppClient.url === debugTarget.iWDPWsUrl) return;

    const outdatedAppClient = appClientList.splice(outdatedIWDPAppClientIndex, 1)[0];
    outdatedAppClient.destroy();

    if (!debugTarget.iWDPWsUrl) {
      return log.verbose('debugTarget.iWDPWsUrl is null, could not debug jscore');
    }
    const urlParsedContext = debugTargetToUrlParsedContext(debugTarget);
    const newOption: AppClientOption = {
      ...option,
      urlParsedContext,
      iWDPWsUrl: debugTarget.iWDPWsUrl,
    };
    const appClient = new AppClientCtor(clientId, newOption);
    appClientList.push(appClient);
    appClient.removeAllListeners(AppClientEvent.Message);
    appClient.on(AppClientEvent.Message, (msg) => getAppClientMessageHandler(debugTarget)(msg));
    log.verbose(`create app client ${AppClientCtor.name}, update iWDPWsUrl to %s`, debugTarget.iWDPWsUrl);
  }

  function removeIWDPAppClient() {
    const outdated = appClientList.splice(outdatedIWDPAppClientIndex, 1)[0];
    outdated.destroy();
    log.verbose('IWDPAppClient is outdated and destroyed!');
  }
};

/**
 * downward message handler
 */
const getAppClientMessageHandler = (debugTarget: DebugTarget) => async (msg: Adapter.CDP.Res & { ts?: number }) => {
  const { clientId, platform } = debugTarget;
  const channelInfo = channelMap.get(clientId);
  if (!channelInfo) {
    return log.verbose('channelInfo does not exist, maybe app page is closed!');
  }
  const { downwardChannelSet, cmdIdChannelIdMap, publisherMap } = channelInfo;
  msg.ts = Date.now();
  const msgStr = JSON.stringify(msg);
  const { Publisher } = getDBOperator();
  if ('id' in msg) {
    // publish CommandRes to `downwardChannelId`
    const commandRes = msg as Adapter.CDP.CommandRes;
    const downwardChannelId = cmdIdChannelIdMap.get(commandRes.id);
    if (!downwardChannelId) return;
    if (!publisherMap.has(downwardChannelId)) {
      const publisher = new Publisher(downwardChannelId);
      publisherMap.set(downwardChannelId, publisher);
    }
    const publisher = publisherMap.get(downwardChannelId);
    publisher.publish(msgStr);
  } else {
    if (downwardChannelSet.size === 0) {
      downwardChannelSet.add(createDownwardChannel(clientId));
    }

    if (platform === DevicePlatform.IOS && isHistoryProtocol(msg.method, platform)) {
      saveHistoryProtocol(clientId, msgStr);
    }

    // broadcast to all channel, because could'n determine the receiver of EventRes
    downwardChannelSet.forEach((channelId) => {
      if (!publisherMap.has(channelId)) {
        const publisher = new Publisher(channelId);
        publisherMap.set(channelId, publisher);
      }
      const publisher = publisherMap.get(channelId);
      publisher.publish(msgStr);
    });
  }
};

const isIWDPPage = (clientId: string) => {
  const { appClientList } = channelMap.get(clientId);
  return appClientList?.length === 1 && appClientList[0].constructor.name === AppClientType.IWDP;
};

const createUpwardSubHandler = (clientId) => (message: string, upwardChannelId: string) => {
  const { downwardChannelSet, cmdIdChannelIdMap } = channelMap.get(clientId);
  if (!upwardChannelId) return log.verbose('pSubscribe without channelId');
  if (upwardChannelId.includes(vueDevtoolsExtensionName) || upwardChannelId.includes(reactDevtoolsExtensionName))
    return log.verbose('ignore vue/react channel');

  let msgObj: Adapter.CDP.Req;
  try {
    msgObj = JSON.parse(message);
  } catch (e) {
    log.error('%s channel message are invalid JSON, %s', upwardChannelId, message);
  }
  const downwardChannelId = upwardChannelToDownwardChannel(upwardChannelId);
  cmdIdChannelIdMap.set(msgObj.id, downwardChannelId);
  downwardChannelSet.add(downwardChannelId);

  /**
   * when devtools publish resumeCommands, maybe app had closed
   */
  const channelInfo = channelMap.get(clientId);
  if (!channelInfo) return;

  const { appClientList: latestAppClientList } = channelInfo;
  latestAppClientList.forEach((appClient) => {
    appClient.sendToApp(msgObj).catch((e) => {
      if (e !== ErrorCode.DomainFiltered) {
        return log.error('%s app client send error: %j', appClient.constructor.name, e);
      }
    });
  });
};

const createInternalHandler = (clientId) => async (msg) => {
  const { downwardChannelSet, publisherMap, debugTarget } = channelMap.get(clientId);
  const { platform } = debugTarget;

  if (msg !== InternalChannelEvent.DevtoolsConnected) return;

  const list = await getHistoryProtocol(clientId);
  if (!list.length) return;

  /**
   * delay to send history log after ConsoleModel of devtools is ready
   */
  setTimeout(() => {
    downwardChannelSet.forEach(async (channelId) => {
      if (!publisherMap.has(channelId)) {
        const { Publisher } = getDBOperator();
        const publisher = new Publisher(channelId);
        publisherMap.set(channelId, publisher);
      }
      const publisher = publisherMap.get(channelId);

      /**
       * mock a clear protocol to clear existed history logs in console panel
       */
      if (platform !== DevicePlatform.Android) {
        await publisher.publish({
          method: 'Log.cleared',
          params: {},
        });
      }

      list.forEach((item) => {
        try {
          const cmd = JSON.parse(item);
          if (!cmd.method?.startsWith('Network.')) {
            publisher.publish(item);
          }
        } catch (e) {}
      });
    });
  }, 1500);
};
