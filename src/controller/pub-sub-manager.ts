import WebSocket from 'ws';
import { differenceBy } from 'lodash';
import { IWDPAppClient } from '@/client/iwdp-app-client';
import {
  AppClientType,
  AppClientEvent,
  ErrorCode,
  InternalChannelEvent,
  WinstonColor,
  DevicePlatform,
} from '@/@types/enum';
import { getDBOperator } from '@/db';
import { appClientManager, AppClient } from '@/client';
import { AppClientOption } from '@/client/app-client';
import { AppClientFullOptionOmicCtx } from '@/client/app-client-manager';
import { debugTargetToUrlParsedContext } from '@/middlewares';
import { DebugTarget } from '@/@types/debug-target';
import {
  upwardChannelToDownwardChannel,
  createUpwardChannel,
  createInternalChannel,
  createDownwardChannel,
} from '@/utils/pub-sub-channel';
import { Logger } from '@/utils/log';
import { IPublisher, ISubscriber } from '@/db/pub-sub';
import { decreaseRefAndSave, removeDebugTarget } from '@/utils/debug-target';

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
    upwardSubscriber: ISubscriber;
    debugTarget: DebugTarget;
    appClientList: AppClient[];
  }
> = new Map();

/**
 * subscribe to the upward command, trigger occasion:
 *  1. tunnel appConnect event
 *  2. app ws connection: maybe repeat subscribe because the iOS close event is later connect event
 *  3. get IWDP pages: should filter this situation, because frontend will request every 2s
 */
export const subscribeCommand = async (debugTarget: DebugTarget, ws?: WebSocket) => {
  const { clientId } = debugTarget;
  if (!channelMap.has(clientId)) addChannelItem(debugTarget);
  else {
    if (isIWDPPage(clientId)) return;
  }

  const { appClientList, downwardChannelSet, cmdIdChannelIdMap, upwardSubscriber } = channelMap.get(clientId);

  createAppClientList(debugTarget, ws);

  upwardSubscriber.pUnsubscribe();
  upwardSubscriber.disconnect();
  const newUpwardSubscriber = createUpwardSubscriber(clientId);
  channelMap.get(clientId).upwardSubscriber = newUpwardSubscriber;

  /**
   * subscribe upward message.
   * because there maybe multiple devtools client, such as multiple chrome extensions,
   * we need use batch subscribe (pSubscribe)
   */
  newUpwardSubscriber.pSubscribe((message: string, upwardChannelId: string) => {
    if (!upwardChannelId) return log.warn('pSubscribe without channelId');
    let msgObj: Adapter.CDP.Req;
    try {
      msgObj = JSON.parse(message);
    } catch (e) {
      log.error('%s channel message are invalid JSON, %s', upwardChannelId, message);
    }
    const downwardChannelId = upwardChannelToDownwardChannel(upwardChannelId);
    cmdIdChannelIdMap.set(msgObj.id, downwardChannelId);
    downwardChannelSet.add(downwardChannelId);

    const { appClientList: latestAppClientList } = channelMap.get(clientId);
    latestAppClientList.forEach((appClient) => {
      appClient.sendToApp(msgObj).catch((e) => {
        if (e !== ErrorCode.DomainFiltered) {
          return log.error('%s app client send error: %j', appClient.constructor.name, e);
        }
      });
    });
  });

  // publish downward message to devtools frontend
  appClientList.forEach((appClient) => {
    appClient.removeAllListeners(AppClientEvent.Message);
    appClient.on(AppClientEvent.Message, (msg) => getAppClientMessageHandler(debugTarget)(msg));
  });
};

/**
 * clean cache of one DebugTarget
 * should invoke when tunnel appDisconnect event, or WSAppClient ws close event.
 */
