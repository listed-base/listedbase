export abstract class LDriver {
  private _ready: Promise<void> | null = null;

  // init — lazy، عند أول استخدام
  async ensureReady(schemas: any): Promise<void> {
    if (!this._ready) this._ready = this._init(schemas);
    return this._ready;
  }

  protected abstract _init( schemas: any): Promise<void>;
  public abstract create(list: string,input: any): Promise<any>;
}
