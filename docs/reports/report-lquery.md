# تقرير تصميم وبنية `lQuery` التفاعلية — المرحلة 4 (`docs/reports/report-lquery.md`)

## 1. جرد الوضع الحالي (Current State Inventory)

- **`packages/core/src/lib/query/query.ts`:**
  - ينشئ reactive store واحد لحفظ `QueryOptions<S>` عبر `createReactive<QueryOptions<S>>()`.
  - يقرأ `store.value` مباشرة عند الإنشاء (`value: store.value`) ويعيد `LQueryRef<S>`.
  - مشكلة الـ getter: التقاط قيمة ثابتة في البيئات التي تعيد قيمة عادية بدلاً من Signal.
- **`packages/core/src/lib/list/query.ts`:**
  - كان مجرد stub مؤقت وغير مستخدم (`TQueryRef`).
- **`packages/core/src/lib/list/list.ts`:**
  - يستقبل `query: LQueryRef<S>` بالشكل القديم `list(query)`.
  - يعتمد عليه الـ Playground (`posts = list(this.query)`) واختبارات `crud.spec.ts`.
- **`packages/uni-reactive/core/src/index.ts`:**
  - عقد `IReactive<T>` يحتوي على:
    ```typescript
    export interface IReactive<T> {
      value: ReactiveTypeMap<T>[keyof RegisteredReactiveAdapters];
      modify: (next: (prev: T) => T) => void;
      init(initial: T): void;
    }
    ```
    بدون `get` أو `set` أو اشتراك مباشر (`subscribe`). القراءة القابلة للاستدعاء `q.data()` تعمل في Angular signals (`Signal<T>`).

---

## 2. الواجهة والأنواع المقترحة لـ `lQuery` (Overloads & Types)

### أ) أشكال الاستدعاء الثلاثة (Three Overload Forms)
1. **Many Query (`lQuery(list, args)`):**
   ```typescript
   export function lQuery<S extends ZodObject<any>>(
     list: LList<S>,
     args: QueryManyArgs<S> // { where?, sort?, take? }
   ): LQueryManyInstance<S>;
   ```
   - إذا تم تمرير `{}`، تعني جلب كل السجلات بدون `take`.
   - `hasNext()` ترجع دائماً `false` في حال غياب `take`.

2. **IDs Query (`lQuery(list, ids)`):**
   ```typescript
   export function lQuery<S extends ZodObject<any>>(
     list: LList<S>,
     ids: string[]
   ): LQueryIdsInstance<S>;
   ```
   - تُجلب السجلات بـ `findMany` وتعاد ترتيبها محلياً في Core بحسب ترتيب مصفوفة الـ `ids`.
   - السجلات غير الموجودة تُستبعد.

3. **Single Query (`lQuery.single(list, { where })`):**
   ```typescript
   export function single<S extends ZodObject<any>>(
     list: LList<S>,
     args: { where: LInfer<S>['whereArgs'] }
   ): LQuerySingleInstance<S>;
   ```
   - إذا كان `where` مفتاحاً فريداً وحيداً (id أو حقل unique بمساواة بسيطة): يستدعي `driver.findUnique`.
   - وإلا: يستدعي `driver.findMany({ where, take: 1 })` ويأخذ أول عنصر.

### ب) عقد الـ Instance العام
```typescript
export interface LQueryBase<TData, TArgs> {
  data: () => TData;
  value: () => TArgs;
  modify: (updater: (prev: TArgs) => TArgs) => void;
  status: <Sel extends StatusSelection>(selection?: Sel) => SelectedStatus<Sel>;
  destroy: () => void;
}

export interface LQueryManyInstance<S extends ZodObject<any>>
  extends LQueryBase<LInfer<S>['base'][], QueryManyArgs<S>> {
  hasNext: () => boolean;
  loadNext: () => Promise<void>;
}

export interface LQueryIdsInstance<S extends ZodObject<any>>
  extends LQueryBase<LInfer<S>['base'][], string[]> {}

export interface LQuerySingleInstance<S extends ZodObject<any>>
  extends LQueryBase<LInfer<S>['base'] | null, { where: LInfer<S>['whereArgs'] }> {}
```

