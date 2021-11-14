import WebSocket from 'ws/index.js';
import { AppClientType, ClientEvent } from '@/@types/enum';
import { Logger } from '@/utils/log';
import { AppClient } from './app-client';

const log = new Logger('app-client:ws');

export class WsAppClient extends AppClient {
  private ws: WebSocket;
  private requestPromiseMap: Adapter.RequestPromiseMap = new Map();

  constructor(id, option) {
    super(id, option);
    this.type = AppClientType.WS;
    this.ws = option.ws;
    this.registerMessageListener();
  }

  protected registerMessageListener() {
    this.ws.on('message', (msg: string) => {
      let msgObj: Adapter.CDP.Res;
      try {
        msgObj = JSON.parse(msg);
      } catch (e) {
        log.error(`parse ws app client json message error: ${msg}`);
      }

      this.onMessage(msgObj).then((res) => {
        if (!('id' in msgObj)) return;
        const requestPromise = this.requestPromiseMap.get(msgObj.id);
        if (requestPromise) requestPromise.resolve(res);
      });
    });

    this.ws.on('close', (msg) => {
      this.isClosed = true;
      log.info(`${this.id} ws app client closed.`);
      this.emit(ClientEvent.Close, msg);
    });
  }

  protected sendHandler(msg: Adapter.CDP.Req): Promise<Adapter.CDP.Res> {
    return new Promise((resolve, reject) => {
      const msgStr = JSON.stringify(msg);
      this.ws.send(msgStr);
      this.requestPromiseMap.set(msg.id, { resolve, reject });
    });
  }
}