export const cleanDebugTarget = async (clientId: string, closeDevtools: boolean, cleanCache = false) => {
  if (cleanCache) {
    await removeDebugTarget(clientId);
    log.info('removeDebugTarget %s', clientId);
    return;
  }

  const debugTarget = await decreaseRefAndSave(clientId);
  if (debugTarget) return;

  const channelInfo = channelMap.get(clientId);
  if (!channelInfo) return;

  const { publisherMap, upwardSubscriber, internalPublisher } = channelInfo;
  if (closeDevtools) {
    internalPublisher.publish(InternalChannelEvent.WSClose);
  }
  Array.from(publisherMap.values()).forEach((publisher) => publisher.disconnect());
  // need some delay for the finish of `InternalChannelEvent.WSClose` event
  process.nextTick(() => {
    upwardSubscriber.pUnsubscribe();
    upwardSubscriber.disconnect();
    internalPublisher.disconnect();
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
  oldIWDPDebugTargets = debugTargets;
  if (outdatedDebugTargets.length) log.info('outdatedDebugTargets %j', outdatedDebugTargets);
  outdatedDebugTargets.forEach(({ clientId }) => {
    cleanDebugTarget(clientId, true);
  });
  debugTargets.forEach((debugTarget) => subscribeCommand(debugTarget));
};

const addChannelItem = (debugTarget: DebugTarget) => {
  const { clientId } = debugTarget;
  const { Publisher } = getDBOperator();
  const internalChannelId = createInternalChannel(clientId, '');
  const upwardSubscriber = createUpwardSubscriber(clientId);
  const internalPublisher = new Publisher(internalChannelId);
  channelMap.set(clientId, {
    downwardChannelSet: new Set(),
    cmdIdChannelIdMap: new Map(),
    publisherMap: new Map(),
    upwardSubscriber,
    internalPublisher,
    debugTarget,
    appClientList: [],
  });
};

const createUpwardSubscriber = (clientId) => {
  const { Subscriber } = getDBOperator();
  const upwardChannelId = createUpwardChannel(clientId, '*');
  log.info('subscribe to redis channel %s', upwardChannelId);
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
          log.info('%s is outdated, re-constructor now', outdatedAppClient.constructor.name);
        }
        const urlParsedContext = debugTargetToUrlParsedContext(debugTarget);
        const newOption: AppClientOption = {
          ...option,
          urlParsedContext,
          iWDPWsUrl: debugTarget.iWDPWsUrl,
          ws,
        };
        if (AppClientCtor.name === AppClientType.WS && !ws) {
          log.warn('WSAppClient constructor option need ws');
          return;
        }
        if (AppClientCtor.name === AppClientType.IWDP && !debugTarget.iWDPWsUrl) {
          log.warn(
            'IWDPAppClient constructor option need iWDPWsUrl, if you are debug iOS without USB, please ignore this warning.',
          );
          return;
        }
        log.info(`create app client ${AppClientCtor.name}`);
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
  const outdatedAppClientIndex = appClientList.findIndex(
    (appClient) => appClient.constructor.name === AppClientCtor.name,
  );
  if (outdatedAppClientIndex === -1) return;

  const iWDPAppClient = appClientList[outdatedAppClientIndex] as IWDPAppClient;
  if (iWDPAppClient.url === debugTarget.iWDPWsUrl) return;

  const outdatedAppClient = appClientList.splice(outdatedAppClientIndex, 1)[0];
  outdatedAppClient.destroy();

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
  log.info(`create app client ${AppClientCtor.name}, update iWDPWsUrl to %s`, debugTarget.iWDPWsUrl);
};

const getAppClientMessageHandler = (debugTarget: DebugTarget) => async (msg: Adapter.CDP.Res) => {
  const channelInfo = channelMap.get(debugTarget.clientId);
  if (!channelInfo) {
    log.error('channelInfo does not exist!');
  }
  const { downwardChannelSet, cmdIdChannelIdMap, publisherMap } = channelInfo;
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
      downwardChannelSet.add(createDownwardChannel(debugTarget.clientId));
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
