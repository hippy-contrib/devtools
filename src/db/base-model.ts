/**
 * 数据库基类，包含基础的增删查改接口
 */
export abstract class DBModel {
  public abstract init();
  public abstract getAll(key: string);

  /**
   * field 存在则更新，不存在则添加
   */
  public abstract upsert(key: string, field: string, value: string | Object);
  public abstract delete(key: string, field: string);
}
