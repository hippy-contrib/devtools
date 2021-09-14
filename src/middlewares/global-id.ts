class GlobalId {
  private _id = 0;

  constructor(private step: number = 1) {}

  public get id() {
    return this._id;
  }

  public create() {
    this._id += this.step;
    return this._id;
  }
}

export const requestId = new GlobalId(-1);
export const contextId = new GlobalId();
