import WebSocket from 'ws/index.js';
import { AppClientType, ClientEvent } from '../@types/enum';
import { requestId } from '../middlewares/global-id';
import { Logger } from '../utils/log';
import { AppClient } from './app-client';

const log = new Logger('app-client:ios-proxy');

export class IwdpAppClient extends AppClient {
  private url: string;
  private ws: WebSocket;
  private requestPromiseMap: Adapter.RequestPromiseMap = new Map();

  constructor(url, option) {
    super(url, option);
    this.url = url;
    this.connect();
    this.registerMessageListener();
  }

  public resumeApp() {
    this.sendToApp({
      id: requestId.create(),
      method: 'Debugger.disable',
      params: {},
    });
    this.sendToApp({
      id: requestId.create(),
      method: 'Runtime.disable',
      params: {},
    });
  }

  protected connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) return;

    this.ws = new WebSocket(this.url);
    this.type = AppClientType.IosProxy;
  }

  protected registerMessageListener() {
    this.ws.on('message', (msg: string) => {
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

    this.ws.on('open', () => {
      log.info(`ios proxy client opened: ${this.url}`);
      for (const msg of this.msgBuffer) {
        this.send(msg);
      }
      this.msgBuffer = [];
    });

    this.ws.on('close', () => {
      this.isClosed = true;
      this.emit(ClientEvent.Close);

      const e = new Error('ws closed');
      for (const requestPromise of this.requestPromiseMap.values()) {
        requestPromise.reject(e);
      }
    });

    this.ws.on('error', (e) => {
      log.error('ios proxy client error: %j', e);
    });
  }

  protected sendToApp(msg: Adapter.CDP.Req): Promise<Adapter.CDP.Res> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        const msgStr = JSON.stringify(msg);
        this.ws.send(msgStr);
        this.requestPromiseMap.set(msg.id, { resolve, reject });
      } else {
        this.msgBuffer.push(msg);
      }
    });
  }
}
