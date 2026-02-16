import { UniRAdapterInterface } from './types.js';


export function createUniReactive() {
  let adapter: UniRAdapterInterface | null = null;

  const uniReactive = (newAdapter: UniRAdapterInterface) => {
    if (adapter) {
      throw new Error('[UniRFactory] Adapter already registered');
    }
    adapter = newAdapter;
  };

  uniReactive.get = (): UniRAdapterInterface => {
    if (!adapter) {
      throw new Error('[UniRFactory] No adapter registered');
    }
    return adapter;
  };

  return uniReactive;
}

export const uniReactive = createUniReactive(); 

