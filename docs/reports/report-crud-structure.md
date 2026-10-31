# تقرير بنية list CRUD ومنظومة Native-First والتخطيط (`docs/reports/report-crud-structure.md`)

## 1. القرارات المستقرة: معمارية Native-First بحسب الـ Capabilities

- **المبدأ الأساسي (Native-first):**
  إن أعلن الـ Driver دعم ميزة عبر أعلام الـ capabilities، يُعهد تنفيذها لمحرك الـ driver بدلاً من Core. ويوفر Core طبقة بديلة (fallback) فقط عند غياب الـ capability. الميزات التي لا يمكن توفير fallback لها برمجياً تُرفض بـ `LError('DRIVER/UNSUPPORTED')`.
- **معرفات السجلات (IDs):**
  يولّد الـ Driver معرف `lField.id.autogen()` إذا كانت `idGeneration: true`، وإلا يولّدها Core عبر `crypto.randomUUID()`. وتُحوَّل كافة المعرفات في النهاية إلى `string` عبر `serializeId`. (ملحوظة: `autoIncrement` خاص بالمحرك فقط ولا fallback له).
- **التحقق من البيانات (Validation):**
  Zod يتحقق في Core دائماً قبل إرسال البيانات للمحرك. أما علم `nativeConstraints` فيعبر عن قيود المحرك وقواعد البيانات ذاتها.
- **التشفير وفك التشفير:**
  `createCodec(schema)` طبقة مستقلة فوق المحرك.
- **استعلامات `TWhere`:**
  IR موحد، ويُترجم محلياً في المحرك، ولا فلترة في الذاكرة.

---

## 2. جدول قرارات Native-First vs Fallback

| الجانب (Aspect) | Flag في الـ Capabilities | التنفيذ عند `true` (Native) | المسار البديل عند `false` (Fallback في Core) | الحالة الحالية في الكود |
|---|---|---|---|---|
| **توليد المعرفات (id)** | `idGeneration` | يترك الحقل للمحرك ليولّده | يولّد Core المعرف بـ `crypto.randomUUID()` | كان Core يولده دائماً؛ تم تحويله لـ Native-first |
| **التوقيت التلقائي (timestamps)** | `timestampGeneration` | المحرك يولّد `createdAt` / `updatedAt` | Core يولّدها بـ `new Date()` | كان Core يولّدها يدوياً؛ سيتّبع الخطة |
| **إرجاع السجل (returning)** | `returning` | المحرك يرجع السجل المحدث/المنشأ مباشرة | Core يقوم بقراءة إضافية أو دمج الحقول | ينفّذ قراءة/دمج في Core؛ سيستغل returning |
| **قراءة الحالة السابقة (before)** | `returning` (أو transaction read) | يرجع المحرك الحالة القديمة مباشرة إذا دعمه | قراءة `findUnique` منفصلة في Core | قراءة `findUnique` في Core |
| **العمليات الجماعية (batch)** | `batch` | استدعاء دالة المحرك الجماعية دفعة واحدة | Core يكرر العملية عبر حلقة | ينفّذ بحلقة في `runGroup` |
| **الذرية (atomicity)** | `transactions` | المحرك يضمن ذرية العملية | رفض نمط `rejectAll` بـ `DRIVER/UNSUPPORTED` | يرفض نمط `rejectAll` عند غياب transactions |
| **الدمج/الإنشاء (upsert)** | `upsert` | استدعاء `_upsert` في المحرك | سؤال مفتوح (محاكاة findUnique ثم update/create) | Stub يرمي `DRIVER/UNSUPPORTED` |

---

## 3. الأعلام المطلوبة في `LDriverCapabilities` ومتطلبات `IDataDriver`

الأعلام الجديدة الموسعة:
```typescript
export interface LDriverCapabilities {
  schema: boolean;
  cursors: boolean;
  fullTextSearch: boolean;
  population: boolean;
  timestampGeneration: boolean;
  updatedAt: boolean;
  subscription: boolean;
  nativeConstraints: boolean;
  transactions: boolean;
  idGeneration: boolean;
  returning: boolean;
  batch: boolean;
  upsert: boolean;
}
```

### متطلباتها في عقد `IDataDriver`:
- `idGeneration`: السماح لمدخلات `_create` بعدم احتواء حقل `id` واستلامه من المحرك بعد الإنشاء.
- `returning`: تضمن دوال `_create` و `_update` و `_delete` إرجاع السجل الناتج أو السابق دون الحاجة لقراءة إضافية.
- `batch`: إضافة توقيع مستقبلي للعمليات الجماعية مثل `_createMany` و `_updateMany` عند الحاجة.
- `upsert`: توفير دالة `_upsert(list, where, createInput, updateInput)`.

---

## 4. نمط `planMutation(op, capabilities)`

يتم تعريف مخطط وموجه العمليات في `mutations/runtime/plan.ts`:
```typescript
export interface MutationPlan {
  id: 'driver' | 'core';
  timestamps: 'driver' | 'core';
  returning: 'driver' | 'core';
  before: 'driver' | 'core';
  batch: 'driver' | 'core';
  atomicity: 'driver' | 'unsupported';
  upsert: 'driver' | 'fallback' | 'unsupported';
}

export function planMutation(
  op: 'create' | 'update' | 'delete' | 'upsert',
  capabilities: LDriverCapabilities
): MutationPlan;
```
تقوم دالة `runGroup` بتنفيذ الخطة الموجهة بالكامل، مما يمنع منعاً باتاً أي فحص مباشر لـ `capabilities` داخل ملفات العمليات `*.op.ts`.

---

## 5. سؤال مفتوح: Fallback لعملية الـ `upsert` عند غياب الدعم

عند غياب ميزة `upsert: false` في الـ driver:
- **الخيار الأول (الموصى به حالياً):** رفض العملية فوراً برمي استثناء `LError('DRIVER/UNSUPPORTED')` للحفاظ على السلامة والذرية وتجنب الـ Race condition في بيئات التخزين غير الذرية.
- **الخيار الثاني:** توفير fallback بمحاكاة التحقق: استدعاء `findUnique` أولاً، ثم استدعاء `update` في حال وجوده أو `create` في حال عدم وجوده، بشرط توفر `transactions: true`.
