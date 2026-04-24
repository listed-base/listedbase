import { LDriver } from './lib/abstract';

export * from './lib/abstract';

let regitredDriver: LDriver;
export function registerDriver(driver: LDriver) {
  regitredDriver = driver;
}

export function getDriver(): LDriver {
  if (!regitredDriver) throw new Error('No driver registered');
  return regitredDriver;
}
