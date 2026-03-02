import { TypedContainer } from '@inversifyjs/strongly-typed';
import { Container } from 'inversify';
import { UniRAdapterInterface } from './lib/types.js';


export * from './lib/types.js';
export * from './lib/abstract-controllers.js';

export * from './lib/from.js';

export const container = new TypedContainer<UniRAdapterInterface>()
export const  REACTIVE_ADAPTER  = Symbol.for('UniRAdapterInterface');
