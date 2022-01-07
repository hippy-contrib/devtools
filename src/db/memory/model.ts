import { DBModel } from '../base-model';

/**
 * 封装数据增删查改，数据统一存储为 redis hashmap 类型
 * 本地开发或单机部署时用此模型，数据保存在内存中
 */
export class MemoryModel extends DBModel {
  private static db: Map<string, Map<string, unknown>> = new Map();

  /**
   * 本地无需做初始化，暂写作空实现
   */
  public async init() {}

  public async get(key: string, field: string) {
    const hashmap = MemoryModel.db.get(key);
    if (!hashmap) return;
    return hashmap.get(field);
  }

  public getAll(key: string) {
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
    hashMap?.delete(field);
  }
}
