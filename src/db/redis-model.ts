import { createClient } from 'redis';
import { config } from '@/config';
import { Logger } from '@/utils/log';
import { DBModel } from './base-model';

const log = new Logger('redis-model');
type RedisClient = ReturnType<typeof createClient>;

/**
 * 封装 redis 的增删查改和 pub/sub 接口（注：value 统一存储为 hashmap 格式）
 * 线上环境多机部署时用此模型
 */
export class RedisModel extends DBModel {
  public client;

  constructor() {
    super();
    if (!this.client) {
      this.client = createMyClient();
    }
  }

  public async init() {
    try {
      await this.client.connect();
    } catch (e) {
      log.error('connect redis failed: %s', (e as Error).stack);
    }
  }

  public async getAll(key) {
    const hashmap: Record<string, string> = await this.client.hGetAll(key);
    return Object.values(hashmap).map((item) => JSON.parse(item));
  }

  public async upsert(key: string, field: string, value: string | Object) {
    let strValue = value;
    if (typeof value !== 'string') strValue = JSON.stringify(value);
    return this.client.hSet(key, field, strValue);
  }

  public async delete(key: string, field: string) {
    return this.client.hDel(key, field);
  }

  public async createSubscriber(channel) {
    if (!channel) {
      const e = new Error('channelId should not be empty');
      log.error('%s', e?.stack);
      throw e;
    }
    const client = await this.createClient();
    return {
      subscribe: (cb) => client.subscribe(channel, cb),
      pSubscribe: (cb) => client.pSubscribe(channel, cb),
      unsubscribe: () => client.unsubscribe(channel),
      pUnsubscribe: () => client.pUnsubscribe(channel),
      disconnect: () => client.disconnect,
    };
  }

  private async createClient(): Promise<RedisClient> {
    const client: RedisClient = this.client.duplicate();
    client.on('error', (e) => {
      log.error('duplicate redis client error: %s', e?.stack);
      console.error('duplicate redis client error', e);
    });

    await client.connect();
    return client;
  }
}

const createMyClient = (): RedisClient => {
  const client = createClient({ url: config.redis.url }) as RedisClient;
  client.on('error', (e) => {
    log.error('create redis client error: %s', e?.stack);
  });
  client.on('connect', log.error.bind(log));
  client.on('warning', log.error.bind(log));
  client.on('ready', log.error.bind(log));
  return client;
};

export const redisModel = new RedisModel();

export class RedisPublisher {
  private client: RedisClient;
  private quequ: Array<string | Adapter.CDP.Req> = [];
  private isConnected = false;
  private channel: string;

  constructor(channel: string) {
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
    this.client.disconnect();
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
    this.isConnected = true;
    this.quequ.forEach(this.realPublish.bind(this));
  }
}

export class RedisSubscriber {
  private client: RedisClient;
  private channel: string;

  constructor(channel: string) {
    if (!channel) {
      const e = new Error('channelId should not be empty');
      log.error('%s', e?.stack);
      throw e;
    }
    this.channel = channel;
    this.client = redisModel.client.duplicate();
    this.init();
  }

  public subscribe = (cb) => this.client.subscribe(this.channel, cb);
  public pSubscribe = (cb) => this.client.pSubscribe(this.channel, cb);
  public unsubscribe = () => this.client.unsubscribe(this.channel);
  public pUnsubscribe = () => this.client.pUnsubscribe(this.channel);
  public disconnect = () => this.client.disconnect();
  private init = () => this.client.connect();
}
