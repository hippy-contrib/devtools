import WebSocket, { Server } from 'ws/index.js';
import { ChromeCommand, TdfCommand } from 'tdf-devtools-protocol/dist/types';
import {
  AppClientType,
  ClientEvent,
  ClientRole,
  DevicePlatform,
  ERROR_CODE,
  InternalChannelEvent,
  WinstonColor,
} from '@/@types/enum';
import { createTargetByWs, model, Publisher, Subscriber } from '@/db';
import { appClientManager } from '@/client';
import { AppClientOption } from '@/client/app-client';
import { AppClientFullOptionOmicCtx } from '@/client/app-client-manager';
import { debugTargetToUrlParsedContext } from '@/middlewares';
import { DebugTargetManager } from '@/controller/debug-targets';
import { DebugTarget } from '@/@types/debug-target';
import { DomainRegister } from '@/utils/cdp';
import { Logger } from '@/utils/log';
import { parseWsUrl, WsUrlParams } from '@/utils/url';
import { config } from '@/config';
import { getIWDPPages, patchIOSTarget } from '@/utils/iwdp';

const log = new Logger('socket-bridge', WinstonColor.Cyan);

export class SocketServer extends DomainRegister {
  /**
   * key: clientId
   */
  private static channelMap: Map<
    string,
    {
      downwardChannelSet: Set<string>;
      // value: downward channelId
      cmdMap: Map<number, string>;
      // key: downward channelId
      publisherMap: Map<string, typeof Publisher>;
      internalPublisher: typeof Publisher;
      subscriber: typeof Subscriber;
    }
  > = new Map();

  private static debugTargets: Array<DebugTarget> = [];

