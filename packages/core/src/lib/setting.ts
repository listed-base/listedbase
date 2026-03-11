import { TypedContainer } from '@inversifyjs/strongly-typed';
import { ServiceIdentifier } from 'inversify';



interface ISetting {
  reactive: IReactive;
}

export const REACTIVE:  ServiceIdentifier<IReactive> = Symbol.for('IReactive');




export const lSetting = new TypedContainer<ISetting>();


const r =  lSetting.get("reactive");