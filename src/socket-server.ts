import { Server as HTTPServer, IncomingMessage } from 'http';
import WebSocket, { Server as WSServer } from 'ws';
import { ChromeCommand, TdfCommand } from 'tdf-devtools-protocol/dist/types';
import { AppClientType, ClientRole, DevicePlatform, InternalChannelEvent, WinstonColor } from '@/@types/enum';
import { getDBOperator } from '@/db';
import { appClientManager } from '@/client';
import { DebugTargetManager } from '@/controller/debug-targets';
import { subscribeRedis, cleanDebugTarget, cleanAllDebugTargets } from '@/controller/pub-sub-manager';
import { Logger } from '@/utils/log';
import { createDownwardChannel, createUpwardChannel, createInternalChannel } from '@/utils/pub-sub-channel';
import { parseWsUrl, isConnectionValid, AppWsUrlParams, DevtoolsWsUrlParams } from '@/utils/url';
import { createTargetByWsUrlParams, patchDebugTarget } from '@/utils/debug-target';
import { config } from '@/config';

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
 * ws 调试服务，支持远程调试（无线模式，ws 通道）、本地调试（有线模式，tunnel 数据通道）
 * 通过 redis pub/sub 实现多点部署时的消息分发，上下行消息根据 clientId 来建立 redis channel 进行分发
 * 本地安装 npm 包部署时（单点部署），不存储 redis，而是直接保存在内存中
 *
 * 设计方案： https://iwiki.woa.com/pages/viewpage.action?pageId=1222336167
 */
export class SocketServer {
  private wss: WSServer;
  private server: HTTPServer | undefined;

  public constructor(server: HTTPServer) {
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
    cleanAllDebugTargets();
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
    const isValid = isConnectionValid(wsUrlParams, debugTarget);
    if (!isValid) return ws.close();
  }

  /**
   * 将来自于 devtools 的 ws，通过 pub/sub 转发到 redis
   */
  private onDevtoolsConnection(ws: WebSocket, wsUrlParams: DevtoolsWsUrlParams) {
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

    downwardSubscriber.subscribe(ws.send.bind(ws));
    internalSubscriber.subscribe((msg: string) => {
      if (msg === InternalChannelEvent.WSClose) {
        log.warn('close devtools ws connection');
        ws.close();
        internalSubscriber.unsubscribe();
        internalSubscriber.disconnect();
      }
    });

    ws.on('message', publisher.publish.bind(publisher));
    const onClose = (e?: Error) => {
      if (e) log.error('devtools ws client error %s', e?.stack);
      log.info('devtools ws disconnect. clientId: %s', clientId);
      resumeCommands.map(publisher.publish.bind(publisher));
      publisher.disconnect();
      downwardSubscriber.unsubscribe();
      downwardSubscriber.disconnect();
    };
    ws.on('close', onClose);
    // ws 标准规定 on error 后一定触发 on close，所以也要做清理
    ws.on('error', onClose);
  }

  private async onAppConnection(ws: WebSocket, wsUrlParams: AppWsUrlParams) {
    const { clientId, clientRole } = wsUrlParams;
    log.info('ws app client connected. %s', clientId);
    const platform = {
      [ClientRole.Android]: DevicePlatform.Android,
      [ClientRole.IOS]: DevicePlatform.IOS,
    }[clientRole];
    const useWS = appClientManager.shouldUseAppClientType(platform, AppClientType.WS);
    if (!useWS) return log.warn('current env is %s, ignore ws connection', global.appArgv.env);

    let debugTarget = createTargetByWsUrlParams(wsUrlParams);
    // app ws 添加监听前可以执行异步操作，因为 app 建立连接后不会主动发送任何消息
    debugTarget = await patchDebugTarget(debugTarget);
    const { model } = getDBOperator();
    model.upsert(config.redis.key, clientId, debugTarget);
    subscribeRedis(debugTarget, ws);

    const onClose = (e?: Error) => {
      if (e) log.error('app ws error %s', e?.stack);
      log.info('ws app client disconnect. %s', clientId);
      cleanDebugTarget(clientId);
    };
    ws.on('close', onClose);
    ws.on('error', onClose);
  }
}
