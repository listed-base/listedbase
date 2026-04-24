import { ZodObject } from 'zod/v4';

// ============================================================
// Update
// ============================================================

import { UpdateFn, UpdateFirstFn } from './update/single'
import { UpdateManyFn, UpdateBulkFn } from './update/group'

// ============================================================
// Create
// ============================================================

import { CreateFn } from './create/single'
import { CreateBulkFn } from './create/group'

// ============================================================
// Delete
// ============================================================

import { DeleteFn, DeleteFirstFn } from './delete/single'
import { DeleteManyFn, DeleteBulkFn } from './delete/group'

// ============================================================
// Upsert
// ============================================================

import { UpsertFn } from './upsert/single'
import { UpsertBulkFn } from './upsert/group'

// ============================================================
// MutationMethods
// ============================================================

export interface MutationMethods<S extends ZodObject<any>> {
  // update
  update:      UpdateFn<S>
  updateFirst: UpdateFirstFn<S>
  updateMany:  UpdateManyFn<S>
  updateBulk:  UpdateBulkFn<S>

  // create
  create:      CreateFn<S>
  createBulk:  CreateBulkFn<S>

  // delete
  delete:      DeleteFn<S>
  deleteFirst: DeleteFirstFn<S>
  deleteMany:  DeleteManyFn<S>
  deleteBulk:  DeleteBulkFn<S>

  // upsert
  upsert:      UpsertFn<S>
  upsertBulk:  UpsertBulkFn<S>
}

// ============================================================
// Re-exports
// ============================================================

// update
export type { UpdateFn, UpdateFirstFn }    from './update/single'
export type { UpdateManyFn, UpdateBulkFn } from './update/group'
export type {
  UpdateIntent,
  UpdateGroupIntent,
  UpdateErrorMode,
  UpdateGroupErrorMode,
  InferUpdateResult,
  InferUpdateGroupResult,
} from './update/result'

// create
export type { CreateFn }      from './create/single'
export type { CreateBulkFn }  from './create/group'
export type {
  CreateIntent,
  CreateGroupIntent,
  CreateErrorMode,
  CreateGroupErrorMode,
  InferCreateResult,
  InferCreateGroupResult,
} from './create/result'

// delete
export type { DeleteFn, DeleteFirstFn }    from './delete/single'
export type { DeleteManyFn, DeleteBulkFn } from './delete/group'
export type {
  DeleteIntent,
  DeleteGroupIntent,
  DeleteErrorMode,
  DeleteGroupErrorMode,
  InferDeleteResult,
  InferDeleteGroupResult,
} from './delete/result'

// upsert
export type { UpsertFn }      from './upsert/single'
export type { UpsertBulkFn }  from './upsert/group'
export type {
  UpsertIntent,
  UpsertGroupIntent,
  UpsertErrorMode,
  UpsertGroupErrorMode,
  UpsertAction,
  InferUpsertResult,
  InferUpsertGroupResult,
} from './upsert/result'

// helpers
export type { LError, LErrorCode } from '../helpers/error'
