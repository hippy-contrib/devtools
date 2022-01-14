/**
 * ⚠️ Publisher, Subscriber 必须 connect 之后再开始发布订阅，否则会先进入 PubSub mode，不能发送 AUTH 命令
 */
import { Logger } from '@/utils/log';
import { IPublisher, ISubscriber } from '@/db/pub-sub';
import { RedisClient, RedisDB } from './redis-db';

const log = new Logger('redis-pub-sub');

export class RedisPublisher implements IPublisher {
  private client: RedisClient;
  private queue: Array<string | Adapter.CDP.Req> = [];
  private isConnected = false;
  private channel: string;

  public constructor(channel: string) {
    if (!channel) {
      const e = new Error('channelId should not be empty');
      log.error('%s', e?.stack);
      throw e;
    }
    this.channel = channel;
    this.client = RedisDB.client.duplicate();
    this.init();
  }

  /**
   * 发布 message 到 channel
   */
  public publish(message: string | Adapter.CDP.Req) {
    if (this.isConnected) this.realPublish(message);
    else this.queue.push(message);
  }

  /**
   * 断开连接。暂写作空实现，redis 进入 PubSub mode 后，不能发送其他任何指令
   */
  public disconnect() {}

  /**
   * 真正的 publish 到 redis
   */
  private realPublish(message: string | Adapter.CDP.Req) {
    const msgStr = typeof message !== 'string' ? JSON.stringify(message) : message;
    try {
      this.client.publish(this.channel, msgStr);
    } catch (e) {
      log.error('publish %s to channel %s error: %s', msgStr, this.channel, (e as Error).stack);
    }
  }

  /**
   * 初始化数据库连接，建立后清空 publish 队列
   */
  private async init() {
    await this.client.connect();
    log.info('redis publisher client created, %s', this.channel);
    this.isConnected = true;
    this.queue.forEach(this.realPublish.bind(this));
  }
}

export class RedisSubscriber implements ISubscriber {
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
    this.client = RedisDB.client.duplicate();
    this.init();
  }

  /**
   * 订阅到 channel
   */
  public subscribe(cb) {
    if (this.isConnected) this.client.subscribe(this.channel, cb);
    else this.operateQueue.push([this.subscribe, cb]);
  }

  /**
   * 含通配符 * 的订阅
   */
  public pSubscribe(cb) {
    if (this.isConnected) this.client.pSubscribe(this.channel, cb);
    else this.operateQueue.push([this.pSubscribe, cb]);
  }

  /**
   * 取消订阅
   */
  public unsubscribe = () => this.client.unsubscribe(this.channel);

  /**
   * 取消订阅含通配符 * 的 channel
   */
  public pUnsubscribe = () => this.client.pUnsubscribe(this.channel);

  /**
   * 断开连接。暂写作空实现，redis 进入 PubSub mode 后，不能发送其他任何指令
   */
  public disconnect = () => {};

  /**
   * 初始化数据库连接，建立后清空提前调用的指令队列
   */
  private async init() {
    if (this.isConnected) return;
    await this.client.connect();
    log.info('redis subscriber client created, %s', this.channel);
    this.isConnected = true;
    if (this.operateQueue) {
      this.operateQueue.forEach(([fn, cb]) => {
        fn.call(this, cb);
      });
    }
  }
}
