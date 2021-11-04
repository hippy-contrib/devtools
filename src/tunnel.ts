/**
 * 注意：请勿引用此文件接口🚫，需调用 dev-server/adapter 下的 messageChannel 做消息收发！！！
 */
import { EventEmitter } from 'events';
import { ClientEvent } from './@types/enum';
import { sendMsg } from './child-process/addon';
import { DomainRegister } from './utils/cdp';
import { Logger } from './utils/log';

const log = new Logger('tunnel');

export class Tunnel extends DomainRegister {
  public static tunnelMessageEmitter = new EventEmitter();
  private requestPromiseMap: Adapter.RequestPromiseMap = new Map();

  public onMessage(msg: string) {
    try {
      const msgObject: Adapter.CDP.Res = JSON.parse(msg);
      if ('id' in msgObject) {
        const requestPromise = this.requestPromiseMap.get(msgObject.id);
        if (requestPromise) requestPromise.resolve(msgObject);
      }
      this.triggerListerner(msgObject);
      Tunnel.tunnelMessageEmitter.emit(ClientEvent.Message, msgObject);
    } catch (e) {
      log.info(`parse tunnel response json failed. error: %j, \n msg: %j`, e, msg);
    }
  }

  public sendMessage(msg: Adapter.CDP.Req): Promise<Adapter.CDP.Res> {
    return new Promise((resolve, reject) => {
      log.info('sendMessage: %j', msg);
      sendMsg(JSON.stringify(msg));

      if (msg.id) {
        this.requestPromiseMap.set(msg.id, { resolve, reject });
      }
    });
  }
}

export const tunnel = new Tunnel();
