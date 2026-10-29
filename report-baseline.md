# تقرير حالة فحص الأنواع المرجعية (report-baseline.md)

تمت مراجعة وتشغيل فحص الأنواع (typecheck) للمشروع باستخدام `npx tsc -p tsconfig.base.json --noEmit` قبل إجراء أي تعديلات، وهذه هي الأخطاء القائمة التي تم رصدها كمرجع (Baseline):

## 1. أخطاء حزمة Core و tsconfig
- `packages/core/src/duct/duct.ts(1,29)`: `error TS2307: Cannot find module './default' or its corresponding type declarations.`

## 2. أخطاء Drivers (خارج نطاق المرحلة 1)
- **Firestore Driver:**
  - `packages/drivers/firestore/src/lib/firestore-driver.spec.ts(1,10)`: `error TS2305: Module '"./firestore-driver"' has no exported member 'firestoreDriver'.`
  - `packages/drivers/firestore/src/lib/firestore-driver.ts(2,14)`: `error TS2515: Non-abstract class 'LFirestore' does not implement inherited abstract member create from class 'LDriver'.`
- **IndexedDB Driver:**
  - `packages/drivers/indexeddb/src/lib/indexeddb-driver.spec.ts(1,33)`: `error TS2307: Cannot find module './indexeddb-driver' or its corresponding type declarations.`
- **Supabase Driver:**
  - أخطاء عديدة متعلقة بفقدان أنواع `IRelationalBase`, `LDriverCapabilities`, `LListMeta`, `LUniqueFilter`, `LWhereFilter`, `LSortFilter`, `LCursor`, `LRefineOptions`, `LMutationResult`, `LBatchOp`, `LBatchResult`, `LDriverError`, `IDriverTransaction`, `LDriverEvent`, `LDriverErrorCode` وتوافق الـ Promises وحقول الضمنية `any`.

## 3. أخطاء uni-reactive adapters (خارج نطاق المرحلة 1)
- **React Reactive:**
  - `packages/uni-reactive/adapters/react-reactive/src/index.ts(38,53)`: `error TS2322: Type 'ReactReactive<T | Signal<T>>' is not assignable to type 'IReactive<T>'.`
- **Vue Reactive:**
  - `packages/uni-reactive/adapters/vue-reactive/src/index.ts(18,7)`: `error TS6133: 're' is declared but its value is never read.`
  - `packages/uni-reactive/adapters/vue-reactive/src/index.ts(39,51)`: `error TS2322: Type 'VueReactive<T | Signal<T>>' is not assignable to type 'IReactive<T>'.`

---
تُستخدم هذه القائمة كمقياس (Baseline) للتحقق بعد تنفيذ كل مهمة وضمان عدم إدخال أخطاء جديدة.
