# تقرير بناء منظومة `LError` (report-lerror.md)

## 1. الأماكن التي تستخدم `LError` أو `LErrorCode` أو `errorMode`

- **`packages/core/src/lib/error.ts`**:
  تضمّن تعريفاً كـ `type LErrorCode` و `type LError` بدون أي تصدير (`export`).
- **`packages/core/src/lib/list/helpers/error.ts`**:
  تضمّن إعادة تعريف وتصدير لـ `export type LErrorCode` و `export type LError` مع إضافة كود `OP/PARTIAL_FAILURE` وحقل `meta` المخصص للعمليات الجماعية الجزئية.
- **`packages/core/src/lib/list/mutations/index.ts`**:
  يصدّر `export type { LError, LErrorCode } from '../helpers/error'`.
- **`packages/core/src/lib/list/mutations/*/result.ts`**:
  تستخدم `LError` و `errorMode` لتعريف أنماط إرجاع الأخطاء مع الـ Group / Single mutations.
- **`packages/core/src/lib/list/mutations/mutations.md`**:
  التوثيق يذكر بوضوح: `if (result instanceof LError) console.error(result.code)`، مما يتطلب أن تكون `LError` عبارة عن **class** (Value Export) وليس مجرد interface أو type definition.

---

## 2. التكرار والتضارب القائم

كان هناك تكرار وتشتت بين `packages/core/src/lib/error.ts` (الذي كان مهملًا وبدون export) وبين `packages/core/src/lib/list/helpers/error.ts` (الذي كان يصدر فقط TypeScript Types). هذا التشتت كان يكسر إمكانية استخدام `instanceof LError` في كود المستخدم.

---

## 3. التصميم المقترح لمنظومة `LError`

سيتم توحيد وبناء منظومة `LError` في الملف الأساسي `packages/core/src/lib/error.ts` وفقًا للآتي:

- **فئة `LError` الكائنية (`class`):**
  تَرِث من الفئة القياسية `Error` لضمان الحصول على `stack trace` وتوافقيّات جافاسكريبت.
- **الرموز المدعومة (`LErrorCode`):**
  تغطية جميع الأكواد القائمة مع إضافة `OP/PARTIAL_FAILURE`:
  - `DB/NOT_FOUND`, `DB/CONSTRAINT`, `DB/DUPLICATE`, `DB/TIMEOUT`
  - `VALIDATION/FIELD`, `VALIDATION/REQUIRED`, `VALIDATION/TYPE`
  - `DRIVER/CONNECTION`, `DRIVER/UNSUPPORTED`, `DRIVER/UNKNOWN`
  - `OP/PARTIAL_FAILURE`, `OP/FORBIDDEN`, `OP/INVALID`
- **الحقول:**
  - `code: LErrorCode`
  - `message: string`
  - `field?: string` (مخصص لأخطاء `VALIDATION/*`)
  - `meta?: unknown | PartialFailureMeta`
  - `cause?: unknown`
- **المساعدات (`Helpers`):**
  - `isLError(err: unknown): err is LError`: دالة للتحقق مما إذا كان الكائن نسخة من `LError`.
  - `createLError(opts: LErrorOptions): LError`: Factory لإنشاء الخطأ بنظافة.
- **التصدير والتنظيف:**
  - تصدير `LError`, `LErrorCode`, `isLError`, `createLError` من `packages/core/src/index.ts`.
  - تنظيف وحذف التكرار من `packages/core/src/lib/list/helpers/error.ts` وجعله يعيد تصدير المنظومة الموحدة.
  - تحديث الاستيرادات في ملفات `mutations/*` عند الحاجة.
