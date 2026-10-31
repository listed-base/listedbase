import { LDriverCapabilities } from '@listedbase/driver-abstract';

export type MutationOpName = 'create' | 'update' | 'delete' | 'upsert';

export interface MutationPlan {
  id: 'driver' | 'core';
  timestamps: 'driver' | 'core';
  returning: 'driver' | 'core';
  before: 'driver' | 'core';
  batch: 'driver' | 'core';
  atomicity: 'driver' | 'unsupported';
  upsert: 'driver' | 'fallback' | 'unsupported';
}

export function planMutation(
  _op: MutationOpName,
  capabilities: LDriverCapabilities
): MutationPlan {
  return {
    id: capabilities.idGeneration ? 'driver' : 'core',
    timestamps: capabilities.timestampGeneration ? 'driver' : 'core',
    returning: capabilities.returning ? 'driver' : 'core',
    before: capabilities.returning ? 'driver' : 'core',
    batch: capabilities.batch ? 'driver' : 'core',
    atomicity: capabilities.transactions ? 'driver' : 'unsupported',
    upsert: capabilities.upsert ? 'driver' : 'unsupported',
  };
}
