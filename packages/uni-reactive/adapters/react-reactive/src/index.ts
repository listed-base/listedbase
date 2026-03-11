

import { IReactive, ReactiveFactory } from '@listedbase/uni-reactive';
import { useState } from 'react';
declare module '@listedbase/uni-reactive' {

  interface ReactiveTypeMap<T> {
    react: T
  }

  interface RegisteredReactiveAdapters {
    react: true
  }


}


class ReactReactive<T> implements IReactive<T> {

  private state = useState<T>()


  init(initial: T) {
    this.state[1](initial) ;
  }
  get value() {
    return this.state[0] as T
  }

  modify(next: (prev: T) => T) {
    this.state[1](prev => next(prev as T))
  }

}


export const reactReactive: ReactiveFactory = () => new ReactReactive();

