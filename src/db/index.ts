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
  if (process.env.IS_REMOTE === 'true') {
    model = new RedisModel();
    Publisher = RedisPublisher;
    Subscriber = RedisSubscriber;
  } else {
    model = new MemoryModel();
    Publisher = MemoryPubSub;
    Subscriber = MemoryPubSub;
  }
  await model.init();
  return model;
};
