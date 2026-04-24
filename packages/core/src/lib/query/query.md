بناء `lQuery` — Functor يحمل الـ find args ويُتيح تعديلها reactively.

**المطلوب:**

`lQuery(schema, defaultArgs)` يُرجع callable object:
- `postQuery()` → `Signal<FindManyArgs>` — الحالة الحالية
- `postQuery.modify(object)` → replace كامل
- `postQuery.modify(callback)` → merge مع الـ current
- `postQuery.modify({})` → reset للـ default

**النمط المطلوب:** Class Instance → Factory Function → Functor

**القيود:**
- لا يُنفّذ find — دور `list`
- يتلقّى الـ `IReactive` من `lSetting` ولا يعرف الـ framework مباشرة
- الـ schema يُحفظ للاستخدام لاحقاً من `list`

**ابدأ بـ:**
1. الـ instances الداخلية مع مسؤولية كل واحدة
2. الـ factory التي تجمّعها
3. الـ functor النهائي