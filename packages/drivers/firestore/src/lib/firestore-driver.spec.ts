import { firestoreDriver } from './firestore-driver';

describe('firestoreDriver', () => {
  it('should work', () => {
    expect(firestoreDriver()).toEqual('firestore-driver');
  });
});
