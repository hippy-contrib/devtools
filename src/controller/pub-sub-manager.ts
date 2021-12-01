import WebSocket from 'ws';
import { differenceBy } from 'lodash';
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
import { IPublisher, ISubscriber } from '@/db/pub-sub';

const log = new Logger('pub-sub-manager', WinstonColor.Cyan);

// 保存一个调试页面的缓存数据，key: clientId
const channelMap: Map<
  string,
  {
    downwardChannelSet: Set<string>;
    // key: command id, value: downward channelId
    cmdIdChannelIdMap: Map<number, string>;
    // key: downward channelId
    publisherMap: Map<string, IPublisher>;
    // 多个 node 节点之间通信的 publisher，用于当 app 端断连时，通知 devtools 端断开
    internalPublisher: IPublisher;
    upwardSubscriber: ISubscriber;
    debugTarget: DebugTarget;
  }
> = new Map();

/**
 * 订阅调试指令，触发时机：
 *  1. tunnel appConnect
 *  2. app ws connection
 *  3. get IWDP pages: 这种场景会触发的很频繁（前端定时器2s请求一次），但是已经订阅过的会直接 return
 */
export const subscribeCommand = async (debugTarget: DebugTarget, ws?: WebSocket) => {
  const { clientId } = debugTarget;
  if (!channelMap.has(clientId)) addChannelItem(debugTarget);
  else return;

  const appClientList = createAppClientList(debugTarget, ws);
  const { downwardChannelSet, cmdIdChannelIdMap, publisherMap, upwardSubscriber } = channelMap.get(clientId);

  upwardSubscriber.pUnsubscribe();
  upwardSubscriber.disconnect();
  const newUpwardSubscriber = createUpwardSubscriber(clientId);
  channelMap.get(clientId).upwardSubscriber = newUpwardSubscriber;

  /**
   * 订阅上行消息。由于可能存在多个 devtools client（如多个插件，每个插件一个通道），
   * 所以这里应该用批量订阅 pSubscribe
   */
  newUpwardSubscriber.pSubscribe((message: string, upwardChannelId: string) => {
    if (!upwardChannelId) return log.warn('pSubscribe without channelId');
    let msgObj: Adapter.CDP.Req;
    try {
      msgObj = JSON.parse(message);
    } catch (e) {
      log.error('%s channel message are invalid JSON, %s', upwardChannelId, message);
    }
    log.info('on channel message, %s, %s, %s', msgObj.id, msgObj.method, upwardChannelId);
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

/**
 * 清除所有调试对象的缓存
 */
export const cleanAllDebugTargets = async () => {
  channelMap.forEach(({ debugTarget }) => {
    cleanDebugTarget(debugTarget.clientId);
  });
};

let oldIWDPDebugTargets: DebugTarget[] = [];
/**
 * 订阅 IWDP 获取到的 DebugTarget 上行消息，清理关闭的 IWDP DebugTarget。
 * IWDP 检测到的已关闭的页面，清空调试对象缓存
 */
export const subscribeByIWDP = (debugTargets: DebugTarget[]) => {
  const removedDebugTargets = differenceBy(oldIWDPDebugTargets, debugTargets, 'clientId');
  oldIWDPDebugTargets = debugTargets;
  removedDebugTargets.forEach(({ clientId }) => {
    cleanDebugTarget(clientId);
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
  });
};

const createUpwardSubscriber = (clientId) => {
  const { Subscriber } = getDBOperator();
  const upwardChannelId = createUpwardChannel(clientId, '*');
  log.info('subscribe to redis channel %s', upwardChannelId);
  return new Subscriber(upwardChannelId);
};

/**
 * 根据调试对象创建匹配的调试通道（AppClient）
 */
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
