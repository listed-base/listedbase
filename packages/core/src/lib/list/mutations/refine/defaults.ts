import { MutationIntent } from '../index';

export type MutationOpName = 'create' | 'update' | 'delete' | 'upsert';

export const DEFAULT_INTENTS: Record<MutationOpName, MutationIntent> = {
  create: 'entity',
  update: 'entity',
  delete: 'confirm',
  upsert: 'entity',
};
