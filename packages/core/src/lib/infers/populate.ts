// populate.ts
import { z } from 'zod/v4';
import type { IsOneFrom, IsManyFrom, IsRelation } from '../schema/meta';
import type { ExactlyOne, RequireAtLeastOne } from '../utils';
import type { UniqueFields } from './unique';
import type { InferCreateInput, InferUpdateInput } from './inputs';

// ============================================================
// 🔗 ZOD UNWRAPPERS
// ============================================================

export type UnwrapBranded<F> =
  F extends z.ZodType & { __lMeta: any } ? Omit<F, '__lMeta'> : F;

export type ZodObjectFields<F> =
  UnwrapBranded<F> extends z.ZodObject<infer Shape> ? Shape :
  F extends z.ZodObject<infer Shape>                ? Shape :
  never;

export type ArrayItem<F> =
  F extends z.ZodArray<infer Item>                ? Item :
  UnwrapBranded<F> extends z.ZodArray<infer Item> ? Item :
  never;

// ============================================================
// 🔗 RELATED TYPE EXTRACTORS
// ============================================================

export type RelatedAttach<F> =
  IsOneFrom<F> extends true
    ? ExactlyOne<UniqueFields<ZodObjectFields<F>>>
    : IsManyFrom<F> extends true
      ? ExactlyOne<UniqueFields<ZodObjectFields<ArrayItem<F>>>>
      : never;

export type RelatedCreate<F> =
  IsOneFrom<F> extends true
    ? InferCreateInput<ZodObjectFields<F>>
    : IsManyFrom<F> extends true
      ? InferCreateInput<ZodObjectFields<ArrayItem<F>>>
      : never;

export type RelatedUpdate<F> =
  IsOneFrom<F> extends true
    ? InferUpdateInput<ZodObjectFields<F>>
    : IsManyFrom<F> extends true
      ? InferUpdateInput<ZodObjectFields<ArrayItem<F>>>
      : never;

// ============================================================
// 🔗 CREATE — RELATION INPUT SHAPES
// ============================================================

interface OneRelationCreateInput<TAttach, TCreate> {
  field:
    | { attach:         TAttach;                                      create?: never; attachOrCreate?: never }
    | { create:         TCreate;                                      attach?: never; attachOrCreate?: never }
    | { attachOrCreate: { attach: TAttach; create: TCreate };         attach?: never; create?: never        };
}

interface ManyRelationCreateInput<TAttach, TCreate> {
  field:
    | { attach:         TAttach[];                                                    create?: never;        attachOrCreate?: never }
    | { create:         TCreate[];                                                    attach?: never;        attachOrCreate?: never }
    | { attachOrCreate: { attach: TAttach; create: TCreate }[];                      attach?: never;        create?: never        }
    | { attach:         TAttach[];          create: TCreate[];                        attachOrCreate?: never                       };
}

// ============================================================
// 🔗 UPDATE — RELATION INPUT SHAPES
// ============================================================

interface OneRelationUpdateInput<TAttach, TCreate, TUpdate> {
  field:
    | { attach:         TAttach;                                      }
    | { create:         TCreate;                                      }
    | { attachOrCreate: { attach: TAttach; create: TCreate };         }
    | { update:         TUpdate;                                      }
    | { upsert:         { create: TCreate; update: TUpdate };         }
    | { detach:         true;                                         }
    | { delete:         true;                                         }
}

interface ManyRelationUpdateInput<TAttach, TCreate, TUpdate> {
  field: RequireAtLeastOne<{
    attach:         TAttach[];
    create:         TCreate[];
    attachOrCreate: { attach: TAttach; create: TCreate }[];
    update:         { where: TAttach;  data:  TUpdate  }[];
    upsert:         { attach: TAttach; create: TCreate; update: TUpdate }[];
    detach:         TAttach[];
    delete:         TAttach[];
  }>;
}

// ============================================================
// 🔗 RELATION FIELD INPUT — CREATE
// ============================================================

export type RelationFieldInputForCreate<F> =
  IsOneFrom<F> extends true
    ? OneRelationCreateInput<
        RelatedAttach<F>,
        RelatedCreate<F>
      >['field']
    : ManyRelationCreateInput<
        RelatedAttach<F>,
        RelatedCreate<F>
      >['field'];

// ============================================================
// 🔗 RELATION FIELD INPUT — UPDATE
// ============================================================

export type RelationFieldInputForUpdate<F> =
  IsOneFrom<F> extends true
    ? OneRelationUpdateInput<
        RelatedAttach<F>,
        RelatedCreate<F>,
        RelatedUpdate<F>
      >['field']
    : ManyRelationUpdateInput<
        RelatedAttach<F>,
        RelatedCreate<F>,
        RelatedUpdate<F>
      >['field'];

// ============================================================
// 🔗 RELATION FIELDS MAPS
// ============================================================

export type RelationFieldsForCreate<T> = {
  [K in keyof T as IsRelation<T[K]> extends true ? K : never]?:
    RelationFieldInputForCreate<T[K]>;
};

export type RelationFieldsForUpdate<T> = {
  [K in keyof T as IsRelation<T[K]> extends true ? K : never]?:
    RelationFieldInputForUpdate<T[K]>;
};