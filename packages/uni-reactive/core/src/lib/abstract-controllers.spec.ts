import {
  AbstractBaseController,
  AbstractController,
  AbstractAsyncController,
} from './abstract-controllers';
import { StatusType, ErrorType } from './types.js';

describe('AbstractBaseController', () => {
  class TestController extends AbstractBaseController<number> {
    private _v = 0;
    protected set(value: number): void {
      this._v = value;
    }
    protected update(fn: (current: number) => number): void {
      this._v = fn(this._v);
    }
    get value(): number {
      return this._v;
    }
  }

  let ctrl: TestController;
  beforeEach(() => {
    ctrl = new TestController();
  });

  it('applies updater function', () => {
    ctrl.modify(v => (v ?? 0) + 5);
    expect((ctrl as any).value).toBe(5);
  });

  it('sets direct value', () => {
    ctrl.modify(42);
    expect((ctrl as any).value).toBe(42);
  });
});

describe('AbstractController subclass', () => {
  class LocalController extends AbstractController<string, string, string> {
    reactive!: string;
    value!: string;
    protected set(value: string): void {
      this.reactive = value;
      this.value = value;
    }
    protected update(fn: (current: string) => string): void {
      this.set(fn(this.reactive));
    }
  }

  it('inherits modify behaviour', () => {
    const ctl = new LocalController();
    ctl.modify('hello');
    expect(ctl.value).toBe('hello');
    ctl.modify(v => v + ' world');
    expect(ctl.value).toBe('hello world');
  });
});

// we don't test the async controller fully since its contract is large;
// ensure it compiles by subclassing with stubbed members

describe('AbstractAsyncController subclass', () => {
  class AsyncCtrl extends AbstractAsyncController<
    boolean,
    unknown,
    boolean,
    unknown,
    unknown,
    unknown,
    unknown
  > {
    reactive!: unknown;
    value!: boolean;
    statusReactive!: unknown;
    errorReactive!: unknown;
    status!: unknown;
    error!: unknown;
    refresh() {
      return false;
    }
    setStatus(status: StatusType): void {}
    setError(error: ErrorType | null): void {}
    protected set(value: boolean): void {
      this.value = value;
    }
    protected update(fn: (current: boolean) => boolean): void {
      this.value = fn(this.value);
    }
  }

  it('provides modify from base', () => {
    const a = new AsyncCtrl();
    a.modify(true);
    expect(a.value).toBe(true);
  });
});
