/* ============================================================
 * AngularAdapter — uniReactive
 * ============================================================
 *
 * Angular implementation of UniRAdapterInterface.
 *
 * Reactive primitives used:
 * - Local state   → signal()
 * - Derived state → resource()
 * - State view    → Signal<T>
 */

import {
  signal,
  Signal,
  WritableSignal,
  effect,
  resource,
  ResourceRef,
  Injector,
  computed,
  linkedSignal,
  ValueEqualityFn,
} from '@angular/core';

import {
  UniRAdapterInterface,
  UniRControllerInterface,
  StatusType,
  ErrorType,
  AbstractController,
  AbstractAsyncController,
} from '@listedbase/uni-reactive';

/* ============================================================
 * FROM / LOCAL CONTROLLER
 * ============================================================ */
class AngularFromController<T> extends AbstractController<
  T,
  WritableSignal<T>,
  Signal<T>
> {
  /** Writable Angular signal (internal) */
  reactive: WritableSignal<T>;

  /** Read-only signal exposed to consumers */
  value: Signal<T>;

  constructor(initialValue: T) {
    super();
    this.reactive = signal(initialValue);
    this.value = this.reactive.asReadonly();
  }

  protected set(value: T): void {
    this.reactive.set(value);
  }

  protected update(fn: (current: T) => T): void {
    this.reactive.update(fn);
  }
}

class AngularLinkedController<T> extends AbstractController<
  T,
  WritableSignal<T>,
  Signal<T>
> {
  /** Angular linked signal (internal) */
  reactive: WritableSignal<T>;

  /** Read-only signal exposed to consumers */
  value: Signal<T>;

  constructor(
    compute: () => T,
    options?:
      | {
          equal?: ValueEqualityFn<NoInfer<T>> | undefined;
          debugName?: string;
        }
      | undefined,
  ) {
    super();
    this.reactive = linkedSignal(compute, options);
    this.value = this.reactive.asReadonly();
  }

  protected set(value: T): void {
    this.reactive.set(value);
  }

  protected update(fn: (current: T) => T): void {
    this.reactive.update(fn);
  }
}

/* ============================================================
 * DERIVED / SOURCE CONTROLLER
 * ============================================================ */

class AngularAsyncController<T, P> extends AbstractAsyncController<
  T,
  ResourceRef<T | undefined>,
  Signal<T | undefined>,
  WritableSignal<StatusType>,
  WritableSignal<ErrorType | null>,
  Signal<StatusType>,
  Signal<ErrorType | null>
> {
  /** Angular resource primitive */
  reactive: ResourceRef<T | undefined>;

  /** Read-only derived state */
  value: Signal<T | undefined>;

  /** Internal reactive status */
  statusReactive: WritableSignal<StatusType>;

  /** Internal reactive error */
  errorReactive: WritableSignal<ErrorType | null>;

  /** Read-only status */
  status: Signal<StatusType>;

  /** Read-only error */
  error: Signal<ErrorType | null>;

  constructor(
    public loader: (params?: P) => Promise<T>,
    public params?: Signal<P>,
    public defaultValue?: T,
    ...deps: any
  ) {
    super();
    this.statusReactive = signal<StatusType>('idle');
    this.errorReactive = signal<ErrorType | null>(null);

    this.status = this.statusReactive.asReadonly();
    this.error = this.errorReactive.asReadonly();

    this.reactive = resource({
      params: () => ({ q: this.params?.() }),
      loader: ({ params }) => this.loader(params.q),
      defaultValue: this.defaultValue,
    });

    this.value = this.reactive.asReadonly().value;
  }

  protected set(value: T): void {
    this.reactive.set(value);
  }

  protected update(fn: (current: T | undefined) => T): void {
    this.reactive.update(fn);
  }

  refresh() {
    this.statusReactive.set('loading');
    return this.reactive.reload();
  }

  setStatus(status: StatusType): void {
    this.statusReactive.set(status);
  }

  setError(error: ErrorType | null): void {
    this.errorReactive.set(error);
  }

}

/* ============================================================
 * ANGULAR ADAPTER
 * ============================================================ */

/**
 * AngularAdapter
 *
 * Maps Angular reactive primitives to uniReactive interfaces.
 */

export class UinRAngular implements UniRAdapterInterface {
  constructor(private injector: Injector) {}

  from<T>(initialValue: T) {
    return new AngularFromController(initialValue);
  }

  fromAsync<T, P>(
    loader: (params?: P) => Promise<T>,
    params?: Signal<P>,
    defaultValue?: T,
  ) {
    return new AngularAsyncController<T, P>(
      loader,
      params,
      defaultValue,
      this.injector,
    );
  }

  linked<T>(
    compute: () => T,
    ...deps: any[]
  ): UniRControllerInterface<T, Signal<T>> {
    return new AngularLinkedController<T>(compute, ...deps);
  }
  derived<T>(compute: () => T): Signal<T> {
    return computed(compute);
  }

  effect(fn: () => void): void {
    effect(fn, { injector: this.injector });
  }
}
