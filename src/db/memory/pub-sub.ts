// 扩展 eventemitter3 以支持 redis 的通配符
import { EventEmitter } from '@/utils/event-emitter';
import { IPublisher, ISubscriber } from '@/db/pub-sub';

const pubsub = new EventEmitter();

export class MemoryPubSub implements IPublisher, ISubscriber {
  private channel: string;

  public constructor(channel: string) {
    this.channel = channel;
  }

  /**
   * 发布 message 到 channel
   */
  public publish(message: string | Adapter.CDP.Req) {
    let msgStr: string;
    if (typeof message !== 'string') msgStr = JSON.stringify(message);
    else msgStr = message;
    pubsub.emit(this.channel, msgStr, null, null, null, null);
  }

  /**
   * 订阅 channel
   */
  public subscribe(cb) {
    pubsub.on(this.channel, cb);
  }

  /**
   * 含通配符 * 的订阅
   */
  public pSubscribe(cb) {
    pubsub.on(this.channel, cb);
  }

  /**
   * 取消订阅
   */
  public unsubscribe() {
    pubsub.removeAllListeners(this.channel);
  }

  /**
   * 含通配符 * 的取消订阅
   */
  public pUnsubscribe() {
    pubsub.removeAllListeners(this.channel);
  }

  /**
   * 断开连接，emitter 无需实现，故写作空
   */
  public disconnect() {}
}
