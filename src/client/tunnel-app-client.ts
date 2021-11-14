import { AppClientType } from '@/@types/enum';
import { sendMsg } from '@/child-process/addon';
import { Logger } from '@/utils/log';
import { tunnelEmitter } from '@/child-process';
import { AppClient } from './app-client';

const log = new Logger('app-client:tunnel');

export class TunnelAppClient extends AppClient {
  private requestPromiseMap: Adapter.RequestPromiseMap = new Map();

  constructor(id, option) {
    super(id, option);
    this.type = AppClientType.Tunnel;
    this.registerMessageListener();
  }

  protected registerMessageListener() {
    tunnelEmitter.on('message', (data) => {
      try {
        const msgObject: Adapter.CDP.Res = JSON.parse(data);
        if ('id' in msgObject) {
          const requestPromise = this.requestPromiseMap.get(msgObject.id);
          if (requestPromise) requestPromise.resolve(msgObject);
        }
        this.triggerListerner(msgObject);
        this.onMessage(msgObject).then((res) => {
          if (!('id' in msgObject)) return;
          const requestPromise = this.requestPromiseMap.get(msgObject.id);
          if (requestPromise) {
            requestPromise.resolve(res);
          }
        });
      } catch (e) {
        log.info(`parse tunnel response json failed. error: %j, \n msg: %j`, e, data);
      }
    });
  }

  protected sendHandler(msg: Adapter.CDP.Req): Promise<Adapter.CDP.Res> {
    return new Promise((resolve, reject) => {
      if (msg.id) {
        this.requestPromiseMap.set(msg.id, { resolve, reject });
      }
      sendMsg(JSON.stringify(msg));
    });
  }
}
