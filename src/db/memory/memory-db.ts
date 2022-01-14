import { BaseDB } from '../base-db';

/**
 * 封装数据增删查改，数据统一存储为 redis hashmap 类型
 * 本地开发或单机部署时用此模型，数据保存在内存中
 */
export class MemoryDB<T> extends BaseDB<T> {
  private static db: Map<string, Map<string, unknown>> = new Map();

  /**
   * 本地无需做初始化，暂写作空实现
   */
  public async init() {}

  public async get(field: string): Promise<T> {
    const hashmap = MemoryDB.db.get(this.key);
    if (!hashmap) return;
    return hashmap.get(field) as T;
  }

  public async getAll(): Promise<T[]> {
    const hashmap = MemoryDB.db.get(this.key) || new Map();
    return Array.from(hashmap.values());
  }

  public upsert(field: string, value: Object) {
    if (!MemoryDB.db.has(this.key)) {
      MemoryDB.db.set(this.key, new Map());
    }
    const hashMap = MemoryDB.db.get(this.key);
    hashMap.set(field, value);
  }

  public delete(field: string) {
    const hashMap = MemoryDB.db.get(this.key);
    hashMap?.delete(field);
  }
}
