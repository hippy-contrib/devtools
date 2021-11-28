import { DBModel } from '../base-model';

/**
 * 封装数据增删查改以及 pub/sub 接口，数据统一存储为 hashmap
 * 本地开发或单机部署时用此模型，数据保存在内存中
 */
export class MemoryModel extends DBModel {
  private static db: Map<string, Map<string, unknown>> = new Map();

  constructor() {
    super();
  }

  public async init() {}

  public getAll(key) {
    const hashmap = MemoryModel.db.get(key) || new Map();
    return Array.from(hashmap.values());
  }

  public upsert(key: string, field: string, value: Object) {
    if (!MemoryModel.db.has(key)) {
      MemoryModel.db.set(key, new Map());
    }
    const hashMap = MemoryModel.db.get(key);
    hashMap.set(field, value);
  }

  public delete(key: string, field: string) {
    const hashMap = MemoryModel.db.get(key);
    if (hashMap) {
      hashMap.delete(field);
    }
  }
}
