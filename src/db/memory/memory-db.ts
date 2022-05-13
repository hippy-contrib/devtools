import { BaseDB } from '../base-db';

/**
 * 封装数据增删查改，数据统一存储为 redis hashmap 类型
 * 本地开发或单机部署时用此模型，数据保存在内存中
 */
export class MemoryDB<T> extends BaseDB<T> {
  private static hashmapStore: Map<string, Map<string, unknown>> = new Map();
  private static listStore: Map<string, Array<unknown>> = new Map();

  /**
   * 本地无需做初始化，暂写作空实现
   */
  public async init() {}

  public async get(field: string): Promise<T> {
    const hashmap = MemoryDB.hashmapStore.get(this.key);
    if (!hashmap) return;
    return hashmap.get(field) as T;
  }

  public async getAll(): Promise<T[]> {
    const hashmap = MemoryDB.hashmapStore.get(this.key) || new Map();
    return Array.from(hashmap.values());
  }

  public async upsert(field: string, value: Object) {
    if (!MemoryDB.hashmapStore.has(this.key)) {
      MemoryDB.hashmapStore.set(this.key, new Map());
    }
    const hashMap = MemoryDB.hashmapStore.get(this.key);
    hashMap.set(field, value);
  }

  public async delete(field: string) {
    const hashMap = MemoryDB.hashmapStore.get(this.key);
    hashMap?.delete(field);
  }

  public async rPush(value: Object) {
    if (!MemoryDB.listStore.has(this.key)) MemoryDB.listStore.set(this.key, []);
    const list = MemoryDB.listStore.get(this.key);
    list.push(value);
  }

  public async getList(): Promise<T[]> {
    const list = MemoryDB.listStore.get(this.key);
    return list as T[];
  }

  public async clearList() {
    MemoryDB.listStore.set(this.key, []);
  }
}
