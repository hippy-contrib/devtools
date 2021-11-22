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
  private client;
  // 每个 channel 可能存在多个 publisher, subscriber
  private publisherMap: Map<string, Array<RedisClient>> = new Map();
  private subscriberMap: Map<string, Array<RedisClient>> = new Map();

  constructor() {
    super();
    if (!this.client) {
      this.client = createClient({
        url: config.redis.url,
      });
      this.client.on('error', (e) => {
        log.error('%j', e);
      });
    }
  }

  public async init() {
    await this.client.connect();
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

  public createPublisher() {
    return this.createClient();
  }

  public createSubscriber() {
    return this.createClient();
  }

  private async createClient(): Promise<RedisClient> {
    const client = this.client.duplicate();
    await client.connect();
    return client;
  }
}
