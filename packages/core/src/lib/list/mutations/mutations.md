# Mutations

ListedBase provides a type-safe mutation API for creating, updating, upserting, and deleting records. Every mutation accepts an optional `refine` parameter for precise control over the return shape.

---

## Setup

```ts
import { list } from 'listed-base'
import { postSchema } from './schema'

const posts = list(postSchema)
```

---

## Methods

| Method | Description |
|--------|-------------|
| [`create`](#create) | Create a single record |
| [`createBulk`](#createbulk) | Create multiple records |
| [`update`](#update) | Update a record by unique key |
| [`updateFirst`](#updatefirst) | Update the first matching record |
| [`updateMany`](#updatemany) | Update multiple matching records |
| [`updateBulk`](#updatebulk) | Update multiple records by unique keys |
| [`upsert`](#upsert) | Insert or update a record |
| [`upsertBulk`](#upsertbulk) | Insert or update multiple records |
| [`delete`](#delete) | Delete a record by unique key |
| [`deleteFirst`](#deletefirst) | Delete the first matching record |
| [`deleteMany`](#deletemany) | Delete multiple matching records |
| [`deleteBulk`](#deletebulk) | Delete multiple records by unique keys |

---

## create

Creates a single record.

```ts
posts.create(opts)
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `input` | `CreateInput` | ✅ | Record data |
| `refine` | `CreateRefine` | ❌ | Return shape options |

### Return

| Intent | Type |
|--------|------|
| _(default)_ | `{ id, createdAt }` — generated fields only |
| `'confirm'` | `boolean` |
| `'id'` | `IdType` |
| `'entity'` | `Full Entity` |
| `'fullSelect'` | `BaseFields & Entity` |

### Examples

```ts
// Default — generated fields only
await posts.create({ input: { title: 'Getting Started', published: false } })
// => { id: '1', createdAt: 2024-01-01 }

// Full entity after creation
await posts.create(
  { input: { title: 'Getting Started', published: false } },
  { intent: 'entity' },
)
// => { id: '1', title: 'Getting Started', published: false, ... }

// ID only
await posts.create(
  { input: { title: 'Getting Started', published: false } },
  { intent: 'id' },
)
// => '1'
```

### Use Cases

```ts
// Optimistic UI — redirect after creation
const { id } = await posts.create(
  { input: { title: 'Draft Post' } },
  { intent: 'entity' },
)
router.push(`/posts/${id}`)

// Background job — confirm only
const ok = await posts.create(
  { input: { title: 'Scheduled Post' } },
  { intent: 'confirm' },
)
if (!ok) retry()
```

---

## createBulk

Creates multiple records in a single operation.

```ts
posts.createBulk(opts)
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `entities` | `CreateInput[]` | ✅ | Array of records |
| `refine` | `CreateGroupRefine` | ❌ | Return shape options |

### Return

| Intent | Type |
|--------|------|
| _(default)_ | `{ id, createdAt }[]` |
| `'confirm'` | `boolean` |
| `'count'` | `number` |
| `'ids'` | `IdType[]` |
| `'entity'` | `Entity[]` |
| `'settled'` | `SettledItem[]` |

### Examples

```ts
// IDs only
await posts.createBulk({
  entities: [
    { title: 'Post One', published: false },
    { title: 'Post Two', published: false },
  ],
  refine: { intent: 'ids' },
})
// => ['1', '2']

// Partial success
await posts.createBulk({
  entities: [
    { title: 'Post One' },
    { title: 'Post One' }, // duplicate
  ],
  refine: { intent: 'settled' },
})
// => [
//   { status: 'fulfilled', data: { id: '1', createdAt: ... } },
//   { status: 'rejected',  error: { code: 'DB/DUPLICATE', ... } },
// ]
```

### Use Cases

```ts
// Seeding — get all IDs after insert
const ids = await posts.createBulk({ entities: seedData, refine: { intent: 'ids' } })
await cache.set('post-ids', ids)

// Import — handle partial failures
const results = await posts.createBulk({ entities: importedData, refine: { intent: 'settled' } })
const failed  = results.filter(r => r.status === 'rejected')
const created = results.filter(r => r.status === 'fulfilled')
report({ created: created.length, failed: failed.length })
```

---

## update

Updates a single record by unique key.

```ts
posts.update(opts)
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `where` | `UniqueInput` | ✅ | Unique identifier |
| `input` | `UpdateInput` | ✅ | Fields to update |
| `refine` | `UpdateRefine` | ❌ | Return shape options |

### Return

| Intent | Type |
|--------|------|
| _(default)_ | `Partial<Input>` — changed fields |
| `'confirm'` | `boolean` |
| `'patch'` | `Partial<Input>` |
| `'entity'` | `Full Entity` |
| `'fullSelect'` | `BaseFields & Entity` |
| `'diff'` | `{ before: Entity, after: Entity }` |

### Examples

```ts
// Default — changed fields
await posts.update({ where: { no: 1 }, input: { published: true } })
// => { published: true }

// Full entity after update
await posts.update(
  { where: { no: 1 }, input: { published: true } },
  { intent: 'entity' },
)
// => { id: '1', no: 1, title: 'Getting Started', published: true, ... }

// Before and after snapshot
await posts.update(
  { where: { no: 1 }, input: { published: true } },
  { intent: 'diff' },
)
// => {
//   before: { id: '1', published: false, ... },
//   after:  { id: '1', published: true,  ... },
// }

// Custom field selection
await posts.update(
  { where: { no: 1 }, input: { published: true } },
  { intent: 'fullSelect', select: { pick: ['title', 'published'] } },
)
// => { id: '1', no: 1, title: 'Getting Started', published: true }
```

### Use Cases

```ts
// Sync UI state after update
const updated = await posts.update(
  { where: { no: 1 }, input: { published: true } },
  { intent: 'entity' },
)
store.update(updated)

// Audit log
const diff = await posts.update(
  { where: { no: 1 }, input: { title: 'New Title' } },
  { intent: 'diff' },
)
auditLog.record({ entity: 'post', diff })

// Undo stack
const diff = await posts.update(
  { where: { no: 1 }, input: { published: true } },
  { intent: 'diff' },
)
undoStack.push({ restore: diff.before })
```

---

## updateFirst

Updates the first record matching a filter.

```ts
posts.updateFirst(opts)
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `where` | `WhereInput` | ✅ | Filter condition |
| `sort` | `SortInput` | ❌ | Sort order |
| `take` | `number` | ❌ | Fetch N then update first |
| `input` | `UpdateInput` | ✅ | Fields to update |
| `refine` | `UpdateRefine` | ❌ | Return shape options |

### Examples

```ts
await posts.updateFirst({
  where:  { published: false },
  sort:   { createdAt: 'asc' },
  input:  { published: true },
  refine: { intent: 'entity' },
})
// => { id: '1', title: 'Getting Started', published: true, ... }
```

### Use Cases

```ts
// Queue processing — update next pending item
const next = await posts.updateFirst({
  where:  { status: 'pending' },
  sort:   { createdAt: 'asc' },
  input:  { status: 'processing' },
  refine: { intent: 'entity' },
})
await processPost(next)
```

---

## updateMany

Updates multiple records matching a filter.

```ts
posts.updateMany(opts)
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `where` | `WhereInput` | ✅ | Filter — `{}` updates all |
| `sort` | `SortInput` | ❌ | Sort order |
| `take` | `number` | ❌ | Limit updated records |
| `input` | `UpdateInput` | ✅ | Fields to update |
| `refine` | `UpdateGroupRefine` | ❌ | Return shape options |

### Return

| Intent | Type |
|--------|------|
| _(default)_ | `(BaseFields & Partial<Input>)[]` |
| `'confirm'` | `boolean` |
| `'count'` | `number` |
| `'ids'` | `IdType[]` |
| `'entity'` | `Entity[]` |
| `'diff'` | `{ before, after }[]` |
| `'settled'` | `SettledItem[]` |

### Examples

```ts
// Count only
await posts.updateMany(
  { where: { published: false }, input: { published: true } },
  { intent: 'count' },
)
// => 3

// With count and ids
await posts.updateMany(
  { where: { published: false }, input: { published: true } },
  { intent: 'entity', count: true, ids: true },
)
// => {
//   entities: [{ id: '1', ... }, { id: '2', ... }],
//   count:    2,
//   ids:      ['1', '2'],
// }
```

### Use Cases

```ts
// Cache invalidation
const ids = await posts.updateMany(
  { where: { categoryId: '5' }, input: { featured: true } },
  { intent: 'ids' },
)
await cache.invalidate(ids)

// Batch publish with audit
const diffs = await posts.updateMany(
  { where: { published: false }, input: { published: true } },
  { intent: 'diff' },
)
await auditLog.recordMany(diffs)
```

---

## updateBulk

Updates multiple records by unique keys, each with its own input.

```ts
posts.updateBulk(opts)
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `entities` | `{ where: UniqueInput, input: UpdateInput }[]` | ✅ | Records to update |
| `refine` | `UpdateGroupRefine` | ❌ | Applied to all records |

### Examples

```ts
await posts.updateBulk({
  entities: [
    { where: { no: 1 }, input: { paid: true  } },
    { where: { no: 2 }, input: { paid: false } },
  ],
})
// => [{ id: '1', no: 1, paid: true }, { id: '2', no: 2, paid: false }]

// Partial failure
await posts.updateBulk({
  entities: [...],
  refine:   { intent: 'settled' },
})
// => [
//   { status: 'fulfilled', data: { id: '1', paid: true  } },
//   { status: 'rejected',  error: { code: 'DB/CONSTRAINT', ... } },
// ]
```

### Use Cases

```ts
// Reorder items
await posts.updateBulk({
  entities: reorderedItems.map((item, index) => ({
    where: { no: item.no },
    input: { position: index },
  })),
  refine: { intent: 'confirm' },
})

// Bulk price update with error reporting
const results = await posts.updateBulk({
  entities: priceUpdates,
  refine:   { intent: 'settled' },
})
const errors = results.filter(r => r.status === 'rejected').map(r => r.error)
reportErrors(errors)
```

---

## upsert

Inserts a record if it doesn't exist, updates it if it does.

```ts
posts.upsert(opts)
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `onConflict` | `keyof UniqueFields` | ❌ | Conflict target — default: `idField` |
| `input` | `UpsertInput` | ✅ | Record data |
| `refine` | `UpsertRefine` | ❌ | Return shape options |

### Return

| Intent | Type |
|--------|------|
| _(default)_ | `Partial<Input>` — no $action |
| `'confirm'` | `boolean` |
| `'action'` | `'created' \| 'updated'` |
| `'id'` | `IdType` |
| `'patch'` | `Partial<Input> & { $action }` |
| `'entity'` | `Entity & { $action }` |
| `'diff'` | `{ before?: Entity, after: Entity, $action }` |

### Examples

```ts
// Default — no $action
await posts.upsert({ input: { no: 1, title: 'Getting Started' } })
// => { no: 1, title: 'Getting Started' }

// Know what happened
await posts.upsert(
  { input: { no: 1, title: 'Getting Started' } },
  { intent: 'action' },
)
// => 'created' | 'updated'

// Diff — before is undefined on create
await posts.upsert(
  { input: { no: 1, title: 'Getting Started' } },
  { intent: 'diff' },
)
// => { before?: undefined, after: { id: '1', ... }, $action: 'created' }

// Custom conflict target
await posts.upsert({
  onConflict: 'no',
  input:      { no: 1, title: 'Updated Title' },
})
```

### Use Cases

```ts
// Sync external data — track changes
const result = await posts.upsert(
  { onConflict: 'externalId', input: externalPost },
  { intent: 'diff' },
)
if (result.$action === 'updated') changelog.record(result)

// Idempotent operations
const { $action } = await posts.upsert(
  { input: { no: 1, title: 'Getting Started' } },
  { intent: 'patch' },
)
metrics.track($action)
```

---

## upsertBulk

Inserts or updates multiple records in a single operation.

```ts
posts.upsertBulk(opts)
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `onConflict` | `keyof UniqueFields` | ❌ | Conflict target — default: `idField` |
| `entities` | `UpsertInput[]` | ✅ | Records to upsert |
| `refine` | `UpsertGroupRefine` | ❌ | Applied to all records |

### Return

| Intent | Type |
|--------|------|
| _(default)_ | `Partial<Input>[]` |
| `'confirm'` | `boolean` |
| `'count'` | `number` |
| `'ids'` | `IdType[]` |
| `'actions'` | `{ id, $action }[]` |
| `'entity'` | `Entity[]` |
| `'settled'` | `SettledItem[]` |

### Examples

```ts
// Track created vs updated
await posts.upsertBulk({
  entities: syncData,
  refine:   { intent: 'actions' },
})
// => [
//   { id: '1', $action: 'created' },
//   { id: '2', $action: 'updated' },
// ]
```

### Use Cases

```ts
// Data sync — report changes
const actions = await posts.upsertBulk({
  onConflict: 'externalId',
  entities:   externalFeed,
  refine:     { intent: 'actions' },
})
const created = actions.filter(a => a.$action === 'created').length
const updated = actions.filter(a => a.$action === 'updated').length
syncLog.record({ created, updated })

// Idempotent seed — safe to run multiple times
await posts.upsertBulk({
  onConflict: 'no',
  entities:   seedData,
  refine:     { intent: 'confirm' },
})
```

---

## delete

Deletes a single record by unique key.

```ts
posts.delete(opts)
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `where` | `UniqueInput` | ✅ | Unique identifier |
| `refine` | `DeleteRefine` | ❌ | Return shape options |

### Return

| Intent | Type |
|--------|------|
| _(default)_ | `boolean` |
| `'confirm'` | `boolean` |
| `'id'` | `IdType` |
| `'entity'` | `Full Entity` |
| `'before'` | `Entity before delete` |

### Examples

```ts
// Default
await posts.delete({ where: { no: 1 } })
// => true

// Entity before deletion
await posts.delete(
  { where: { no: 1 } },
  { intent: 'before' },
)
// => { id: '1', no: 1, title: 'Getting Started', ... }

// Select specific fields before deletion
await posts.delete(
  { where: { no: 1 } },
  { intent: 'before', select: { pick: ['title', 'createdAt'] } },
)
// => { title: 'Getting Started', createdAt: 2024-01-01 }
```

### Use Cases

```ts
// Undo — save before delete
const snapshot = await posts.delete(
  { where: { no: 1 } },
  { intent: 'before' },
)
undoStack.push({ restore: snapshot })

// Cascade cleanup
const id = await posts.delete(
  { where: { no: 1 } },
  { intent: 'id' },
)
await comments.deleteMany({ where: { postId: id } })
```

---

## deleteFirst

Deletes the first record matching a filter.

```ts
posts.deleteFirst(opts)
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `where` | `WhereInput` | ✅ | Filter condition |
| `sort` | `SortInput` | ❌ | Sort order |
| `take` | `number` | ❌ | Fetch N then delete first |
| `refine` | `DeleteRefine` | ❌ | Return shape options |

### Examples

```ts
await posts.deleteFirst({
  where:  { expired: true },
  sort:   { createdAt: 'asc' },
  refine: { intent: 'confirm' },
})
// => true
```

### Use Cases

```ts
// TTL cleanup — delete oldest expired session
await sessions.deleteFirst({
  where: { expired: true },
  sort:  { expiresAt: 'asc' },
})
```

---

## deleteMany

Deletes multiple records matching a filter.

```ts
posts.deleteMany(opts)
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `where` | `WhereInput` | ✅ | Filter — `{}` deletes all |
| `sort` | `SortInput` | ❌ | Sort order |
| `take` | `number` | ❌ | Limit deleted records |
| `refine` | `DeleteGroupRefine` | ❌ | Return shape options |

### Return

| Intent | Type |
|--------|------|
| _(default)_ | `boolean[]` |
| `'confirm'` | `boolean` |
| `'count'` | `number` |
| `'ids'` | `IdType[]` |
| `'before'` | `Entity[]` before delete |
| `'settled'` | `SettledItem[]` |

### Examples

```ts
// Count deleted
await posts.deleteMany(
  { where: { published: false } },
  { intent: 'count' },
)
// => 5

// Archive before delete
const snapshots = await posts.deleteMany(
  { where: { expired: true } },
  { intent: 'before' },
)
await archive.saveMany(snapshots)
```

### Use Cases

```ts
// GDPR — delete all user data
const count = await userPosts.deleteMany(
  { where: { userId: '123' } },
  { intent: 'count' },
)
gdprLog.record({ userId: '123', deletedCount: count })
```

---

## deleteBulk

Deletes multiple records by unique keys.

```ts
posts.deleteBulk(opts)
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `entities` | `UniqueInput[]` | ✅ | Records to delete |
| `refine` | `DeleteGroupRefine` | ❌ | Applied to all records |

### Examples

```ts
// Selection-based delete
await posts.deleteBulk({
  entities: selectedIds.map(id => ({ id })),
  refine:   { intent: 'confirm' },
})

// Partial failure
await posts.deleteBulk({
  entities: [{ no: 1 }, { no: 999 }],
  refine:   { intent: 'settled' },
})
// => [
//   { status: 'fulfilled', data: { id: '1' } },
//   { status: 'rejected',  error: { code: 'DB/NOT_FOUND', ... } },
// ]
```

### Use Cases

```ts
// Selection-based delete — user selects items to remove
const selectedIds = ['1', '2', '3']
await posts.deleteBulk({
  entities: selectedIds.map(id => ({ id })),
  refine:   { intent: 'confirm' },
})
```

---

## Error Handling

### throw — default

```ts
try {
  await posts.update({ where: { no: 999 }, input: { paid: true } })
} catch (e) {
  e.code    // 'DB/NOT_FOUND'
  e.message // 'Record not found'
}
```

### returned

```ts
const result = await posts.update(
  { where: { no: 1 }, input: { paid: true } },
  { errorMode: 'returned' },
)
if (result instanceof LError) console.error(result.code)
```

### group — rejectAll (default)

```ts
try {
  await posts.updateBulk({
    entities: [...],
    refine:   { errorMode: { throw: 'rejectAll' } },
  })
} catch (e) {
  e.code // 'DB/CONSTRAINT'
}
```

### group — settled

```ts
try {
  await posts.updateBulk({
    entities: [...],
    refine:   { errorMode: { throw: 'settled' } },
  })
} catch (e) {
  e.code // 'OP/PARTIAL_FAILURE'
  e.meta // { failed: [{ id, error }], succeeded: [{ id }] }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `DB/NOT_FOUND` | Record does not exist |
| `DB/CONSTRAINT` | Database constraint violation |
| `DB/DUPLICATE` | Unique value already exists |
| `DB/TIMEOUT` | Connection timed out |
| `VALIDATION/FIELD` | Invalid field value |
| `VALIDATION/REQUIRED` | Required field is missing |
| `VALIDATION/TYPE` | Wrong data type |
| `DRIVER/CONNECTION` | Connection error |
| `DRIVER/UNSUPPORTED` | Operation not supported by driver |
| `DRIVER/UNKNOWN` | Unknown driver error |
| `OP/PARTIAL_FAILURE` | Some records failed in bulk operation |
| `OP/FORBIDDEN` | Operation not permitted |
| `OP/INVALID` | Invalid operation |