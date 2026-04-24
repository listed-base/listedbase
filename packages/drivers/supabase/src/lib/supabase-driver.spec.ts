import { supabaseDriver } from './supabase-driver';

describe('supabaseDriver', () => {
  it('should work', () => {
    expect(supabaseDriver()).toEqual('supabase-driver');
  });
});
