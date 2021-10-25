class GlobalId {
  private globalId = 0;

  constructor(private step: number = 1) {}

  public get id() {
    return this.globalId;
  }

  public create() {
    this.globalId += this.step;
    return this.globalId;
  }
}

export const requestId = new GlobalId(-1);
export const contextId = new GlobalId();
