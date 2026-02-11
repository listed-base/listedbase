/* ============================================================
 * uniReactive — Core Interfaces
 * ============================================================
 *
 * Introduction
 * ------------
 * uniReactive provides a minimal, framework-agnostic contract
 * for reactive state management across Angular, React, Vue,
 * Solid, RxJS, and others.
 *
 * This file defines ONLY interfaces.
 * No framework logic, no implementations.
 *
 * Adapters are responsible for mapping these interfaces
 * to native reactive primitives.
 */

/* ============================================================
 * PUBLIC TYPES
 * ============================================================ */

/**
 * Unified lifecycle status for derived/source-based state.
 */
export type StatusType = 'idle' | 'loading' | 'ready' | 'error';

/**
 * Normalized error representation.
 *
 * Adapters should map framework-specific errors
 * into this shape.
 */
export interface ErrorType {
  code: number | string;
  name: string;
  message: string;
}
/* ============================================================
 * BASE CONTROLLER
 * ============================================================ */

/**
 * Base reactive controller contract.
 *
 * Defines how state can be mutated.
 * Does NOT define how state is stored.
 */
export interface UniRBaseController<T> {
  /**
   * Modify the current state using a function.
   *
   * Examples:
   * - Angular: signal.update(fn)
   * - React: setState(fn)
   * - Vue: ref.value = fn(ref.value)
   * - Solid: setter(fn)
   * - RxJS: subject.next(fn(prev))
   */
  modify(fn: (current: T | undefined) => T): void;

  /**
   * Directly replace the current state.
   */
  set(value: T): void;
}

/* ============================================================
 * FROM / LOCAL CONTROLLER
 * ============================================================ */

/**
 * UniRControllerInterface
 *
 * Represents a local, owned reactive state.
 * Created via `adapter.from()`.
 *
 * Conceptual mapping:
 * - Angular: signal()
 * - React: useState()
 * - Vue: ref()
 * - Solid: createSignal()
 * - RxJS: BehaviorSubject
 *
 * @example
 * ```ts
 * const count = adapter.from(0)
 * count.modify(v => v + 1)
 * count.set(10)
 * console.log(count.value)
 * ```
 */
export interface UniRControllerInterface<T, ReactiveType, StatusType>
  extends UniRBaseController<T> {
  /**
   * Framework-native reactive primitive.
   *
   * INTERNAL — adapter-only.
   *
   * Examples:
   * - Angular: WritableSignal<T>
   * - React: [State<T>, Dispatch<T>]
   * - Vue: Ref<T>
   * - RxJS: BehaviorSubject<T>
   */
  reactive: ReactiveType;

  /**
   * Read-only reactive state exposed to consumers.
   *
   * Examples:
   * - Angular:  Signal<T> as readonly
   * - React: State<T>
   * - Vue: ComputedRef<T>
   * - Solid: Accessor<T>
   * - RxJS: Observable<T>
   */
  value: StatusType;
}

/* ============================================================
 * DERIVED / SOURCE CONTROLLER
 * ============================================================ */

/**
 * UniRDerivedControllerInterface
 *
 * Represents a derived or source-driven reactive state.
 * Created via `adapter.deriveFrom()`.
 *
 * Conceptual mapping:
 * - Angular: resource()
 * - React: use(promise), query libs
 * - Vue: async computed / watchEffect
 * - Solid: createResource()
 * - RxJS: from(promise), switchMap
 *
 * @example
 * ```ts
 * const user = adapter.asyncFrom({
 *   query: '/user',
 *   loader: fetchUser(),
 *   defaultValue: null
 * })
 *
 * user.refresh()
 * console.log(user.value, user.status, user.error)
 * ```
 */
export interface UniRAsyncControllerInterface<
  T,
  AsyncReactuveType,
  ValueType,
  StatusReactiveType,
  ErrorReactiveType,
  StatusValueType,
  ErrorValueType
> extends UniRBaseController<T> {
  /** Internal reactive primitive for the value */
  reactive: AsyncReactuveType;

  /** Read-only derived state */
  value: ValueType;

  /**
   * INTERNAL reactive status primitive.
   * Adapter-controlled.
   */
  statusReactive: StatusReactiveType;

  /**
   * INTERNAL reactive error primitive.
   * Adapter-controlled.
   */
  errorReactive: ErrorReactiveType;

  /** Read-only status */
  status: StatusValueType;


  /** Read-only error */
  error: ErrorValueType;

  /** Re-trigger source resolution */
  refresh(): boolean;

  /** Manually update status */
  setStatus(status: StatusType): void;

  /** Manually set or clear error */
  setError(error: ErrorType | null): void;
}

/* ============================================================
 * ADAPTER INTERFACE
 * ============================================================ */

/**
 * UniRAdapterInterface
 *
 * Entry point for integrating a framework with uniReactive.
 *
 * Adapters translate framework-native reactive APIs
 * into this unified model.
 *
 * @example
 * ```ts
 * const adapter = new UniRAngular()
 *
 * const count = adapter.from(0)
 * const doubled = adapter.computed(() => count.value * 2)
 *
 * adapter.effect(() => {
 *   console.log(count.value)
 * })
 * ```
 */
export interface UniRAdapterInterface {
  /** Create a local reactive state */
  from<T>(initialValue: T): UniRControllerInterface<T, unknown, unknown>;

  /** Create a derived/source-based reactive state */
  fromAsync<T, P>(
    loader: (params?: P) => Promise<T>,
    reactiveParams?: unknown,
    defaultValue?: T,
    ...deps: any
  ): UniRAsyncControllerInterface<T, unknown, unknown, unknown, unknown, unknown, unknown>;

  /** Create a computed/derived reactive value */
  computed<T>(compute: () => T, ...deps: any[]): T;

  /** Register a reactive side-effect */
  effect(fn: () => void, ...deps: any[]): void;
}
