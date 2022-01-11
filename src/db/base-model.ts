/**
 * 数据库基类，包含基础的增删查改接口
 */
export abstract class DBModel {
  public async find(key: string, field: string, value: string) {
    const all = await this.getAll(key);
    return all.filter((item) => item[field] === value);
  }

  public abstract init();
  public abstract getAll(key: string);
  public abstract get(key: string, field: string);

  /**
   * field 存在则更新，不存在则添加
   */
  public abstract upsert(key: string, field: string, value: string | Object);
  public abstract delete(key: string, field: string);
}
