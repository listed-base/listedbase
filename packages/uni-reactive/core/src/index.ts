
// core/types.ts
// core/types.ts
export interface ReactiveTypeMap<T> {
  default: T
}

/**
 * كل adapter يضيف المفتاح الخاص به هنا
 */
export interface RegisteredReactiveAdapters { }

export type ActiveReactiveKind = keyof RegisteredReactiveAdapters

export type TReadonlyState<T> =
  ReactiveTypeMap<T>[ActiveReactiveKind]



export interface IReactive<T> {
  value: TReadonlyState<T>
  modify: (next: (prev: T) => T) => void
  init(initial: T): void
}

export type ReactiveFactory = <T>() => IReactive<T>;

let factory: ReactiveFactory | null = null;

export function registerReactive(f: ReactiveFactory) {
  factory = f;
}

export function createReactive<T>(): IReactive<T> {
  if (!factory) throw new Error("Reactive adapter not registered");
  return factory<T>();
}