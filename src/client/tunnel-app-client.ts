import { AppClientType, ClientEvent, DevicePlatform } from '../@types/enum';
import { requestId } from '../middlewares';
import { Tunnel, tunnel } from '../tunnel';
import { Logger } from '../utils/log';
import { AppClient } from './app-client';

const log = new Logger('app-client:ws');

export class TunnelAppClient extends AppClient {
  private requestPromiseMap: Adapter.RequestPromiseMap = new Map();
  constructor(id, option) {
    super(id, option);
    this.type = AppClientType.Tunnel;

    this.registerMessageListener();
  }

  public resumeApp() {
    log.info('tunnel app client resume');
    if (this.platform === DevicePlatform.Android) {
      tunnel.sendMessage({
        id: requestId.create(),
        method: 'TDFRuntime.resume',
        params: {},
      });
    }
    tunnel.sendMessage({
      id: requestId.create(),
      method: 'Debugger.disable',
      params: {},
    });
  }

  protected registerMessageListener() {
    Tunnel.tunnelMessageEmitter.on(ClientEvent.Message, (msg: Adapter.CDP.Res) => {
      this.onMessage(msg).then((res) => {
        if (!('id' in msg)) return;
        const requestPromise = this.requestPromiseMap.get(msg.id);
        if (requestPromise) {
          requestPromise.resolve(res);
        }
      });
    });
  }

  protected sendToApp(msg: Adapter.CDP.Req): Promise<Adapter.CDP.Res> {
    return new Promise((resolve, reject) => {
      tunnel.sendMessage(msg);
      this.requestPromiseMap.set(msg.id, { resolve, reject });
    });
  }
}
