import { createClient } from 'redis';
import { config } from '@/config';
import { Logger } from '@/utils/log';
import { DBModel } from '../base-model';

const log = new Logger('redis-model');
export type RedisClient = ReturnType<typeof createClient>;

/**
 * 封装 redis 的增删查改和 pub/sub 接口（注：value 统一存储为 hashmap 格式）
 * 线上环境多机部署时用此模型
 */
export class RedisModel extends DBModel {
  public client;

  public constructor() {
    super();
    if (!this.client) {
      this.client = createMyClient();
    }
  }

  public async init() {
    try {
      // ⚠️ Publisher, Subscriber 必须 connect 之后再开始发布订阅，否则会先进入 PubSub mode，不能发送 AUTH 命令
      await this.client.connect();
    } catch (e) {
      log.error('connect redis failed: %s', (e as Error).stack);
    }
  }

  public async getAll(key) {
    const hashmap: Record<string, string> = await this.client.hGetAll(key);
    return Object.values(hashmap)
      .map((item) => {
        let itemObj;
        try {
          itemObj = JSON.parse(item);
        } catch (e) {
          log.error('parse redis hashmap fail, key: %s', item);
        }
        return itemObj;
      })
      .filter((v) => v);
  }

  public async upsert(key: string, field: string, value: string | Object) {
    let strValue = value;
    if (typeof value !== 'string') strValue = JSON.stringify(value);
    return this.client.hSet(key, field, strValue);
  }

  public async delete(key: string, field: string) {
    return this.client.hDel(key, field);
  }
}

const createMyClient = (): RedisClient => {
  try {
    const client = createClient({ url: config.redis.url }) as RedisClient;
    client.on('error', (e) => {
      log.error('create redis client error: %s', e?.stack);
    });
    client.on('connect', log.error.bind(log));
    client.on('warning', log.error.bind(log));
    client.on('ready', log.error.bind(log));
    return client;
  } catch (e) {
    return null;
  }
};

export const redisModel = new RedisModel();
