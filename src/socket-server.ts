import { Server as HTTPServer, IncomingMessage } from 'http';
import WebSocket, { Server as WSServer } from 'ws';
import { ChromeCommand, TdfCommand } from 'tdf-devtools-protocol/dist/types';
import {
  AppClientType,
  ClientEvent,
  ClientRole,
  DevicePlatform,
  ErrorCode,
  InternalChannelEvent,
  WinstonColor,
} from '@/@types/enum';
import { createTargetByWsUrlParams, model, Publisher, Subscriber } from '@/db';
import { appClientManager, AppClient } from '@/client';
import { AppClientOption } from '@/client/app-client';
import { AppClientFullOptionOmicCtx } from '@/client/app-client-manager';
import { debugTargetToUrlParsedContext } from '@/middlewares';
import { DebugTargetManager } from '@/controller/debug-targets';
import { DebugTarget } from '@/@types/debug-target';
import { DomainRegister } from '@/utils/cdp';
import { Logger } from '@/utils/log';
import { parseWsUrl, WsUrlParams, AppWsUrlParams, DevtoolsWsUrlParams } from '@/utils/url';
import { config } from '@/config';
import { getIWDPPages, patchIOSTarget } from '@/utils/iwdp';

const log = new Logger('socket-server', WinstonColor.Cyan);

/**
 * ws 调试服务，支持远程调试（无线模式，ws 通道）、本地调试（有线模式，tunnel 数据通道）
 * 通过 redis pub/sub 实现多点部署时的消息分发，上下行消息根据 clientId 来建立 redis channel 进行分发
 * 本地安装 npm 包部署时（单点部署），不存储 redis，而是直接保存在内存中
 *
 * 设计方案： https://iwiki.woa.com/pages/viewpage.action?pageId=1222336167
 */
export class SocketServer extends DomainRegister {
  // 保存一个调试页面的缓存数据，key: clientId
  private static channelMap: Map<
    string,
    {
      downwardChannelSet: Set<string>;
      // key: command id, value: downward channelId
      cmdIdChannelIdMap: Map<number, string>;
      // key: downward channelId
      publisherMap: Map<string, typeof Publisher>;
      // 多个 node 节点之间通信的 publisher，用与当 app 端断连时，通知 devtools 端断开
      internalPublisher: typeof Publisher;
      upwardSubscriber: typeof Subscriber;
    }
  > = new Map();

  // 保存当前 node 节点所连接的调试对象，当服务关闭时清理 redis 缓存、优雅退出
  private static debugTargets: Array<DebugTarget> = [];

