

import { ref, Ref } from 'vue';
import { IReactive, ReactiveFactory } from '@listedbase/uni-reactive';
declare module '@listedbase/uni-reactive' {

  interface ReactiveTypeMap<T> {
    vue: T
  }

  interface RegisteredReactiveAdapters {
    vue: true
  }


}

const re = ref(0)

class VueReactive<T> implements IReactive<T> {

  private state = ref() as Ref<T>;


  init(initial: T) {
    this.state.value = initial ;
  }
  get value() {
    return this.state.value
  }

  modify(next: (prev: T) => T) {
    this.state.value = next(this.state.value)
  }

}


export const vueReactive: ReactiveFactory = () => new VueReactive();

