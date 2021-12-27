import { DBType } from '@/@types/enum';
import { IPublisher, ISubscriber } from '@/db/pub-sub';
import { MemoryModel } from './memory/model';
import { MemoryPubSub } from './memory/pub-sub';
import { RedisModel } from './redis/model';
import { RedisPublisher, RedisSubscriber } from './redis/pub-sub';
import { DBModel } from './base-model';

let model: DBModel;
let Publisher: new (channel: string) => IPublisher;
let Subscriber: new (channel: string) => ISubscriber;

/**
 * 获取数据库 model, Publisher, Subscriber
 */
export const getDBOperator = () => ({
  model,
  Publisher,
  Subscriber,
});

/**
 * 初始化数据库环境
 */
export const initDbModel = async () => {
  const { dbType } = global.debugAppArgv;
  if (dbType === DBType.Memory) {
    model = new MemoryModel();
    Publisher = MemoryPubSub;
    Subscriber = MemoryPubSub;
  }
  if (dbType === DBType.Redis) {
    model = new RedisModel();
    Publisher = RedisPublisher;
    Subscriber = RedisSubscriber;
  }
  await model.init();
  return model;
};