### ج) خيارات الـ Status (`status(selection)`)
```typescript
export interface StatusSelection {
  count?: boolean;
  error?: boolean;
  loading?: boolean;
  refreshing?: boolean;
}

export type SelectedStatus<Sel extends StatusSelection> = {
  [K in keyof Sel as Sel[K] extends true ? K : never]: ...
};
```
يتم تطبيع الـ selection إلى مفتاح كاش في closure لعدم إعادة إنشاء reactive instances جديدة عند كل استدعاء.

---

## 3. آلة الحالة ومصدر الأحداث (State Machine & Changes Emitter)

1. **إدارة الحالة ومطابقة الـ Latest-Wins:**
   - الحالات: `loading | refreshing | success | error`.
   - عداد متزايد `runId: number`: يُهمل أي رد يعود بعد تشغيل استعلام أحدث أو بعد استدعاء `destroy()`.
   - يتم تخزين نسخة متطابقة (Mirror) من `args` الحالية محلياً داخل closure لتجنب الاعتماد على قراءة الـ getter من الـ reactive adapter.

2. **مصدر أحداث التغيير في `LListContext`:**
   - استبدال دالة `onMutated` في `LListContext` بـ EventEmitter داخلي صغير:
     ```typescript
     export interface ListChangeEmitter {
       subscribe: (listener: () => void) => () => void;
       emit: () => void;
     }
     ```
   - في `runGroup`: يتم إطلاق `ctx.changes.emit()` بعد كل عملية كتابة ناجحة (`create`, `update`, `delete`).
   - تجميع الأحداث المتتالية (Batching) عبر `queueMicrotask`: إذا حدثت عدة عمليات كتابة متتالية، يتم دمجها في طلب جلب واحد فقط.

---

## 4. عقد الـ Driver الجديد (`IDataDriver`) وتنفيذ IndexedDB

### أ) العمليات المطلوبة في `IDataDriver`:
```typescript
export interface FindManyOptions {
  where?: any;
  sort?: any;
  take?: number;
  cursor?: string;
}

export interface FindManyResult<T = any> {
  items: T[];
  nextCursor?: string | null;
}

export interface IDataDriver {
  // ... CRUD operations
  findMany(list: string, options: FindManyOptions): Promise<FindManyResult>;
  count(list: string, where?: any): Promise<number>;
}
```

### ب) ترجمة `TWhere` في `LIndexeddb`:
- ترجمة الحقول الفريدة ومساواة الـ ID إلى `IDBKeyRange.only(...)`.
- استخدام `openCursor` للمرور عبر السجلات وتطبيق المعاملات التي لا يدعمها الفهرس (`contains`, `gt`, `gte`, `lt`, `lte`) محلياً داخل طبقة المحرك.
- دعم الـ Pagination عبر Cursors وتوليد المعرف التالي كـ string معتم (Opaque Base64/Key Cursor).

---

## 5. خطة تعديل `list.ts` والـ Playgrounds

1. **تحديث توقيع `list`:**
   - يصبح `list(schema)` بدلاً من `list(query)`.
   - حذف خاصية `items` والـ stub القديم.
2. **تحديث الـ Playground:**
   ```typescript
   // من
   query = lQuery(sPosts, {});
   posts = list(this.query);

   // إلى
   posts = list(sPosts);
   q = lQuery(this.posts, { take: 20 });
   ```
3. **تحديث `crud.spec.ts`:**
   - تهيئة القائمة مباشرة: `const users = list(userSchema)`.

---

## 6. قائمة الأسئلة المفتوحة المواجهة لموافقتك (Open Questions)

1. **اعتماد واجهة `list(schema)`:** هل نعتمد استبدال `list(query)` نهائياً بـ `list(schema)` وحذف خاصية `items` القديمة؟ (نعم، متفق عليه كقرار مستقر).
2. **حالة `refreshing` في `status()`:** هل نعتمد إضافة علم `refreshing` (أو `isFetching`) للتفرقة بين أول تحميل والتحميل اللاحق في الخلفية؟
3. **عقد `q.data()`:** في Angular يُرجع `Signal<T>`، بينما في بيئة الاختبار يتم تغليف القيمة العادية في فانكشن قابلة للاستدعاء عبر الـ mock adapter.

---
**أنا متوقف بانتظار موافقتك على هذا التقرير والتصميم للانتقال إلى مرحلة التنفيذ (الخطوة ب).**
