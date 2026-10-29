# تقرير دمج مجلدي `infers` و `infers2` (report-infers-merge.md)

## 1. مقارنة وتحليل الملفات (Diff Analysis)

تم إجراء فحص دقيق ومقارنة بين الملفات المتقابلة في المجلدين `packages/core/src/lib/infers` و `packages/core/src/lib/infers2`:

- **الملفات المتطابقة تمامًا:**
  - `autogen.ts`
  - `entity.ts`
  - `inputs.ts`
  - `output.ts`
  - `populate.ts`
  - `select.ts`
  - `unique.ts`

- **الملفات المختلفة والتغييرات بينهما:**
  - `sort.ts`:
    - **في `infers`:** كان يعتمد على تحديد المسارات لغاية العمق 3 (`SortDepth1Paths`, `SortDepth2Paths`, `SortDepth3Paths`).
    - **في `infers2`:** تم تبسيطه واستبداله بـ Type عودي موحد `TSortRecursive` مما يدعم الأعماق المتعددة بنظافة وبدون تعقيد.
  - `where.ts`:
    - **في `infers`:** كان يحوي تعريفات ممتدة ومفصلة لكل عمق على حدة (`Depth1Paths`, `Depth2Paths`, `Depth3Paths`, `TopLevelFields`, `NestedFields`).
    - **في `infers2`:** تم إعادة هيكلته إلى نوع عودي موحد ومبسط `TWhere<T>` يغطي حقول الـ Scalars والعمق التكراري للأنواع والعمليات المنطقية (`$and`, `$or`, `$not`) والصفوف (`some`, `every`, `none`).
  - `index.ts`:
    - **في `infers`:** كان مجرد جسر يفرغ التصدير ويستورده من `infers2` (`export type { LInfer } from '../infers2/index'`).
    - **في `infers2`:** هو الملف الأساسي المحتوي على تعريف الواجهة `LInfer` وتصدير الدوال المنطقية `intersect`, `union`, `exclude`.

---

## 2. خريطة الاستيرادات الحالية (Current Imports)

- **يستورد من `infers`:**
  - `packages/core/src/lib/list/list.ts`
  - جميع ملفات الـ mutations تحت `packages/core/src/lib/list/mutations/*` (استيراد `LInfer` و `ApplySelect`)
  - `packages/core/src/lib/schema/index.ts` (يصدّر `TWhere` من `infers/where`)
- **يستورد من `infers2`:**
  - `packages/core/src/index.ts` (يصدّر `* from './lib/infers2/index'`)
  - `packages/core/src/lib/query/query.ts` (يستورد `LInfer` من `../infers2`)

---

## 3. هل يوجد تصديران لنفس الاسم بأنواع مختلفة؟
لا، لأن `infers/index.ts` كان يمرر تصدير `infers2` بالفعل. الاختلاف كان في الملفات الداخلية القديمة لـ `sort.ts` و `where.ts` في `infers` قبل التفرع، بينما `infers2` هو النسخة الأحدث والمعتمدة.

---

## 4. المجلد الموصى به وخطة الدمج

- **المجلد المعتمد النهائي:** `packages/core/src/lib/infers/` (كونه الاسم الأصلي والمعياري).
- **خطة التنفيذ:**
  1. استبدال جميع ملفات `infers/` بالنسخة الحديثة من `infers2/`.
  2. الإبقاء على الملفات التوثيقية `README_AR.md` و `REPORT.md` داخل المجلد النهائي `infers/`.
  3. حذف مجلد `infers2/` بالكامل.
  4. تحديث الاستيرادات في `packages/core/src/index.ts` و `packages/core/src/lib/query/query.ts` لتشير إلى `./lib/infers` بدلاً من `infers2`.
  5. التأكد من سلامة الاستيرادات في `schema/index.ts` و `list.ts` و `mutations/*`.
  6. تشغيل `npx tsc -p tsconfig.base.json --noEmit` للتأكد من عدم وجود أخطاء أنواع جديدة.
