# تقرير إعادة تنظيم وهيكلة list CRUD — المرحلة 3ب (`docs/reports/report-crud-structure.md`)

## 1. جرد `list.ts` وملفات `mutations/*` القديمة

### أ) جرد `list.ts` الحالي
يحتوي `packages/core/src/lib/list/list.ts` على حوالي 330 سطرًا تشمل:
- فئة `LCodec` المسؤولة عن تحويل التواريخ والـ Codec.
- دالة `list()` المركزية التي تنشئ `getDriver` و`applySelect` و`normalizeWhere` و`formatResult`.
- كتل تنفيذ العمليات:
  - `create` (المفردة والمصفوفة، مع فحص الذرية والتحقق عبر Zod).
  - `update` (المفردة والمصفوفة، مع استدعاء findUnique والتحديث والتسجيل).
  - `delete` (المفردة والمصفوفة، مع التحقق والحذف).
  - Stubs لـ `upsert` و`updateMany` و`deleteMany`.

### ب) جرد ملفات `mutations/` المتبقية
ما تزال مجلدات `mutations/` تحتوي على بقايا الهيكلية القديمة (12 method):
- `create/single.ts`, `create/group.ts`, `create/result.ts`
- `update/single.ts`, `update/group.ts`, `update/result.ts`
- `delete/single.ts`, `delete/group.ts`, `delete/result.ts`
- `upsert/single.ts`, `upsert/group.ts`, `upsert/result.ts`
هذه الملفات القديمة كانت مبنية للتعامل مع الـ 12 method القديمة وتعتمد على intents مهجورة كـ `fullSelect`, `actions`, `patch`. سيتم استبدالها ودمج تعريفات الأنواع في مجلدات العمليات المخصصة:
- `mutations/create/create.types.ts`
- `mutations/update/update.types.ts`
- `mutations/delete/delete.types.ts`
- `mutations/upsert/upsert.types.ts`
- `mutations/update-many/update-many.types.ts`
- `mutations/delete-many/delete-many.types.ts`

---

## 2. خريطة النقل والتوزيع المعماري (File Mapping)

| المقطع الحالي في `list.ts` | الملف الهدف | الدور والمسؤولية |
|---|---|---|
| `LCodec` | `packages/core/src/lib/list/codec/index.ts` | إدارة تشفير وفك تشفير البيانات والتوافق مع التواريخ. |
| تعريف واجهة `LListContext` | `packages/core/src/lib/list/context.ts` | سياق القائمة يحمل `schema`, `name`, `driver()` (كسول), `codec`, و `onMutated`. |
| تعريف عقد الـ API العام للقائمة | `packages/core/src/lib/list/api.ts` | تعريف واجهة `LList<S>` الموحدة للـ 6 methods و `items`. |
| دالة `list()` الإنشائية | `packages/core/src/lib/list/list.ts` | مصنع رقيق (Thin Factory) ينشئ الـ context ويركّب الدوال. |
| معالجة المصفوفات والـ ErrorModes | `packages/core/src/lib/list/mutations/runtime/runGroup.ts` | دالة قالبية موحدة (Template Method) لإدارة المفرد والمصفوفة و `rejectAll` و `settled`. |
| `normalizeWhere` | `packages/core/src/lib/list/mutations/runtime/normalize.ts` | استخراج وتطبيع فلاتر الـ where وتطبيق `serializeId`. |
| `toLError` | `packages/core/src/lib/list/mutations/runtime/errors.ts` | تحويل أخطاء Zod وأخطاء المحرك المجهولة إلى `LError`. |
| `applySelect` | `packages/core/src/lib/list/mutations/refine/select.ts` | تطبيق `pick` و `omit` على مخرجات السجلات. |
| خريطة Defaults والـ Project | `packages/core/src/lib/list/mutations/refine/project.ts` و `defaults.ts` | تنسيق وإسقاط المخرجات بناء على الـ `intent` والعملية. |
| تنفيذ `create` | `packages/core/src/lib/list/mutations/create/create.op.ts` | المنطق التنفيذي لـ create. |
| تنفيذ `update` | `packages/core/src/lib/list/mutations/update/update.op.ts` | المنطق التنفيذي لـ update. |
| تنفيذ `delete` | `packages/core/src/lib/list/mutations/delete/delete.op.ts` | المنطق التنفيذي لـ delete. |
| stubs للعمليات المؤجلة | `packages/core/src/lib/list/mutations/{upsert,update-many,delete-many}/` | تعريفات الأنواع مع دوال stub ترفض بـ `DRIVER/UNSUPPORTED`. |

---

## 3. عقود الأنواع الأساسية (Context & Helpers Contracts)

### أ) `LListContext`
```typescript
export interface LListContext<S extends ZodObject<any>> {
  schema: S;
  name: string;
  driver: () => IDataDriver;
  codec: {
    encode: (data: any) => any;
    decode: (data: any) => any;
  };
  onMutated: (listName: string) => void;
}
```

### ب) `runGroup`
```typescript
export async function runGroup<TItem, TResult, TRefine extends RefineOptions<any, any>>(
  ctx: LListContext<any>,
  items: TItem | TItem[],
  execute: (item: TItem) => Promise<TResult>,
  refine?: TRefine
): Promise<TResult | TResult[] | SettledResult<TResult> | SettledResult<TResult>[]>
```

### ج) `project`
```typescript
export function project<T>(
  op: 'create' | 'update' | 'delete' | 'upsert',
  intent: MutationIntent | undefined,
  before: any,
  after: any,
  select: any,
  driver: IDataDriver
): any
```

---

## 4. الحفاظ على الـ Overloads والـ Type Inference

عند فصل الـ types في ملفات مستقلة `<op>.types.ts`، يتم تصدير Type signature صريح لـ Op Function بالشكل:

```typescript
export interface CreateOp<S extends ZodObject<any>> {
  <
    Input extends LInfer<S>['createInput'] | LInfer<S>['createInput'][],
    I extends MutationIntent | undefined = undefined,
    Ref extends RefineOptions<S, I> | undefined = undefined
  >(
    input: Input,
    refine?: Ref
  ): Promise<
    Input extends any[]
      ? InferGroupMutationResult<S, I, Ref>
      : InferMutationResult<S, I, Ref>
  >;
}
```
وهذا يضمن عدم فقدان دقة الـ inference عند استدعاء `list(query).create(...)` من الكود الخارجي.

---

## 5. الأسئلة المفتوحة (Open Questions)

1. **التعامل مع ملفات `single.ts/group.ts/result.ts` القديمة:** هل نعتمد حذفها نهائياً واستبدالها بنظام `<op>.types.ts` و `<op>.op.ts`؟ (نعم، متسق مع المطلوب).
2. **عقد `onMutated`:** سيتم تزويد `LListContext` بـ no-op hook: `onMutated: (name) => {}` ليكون جاهزاً للربط اللاحق مع `items.invalidate()`.

---
**أنا الآن متوقف بانتظار موافقتك على هذا التقرير والتصميم قبل الانتقال للخطوتين ب وج.**