  /**
   * 订阅 redis 消息。tunnel appConnect 或 app ws connection 时订阅
   */
  public static async subscribeRedis(debugTarget: DebugTarget, ws?: WebSocket) {
    const { clientId } = debugTarget;
    SocketServer.debugTargets.push(debugTarget);

    if (!SocketServer.channelMap.has(clientId)) {
      const upwardChannelId = createUpwardChannel(clientId, '*');
      const internalChannelId = createInternalChannel(clientId, '');
      const upwardSubscriber = new Subscriber(upwardChannelId);
      const internalPublisher = new Publisher(internalChannelId);
      log.info('subscribe to redis channel %s', upwardChannelId);
      SocketServer.channelMap.set(clientId, {
        downwardChannelSet: new Set(),
        cmdIdChannelIdMap: new Map(),
        publisherMap: new Map(),
        upwardSubscriber,
        internalPublisher,
      });
    }
    const { downwardChannelSet, cmdIdChannelIdMap, publisherMap, upwardSubscriber } =
      SocketServer.channelMap.get(clientId);

    let options: AppClientFullOptionOmicCtx[];
    if (debugTarget.platform === DevicePlatform.Android) {
      options = appClientManager.getAndroidAppClientOptions();
    } else {
      options = appClientManager.getIosAppClientOptions();
    }

    let appClientList: AppClient[] = [];
    appClientList = options
      .map(({ Ctor, ...option }: AppClientFullOptionOmicCtx) => {
        try {
          log.info(`create app client ${Ctor.name}`);
          const urlParsedContext = debugTargetToUrlParsedContext(debugTarget);
          const newOption: AppClientOption = {
            ...option,
            urlParsedContext,
            iwdpWsUrl: debugTarget.iwdpWsUrl,
          };
          if (Ctor.name === AppClientType.WS) {
            newOption.ws = ws;
          }
          return new Ctor(clientId, newOption);
        } catch (e) {
          log.error('create app client error: %s', (e as Error)?.stack);
          return null;
        }
      })
      .filter((v) => v);

    // 订阅上行消息。由于可能存在多个 devtools client（如多个插件），所以这里应该用批量订阅 pSubscribe
    upwardSubscriber.pSubscribe((message: string, upwardChannelId: string) => {
      log.info('on channel message, %s', upwardChannelId);
      let msgObj: Adapter.CDP.Req;
      try {
        msgObj = JSON.parse(message);
      } catch (e) {
        log.error('%s channel message are invalid JSON, %s', upwardChannelId, message);
      }
      const downwardChannelId = upwardChannelId.replace(upwardSpliter, downwardSpliter);
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
      appClient.removeAllListeners(ClientEvent.Message);
      appClient.on(ClientEvent.Message, async (msg: Adapter.CDP.Res) => {
        const msgStr = JSON.stringify(msg);
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
  }

  /**
   * 调试结束，清除缓存
   * appDisconnect, app ws close 时调用
   */
  public static async cleanDebugTarget(clientId: string) {
    model.delete(config.redis.key, clientId);
    const channelInfo = SocketServer.channelMap.get(clientId);
    if (!channelInfo) return;
    const { publisherMap, upwardSubscriber, internalPublisher } = channelInfo;
    internalPublisher.publish(InternalChannelEvent.WSClose);
    Array.from(publisherMap.values()).forEach((publisher) => publisher.disconnect());
    // 稍作延迟，等处理完 InternalChannelEvent.WSClose 事件后再取消订阅
    process.nextTick(() => {
      upwardSubscriber.pUnsubscribe();
      upwardSubscriber.disconnect();
      internalPublisher.disconnect();
      SocketServer.channelMap.delete(clientId);
    });
  }

  private wss: WSServer;
  private server: HTTPServer | undefined;

  constructor(server: HTTPServer) {
    super();
    this.server = server;
  }

  public start() {
    const wss = new WSServer({
      server: this.server,
      path: config.wsPath,
    });
    this.wss = wss;
    wss.on('connection', this.onConnection.bind(this));

    wss.on('error', (e: Error) => {
      log.error(`wss error: %s`, (e as Error)?.stack);
    });
    wss.on('headers', (headers: string[]) => {
      log.info('wss headers: %j', headers);
    });
    wss.on('upgrade', (response: IncomingMessage) => {
      log.info('wss upgrade: %j', response);
    });
  }

  public close() {
    SocketServer.debugTargets.forEach((debugTarget) => {
      SocketServer.cleanDebugTarget(debugTarget.clientId);
    });
    this.wss.close(() => {
      log.info('wss closed.');
    });
  }

  private async onConnection(ws: WebSocket, req: IncomingMessage) {
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
  private onDevtoolsConnection(ws: WebSocket, wsUrlParams: DevtoolsWsUrlParams) {
    const { extensionName, clientId } = wsUrlParams;
    const downwardChannelId = createDownwardChannel(clientId, extensionName);
    const upwardChannelId = createUpwardChannel(clientId, extensionName);
    const internalChannelId = createInternalChannel(clientId, '');
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
      publisher.publish(msg);
    });
    const onClose = () => {
      log.info('devtools ws disconnect. clientId: %s', clientId);
      // 断开连接后不再发送调试指令，不会出现 id 混乱，所以 command id 可以 mock 一个
      const mockId = -100000;
      const resumeCommands = [
        {
          id: mockId,
          method: TdfCommand.TDFRuntimeResume,
          params: {},
        },
        {
          id: mockId - 1,
          method: ChromeCommand.DebuggerDisable,
          params: {},
        },
        {
          id: mockId - 2,
          method: ChromeCommand.RuntimeDisable,
          params: {},
        },
      ];
      resumeCommands.map(publisher.publish.bind(publisher));
      publisher.disconnect();
      downwardSubscriber.unsubscribe();
      downwardSubscriber.disconnect();
    };
    ws.on('close', onClose);
    // ws 标准规定 on error 后一定触发 on close，所以也要做清理
    ws.on('error', (e: Error) => {
      log.error('devtools ws client error %s', e?.stack);
      onClose();
    });
  }

  private async onAppConnection(ws: WebSocket, wsUrlParams: AppWsUrlParams) {
    const { clientId, clientRole } = wsUrlParams;
    log.info('ws app client connected. %s', clientId);
    const platform = {
      [ClientRole.Android]: DevicePlatform.Android,
      [ClientRole.IOS]: DevicePlatform.IOS,
    }[clientRole];
    const useWS = appClientManager.useAppClientType(platform, AppClientType.WS);
    if (!useWS) return log.warn('current env is %s, ignore ws connection', global.appArgv.env);

    let debugTarget = createTargetByWsUrlParams(wsUrlParams);
    if (debugTarget.platform === DevicePlatform.IOS) {
      const iosPages = await getIWDPPages(global.appArgv.iwdpPort);
      debugTarget = patchIOSTarget(debugTarget, iosPages);
    }
    model.upsert(config.redis.key, clientId, debugTarget);
    SocketServer.subscribeRedis(debugTarget, ws);

    const onClose = () => {
      log.info('ws app client disconnect. %s', clientId);
      SocketServer.cleanDebugTarget(clientId);
    };
    ws.on('close', onClose);
    ws.on('error', (e: Error) => {
      log.error('app ws error %s', e?.stack);
      onClose();
    });
  }
}

const isConnectionValid = async (wsUrlParams: WsUrlParams, debugTarget: DebugTarget): Promise<boolean> => {
  const { clientRole, pathname, contextName } = wsUrlParams;
  const { clientId } = wsUrlParams;
  log.info('clientRole: %s', clientRole);
  if (clientRole === ClientRole.Devtools) log.info('isConnectionValid debug target: %j', debugTarget);

  if (pathname !== config.wsPath) {
    log.warn('invalid ws connection path!');
    return false;
  }
  if (clientRole === ClientRole.Devtools && !debugTarget) {
    log.warn("debugTarget doesn't exist! %s", clientId);
    return false;
  }
  if (!Object.values(ClientRole).includes(clientRole)) {
    log.warn('invalid client role!');
    return false;
  }
  if (clientRole === ClientRole.IOS && !contextName) {
    log.warn('invalid ios connection, should request with contextName!');
    return false;
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
