import { uniReactive } from '@listedbase/uni-reactive';
import { LFilterInput, LReactiveFilterType } from './types';

const reactive = uniReactive.get();

export const lFilter = <T>(
  initial: LFilterInput<T>,
): LReactiveFilterType<T> => {
  const filter = reactive.from<LFilterInput<T>>(initial);
  return filter;
};
