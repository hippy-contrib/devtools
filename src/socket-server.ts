import { Server as HTTPServer, IncomingMessage } from 'http';
import { Socket } from 'net';
import { Server as WSServer } from 'ws';
import { ClientRole, WinstonColor, WSCode } from '@/@types/enum';
import { DebugTargetManager } from '@/controller/debug-targets';
import { cleanAllDebugTargets } from '@/controller/pub-sub-manager';
import { onDevtoolsConnection, onAppConnection } from '@/controller/chrome-devtools';
import { Logger } from '@/utils/log';
import {
  parseWsUrl,
  getWsInvalidReason,
  AppWsUrlParams,
  DevtoolsWsUrlParams,
  HMRWsParams,
  JSRuntimeWsUrlParams,
} from '@/utils/url';
import { config } from '@/config';
import { onHMRClientConnection, onHMRServerConnection } from '@/controller/hmr';
import { MyWebSocket } from '@/@types/socker-server';
import { onVueClientConnection } from '@/controller/vue-devtools';

const heartbeatInterval = 30000;
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
      onDevtoolsConnection(ws, wsUrlParams as DevtoolsWsUrlParams);
    } else {
      onAppConnection(ws, wsUrlParams as AppWsUrlParams, host);
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
}
