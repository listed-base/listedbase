# ListedBase — Type Inference Guide

> Complete reference for `inputs`, `filters`, `unique`, `where`, `sort`, and `refine`.

---

## Table of Contents

- [Schema Definition](#schema-definition)
- [Inputs](#inputs)
  - [Create Input](#create-input)
  - [Update Input](#update-input)
  - [Upsert Input](#upsert-input)
- [Filters](#filters)
  - [Unique Filter](#unique-filter)
  - [Where Filter](#where-filter)
  - [Sort Filter](#sort-filter)
- [Refine](#refine)
- [LInfer — Public API](#linfer--public-api)

---

## Schema Definition

```typescript
import { lSchema, lField } from '@listedbase/core';

export const sCategory = lSchema({
  name: 'categories',
  fields: {
    id:   lField.id.autouuid(),
    name: lField.string().unique(),
    slug: lField.string().unique(),
  },
});

export const sPost = lSchema({
  name: 'posts',
  fields: {
    id:          lField.id.autouuid(),
    title:       lField.string(),
    body:        lField.string(),
    no:          lField.number().unique(),
    published:   lField.boolean(),
    publishedAt: lField.string(),
    createdAt:   lField.now(),
    updatedAt:   lField.updatedAt(),
    category:    () => lField.oneFrom(sCategory),
    tags:        () => lField.manyFrom(sTag),
  },
});
```

> **Rules:**
> - Every schema **must** have at least one `id` field.
> - `autogen` fields (`id`, `createdAt`, `updatedAt`) are excluded from create/update inputs automatically.
> - Relations (`oneFrom`, `manyFrom`) are excluded from `pick`/`omit`/`pluck` and handled via `include`.

---

## Inputs

### Create Input

`$inferCreate` generates the input type for creating a new entry.

**Rules:**
- `autogen` fields (`autouuid`, `autoincrement`, `now`) are **optional** — they are auto-generated if omitted.
- `updatedAt` fields are **excluded** — managed internally.
- Relation fields accept `attach`, `create`, or `attachOrCreate`.

```typescript
import { LInfer, LCreateInput } from '@listedbase/core';

type Infers     = LInfer<typeof sPost>;
type CreatePost = LCreateInput<Infers>;

// Result:
type CreatePost = {
  title:       string;
  body:        string;
  no:          number;
  published:   boolean;
  publishedAt: string;
  id?:         string;         // optional — auto-generated
  createdAt?:  string;         // optional — auto-generated

  // oneFrom → ExactlyOne of attach | create | attachOrCreate
  category?: 
    | { attach: { id: string } | { name: string } | { slug: string } }
    | { create: { name: string; slug: string } }
    | { attachOrCreate: { attach: { id: string }; create: { name: string; slug: string } } };

  // manyFrom → RequireAtLeastOne, supports mixing attach + create
  tags?:
    | { attach: { id: string }[] }
    | { create: { name: string }[] }
    | { attach: { id: string }[]; create: { name: string }[] }
    | { attachOrCreate: { attach: { id: string }; create: { name: string } }[] };
};
```

**Usage:**

```typescript
const input: CreatePost = {
  title:     'Hello World',
  body:      'Content here',
  no:        1,
  published: false,
  publishedAt: '2024-01-01',

  category: {
    attach: { slug: 'typescript' },
  },

  tags: {
    attach: [{ id: 'tag-1' }],
    create: [{ name: 'new-tag' }],
  },
};
```

---

### Update Input

`$inferUpdate` generates the input type for updating an existing entry.

**Rules:**
- All base fields are **optional**.
- `updatedAt` fields are **excluded** — managed internally.
- Relations support additional operations: `update`, `upsert`, `detach`, `delete`.

```typescript
type UpdatePost = LUpdateInput<Infers>;

// Result:
type UpdatePost = {
  title?:       string;
  body?:        string;
  no?:          number;
  published?:   boolean;
  publishedAt?: string;

  // oneFrom → all operations available
  category?:
    | { attach:         { id: string } | { slug: string } }
    | { create:         { name: string; slug: string } }
    | { attachOrCreate: { attach: { id: string }; create: { name: string; slug: string } } }
    | { update:         { name?: string; slug?: string } }
    | { upsert:         { create: { name: string; slug: string }; update: { name?: string } } }
    | { detach:         true }
    | { delete:         true };

  // manyFrom → RequireAtLeastOne of any operations
  tags?: RequireAtLeastOne<{
    attach:         { id: string }[];
    create:         { name: string }[];
    attachOrCreate: { attach: { id: string }; create: { name: string } }[];
    update:         { where: { id: string }; data: { name?: string } }[];
    upsert:         { attach: { id: string }; create: { name: string }; update: { name?: string } }[];
    detach:         { id: string }[];
    delete:         { id: string }[];
  }>;
};
```

**Usage:**

```typescript
const input: UpdatePost = {
  title: 'Updated Title',

  category: { detach: true },

  tags: {
    attach: [{ id: 'existing-tag' }],
    delete: [{ id: 'old-tag' }],
  },
};
```

---

### Upsert Input

`$inferUpsert` combines create and update in one operation.

```typescript
type UpsertPost = LUpsertInput<Infers>;

// Result:
type UpsertPost = {
  where:  CreatePost;   // unique condition — find if exists
  create: CreatePost;   // data to create if not found
  update: UpdatePost;   // data to update if found
};
```

**Usage:**

```typescript
const input: UpsertPost = {
  where:  { no: 1 },
  create: { title: 'New Post', body: '...', no: 1, published: false, publishedAt: '2024-01-01' },
  update: { title: 'Updated Post' },
};
```

---

## Filters

### Unique

`$inferUnique` generates a filter that accepts **exactly one** of the unique/id fields.

```typescript
type UniquePost = LUniqueFilter<Infers>;

// Result:
type UniquePost =
  | { id: string;  no?: never }
  | { no: number;  id?: never };
```

**Usage:**

```typescript
// find by id
const byId: UniquePost = { id: 'post-uuid' };

// find by unique field
const byNo: UniquePost = { no: 42 };
```

---

### Where

`$inferWhere` describes the conditions used to match entries — supports direct values, operators, nested paths, and logical functions.

#### Field Operators

| Type      | Operators |
|-----------|-----------|
| `string`  | direct value, `contains`, `startsWith`, `endsWith`, `neq`, `in`, `notIn`, `isNull` |
| `number`  | direct value, `gt`, `gte`, `lt`, `lte`, `neq`, `in`, `notIn`, `isNull` |
| `boolean` | direct value, `isNull` |

```typescript
type WherePost = LWhereFilter<Infers>;

const where: WherePost = {
  // direct value — exact match
  published: true,
  no:        42,
  title:     'Hello',

  // operators
  title:     { contains: 'world', startsWith: 'H' },
  no:        { gte: 10, lt: 100 },
  publishedAt: { gt: '2024-01-01' },
};
```

#### Nested Object Conditions

```typescript
const where: WherePost = {
  // object — conditions applied directly
  meta: {
    views: { gte: 1000 },
    slug:  { startsWith: 'typescript' },
  },
};
```

#### Array Conditions (some / every / none)

```typescript
const where: WherePost = {
  tags: {
    some:  { name: { contains: 'ts' } },
    every: { active: true },
    none:  { name: 'deprecated' },
  },
};
```

Array conditions also support nested dot-paths inside `some`/`every`/`none`:

```typescript
const where: WherePost = {
  tags: {
    some: {
      'category.name': 'typescript',  // depth 1 inside each item
    },
  },
};
```

#### Dot-Path Notation

```typescript
const where: WherePost = {
  'meta.slug':             { startsWith: 'ts' },      // depth 1
  'meta.author.name':      { contains: 'ali' },        // depth 2
  'meta.author.city.zip':  '12345',                    // depth 3
};
```

> **Note:** Dot-paths work on objects only. For array fields, use `some`/`every`/`none` with nested conditions.

#### Logical Functions

```typescript
import { intersect, union, exclude } from '@listedbase/core';

const where: WherePost = {
  ...intersect(
    { published: true },
    { no: { gte: 10 } },
    union(
      { title: { contains: 'ali' } },
      { title: { contains: 'ahmed' } },
    ),
    exclude({ published: false }),
  ),
};
```

| Function    | Behavior |
|-------------|----------|
| `intersect` | all conditions must match |
| `union`     | at least one condition must match |
| `exclude`   | condition must not match |

---

### Sort

`$inferSort` generates a sort type for all primitive fields and dot-paths on objects (not arrays).

```typescript
type SortPost = LSortFilter<Infers>;

const sort: SortPost = {
  no:              'asc',
  title:           'desc',
  'meta.views':    'asc',   // depth 1
  'meta.author.name': 'desc', // depth 2
};
```

> **Rules:**
> - Only `'asc'` or `'desc'` are accepted.
> - Array fields are **not** sortable directly.
> - All fields are optional — specify only what you need.

---

## Refine

`$inferRefine` controls the **shape of the output** — which fields to return and which relations to populate.

### Base Field Selection

Exactly one of `pick`, `omit`, or `pluck` can be used at a time. These apply only to **base fields** (not relations).

| Option  | Description |
|---------|-------------|
| `pick`  | Return only the specified fields |
| `omit`  | Return all fields except the specified ones |
| `pluck` | Return a single field value |

```typescript
import { LRefine } from '@listedbase/core';

type RefinePost = LRefine<Infers>;

// pick — only id and title
const refine: RefinePost = {
  pick: ['id', 'title'],
};

// omit — everything except body
const refine: RefinePost = {
  omit: ['body'],
};

// pluck — single field
const refine: RefinePost = {
  pluck: 'id',
};
```

> **Mutual exclusivity:** `pick`, `omit`, and `pluck` cannot be combined. TypeScript will raise a compile-time error.

### Include (Populate Relations)

`include` populates relation fields. It is only available when `pluck` is **not** used.

```typescript
const refine: RefinePost = {
  pick: ['id', 'title'],

  include: {
    // oneFrom — no where/sort/take
    category: {
      pick: ['id', 'name'],
    },

    // manyFrom — supports where/sort/take
    tags: {
      omit:  ['createdAt'],
      where: { active: true },
      sort:  { name: 'asc' },
      take:  10,
    },
  },
};
```

> **Rules:**
> - `include` keys are limited to **relation fields** only (`oneFrom`/`manyFrom`).
> - `oneFrom` relations do **not** support `where`, `sort`, or `take`.
> - `manyFrom` relations support all: `pick`/`omit`/`pluck` + `where` + `sort` + `take`.
> - Nested `include` is supported for deep population.

### Nested Population

```typescript
const refine: RefinePost = {
  include: {
    tags: {
      pick: ['id', 'name'],
      include: {
        category: {
          pluck: 'name',
        },
      },
      where: { active: true },
      take:  5,
    },
  },
};
```

---

## LInfer — Public API

`LInfer` wraps a schema ref and exposes all inferred types as properties.

```typescript
import {
  LInfer,
  LCreateInput,
  LUpdateInput,
  LUpsertInput,
  LUniqueFilter,
  LWhereFilter,
  LSortFilter,
  LRefine,
} from '@listedbase/core';

type Infers = LInfer<typeof sPost>;

type CreatePost = LCreateInput<Infers>;
type UpdatePost = LUpdateInput<Infers>;
type UpsertPost = LUpsertInput<Infers>;
type UniquePost = LUniqueFilter<Infers>;
type WherePost  = LWhereFilter<Infers>;
type SortPost   = LSortFilter<Infers>;
type RefinePost = LRefine<Infers>;
```

All types update **automatically** when the schema changes — no manual maintenance required.