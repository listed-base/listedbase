import { ZodObject } from 'zod/v4';
import { LQueryRef } from '../query/query';
import { createListContext } from './context';
import { LList } from './api';
import { createOp } from './mutations/create/create.op';
import { updateOp } from './mutations/update/update.op';
import { deleteOp } from './mutations/delete/delete.op';
import { upsertOp } from './mutations/upsert/upsert.op';
import { updateManyOp } from './mutations/update-many/update-many.op';
import { deleteManyOp } from './mutations/delete-many/delete-many.op';

export { LCodec } from './codec';

export function list<S extends ZodObject<any>>(query: LQueryRef<S>): LList<S> {
  const ctx = createListContext(query.schema);

  return {
    items: [],
    create: createOp(ctx),
    update: updateOp(ctx),
    delete: deleteOp(ctx),
    upsert: upsertOp(ctx),
    updateMany: updateManyOp(ctx),
    deleteMany: deleteManyOp(ctx),
  };
}
