// uni-reactive/core.ts
export interface ReactiveInterface<S> {
  create<T>(value: T): S;
  get<T>(store: S): unknown;
  modify<T>(store: S, modifier: (v: T) => T): void;
}


@injectable()
class Reactive implements ReactiveInterface<string> {
  create<T>(value: T): string {
    return JSON.stringify(value);
  }
  get<T>(store: string): unknown {
    return JSON.parse(store);
  }
  modify<T>(store: string, modifier: (v: T) => T): void {
    const value = JSON.parse(store);
    const modifiedValue = modifier(value);
    store = JSON.stringify(modifiedValue);
  }
}


container.bind(Reactive).toSelf();

const reactive = container.get(Reactive);

console.log(reactive.create({ name: "Alice" }));