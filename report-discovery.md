# تقرير الاكتشافات والأخطاء خارج النطاق (report-discovery.md)

تم إجراء مسح شامل للمشروع أثناء تنفيذ المرحلة الأولى، وتم تدوين الأخطاء والتناقضات الموجودة خارج نطاق التعديل المباشر مرتبة حسب درجة الخطورة:

---

## 1. أخطاء عالية الخطورة (High Severity)

### أ) أخطاء تعريف ومطابقة الأنواع في محرك Supabase Driver (`packages/drivers/supabase/src/index.ts`)
- **الوصف:** وجود عشرات الأخطاء بسبب الإشارة إلى أنواع غير معرفة كـ `LWhereFilter`, `LUniqueFilter`, `LSortFilter`, `LCursor`, `LListMeta`, `LDriverCapabilities`, `LRefineOptions`, `LMutationResult`, `LBatchOp`, `LBatchResult`, `LDriverError`, `IDriverTransaction`, `LDriverEvent`, `LDriverErrorCode`.
- **التأثير:** تعذر بناء أو إكمال فحص الأنواع الخاص بشركاء الاتصال مع Supabase.

### ب) أخطاء الـ Abstract / Class Implementation في `LFirestore` (`packages/drivers/firestore/src/lib/firestore-driver.ts`)
- **الوصف:** الكلاس `LFirestore` كلاس غير مجرد (Non-abstract) ولكنه لا يطبق الدالة المجرّدة `create` الموروثة من الكلاس الأب `LDriver`.
- **التأثير:** فشل في مطابقة العقد (Contract Break) بين الـ Core والـ Drivers.

---

## 2. أخطاء متوسطة الخطورة (Medium Severity)

### أ) أخطاء التوافقية في محولات uni-reactive الخاصة بـ React و Vue
- **React Adapter (`packages/uni-reactive/adapters/react-reactive/src/index.ts(38,53)`):**
  - **الوصف:** عدم توافق دالة `modify` بين `ReactReactive<T | Signal<T>>` والواجهة الأساسية `IReactive<T>`.
- **Vue Adapter (`packages/uni-reactive/adapters/vue-reactive/src/index.ts(39,51)`):**
  - **الوصف:** نفس مشكلة عدم التوافق في نمط الدالة `modify` بالإضافة إلى وجود متغير غير مستخدم `re` (`TS6133`).

### ب) أخطاء اختبارات وحدات السائقين (Driver Unit Test Spec Files)
- **`firestore-driver.spec.ts`**: محاولة استيراد `firestoreDriver` غير المصدر من الملف الأساسي.
- **`indexeddb-driver.spec.ts`**: فشل مسار استيراد وحدة `./indexeddb-driver`.

---

## 3. أخطاء منخفضة الخطورة (Low Severity)

### أ) أخطاء التحذيرات والإعدادات الحالية في tsconfig
- بعض ملفات `tsconfig.json` في مجلدات السائقين الفرعية تستخدم `moduleResolution: bundler` بدون ضبط قيمة `module` المناسبة، مما يتسبب بتحذيرات TS5095 عند التشغيل المباشر عبر tsc.
