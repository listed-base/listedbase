import { LDriver, registerDriver } from '@listedbase/driver-abstract';
import {
  ReactiveFactory,
  registerReactive,
} from '@listedbase/uni-reactive';
export const lSetting = {
  reactive: (r: ReactiveFactory) => {
    registerReactive(r);
  },
  driver: (d: LDriver) => registerDriver(d)
};
