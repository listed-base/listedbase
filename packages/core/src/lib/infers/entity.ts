// ============================================================
// 🔧 ENTITY — base fields فقط بدون relations
// ============================================================

import type { IsManyFrom, IsRelation } from "../schema/meta";
import { Clean, Simplify } from "../utils";
import type { FieldOutput } from "./unique";

export type Entity<TRaw> = {
    [K in keyof TRaw as IsRelation<TRaw[K]> extends true ? never : K]:
      FieldOutput<TRaw[K]>;
  };
  
  export type InferEntity<T> = Clean<Simplify<Entity<T>>>
  // ============================================================
  // 🔧 ENTITY POPULATE — relation fields فقط
  // ============================================================
  
   type EntityPopulate<TRaw> = {
    [K in keyof TRaw as IsRelation<TRaw[K]> extends true ? K : never]:
      IsManyFrom<TRaw[K]> extends true
        ? FieldOutput<TRaw[K]>        // array كاملة
        : FieldOutput<TRaw[K]>;       // object كامل
  };

  export type InferEntityPopulate<T> = Clean<Simplify<EntityPopulate<T>>>
