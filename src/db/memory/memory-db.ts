import { BaseDB } from '../base-db';

/**
 * 封装数据增删查改，数据统一存储为 redis hashmap 类型
 * 本地开发或单机部署时用此模型，数据保存在内存中
 */
export class MemoryDB extends BaseDB {
  private db: Map<string, Map<string, unknown>> = new Map();

  /**
   * 本地无需做初始化，暂写作空实现
   */
  public async init() {}

  public async get(field: string) {
    const hashmap = this.db.get(this.key);
    if (!hashmap) return;
    return hashmap.get(field);
  }

  public async getAll() {
    const hashmap = this.db.get(this.key) || new Map();
    return Array.from(hashmap.values());
  }

  public upsert(field: string, value: Object) {
    if (!this.db.has(this.key)) {
      this.db.set(this.key, new Map());
    }
    const hashMap = this.db.get(this.key);
    hashMap.set(field, value);
  }

  public delete(field: string) {
    const hashMap = this.db.get(this.key);
    hashMap?.delete(field);
  }
}
