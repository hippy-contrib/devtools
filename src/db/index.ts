import { IPublisher, ISubscriber } from '@/db/pub-sub';
import { config } from '@/config';
import { MemoryDB } from './memory/memory-db';
import { MemoryPubSub } from './memory/pub-sub';
import { RedisDB } from './redis/redis-db';
import { RedisPublisher, RedisSubscriber } from './redis/pub-sub';
import { BaseDB } from './base-db';

let DB: new <T>(key: string) => BaseDB<T>;
let Publisher: new (channel: string) => IPublisher;
let Subscriber: new (channel: string) => ISubscriber;

/**
 * 获取数据库 db, Publisher, Subscriber
 */
export const getDBOperator = () => ({
  DB,
  Publisher,
  Subscriber,
});

/**
 * 初始化数据库环境
 */
export const initDbModel = () => {
  if (config.isCluster) {
    DB = RedisDB;
    Publisher = RedisPublisher;
    Subscriber = RedisSubscriber;
  } else {
    DB = MemoryDB;
    Publisher = MemoryPubSub;
    Subscriber = MemoryPubSub;
  }
};
