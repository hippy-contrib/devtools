import { createClient } from 'redis';
import { config } from '@/config';
import { Logger } from '@/utils/log';
import { WinstonColor } from '@/@types/enum';
import { DBModel } from '../base-model';

const log = new Logger('redis-model', WinstonColor.BrightCyan);
export type RedisClient = ReturnType<typeof createClient>;

/**
 * 封装 redis 的增删查改接口（注：value 统一存储为 hashmap 格式）
 * 线上环境多机部署时用此模型
 */
export class RedisModel extends DBModel {
  private static instance: RedisModel;

  public static getInstance() {
    if (!RedisModel.instance) {
      RedisModel.instance = new RedisModel();
    }
    return RedisModel.instance;
  }

  public client;

  public constructor() {
    super();
    if (!this.client) {
      this.client = createMyClient();
    }
  }

  /**
   * 初始化数据库连接
   */
  public async init() {
    try {
      // ⚠️ Publisher, Subscriber 必须 connect 之后再开始发布订阅，否则会先进入 PubSub mode，不能发送 AUTH 命令
      await this.client.connect();
    } catch (e) {
      log.error('connect redis failed: %s', (e as Error).stack || e);
    }
  }

  public async get(key: string, field: string) {
    const all = await this.getAll(key);
    return all[field];
  }

  /**
   * 查询 hashmap 的所有 value
   */
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
  const client = createClient({ url: config.redis.url }) as RedisClient;
  client.on(RedisClientEvent.Error, (e) => {
    log.error('redis client error: %s', e?.stack || e);
  });
  client.on(RedisClientEvent.Connect, () => log.info('redis connected'));
  client.on(RedisClientEvent.Ready, () => log.info('redis ready'));
  client.on(RedisClientEvent.End, () => log.warn('redis disconnect by quit() or disconnect()'));
  client.on(RedisClientEvent.Reconnecting, () => {
    log.warn('redis reconnecting');
  });
  return client;
};

const enum RedisClientEvent {
  Error = 'error',
  Connect = 'connect',
  Ready = 'ready',
  End = 'end',
  Reconnecting = 'reconnecting',
}
