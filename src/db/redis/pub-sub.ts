/**
 * ⚠️ Publisher, Subscriber 必须 connect 之后再开始发布订阅，否则会先进入 PubSub mode，不能发送 AUTH 命令
 */
import { Logger } from '@/utils/log';
import { redisModel, RedisClient } from './model';

const log = new Logger('redis-pub-sub');

export class RedisPublisher {
  private client: RedisClient;
  private quequ: Array<string | Adapter.CDP.Req> = [];
  private isConnected = false;
  private channel: string;

  public constructor(channel: string) {
    if (!channel) {
      const e = new Error('channelId should not be empty');
      log.error('%s', e?.stack);
      throw e;
    }
    this.channel = channel;
    this.client = redisModel.client.duplicate();
    this.init();
  }

  public publish(message: string | Adapter.CDP.Req) {
    if (this.isConnected) this.realPublish(message);
    else this.quequ.push(message);
  }

  public disconnect() {
    this.client.quit();
  }

  private realPublish(message: string | Adapter.CDP.Req) {
    let msgStr: string;
    if (typeof message !== 'string') msgStr = JSON.stringify(message);
    else msgStr = message;
    try {
      this.client.publish(this.channel, msgStr);
    } catch (e) {
      log.error('publish %s to channel %s error: %s', msgStr, this.channel, (e as Error).stack);
    }
  }

  private async init() {
    await this.client.connect();
    log.info('redis publisher client created, %s', this.channel);
    this.isConnected = true;
    log.info('publish quequ message, length %s', this.quequ.length);
    this.quequ.forEach(this.realPublish.bind(this));
  }
}

export class RedisSubscriber {
  private client: RedisClient;
  private channel: string;
  private isConnected = false;
  private operateQueue: Array<[Function, Function]> = [];

  public constructor(channel: string) {
    if (!channel) {
      const e = new Error('channelId should not be empty');
      log.error('%s', e?.stack);
      throw e;
    }
    this.channel = channel;
    this.client = redisModel.client.duplicate();
    this.init();
  }

  public subscribe(cb) {
    if (this.isConnected) this.client.subscribe(this.channel, cb);
    else this.operateQueue.push([this.subscribe, cb]);
  }
  public pSubscribe(cb) {
    if (this.isConnected) this.client.pSubscribe(this.channel, cb);
    else this.operateQueue.push([this.pSubscribe, cb]);
  }
  public unsubscribe = () => this.client.unsubscribe(this.channel);
  public pUnsubscribe = () => this.client.pUnsubscribe(this.channel);
  public disconnect = () => this.client.quit();

  private async init() {
    if (this.isConnected) return;
    await this.client.connect();
    log.info('redis subscriber client created, %s', this.channel);
    this.isConnected = true;
    if (this.operateQueue) {
      log.info('clear subscribe quequ, length %s', this.operateQueue.length);
      this.operateQueue.forEach(([fn, cb]) => {
        fn.call(this, cb);
      });
    }
  }
}
