import WebSocket from 'ws';
import { AppClientEvent } from '@/@types/enum';
import { Logger } from '@/utils/log';
import { AppClient } from './app-client';

const log = new Logger('app-client:ws');

export class WSAppClient extends AppClient {
  private ws: WebSocket;
  private requestPromiseMap: Adapter.RequestPromiseMap = new Map();

  public constructor(id, option) {
    super(id, option);
    this.ws = option.ws;
    if (!this.ws) {
      const e = new Error('WSAppClient constructor option need ws');
      throw e;
    }
    this.registerMessageListener();
  }

  public destroy() {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.close();
  }

  protected registerMessageListener() {
    this.ws.on('message', async (msg: string) => {
      let msgObj: Adapter.CDP.Res;
      try {
        msgObj = JSON.parse(msg);
      } catch (e) {
        log.error(`parse WSAppClient json message error: ${msg}`);
      }

      const res = await this.downwardMessageHandler(msgObj);
      if (!('id' in msgObj)) return;
      const requestPromise = this.requestPromiseMap.get(msgObj.id);
      if (requestPromise) requestPromise.resolve(res);
    });

    this.ws.on('close', () => {
      this.isClosed = true;
      log.warn(`${this.id} WSAppClient closed.`);
      this.emit(AppClientEvent.Close);
    });
  }

  protected sendHandler(msg: Adapter.CDP.Req): Promise<Adapter.CDP.Res> {
    if (this.ws.readyState !== WebSocket.OPEN) return;
    return new Promise((resolve, reject) => {
      const msgStr = JSON.stringify(msg);
      this.ws.send(msgStr);
      this.requestPromiseMap.set(msg.id, { resolve, reject });
    });
  }
}
