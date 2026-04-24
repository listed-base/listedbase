import { indexeddbDriver } from './indexeddb-driver';

describe('indexeddbDriver', () => {
  it('should work', () => {
    expect(indexeddbDriver()).toEqual('indexeddb-driver');
  });
});
