import { Server as HTTPServer, IncomingMessage } from 'http';
import { Socket } from 'net';
import WebSocket, { Server as WSServer } from 'ws';
import { ChromeCommand, TdfCommand } from 'tdf-devtools-protocol/dist/types';
import { AppClientType, ClientRole, DevicePlatform, InternalChannelEvent, WinstonColor, WSCode } from '@/@types/enum';
import { getDBOperator } from '@/db';
import { appClientManager } from '@/client';
import { DebugTargetManager } from '@/controller/debug-targets';
import { subscribeCommand, cleanDebugTarget, cleanAllDebugTargets } from '@/controller/pub-sub-manager';
import { Logger } from '@/utils/log';
import { createDownwardChannel, createUpwardChannel, createInternalChannel } from '@/utils/pub-sub-channel';
import { parseWsUrl, getWsInvalidReason, AppWsUrlParams, DevtoolsWsUrlParams, HMRWsParams } from '@/utils/url';
import { createTargetByWsUrlParams, patchDebugTarget } from '@/utils/debug-target';
import { config } from '@/config';
import { onHMRClientConnection, onHMRServerConnection } from '@/controller/hmr';

const heartbeatInterval = 30000;
// 断开连接后不再发送调试指令，不会出现 id 混乱，所以 command id 可以 mock 一个
const mockCmdId = -100000;
const resumeCommands = [
  {
    id: mockCmdId,
    method: TdfCommand.TDFRuntimeResume,
    params: {},
  },
  {
    id: mockCmdId - 1,
    method: ChromeCommand.DebuggerDisable,
    params: {},
  },
  {
    id: mockCmdId - 2,
    method: ChromeCommand.RuntimeDisable,
    params: {},
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
  public close() {
    cleanAllDebugTargets();
    this.wss.close(() => {
      log.info('wss closed.');
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

    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });
    const { clientRole } = wsUrlParams;
    if (clientRole === ClientRole.HMRClient) {
      onHMRClientConnection(ws, wsUrlParams as HMRWsParams);
    } else if (clientRole === ClientRole.HMRServer) {
      onHMRServerConnection(ws, wsUrlParams as HMRWsParams);
    } else if (clientRole === ClientRole.Devtools) {
      this.onDevtoolsConnection(ws, wsUrlParams as DevtoolsWsUrlParams);
    } else {
      this.onAppConnection(ws, wsUrlParams as AppWsUrlParams);
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
    log.info('checkDebugTargetExist debug target: %j', debugTarget);
    return Boolean(debugTarget);
  }

  /**
   * 将来自于 devtools 的 ws，通过 pub/sub 转发到 redis
   */
  private onDevtoolsConnection(ws: MyWebSocket, wsUrlParams: DevtoolsWsUrlParams) {
    const { Subscriber, Publisher } = getDBOperator();
    const { extensionName, clientId } = wsUrlParams;
    const downwardChannelId = createDownwardChannel(clientId, extensionName);
    const upwardChannelId = createUpwardChannel(clientId, extensionName);
    const internalChannelId = createInternalChannel(clientId, '');
    log.info('devtools connected, subscribe channel: %s, publish channel: %s', downwardChannelId, upwardChannelId);

    const downwardSubscriber = new Subscriber(downwardChannelId);
    // internal channel 用于订阅 node 节点之间的事件，如 app ws close 时，通知 devtools ws close
    const internalSubscriber = new Subscriber(internalChannelId);
    const publisher = new Publisher(upwardChannelId);
    downwardSubscriber.unsubscribe();
    internalSubscriber.unsubscribe();
    downwardSubscriber.subscribe(ws.send.bind(ws));
    internalSubscriber.subscribe((msg) => {
      if (msg === InternalChannelEvent.WSClose) {
        log.warn('close devtools ws connection');
        ws.close();
        internalSubscriber.unsubscribe();
        internalSubscriber.disconnect();
      }
    });

    ws.on('message', (msg) => {
      publisher.publish(msg.toString());
    });
    const onClose = (code, reason, e?: Error) => {
      log.info('devtools ws client close code %s, reason: %s, clientId: %s', code, reason, clientId);
      log.error('devtools ws client error: %j', e);
      resumeCommands.map(publisher.publish.bind(publisher));
      // 延时等 publisher 发布完成
      process.nextTick(() => {
        publisher.disconnect();
        downwardSubscriber.unsubscribe();
        downwardSubscriber.disconnect();
      });
    };
    ws.on('close', (code, reason) => onClose(code, reason));
    // ws 标准规定 on error 后一定触发 on close，所以也要做清理
    ws.on('error', (error) => onClose(null, null, error));
  }

  /**
   * app ws 连接，创建调试对象，并订阅上行调试消息
   */
  private async onAppConnection(ws: MyWebSocket, wsUrlParams: AppWsUrlParams) {
    const { clientId, clientRole } = wsUrlParams;
    log.info('WsAppClient connected. %s', clientId);
    const platform = {
      [ClientRole.Android]: DevicePlatform.Android,
      [ClientRole.IOS]: DevicePlatform.IOS,
    }[clientRole];
    const useWS = appClientManager.shouldUseAppClientType(platform, AppClientType.WS);
    if (!useWS) return log.warn('current env is %s, ignore ws connection', global.debugAppArgv.env);

    let debugTarget = createTargetByWsUrlParams(wsUrlParams);
    // app ws 添加监听前可以执行异步操作，因为 app 建立连接后不会主动发送任何消息
    debugTarget = await patchDebugTarget(debugTarget);
    const { DB } = getDBOperator();
    new DB(config.redis.debugTargetTable).upsert(clientId, debugTarget);
    process.nextTick(() => {
      subscribeCommand(debugTarget, ws);
    });

    const onClose = (code: number, reason: string, error?) => {
      log.warn('WsAppClient close: %j, reason: %s, clientId: %s', code, reason, clientId);
      if (error) {
        log.error('WsAppClient error %j', error);
      }
      cleanDebugTarget(clientId, code === WSCode.ClosePage);
    };
    ws.on('close', (code, reason) => onClose(code, reason));
    ws.on('error', (e) => onClose(null, null, e));
  }
}

declare class MyWebSocket extends WebSocket {
  isAlive: boolean;
}
