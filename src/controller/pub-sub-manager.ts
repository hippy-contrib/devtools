import WebSocket from 'ws';
import { AppClientType, AppClientEvent, ErrorCode, InternalChannelEvent, WinstonColor } from '@/@types/enum';
import { getDBOperator } from '@/db';
import { appClientManager, AppClient } from '@/client';
import { AppClientOption } from '@/client/app-client';
import { AppClientFullOptionOmicCtx } from '@/client/app-client-manager';
import { debugTargetToUrlParsedContext } from '@/middlewares';
import { DebugTarget } from '@/@types/debug-target';
import { upwardChannelToDownwardChannel, createUpwardChannel, createInternalChannel } from '@/utils/pub-sub-channel';
import { Logger } from '@/utils/log';
import { config } from '@/config';

const log = new Logger('pub-sub-manager', WinstonColor.Cyan);

// 保存一个调试页面的缓存数据，key: clientId
const channelMap: Map<
  string,
  {
    downwardChannelSet: Set<string>;
    // key: command id, value: downward channelId
    cmdIdChannelIdMap: Map<number, string>;
    // key: downward channelId
    publisherMap: Map<string, Publisher>;
    // 多个 node 节点之间通信的 publisher，用于当 app 端断连时，通知 devtools 端断开
    internalPublisher: Publisher;
    upwardSubscriber: Subscriber;
    debugTarget: DebugTarget;
  }
> = new Map();

/**
 * 订阅 redis 消息。tunnel appConnect 或 app ws connection 时订阅
 */
export const subscribeRedis = async (debugTarget: DebugTarget, ws?: WebSocket) => {
  const { clientId } = debugTarget;
  if (!channelMap.has(clientId)) addChannelItem(debugTarget);

  const appClientList = createAppClientList(debugTarget, ws);
  const { downwardChannelSet, cmdIdChannelIdMap, publisherMap, upwardSubscriber } = channelMap.get(clientId);

  // 订阅上行消息。由于可能存在多个 devtools client（如多个插件），所以这里应该用批量订阅 pSubscribe
  upwardSubscriber.pSubscribe((message: string, upwardChannelId: string) => {
    log.info('on channel message, %s', upwardChannelId);
    let msgObj: Adapter.CDP.Req;
    try {
      msgObj = JSON.parse(message);
    } catch (e) {
      log.error('%s channel message are invalid JSON, %s', upwardChannelId, message);
    }
    const downwardChannelId = upwardChannelToDownwardChannel(upwardChannelId);
    cmdIdChannelIdMap.set(msgObj.id, downwardChannelId);
    downwardChannelSet.add(downwardChannelId);

    appClientList.forEach((appClient) => {
      appClient.sendToApp(msgObj).catch((e) => {
        if (e !== ErrorCode.DomainFiltered) {
          return log.error('%s app client send error: %j', appClient.type, e);
        }
      });
    });
  });

  // 发布下行消息
  appClientList.forEach((appClient) => {
    appClient.removeAllListeners(AppClientEvent.Message);
    appClient.on(AppClientEvent.Message, async (msg: Adapter.CDP.Res) => {
      const msgStr = JSON.stringify(msg);
      const { Publisher } = getDBOperator();
      if ('id' in msg) {
        // 消息为 CommandRes，根据缓存的 cmdId 查找 downwardChannelId，只发布到该 channel
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
        // 消息类型为 EventRes，event 无法确定来源，广播到所有 channel
        downwardChannelSet.forEach((channelId) => {
          if (!publisherMap.has(channelId)) {
            const publisher = new Publisher(channelId);
            publisherMap.set(channelId, publisher);
          }
          const publisher = publisherMap.get(channelId);
          publisher.publish(msgStr);
        });
      }
    });
  });
};

/**
 * 调试结束，清除缓存
 * appDisconnect, app ws close 时调用
 */
export const cleanDebugTarget = async (clientId: string) => {
  const { model } = getDBOperator();
  model.delete(config.redis.key, clientId);
  const channelInfo = channelMap.get(clientId);
  if (!channelInfo) return;
  const { publisherMap, upwardSubscriber, internalPublisher } = channelInfo;
  internalPublisher.publish(InternalChannelEvent.WSClose);
  Array.from(publisherMap.values()).forEach((publisher) => publisher.disconnect());
  // 稍作延迟，等处理完 InternalChannelEvent.WSClose 事件后再取消订阅
  process.nextTick(() => {
    upwardSubscriber.pUnsubscribe();
    upwardSubscriber.disconnect();
    internalPublisher.disconnect();
    channelMap.delete(clientId);
  });
};

export const cleanAllDebugTargets = async () => {
  channelMap.forEach(({ debugTarget }) => {
    cleanDebugTarget(debugTarget.clientId);
  });
};

const addChannelItem = (debugTarget: DebugTarget) => {
  const { clientId } = debugTarget;
  const { Subscriber, Publisher } = getDBOperator();
  const upwardChannelId = createUpwardChannel(clientId, '*');
  const internalChannelId = createInternalChannel(clientId, '');
  const upwardSubscriber = new Subscriber(upwardChannelId);
  const internalPublisher = new Publisher(internalChannelId);
  log.info('subscribe to redis channel %s', upwardChannelId);
  channelMap.set(clientId, {
    downwardChannelSet: new Set(),
    cmdIdChannelIdMap: new Map(),
    publisherMap: new Map(),
    upwardSubscriber,
    internalPublisher,
    debugTarget,
  });
};

const createAppClientList = (debugTarget: DebugTarget, ws?: WebSocket): AppClient[] => {
  const { clientId } = debugTarget;
  const options: AppClientFullOptionOmicCtx[] = appClientManager.getAppClientOptions(debugTarget.platform);
  return options
    .map(({ Ctor: AppClientCtor, ...option }: AppClientFullOptionOmicCtx) => {
      try {
        log.info(`create app client ${AppClientCtor.name}`);
        const urlParsedContext = debugTargetToUrlParsedContext(debugTarget);
        const newOption: AppClientOption = {
          ...option,
          urlParsedContext,
          iWDPWsUrl: debugTarget.iWDPWsUrl,
        };
        if (AppClientCtor.name === AppClientType.WS) {
          newOption.ws = ws;
        }
        return new AppClientCtor(clientId, newOption);
      } catch (e) {
        log.error('create app client error: %s', (e as Error)?.stack);
        return null;
      }
    })
    .filter((v) => v);
};
