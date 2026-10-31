import { ZodObject } from 'zod/v4';
import { LInfer } from '../infers';
import { CreateOp } from './mutations/create/create.types';
import { UpdateOp } from './mutations/update/update.types';
import { DeleteOp } from './mutations/delete/delete.types';
import { UpsertOp } from './mutations/upsert/upsert.types';
import { UpdateManyOp } from './mutations/update-many/update-many.types';
import { DeleteManyOp } from './mutations/delete-many/delete-many.types';

export interface LList<S extends ZodObject<any>> {
  items: LInfer<S>['base'][];
  create: CreateOp<S>;
  update: UpdateOp<S>;
  delete: DeleteOp<S>;
  upsert: UpsertOp<S>;
  updateMany: UpdateManyOp<S>;
  deleteMany: DeleteManyOp<S>;
}
