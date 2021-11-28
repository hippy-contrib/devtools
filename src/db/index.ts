import { DBType } from '@/@types/enum';
import { MemoryModel } from './memory/model';
import { MemoryPubSub } from './memory/pub-sub';
import { redisModel } from './redis/model';
import { RedisPublisher, RedisSubscriber } from './redis/pub-sub';
import { DBModel } from './base-model';
export * from '../utils/debug-target';

export let model: DBModel;
export let Publisher;
export let Subscriber;

export const initDbModel = async () => {
  const { dbType } = global.appArgv;
  if (dbType === DBType.Memory) {
    model = new MemoryModel();
    Publisher = MemoryPubSub;
    Subscriber = MemoryPubSub;
  }
  if (dbType === DBType.Redis) {
    model = redisModel;
    Publisher = RedisPublisher;
    Subscriber = RedisSubscriber;
  }
  await model.init();
  return model;
};
