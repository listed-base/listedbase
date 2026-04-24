import { LDriver } from '@listedbase/driver-abstract';
export class LFirestore extends LDriver {
  constructor(config: any) {
    super();
  }
  protected override async _init(schemas: any): Promise<void> {
    console.log(schemas);
  }
}

export function lFirestore(config: any): LDriver {
  return new LFirestore(config);
}
