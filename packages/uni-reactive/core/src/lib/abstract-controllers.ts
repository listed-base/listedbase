/* ============================================================
 * uniReactive — Abstract controller base classes
 * ============================================================
 *
 * Provides framework-agnostic helper classes that implement
 * common pieces of the controller interfaces.  Adapters can
 * extend these to avoid duplicating boilerplate (especially
 * the `modify`/`set`/`update` logic).
 *
 * NOTE: the core `types.ts` file continues to define interfaces
 * only; concrete helpers like these live here so the intent
 * remains clear.
 */

import {
  Updater,
  isUpdater,
  UniRBaseController,
  UniRControllerInterface,
  UniRAsyncControllerInterface,
  StatusType,
  ErrorType,
} from './types';

/**
 * Minimal base class implementing the `modify` helper.  Subclasses
 * simply need to provide primitives for updating and setting the
 * underlying value.
 */
export abstract class AbstractBaseController<T>
  implements UniRBaseController<T>
{
  modify(updater: Updater<T>): void {
    if (isUpdater(updater)) {
      this.update(updater);
    } else {
      this.set(updater);
    }
  }

  /**
   * Write a concrete value to the underlying reactive primitive.
   * Framework adapters must implement this.
   */
  protected abstract set(value: T): void;

  /**
   * Apply a function to the current value.  Framework adapters must
   * implement this as well (usually a simple `signal.update` or
   * similar).
   */
  protected abstract update(fn: (current: T | undefined) => T): void;
}

/**
 * Abstract base for a *local* controller created via `adapter.from()`.
 * The generic parameters mirror those from `UniRControllerInterface`.
 */
export abstract class AbstractController<T, ReactiveType, StatusType>
  extends AbstractBaseController<T>
  implements UniRControllerInterface<T, StatusType>
{
  protected abstract reactive: ReactiveType;
  abstract readonly value: StatusType;


}

/**
 * Abstract base for an async/derived controller created via
 * `adapter.fromAsync()`.  Again the generics mirror those in the
 * corresponding interface.
 */
export abstract class AbstractAsyncController<
    T,
    AsyncReactiveType,
    ValueType,
    StatusReactiveType,
    ErrorReactiveType,
    StatusValueType,
    ErrorValueType,
  >
  extends AbstractBaseController<T>
  implements
    UniRAsyncControllerInterface<
      T,
      ValueType,
      StatusValueType,
      ErrorValueType
    >
{
  protected abstract reactive: AsyncReactiveType;
  abstract readonly value: ValueType;

  protected abstract statusReactive: StatusReactiveType;
  protected abstract errorReactive: ErrorReactiveType;

  abstract readonly status: StatusValueType;
  abstract readonly error: ErrorValueType;


  abstract refresh(): boolean;
  abstract setStatus(status: StatusType): void;
  abstract setError(error: ErrorType | null): void;
}
