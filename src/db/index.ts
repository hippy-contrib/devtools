import { DBType } from '@/@types/enum';
import { MemoryModel } from './memory-model';
import { redisModel, RedisPublisher, RedisSubscriber } from './redis-model';
import { DBModel } from './base-model';
export * from '../utils/debug-target';

export let model: DBModel;
export let Publisher;
export let Subscriber;

export const initDbModel = async () => {
  const { dbType } = global.appArgv;
  if (dbType === DBType.Memory) {
    model = new MemoryModel();
  }
  if (dbType === DBType.Redis) {
    model = redisModel;
    Publisher = RedisPublisher;
    Subscriber = RedisSubscriber;
  }
  await model.init();
  return model;
};
