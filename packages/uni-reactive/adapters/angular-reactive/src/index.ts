// angular-adapter/types.ts

import { Signal } from '@angular/core'
import { IReactive, ReactiveFactory } from '@listedbase/uni-reactive'

declare module '@listedbase/uni-reactive' {

  interface ReactiveTypeMap<T> {
    angular: Signal<T> 
  }

  interface RegisteredReactiveAdapters {
    angular: true
  }


}

// angular-adapter/angularReactive.ts

import { signal, WritableSignal } from '@angular/core'

class AngularReactive<T> implements IReactive<T> {

  private state!: WritableSignal<T>


  init(initial: T) {
    this.state = signal(initial);
  }
  get value(): Signal<T> {
    return this.state.asReadonly()
  }

  modify(next: (prev: T) => T) {
    this.state.update(next)
  }

}


export const angularReactive: ReactiveFactory = () => new AngularReactive();

