import { createClient } from 'redis';
import { config } from '@/config';
import { Logger } from '@/utils/log';
import { WinstonColor } from '@/@types/enum';
import { BaseDB } from '../base-db';

const log = new Logger('redis-model', WinstonColor.BrightCyan);
export type RedisClient = ReturnType<typeof createClient>;

/**
 * 封装 redis 的增删查改接口（注：value 统一存储为 hashmap 格式）
 * 线上环境多机部署时用此模型
 */
export class RedisDB<T> extends BaseDB<T> {
  /**
   * Since Node.js and Redis are both effectively single threaded there is no need
   * to use multiple client instances or any pooling mechanism save for a few exceptions;
   * the most common exception is if you’re subscribing with Pub/Sub or blocking
   * with streams or lists, then you’ll need to have dedicated clients to receive
   * these long-running commands.
   */
  public static client;
  private static isInited = false;

  /**
   * 初始化数据库连接
   */
  private static async init() {
    try {
      RedisDB.client = createMyClient();
      // ⚠️ Publisher, Subscriber 必须 connect 之后再开始发布订阅，否则会先进入 PubSub mode，不能发送 AUTH 命令
      await RedisDB.client.connect();
      RedisDB.isInited = true;
    } catch (e) {
      log.error('connect redis failed: %s', (e as Error).stack || e);
    }
  }

  private opQueue: Array<Function> = [];

  public constructor(key: string) {
    super(key);
    if (!RedisDB.client) {
      RedisDB.init();
    }
  }

  public async get(field: string): Promise<T> {
    return new Promise((resolve) => {
      const op = async () => {
        const hashmap: Record<string, string> = await RedisDB.client.hGetAll(this.key);
        const item = hashmap[field];
        try {
          const itemObj: T = JSON.parse(item);
          return resolve(itemObj);
        } catch (e) {
          log.error('parse redis hashmap error, key: %s, field: %s, value: %s', this.key, field, item);
          return resolve(null);
        }
      };
      if (RedisDB.isInited) return op();
      this.opQueue.push(op);
    });
  }

  /**
   * 查询 hashmap 的所有 value
   */
  public async getAll(): Promise<T[]> {
    return new Promise((resolve) => {
      const op = async () => {
        const hashmap: Record<string, string> = await RedisDB.client.hGetAll(this.key);
        const result = Object.values(hashmap)
          .map((item) => {
            let itemObj: T;
            try {
              itemObj = JSON.parse(item);
            } catch (e) {
              log.error('parse redis hashmap fail, key: %s', item);
            }
            return itemObj;
          })
          .filter((v) => v);
        resolve(result);
      };
      if (RedisDB.isInited) return op();
      this.opQueue.push(op);
    });
  }

  public async upsert(field: string, value: string | Object) {
    return new Promise((resolve, reject) => {
      const op = async () => {
        let strValue = value;
        if (typeof value !== 'string') strValue = JSON.stringify(value);
        try {
          await RedisDB.client.hSet(this.key, field, strValue);
          resolve(null);
        } catch (e) {
          reject(e);
        }
      };
      if (RedisDB.isInited) return op();
      this.opQueue.push(op);
    });
  }

  public async delete(field: string) {
    return new Promise((resolve, reject) => {
      const op = async () => {
        try {
          await RedisDB.client.hDel(this.key, field);
          resolve(null);
        } catch (e) {
          reject(e);
        }
      };
      if (RedisDB.isInited) return op();
      this.opQueue.push(op);
    });
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
