export class GlobalId {
  private globalId = 0;

  public constructor(private start = 0, private step: number = 1) {
    this.globalId = start;
  }

  public get id() {
    return this.globalId;
  }

  public create() {
    this.globalId += this.step;
    return this.globalId;
  }
}

/**
 * 全局调试协议 request command id
 */
export const requestId = new GlobalId(0, -1);

/**
 * 全局 js 执行上下文 id
 */
export const contextId = new GlobalId();
