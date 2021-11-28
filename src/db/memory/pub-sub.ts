import { EventEmitter } from '@/utils/event-emitter';
const pubsub = new EventEmitter();

export class MemoryPubSub extends EventEmitter {
  private channel: string;

  constructor(channel: string) {
    super();
    this.channel = channel;
  }

  public publish(message: string | Adapter.CDP.Req) {
    let msgStr: string;
    if (typeof message !== 'string') msgStr = JSON.stringify(message);
    else msgStr = message;
    pubsub.emit(this.channel, msgStr);
  }

  public subscribe(cb) {
    pubsub.on(this.channel, cb);
  }

  public pSubscribe(cb) {
    pubsub.on(this.channel, cb);
  }

  public unsubscribe() {
    pubsub.removeAllListeners(this.channel);
  }

  public pUnsubscribe() {
    pubsub.removeAllListeners(this.channel);
  }

  public disconnect() {}
}
