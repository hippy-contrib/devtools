import { Server as HTTPServer, IncomingMessage } from 'http';
import { Socket } from 'net';
import { Server as WSServer } from 'ws';
import { ChromeCommand, TdfCommand } from 'tdf-devtools-protocol/dist/types';
import { aegis, createCDPPerformance } from '@/utils/aegis';
import {
  AppClientType,
  ClientRole,
  DevicePlatform,
  InternalChannelEvent,
  WinstonColor,
  WSCode,
  ReportEvent,
} from '@/@types/enum';
import { getDBOperator } from '@/db';
import { appClientManager } from '@/client';
import { DebugTargetManager } from '@/controller/debug-targets';
import { subscribeCommand, cleanDebugTarget, cleanAllDebugTargets } from '@/controller/pub-sub-manager';
import { Logger } from '@/utils/log';
import { createDownwardChannel, createUpwardChannel, createInternalChannel } from '@/utils/pub-sub-channel';
import {
  parseWsUrl,
  getWsInvalidReason,
  AppWsUrlParams,
  DevtoolsWsUrlParams,
  HMRWsParams,
  JSRuntimeWsUrlParams,
} from '@/utils/url';
import { createTargetByWsUrlParams, patchRefAndSave } from '@/utils/debug-target';
import { config } from '@/config';
import { onHMRClientConnection, onHMRServerConnection } from '@/controller/hmr';
import { MyWebSocket } from '@/@types/socker-server';
import { publishReloadCommand } from '@/utils/reload-adapter';
import { onVueClientConnection } from '@/controller/vue-devtools';

const heartbeatInterval = 30000;
// 断开连接后不再发送调试指令，不会出现 id 混乱，所以 command id 可以 mock 一个
const mockCmdId = -100000;
const resumeCommands = [
  {
    id: mockCmdId,
    method: TdfCommand.TDFRuntimeResume,
    params: {},
    performance: createCDPPerformance(),
  },
  {
    id: mockCmdId - 1,
    method: ChromeCommand.DebuggerDisable,
    params: {},
    performance: createCDPPerformance(),
  },
  {
    id: mockCmdId - 2,
    method: ChromeCommand.RuntimeDisable,
    params: {},
    performance: createCDPPerformance(),
  },
];
const log = new Logger('socket-server', WinstonColor.Cyan);

/**
 * ws 调试服务，支持远程调试（无线模式，使用 ws 通道）、本地调试（有线模式，使用 tunnel 数据通道）
 * 通过 redis pub/sub 实现多点部署时的消息分发，上下行消息根据 clientId 来建立 redis channel 进行分发
 * 本地安装 npm 包部署时（单点部署），不存储 redis，而是直接保存在内存中
 *
 * 设计方案： https://iwiki.woa.com/pages/viewpage.action?pageId=1222336167
 */
export class SocketServer {
  private wss: WSServer;
  private server: HTTPServer | undefined;
  private interval;

  public constructor(server: HTTPServer) {
    this.server = server;
  }

  /**
   * 开启调试服务
   */
  public start() {
    const wss = new WSServer({
      noServer: true,
      path: config.wsPath,
    });
    this.wss = wss;
    this.server.on('upgrade', this.onUpgrade.bind(this));
    wss.on('connection', this.onConnection.bind(this));

    wss.on('error', (e: Error) => {
      log.error('wss error: %s', (e as Error)?.stack);
    });
    wss.on('upgrade', (response: IncomingMessage) => {
      log.info('wss upgrade: %j', response);
    });
    wss.on('close', () => {
      clearInterval(this.interval);
    });

    this.interval = setInterval(() => {
      (this.wss.clients as Set<MyWebSocket>).forEach((client) => {
        if (client.isAlive === false) {
          client.terminate();
          return;
        }

        client.isAlive = false;
        client.ping(() => {});
      });
    }, heartbeatInterval);
  }

  /**
   * 关闭调试服务，并清理当前节点连接的调试对象缓存
   */
  public async close() {
    await cleanAllDebugTargets();
    this.wss.close(() => {
      log.warn('wss closed.');
    });
  }

  private onUpgrade(req: IncomingMessage, socket: Socket, head: Buffer) {
    log.info('onUpgrade, ws url: %s', req.url);
    const wsUrlParams = parseWsUrl(req.url);
    const reason = getWsInvalidReason(wsUrlParams);
    if (reason) {
      log.warn('onUpgrade error: %s', reason);
      return socket.destroy();
    }

    this.wss.handleUpgrade(req, socket, head, (ws) => {
      this.wss.emit('connection', ws, req);
    });
  }

  /**
   * ⚠️ 给 ws 添加事件监听前，不要执行异步操作，否则会遗漏消息
   * 事件监听后，再异步判断是否合法，不合法则关闭
   */
  private async onConnection(ws: MyWebSocket, req: IncomingMessage) {
    const wsUrlParams = parseWsUrl(req.url);
    const host = ((req.headers.host || req.headers.Host) as string) || '';
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    const { clientRole } = wsUrlParams;
    if ([ClientRole.JSRuntime, ClientRole.VueDevtools].includes(clientRole)) {
      onVueClientConnection(ws, wsUrlParams as JSRuntimeWsUrlParams | DevtoolsWsUrlParams);
      return;
    }
    if (clientRole === ClientRole.HMRClient) {
      onHMRClientConnection(ws, wsUrlParams as HMRWsParams);
    } else if (clientRole === ClientRole.HMRServer) {
      onHMRServerConnection(ws, wsUrlParams as HMRWsParams);
    } else if (clientRole === ClientRole.Devtools) {
      this.onDevtoolsConnection(ws, wsUrlParams as DevtoolsWsUrlParams);
    } else {
      this.onAppConnection(ws, wsUrlParams as AppWsUrlParams, host);
    }

    if (clientRole === ClientRole.Devtools) {
      const params = wsUrlParams as DevtoolsWsUrlParams;
      const exist = await this.checkDebugTargetExist(params);
      if (!exist) {
        const reason = `debugTarget not exist! ${params.clientId}`;
        log.warn(reason);
        ws.close(WSCode.NoDebugTarget, reason);
      }
    }
  }

