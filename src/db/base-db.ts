/**
 * 数据库基类，包含基础的增删查改接口
 */
export abstract class BaseDB<T = unknown> {
  constructor(protected key: string) {}
  public async find(field: string, value: string): Promise<T[]> {
    const all = await this.getAll();
    return all.filter((item) => item[field] === value);
  }

  public abstract getAll(): Promise<T[]>;
  public abstract get(field: string): Promise<T>;

  /**
   * field 存在则更新，不存在则添加
   */
  public abstract upsert(field: string, value: string | Object);
  public abstract delete(field: string);
}
