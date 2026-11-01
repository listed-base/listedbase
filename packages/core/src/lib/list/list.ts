import { ZodObject } from 'zod/v4';
import { createListContext } from './context';
import { LList } from './api';
import { createOp } from './mutations/create/create.op';
import { updateOp } from './mutations/update/update.op';
import { deleteOp } from './mutations/delete/delete.op';
import { upsertOp } from './mutations/upsert/upsert.op';
import { updateManyOp } from './mutations/update-many/update-many.op';
import { deleteManyOp } from './mutations/delete-many/delete-many.op';

export { LCodec } from './codec';
export type { LList } from './api';
export type { LListContext } from './context';

export function list<S extends ZodObject<any>>(schema: S): LList<S> {
  const ctx = createListContext(schema);

  return { 
    items: [],
    create: createOp(ctx),
    update: updateOp(ctx),
    delete: deleteOp(ctx),
    upsert: upsertOp(ctx),
    updateMany: updateManyOp(ctx),
    deleteMany: deleteManyOp(ctx),
    context: ctx,
  };
}
