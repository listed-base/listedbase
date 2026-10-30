import { LSourcesConfig, registerSources } from '@listedbase/driver-abstract';
import {
  ReactiveFactory,
  registerReactive,
} from '@listedbase/uni-reactive';

export const lSetting = {
  reactive: (r: ReactiveFactory) => {
    registerReactive(r);
  },
  sources: (config: LSourcesConfig) => {
    registerSources(config);
  },
};
