# تقرير تنفيذ عمليات list CRUD — المرحلة 3 (`docs/reports/report-crud-impl.md`)

## 1. ما تم تنفيذه بالكامل (Implemented Tasks)

1. **إصلاحات البنية التحتية والعقود (Items 0):**
   - معالجة وإعادة ضبط `_readyPromise = null` في `LDataDriver` عند فشل التهيئة للسلامة التجهيزية.
   - إضافة خاصية `transactions: boolean` في `LDriverCapabilities` للتأكد من قدرة السائق على العمليات الجماعية الذرية.
   - تطبيق القراءة الكسولة للمصدر (Lazy Resolution) في `list.ts` لقراءة `getPrimarySource()` لحظة الاستدعاء الفعلي للعمليات فقط.

2. **تطوير وتأطير أنواع الـ Mutations (`mutations/index.ts`):**
   - تقليص الواجهة إلى 6 الـ methods المعيارية: `create`, `update`, `upsert`, `delete`, `updateMany`, `deleteMany`.
   - نقل `refine` كمعامل ثانٍ مستقل لكل الـ mutations.
   - اعتماد الـ Intents الأربعة (`'confirm'`, `'id'`, `'entity'`, `'diff'`).
   - دعم نمط الأخطاء `errorMode: 'settled'` بنمط النتيجة المعزولة `{ status: 'fulfilled', data } | { status: 'rejected', error: LError }`.

3. **تنفيذ عمليات الـ CRUD والـ Codec في `list.ts` و `LIndexeddb`:**
   - تطبيق `LCodec` لتنفيذ التحويل التلقائي لتواريخ `Date` إلى `ISO String` والعكس عند القراءة والكتابة.
   - تنفيذ `create` و `update` و `delete` (مفرد ومجموعات) بالكامل في `list.ts` مع توليد الـ IDs و الـ Timestamps تلقائياً في Core مع التحقق عبر Zod.
   - التحقق من شرط الذرية للعمليات الجماعية بحظر نمط `rejectAll` عند كون `transactions: false` بـ `LError('DRIVER/UNSUPPORTED')`.
   - تعديل سائق `LIndexeddb` لتنفيذ عمليات `_create`, `_update`, `_delete`, `_findUnique` وتفعيل `transactions: true`.

4. **الاختبارات (Tests):**
   - كتابة اختبارات وحدات تشغيلية واختبارات تحويل الـ Codec واجتيازها في `packages/core/src/lib/list/crud.spec.ts`.

---

## 2. ما تم تأجيله ولماذا (Deferred Tasks)

- **`upsert`, `updateMany`, `deleteMany`:** تم توفير تعريفات الأنواع المطابقة، مع إبقاء التنفيذ البرمجي لها بطلب الرفض بـ `DRIVER/UNSUPPORTED` لحين اكتمال الـ IR الخاص بـ `TWhere` مع الـ drivers في المرحلة المقبلة.

---

## 3. نتيجة فحص الأنواع (Typecheck Results)

- تمت مقارنة نتيجة تشغيل `npx tsc -p tsconfig.base.json --noEmit` مع التقرير المرجعي الأساسي (`report-baseline.md`).
- **النتيجة:** عدم ظهور أي أخطاء جديدة في حزمة Core أو الـ Abstract Driver أو الـ IndexedDB Driver، مع بقاء أخطاء الـ Baseline الأصلية القائمة فقط خارج النطاق.