  private async checkDebugTargetExist(wsUrlParams: DevtoolsWsUrlParams): Promise<boolean> {
    const { clientId, hash } = wsUrlParams;
    const debugTarget = await DebugTargetManager.findDebugTarget(clientId, hash);
    log.verbose('checkDebugTargetExist debug target: %j', debugTarget);
    return Boolean(debugTarget);
  }

  /**
   * pipe devtools ws message to redis pub/sub
   */
  private onDevtoolsConnection(ws: MyWebSocket, wsUrlParams: DevtoolsWsUrlParams) {
    const { Subscriber, Publisher } = getDBOperator();
    const { extensionName, clientId } = wsUrlParams;
    const downwardChannelId = createDownwardChannel(clientId, extensionName);
    const upwardChannelId = createUpwardChannel(clientId, extensionName);
    const internalChannelId = createInternalChannel(clientId, '');
    log.verbose('devtools connected, subscribe channel: %s, publish channel: %s', downwardChannelId, upwardChannelId);

    const downwardSubscriber = new Subscriber(downwardChannelId);
    // internal channel used to listen message between nodes, such as when app ws closed, notify devtools ws close
    const internalSubscriber = new Subscriber(internalChannelId);
    const internalPublisher = new Publisher(internalChannelId);
    const publisher = new Publisher(upwardChannelId);
    const downwardHandler = (msg) => {
      ws.send(msg);
      try {
        const msgStr = msg as string;
        const msgObj = JSON.parse(msgStr as string);
        const { ts: start } = msgObj;
        if (start) {
          aegis.reportTime({
            name: ReportEvent.PubSub,
            duration: Date.now() - start,
            ext1: `${Math.ceil(msgStr.length / 1024)}KB`,
            ext2: msgObj.method,
          });
        }
      } catch (e) {
        log.error('%s channel message are invalid JSON, %s', downwardChannelId, msg);
      }
    };
    const internalHandler = (msg) => {
      if (msg === InternalChannelEvent.AppWSClose) {
        log.warn('close devtools ws connection');
        ws.close(WSCode.ClosePage, 'the target page is closed');
        internalSubscriber.unsubscribe(internalHandler);
        internalSubscriber.disconnect();
      }
    };
    downwardSubscriber.subscribe(downwardHandler);
    internalSubscriber.subscribe(internalHandler);
    internalPublisher.publish(InternalChannelEvent.DevtoolsConnected);

    // for iOS, must invoke Debugger.disable before devtools frontend connected, otherwise couldn't
    // receive Debugger.scriptParsed event.
    // for Android, both way is okay
    resumeCommands.map(publisher.publish.bind(publisher));

    ws.on('message', (msg) => {
      publisher.publish(msg.toString());
    });
    ws.on('close', (code, reason) => {
      log.warn('devtools ws client close code %s, reason: %s, clientId: %s', code, reason, clientId);
      resumeCommands.map(publisher.publish.bind(publisher));
      // wait for publish finished
      process.nextTick(() => {
        publisher.disconnect();
        downwardSubscriber.unsubscribe(downwardHandler);
        downwardSubscriber.disconnect();
      });
    });
    ws.on('error', (e) => log.error('devtools ws client error: %j', e));
  }

  /**
   * app ws 连接，创建调试对象，并订阅上行调试消息
   */
  private async onAppConnection(ws: MyWebSocket, wsUrlParams: AppWsUrlParams, host: string) {
    const { clientId, clientRole } = wsUrlParams;
    log.verbose('WSAppClient connected. %s', clientId);
    const platform = {
      [ClientRole.Android]: DevicePlatform.Android,
      [ClientRole.IOS]: DevicePlatform.IOS,
    }[clientRole];
    const useWS = appClientManager.shouldUseAppClientType(platform, AppClientType.WS);
    if (!useWS) return log.warn('current env is %s, ignore ws connection', global.debugAppArgv.env);

    let debugTarget = createTargetByWsUrlParams(wsUrlParams, host);
    // app ws 添加监听前可以执行异步操作，因为 app 建立连接后不会主动发送任何消息
    debugTarget = await patchRefAndSave(debugTarget);
    process.nextTick(() => {
      subscribeCommand(debugTarget, ws);
    });

    // when reload, iOS will create a new JSContext, so the debug protocol should resend
    //
    if (debugTarget.platform === DevicePlatform.IOS) publishReloadCommand(debugTarget);

    ws.on('close', (code: number, reason: string) => {
      log.warn('WSAppClient closed: %j, reason: %s, clientId: %s', code, reason, clientId);
      // when reload page, keep frontend open to debug lifecycle of created
      const closeDevtools = code === WSCode.ClosePage;
      cleanDebugTarget(clientId, closeDevtools);
    });
    ws.on('error', (e) => log.error('WSAppClient error %j', e));
  }
}
