import { DBType } from '@/@types/enum';
import { MemoryModel } from './memory-model';
import { RedisModel } from './redis-model';
export * from './debug-target';

export let model;

export const initModel = async (dbType: DBType) => {
  if (dbType === DBType.Memory) model = new MemoryModel();
  if (dbType === DBType.Redis) model = new RedisModel();
  await model.init();
  return model;
};
