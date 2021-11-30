import { AppClientType } from '@/@types/enum';
import { Logger } from '@/utils/log';
import { AppClient } from './app-client';

const log = new Logger('app-client:tunnel');

export class TunnelAppClient extends AppClient {
  private requestPromiseMap: Adapter.RequestPromiseMap = new Map();

  public constructor(id, option) {
    super(id, option);
    this.type = AppClientType.Tunnel;
    this.registerMessageListener();
  }

  protected async registerMessageListener() {
    const { tunnelEmitter, TUNNEL_EVENT } = await import('../child-process/index');
    // TODO tunnel 暂不支持多调试实例，这里暂时移除上一个实例的事件监听
    tunnelEmitter.removeAllListeners(TUNNEL_EVENT);
    tunnelEmitter.on(TUNNEL_EVENT, async (data) => {
      let msgObject: Adapter.CDP.Res;
      try {
        msgObject = JSON.parse(data);
      } catch (e) {
        return log.info(`parse tunnel response json failed. error: %s, \n msg: %j`, (e as Error)?.stack, data);
      }
      if ('id' in msgObject) {
        const requestPromise = this.requestPromiseMap.get(msgObject.id);
        if (requestPromise) requestPromise.resolve(msgObject);
      }
      const res = await this.onMessage(msgObject);
      if (!('id' in msgObject)) return;
      const requestPromise = this.requestPromiseMap.get(msgObject.id);
      if (requestPromise) {
        requestPromise.resolve(res);
      }
    });
  }

  protected sendHandler(msg: Adapter.CDP.Req): Promise<Adapter.CDP.Res> {
    return new Promise((resolve, reject) => {
      if (msg.id) {
        this.requestPromiseMap.set(msg.id, { resolve, reject });
      }
      import('../child-process/addon').then(({ sendMsg }) => {
        sendMsg(JSON.stringify(msg));
      });
    });
  }
}
