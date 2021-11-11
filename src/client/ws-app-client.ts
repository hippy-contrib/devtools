import WebSocket from 'ws/index.js';
import { AppClientType, ClientEvent, DevicePlatform } from '../@types/enum';
import { requestId } from '../middlewares';
import { Logger } from '../utils/log';
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

  public resumeApp() {
    log.info('ws app client resume');
    if (this.platform === DevicePlatform.Android) {
      this.ws.send(
        JSON.stringify({
          id: requestId.create(),
          method: 'TDFRuntime.resume',
          params: {},
        }),
      );
    }
    this.ws.send(
      JSON.stringify({
        id: requestId.create(),
        method: 'Debugger.disable',
        params: {},
      }),
    );
    this.ws.send(
      JSON.stringify({
        id: requestId.create(),
        method: 'Runtime.disable',
        params: {},
      }),
    );
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
        if (requestPromise) requestPromise.resolve(res);
      });
    });

    this.ws.on('close', (msg) => {
      this.isClosed = true;
      this.emit(ClientEvent.Close, msg);
    });
  }

  protected sendToApp(msg: Adapter.CDP.Req): Promise<Adapter.CDP.Res> {
    return new Promise((resolve, reject) => {
      log.info(`ws send to app: '${JSON.stringify(msg)}'`);
      const msgStr = JSON.stringify(msg);
      this.ws.send(msgStr);
      this.requestPromiseMap.set(msg.id, { resolve, reject });
    });
  }
}
