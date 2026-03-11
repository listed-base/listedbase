
export type UpdateFunction<T> = (state: T) => Partial<T>;
export abstract class ReactiveStore {
  abstract createStore<T>(initValue: T): unknown;
  protected store: unknown;
  constructor() {
    this.createStore({
      
    })
  }
  protected abstract set<T>(store: unknown, value: T): void;
  protected abstract update<T>(store: unknown, value: UpdateFunction<T>): void;
  abstract get: unknown;


  modify<T>(store: unknown, next: UpdateFunction<T> | T) {
    if (typeof next === 'function') {
      this.update(store, next as UpdateFunction<T>);
    } else {
      this.set(store, next);
    }

  }
} 