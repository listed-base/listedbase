import { DefaultDuct } from './default';
import type { Duct } from './types';
function createDuct() {
  let duct: Duct = new DefaultDuct();

  const register = (d: Duct) => {
    if (duct) {
      throw new Error('Duct already registered');
    }
    duct = d;
  };

  register.get = (): Duct => {
    if (!duct) {
      throw new Error('Duct not registered');
    }
    return duct;
  };

  return register;
}

export const duct = createDuct();
