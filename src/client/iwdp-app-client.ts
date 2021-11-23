import WebSocket from 'ws/index.js';
import { AppClientType, ClientEvent } from '@/@types/enum';
import { Logger } from '@/utils/log';
import { AppClient } from './app-client';

const log = new Logger('app-client:iwdp');

/**
 * IWDP 调试通道，通过 ws client 与 IWDP server 建立连接
 */
export class IwdpAppClient extends AppClient {
  private url: string;
  private ws: WebSocket;
  private requestPromiseMap: Adapter.RequestPromiseMap = new Map();
  private msgBuffer: {
    msg: Adapter.CDP.Req;
    resolve: Adapter.Resolve<Adapter.CDP.Res>;
    reject: Adapter.Reject;
  }[];

  constructor(url, option) {
    super(url, option);
    this.url = url;
    this.type = AppClientType.IWDP;
    this.connect();
    this.registerMessageListener();
  }

  protected registerMessageListener() {
    this.ws?.on('message', (msg: string) => {
      let msgObj: Adapter.CDP.Res;
      try {
        msgObj = JSON.parse(msg);
      } catch (e) {
        log.error(`parse json error: ${msg}`);
      }
      this.onMessage(msgObj).then((res) => {
        if (!('id' in msgObj)) return;
        const requestPromise = this.requestPromiseMap.get(msgObj.id);
        if (requestPromise) {
          requestPromise.resolve(res);
        }
      });
    });

    this.ws?.on('open', () => {
      log.info(`ios proxy client opened: ${this.url}`);
      for (const { msg, resolve, reject } of this.msgBuffer) {
        const msgStr = JSON.stringify(msg);
        this.ws.send(msgStr);
        this.requestPromiseMap.set(msg.id, { resolve, reject });
      }
      this.msgBuffer = [];
    });

    this.ws?.on('close', () => {
      this.isClosed = true;
      this.emit(ClientEvent.Close);

      const e = new Error('ws closed');
      for (const requestPromise of this.requestPromiseMap.values()) {
        requestPromise.reject(e);
      }
    });

    this.ws?.on('error', (e) => {
      log.error('ios proxy client error: %s', e.stack);
    });
  }

  protected sendHandler(msg: Adapter.CDP.Req): Promise<Adapter.CDP.Res> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        const msgStr = JSON.stringify(msg);
        this.ws.send(msgStr);
        this.requestPromiseMap.set(msg.id, { resolve, reject });
      } else {
        this.msgBuffer.push({
          msg,
          resolve,
          reject,
        });
      }
    });
  }

  /**
   * 与 IWDP server 建立连接
   */
  private connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) return;

    try {
      this.ws = new WebSocket(this.url);
    } catch (e) {
      log.error('iwdp connect error: %s', (e as Error)?.stack);
    }
  }
}