  /**
   * 订阅 redis 消息。tunnel appConnect 或 app ws connection 时订阅
   */
  public static async subscribeRedis(debugTarget: DebugTarget, ws?: WebSocket) {
    const { clientId } = debugTarget;
    SocketServer.debugTargets.push(debugTarget);

    if (!SocketServer.channelMap.has(clientId)) {
      const upwardChannelId = createUpwardChannel(clientId, '*');
      const internalChannelId = createInternalChannel(clientId, '*');
      const subscriber = new Subscriber(upwardChannelId);
      const internalPublisher = new Publisher(internalChannelId);
      log.info('subscribe to redis channel %s', upwardChannelId);
      SocketServer.channelMap.set(clientId, {
        downwardChannelSet: new Set(),
        cmdMap: new Map(),
        publisherMap: new Map(),
        subscriber,
        internalPublisher,
      });
    }
    const { downwardChannelSet, cmdMap, publisherMap, subscriber } = SocketServer.channelMap.get(clientId);

    let options;
    if (debugTarget.platform === DevicePlatform.Android) {
      options = appClientManager.getAndroidAppClientOptions();
    } else {
      options = appClientManager.getIosAppClientOptions();
    }

    let appClientList = [];
    appClientList = options
      .map(({ Ctor, ...option }: AppClientFullOptionOmicCtx) => {
        try {
          log.info(`create app client ${Ctor.name}`);
          const urlParsedContext = debugTargetToUrlParsedContext(debugTarget);
          const newOption: AppClientOption = {
            urlParsedContext,
            ...option,
            iwdpWsUrl: debugTarget.iwdpWsUrl,
          };
          if (Ctor.name === AppClientType.WS) {
            newOption.ws = ws;
          }
          return new Ctor(clientId, newOption);
        } catch (e) {
          log.error('create app client error: %s', (e as Error)?.stack);
        }
      })
      .filter((v) => v);

    // 订阅上行消息
    subscriber.pSubscribe((message, upwardChannelId) => {
      log.info('on channel message, %s', upwardChannelId);
      const msgObj: Adapter.CDP.Req = JSON.parse(message);
      const downwardChannelId = upwardChannelId.replace(upwardSpliter, downwardSpliter);
      cmdMap.set(msgObj.id, downwardChannelId);
      downwardChannelSet.add(downwardChannelId);

      appClientList.forEach((appClient) => {
        appClient.sendToApp(msgObj).catch((e) => {
          if (e !== ERROR_CODE.DOMAIN_FILTERED) {
            return log.error('%s app client send error: %j', appClient.type, e);
          }
        });
      });
    });

    // 发布下行消息
    appClientList.forEach((appClient) => {
      appClient.removeAllListeners(ClientEvent.Message);
      appClient.on(ClientEvent.Message, async (msg: Adapter.CDP.Res) => {
        const msgStr = JSON.stringify(msg);
        if ('id' in msg) {
          // 消息为 command，根据缓存的 cmdId 查找 downwardChannelId，只发布到该 channel
          const commandRes = msg as Adapter.CDP.CommandRes;
          const downwardChannelId = cmdMap.get(commandRes.id);
          if (!publisherMap.has(downwardChannelId)) {
            if (!downwardChannelId) return;
            const publisher = new Publisher(downwardChannelId);
            publisherMap.set(downwardChannelId, publisher);
          }
          const publisher = publisherMap.get(downwardChannelId);
          publisher.publish(msgStr);
        } else {
          // event 无法确定来源，广播到所有 channel
          Array.from(downwardChannelSet.values()).map(async (channelId) => {
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
  }

  /**
   * 调试结束，清除缓存。appDisconnect, app ws close 时调用
   */
  public static async clean(clientId: string) {
    const channelInfo = SocketServer.channelMap.get(clientId);
    if (!channelInfo) return;
    const { publisherMap, subscriber, internalPublisher } = channelInfo;
    internalPublisher.publish(InternalChannelEvent.WSClose);
    // Promise.all(Array.from(publisherMap.values()).map((publisher) => publisher.disconnect()));
    // subscriber.pUnsubscribe();
    // subscriber.disconnect();
    // internalPublisher.disconnect();
    SocketServer.channelMap.delete(clientId);
  }

  private wss: Server;
  private server;

  constructor(server) {
    super();
    this.server = server;
  }

  public start() {
    const wss = new Server({
      server: this.server,
      path: config.wsPath,
    });
    this.wss = wss;
    wss.on('connection', this.onConnection.bind(this));

    wss.on('error', (e) => {
      log.error(`wss error: %s`, (e as Error)?.stack);
    });
    wss.on('headers', (headers) => {
      log.info('wss headers: %j', headers);
    });
    wss.on('upgrade', (response) => {
      log.info('wss upgrade: %j', response);
    });
  }

  public close() {
    SocketServer.debugTargets.forEach((debugTarget) => {
      model.delete(config.redis.key, debugTarget.clientId);
    });
    this.wss.close(() => {
      log.info('close wss.');
    });
  }

  private async onConnection(ws, req) {
    log.info('on connection, ws url: %s', req.url);
    const wsUrlParams = parseWsUrl(req.url);
    const { clientRole, clientId } = wsUrlParams;
    if (clientRole === ClientRole.Devtools) {
      this.onDevtoolsConnection(ws, wsUrlParams);
    } else {
      this.onAppConnection(ws, wsUrlParams);
    }

    /**
     * ⚠️ 给 ws 添加事件监听前，不要执行异步操作
     * 连接建立后，再判断是否合法，不合法则关闭
     */
    const debugTarget = await DebugTargetManager.findDebugTarget(clientId);
    const isValid = await isConnectionValid(wsUrlParams, debugTarget);
    if (!isValid) return ws.close();
  }

  /**
   * 将来自于 devtools 的 ws，通过 pub/sub 转发到 redis
   */
  private onDevtoolsConnection(ws: WebSocket, wsUrlParams: WsUrlParams) {
    const { extensionName } = wsUrlParams;
    const { clientId } = wsUrlParams;
    const downwardChannelId = createDownwardChannel(clientId, extensionName);
    const upwardChannelId = createUpwardChannel(clientId, extensionName);
    const internalChannelId = createInternalChannel(clientId, extensionName);
    log.info('devtools connected, subscribe channel: %s, publish channel: %s', downwardChannelId, upwardChannelId);
    const downwardSubscriber = new Subscriber(downwardChannelId);
    // internal channel 用于订阅 node 节点之间的事件，如 app ws close 时，通知 devtools ws close
    const internalSubscriber = new Subscriber(internalChannelId);
    const publisher = new Publisher(upwardChannelId);
    downwardSubscriber.subscribe(ws.send.bind(ws));

    internalSubscriber.subscribe((msg: string) => {
      if (msg === InternalChannelEvent.WSClose) {
        log.warn('close devtools ws connection');
        ws.close();
        internalSubscriber.unsubscribe();
        internalSubscriber.disconnect();
      }
    });
    ws.on('message', (msg: string) => {
      log.info('devtools msg: %s', msg);
      publisher.publish(msg);
    });
    const onClose = async () => {
      log.info('devtools ws disconnect. clientId: %s', clientId);
      // 断开连接后不再发送调试指令，不会出现 id 混乱，所以 command id 可以直接用 ts 来 mock
      const ts = 10000;
      const resumeCommands = [
        {
          id: ts,
          method: TdfCommand.TDFRuntimeResume,
          params: {},
        },
        {
          id: ts + 1,
          method: ChromeCommand.DebuggerDisable,
          params: {},
        },
        {
          id: ts + 2,
          method: ChromeCommand.RuntimeDisable,
          params: {},
        },
      ];
      await Promise.all(resumeCommands.map((command) => publisher.publish(command)));
      publisher.disconnect();
      downwardSubscriber.unsubscribe();
      downwardSubscriber.disconnect();
    };
    ws.on('close', onClose);
    // ws 标准规定 on error 后一定触发 on close，所以也要做清理
    ws.on('error', (e) => {
      log.error('devtools ws client error %s', e?.stack);
      onClose();
    });
  }

  private async onAppConnection(ws: WebSocket, wsUrlParams: WsUrlParams) {
    const { clientId, clientRole } = wsUrlParams;
    log.info('ws app client connected. %s', clientId);
    const platform = {
      [ClientRole.Android]: DevicePlatform.Android,
      [ClientRole.IOS]: DevicePlatform.IOS,
    }[clientRole];
    const useWS = appClientManager.useAppClientType(platform, AppClientType.WS);
    if (!useWS) return log.warn('current env is %s, ignore ws connection', global.appArgv.env);

    let debugTarget = createTargetByWs(wsUrlParams);
    if (debugTarget.platform === DevicePlatform.IOS) {
      const iosPages = await getIWDPPages(global.appArgv.iwdpPort);
      debugTarget = patchIOSTarget(debugTarget, iosPages);
    }
    model.upsert(config.redis.key, clientId, debugTarget);
    SocketServer.subscribeRedis(debugTarget, ws);

    const onClose = () => {
      log.info('ws app client disconnect. %s', clientId);
      model.delete(config.redis.key, clientId);
      SocketServer.clean(clientId);
    };
    ws.on('close', onClose);
    ws.on('error', (e) => {
      log.error('app ws error %s', e?.stack);
      onClose();
    });
  }
}

const isConnectionValid = async (wsUrlParams, debugTarget): Promise<boolean> => {
  const { clientRole, pathname, contextName } = wsUrlParams;
  const { clientId } = wsUrlParams;
  log.info('clientRole: %s', clientRole);
  if (clientRole === ClientRole.Devtools) log.info('isConnectionValid debug target: %j', debugTarget);

  if (pathname !== config.wsPath) {
    log.warn('invalid ws connection path!');
    return false;
  }
  if (clientRole === ClientRole.Devtools && !debugTarget) {
    log.warn("debugTarget doesn't exist!");
    return false;
  }
  if (!Object.values(ClientRole).includes(clientRole)) {
    log.warn('invalid client role!');
    return false;
  }
  if (clientRole === ClientRole.IOS) {
    if (!contextName) {
      log.warn('invalid ios connection, should request with contextName!');
      return false;
    }
  }

  if (!clientId) {
    log.warn('invalid ws connection!');
    return false;
  }
  return true;
};

/**
 * channel id 未加 devtoolsId，所以当开启多个 chrome-devtools 时，下行消息是广播到所有
 * ws endpoint 的，体验上也不影响调试
 */
const downwardSpliter = '_down_';
const upwardSpliter = '_up_';
const internalSpliter = '_internal_';
const createDownwardChannel = (clientId: string, extensionName?: string) =>
  createChannel(clientId, extensionName, downwardSpliter);
const createUpwardChannel = (clientId: string, extensionName?: string) =>
  createChannel(clientId, extensionName, upwardSpliter);
const createInternalChannel = (clientId: string, extensionName?: string) =>
  createChannel(clientId, extensionName, internalSpliter);
const createChannel = (clientId: string, extensionName?: string, spliter?: string) =>
  `${clientId}${spliter}${extensionName || 'default'}`;
