# تقرير تصميم وبنية list CRUD — المرحلة 3 (`docs/reports/report-crud.md`)

## 0. تثبيت وتصحيح بنية `sources` والمحركات

بناءً على التقييم البرمجي والمقترحات المعمارية، يتضمن التصميم تثبيت البنود التالية:

1. **فك الاعتماد الدائري (`core ↔ driver-abstract`):**
   - سيبقى سجل المصادر `registerSources` و `getPrimarySource` و `getReplicaSource` والأنواع الأساسية `IDataDriver`, `IFilesDriver`, `LSourcesConfig` معرفة في `packages/core/src/lib/sources/` أو `driver-abstract`.
2. **إعادة ضبط الجاهزية عند الفشل:**
   - في `LDataDriver` داخل `ensureReady`، سيتم تصفية `this._readyPromise = null` في حال فشل `_init(schemas)` ليتاح للمحرك إعادة محاولة الاتصال/التطوير بشكل صحيح بدلاً من تعليق الـ Promise المرفوض.
3. **عقد `IDataDriver` بأنواع دقيقة بدلاً من `any`:**
   - استبدال `any` بـ generics ودعم عمليات CRUD الأساسية (`create`, `update`, `delete`, `findUnique`).
4. **تحديث `IFilesDriver`:**
   - إزالة `Buffer` لتسهيل التوافق مع بيئة الـ Browser والـ Frontend واقتصارها على `Blob | Uint8Array`.
5. **القراءة الكسولة للمصدر (`Lazy Source Resolution`):**
   - عدم استدعاء `getPrimarySource()` أثناء دالة `list(query)` الإنشائية، بل تأجيل قراءتها كسولاً حتى لحظة تنقيذ أول عملية CRUD حقيقية لتجنب خطأ الاستدعاء المبكر قبل `lSetting.sources(...)`.
6. **إضافة خاصية `transactions` إلى `LDriverCapabilities`:**
   - إضافة خاصية منطقية `transactions: boolean` لوصف كفاءة المحرك في تنفيذ العمليات الذرية الجماعية.

---

## 1. جرد الوضع الحالي وتطوير الـ Mutations Types

### الوضع الحالي:
- يوجد تشتت بين `packages/core/src/lib/list/mutations/` التي توفر أنواعاً تشمل 12 method و`intents` متعددة كـ (`fullSelect`, `patch`, `before`, `ids`, `actions`) وبين `packages/core/src/lib/list/list.ts` التي لا تطبق سوى `create` واحدة.

### الـ API الجديد والتعديلات المعتمدة:
1. **الـ Methods الـ 6 المعتمدة:**
   - `create(input: item | item[], refine?: RefineOpts)`
   - `update(opts: { where, input } | Array<{ where, input }>, refine?: RefineOpts)`
   - `upsert(opts: { where, create, update } | Array<{ where, create, update }>, refine?: RefineOpts)`
   - `delete(where: UniqueWhere | UniqueWhere[], refine?: RefineOpts)`
   - `updateMany(opts: { where: TWhere, input }, refine?: RefineOpts)`
   - `deleteMany(opts: { where: TWhere }, refine?: RefineOpts)`

2. **الـ Intents المعتمدة:**
   - `'confirm' | 'id' | 'entity' | 'diff'`
   - `'count'` مخصصة فقط لـ `updateMany` و `deleteMany`.
   - إلغاء كل من: `fullSelect`, `patch`, `before`, `ids`, `actions`.

3. **القيم الافتراضية (Defaults):**
   - `create` ← `{ id, createdAt }`
   - `update` ← الحقول المتغيرة
   - `upsert` ← `{ id, $action }`
   - `delete` ← `boolean`
   - `updateMany` / `deleteMany` ← `{ count: number }`

4. **نظام الأخطاء والـ `errorMode`:**
   - الخيار `errorMode: 'settled'` يغلف نتائج السجلات في مصروفة بالشكل:
     `{ status: 'fulfilled', data } | { status: 'rejected', error: LError }`
   - يتم معالجته بالكامل في Core وتطبيقه دون معرفة الـ driver.
   - النمط الافتراضي هو `rejectAll`. إذا كانت `transactions: false` في `capabilities` السائق، يتم رفض العمليات الجماعية تحت نمط `rejectAll` بـ `LError('DRIVER/UNSUPPORTED')` ولن يتم محاكاتها بحلقة لضمان الذرية.

---

## 2. تصميم الـ Runtime والـ Codec

1. **الـ Codec:**
   - تحويل البيانات المتبادلة (مثل تحويل Date إلى ISO string والعكس) يتم كطبقة مستقلة داخل Core قبل وبعد التفاعل مع الـ Driver.
2. **تطبيع `where`:**
   - تحويل الـ `UniqueWhere` إلى كائن معرف ومطابق للـ serializing باستخدام `serializeId`.
3. **الحقول التلقائية:**
   - توليد `id` (autouuid) و `createdAt` و `updatedAt` يتم بالكامل في Core قبل الوصول للـ driver.
4. **حساب الـ `diff` و `entity`:**
   - **الخيار الموصى به:** قراءة حالة السجل `before` داخل نفس الـ transaction عند وجود `transactions: true` في المحرك لضمان الدقة وعدم وجود Race condition.
5. **نطاق التنفيذ في المرحلة 3:**
   - تنفيذ برمي كامل لـ `create` و `update` و `delete` (مفرد ومصفوفة) مع الـ intents والـ `errorMode`.
   - إبقاء `upsert` و `updateMany` و `deleteMany` كأنواع فقط (Types only) لحين اكتمال بناء وتأطير الـ `TWhere` مع الـ driver.

---

## 3. مقترحات توحيد المسميات (For Decision)

| المسمى الحالي | المسمى المقترح | الاستخدام القائم |
|---|---|---|
| `autouuid` | `autoId` / `autouuid` | مستخدم في `lField.id.autouuid()` في `field.ts` والـ Playgrounds. |
| `lQuery` | `lQuery` / `lFind` | مستخدم كـ Callable Functor في `query.ts` والـ Playgrounds. |
| `takeNext` | `loadNext` | مقتنع للتصفح المتقدم في الـ pagination مستقبلاً. |

*ملاحظة:* التسميات الحالية تعمل باستقرار ولم تتأثر.

---

## 4. قائمة الأسئلة المفتوحة المواجهة لموافقتك (Open Questions)

1. **نطاق التنفيذ البرمجي:** هل تعتمد تنفيذ `create` و `update` و `delete` (مفرد ومجموعات) كاملاً في `list.ts` و `LIndexeddb` مع إبقاء `upsert` و `updateMany` و `deleteMany` كأنواع فقط في هذه المرحلة؟
2. **استراتيجية الذرية (Transactions & Atomicity):** هل تعتمد رفض المجموعات في نمط `rejectAll` عند كون `transactions: false` بـ `LError('DRIVER/UNSUPPORTED')` دون محاكاة الحلقة؟

---
**أنا متوقف بانتظار موافقتك على هذا التقرير والتصميم للانتقال إلى مرحلة التنفيذ (الخطوة ب).**
