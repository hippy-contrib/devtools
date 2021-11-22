import { EventEmitter } from 'events';

/**
 * 数据库基类，包含基础的增删查改接口，以及 pub/sub 接口
 */
export abstract class DBModel extends EventEmitter {
  public abstract getAll(key: string);
  /**
   * field 存在则更新，不存在则添加
   */
  public abstract upsert(key: string, field: string, value: string | Object);
  public abstract delete(key: string, field: string);
  public abstract createPublisher(): Promise<Publisher>;
  public abstract createSubscriber(): Promise<Subscriber>;
}

interface Publisher {
  publish(channel: string, message: string);
  disconnect();
}

interface Subscriber {
  subscribe(channel: string, cb: (message: string) => void): void;
  unsubscribe(channel: string): void;
  disconnect();
}
