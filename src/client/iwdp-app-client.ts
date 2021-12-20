import WebSocket from 'ws';
import { AppClientType, AppClientEvent } from '@/@types/enum';
import { Logger } from '@/utils/log';
import { AppClient } from './app-client';

const log = new Logger('app-client:IWDP');

/**
 * IWDP 调试通道，通过 ws client 与 IWDP server 建立连接
 */
export class IWDPAppClient extends AppClient {
  private url: string;
  private ws: WebSocket;
  private requestPromiseMap: Adapter.RequestPromiseMap = new Map();
  private msgBuffer: Array<{
    msg: Adapter.CDP.Req;
    resolve: Adapter.Resolve;
    reject: Adapter.Reject;
  }> = [];

  public constructor(id, option) {
    super(id, option);
    this.url = option.iWDPWsUrl;
    if (!this.url) {
      const e = new Error(
        'IWDPAppClient constructor option need iWDPWsUrl, if you are debug iOS without USB, please ignore this error.',
      );
      throw e;
    }
    this.type = AppClientType.IWDP;
    this.connect();
  }

  protected registerMessageListener() {
    if (!this.ws) return;
    this.ws.on('message', async (msg: string) => {
      let msgObj: Adapter.CDP.Res;
      try {
        msgObj = JSON.parse(msg);
      } catch (e) {
        log.error(`parse json error: ${msg}`);
      }
      const res = await this.downwardMessageHandler(msgObj);
      if (!('id' in msgObj)) return;
      const requestPromise = this.requestPromiseMap.get(msgObj.id);
      if (requestPromise) {
        requestPromise.resolve(res);
      }
    });

    this.ws.on('open', () => {
      log.info(`ios proxy client opened: ${this.url}`);
      for (const { msg, resolve, reject } of this.msgBuffer) {
        const msgStr = JSON.stringify(msg);
        this.ws.send(msgStr);
        this.requestPromiseMap.set(msg.id, { resolve, reject });
      }
      this.msgBuffer = [];
    });

    this.ws.on('close', () => {
      this.isClosed = true;
      this.emit(AppClientEvent.Close);

      const e = new Error('ws closed');
      for (const requestPromise of this.requestPromiseMap.values()) {
        requestPromise.reject(e);
      }
    });

    this.ws.on('error', (e) => {
      log.error('ios proxy client error: %s', e?.stack);
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
      this.registerMessageListener();
    } catch (e) {
      log.error('IWDP connect error: %s', (e as Error)?.stack);
      throw e;
    }
  }
}
