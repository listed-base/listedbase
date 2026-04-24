openCode rules
for report create report-{entity}.md in arabic lang
# ListedBase — Developer Introduction

> وثيقة داخلية موجّهة لمطوّر يريد فهم المكتبة من الداخل والمساهمة في بنائها.

---

## ما هي ListedBase؟

ListedBase مكتبة TypeScript تبني **Universal Data Layer (UDL)** للـ frontend apps. الهدف: المطوّر يعرّف الـ schema مرة واحدة، والمكتبة توفّر له استعلامات متزامنة مع الـ UI وأي تغيير في البيانات — بدون boilerplate، وبصرف النظر عن محرك التخزين.

الفلسفة الأساسية: **الـ schema هو مصدر الحقيقة الوحيد.** منه تُشتق الـ types، والـ queries، والـ mutations، والـ migrations.

---

## المعمارية العامة

```
┌─────────────────────────────────┐
│            Your App             │
├─────────────────────────────────┤
│         Core (listedbase)       │
│   lSchema · lQuery · list       │
├────────────────┬────────────────┤
│   Consumer     │     Driver     │
│  uni-reactive  │   IDriver      │
└────────────────┴────────────────┘
```

ثلاث طبقات بمسؤوليات واضحة ومنفصلة:

**Driver** — abstract contract يُجرّد محرك التخزين. stateless تماماً، لا يعرف شيئاً عن الـ reactivity أو الـ UI. يتلقّى أوامر من الـ Core وينفّذها. `lIndexeddb` هو التنفيذ الجزئي الحالي لهذا الـ contract في الـ MVP.

**Core** — القلب. يُدير الـ schema، الـ queries، الـ mutations، والـ type system. لا يعرف شيئاً عن الـ framework أو الـ driver المحدد — يتعامل معهما عبر contracts.

**Consumer (uni-reactive)** — يُحوّل نتائج الـ Core إلى reactive primitives خاصة بالـ framework. في الـ MVP: Angular Signals فقط.

---

## تدفق البيانات

```
lSchema
   │
   ▼
lQuery(schema, defaultArgs)
   │  يحمل: find args الافتراضية
   │  يقبل: modify() لتحديثها
   │
   ▼
list(query)
   │  يراقب: تغييرات الـ query
   │  يراقب: تغييرات البيانات (mutations)
   │  يُجري: create / update / delete
   ▼
Signal<Post[]>  ←── Angular component
```

---

## MVP Scope

| الجزء | الحالة |
|---|---|
| `lSchema` / `lField` — type system | ✅ مكتمل |
| `IDriver` contract | ✅ مكتمل |
| `lIndexeddb` — تنفيذ جزئي + auto migration | 🔧 غير مكتمل |
| `lAngularReactive` consumer | 🔧 قريب من الاكتمال |
| `lQuery` + `list` — public API | 🔧 قيد البناء |

---

## Design Patterns في الـ Core

الـ Core يتبع ثلاثة patterns ثابتة في بناء كل وحدة. فهم هذه الـ patterns شرط أساسي قبل المساهمة.

---

### 1. Class Instance

الوحدة الأساسية في الـ Core. كل `class` يحمل **مسؤولية واحدة فقط** ولا يعرف شيئاً عمّا حوله.

المبادئ:
- مسؤولية واحدة محددة (Single Responsibility)
- state خاص به لا يُشارَك مباشرة
- لا يستدعي instances أخرى بنفسه — يتلقّى ما يحتاجه عبر الـ constructor

```typescript
class QueryStateInstance {
  private args: FindManyArgs

  constructor(
    private readonly schema: LSchema,
    defaultArgs: FindManyArgs,
  ) {
    this.args = defaultArgs
  }

  read(): FindManyArgs {
    return this.args
  }

  modify(next: FindManyArgs): void {
    this.args = next
  }
}
```

---

### 2. Factory Function

الواجهة الوحيدة التي يراها المستخدم. تُنشئ الـ instances الداخلية، تُجمّعها، وتُرجع object جاهز للاستخدام. الـ instances مخفية تماماً خلفها.

المبادئ:
- تُنشئ الـ instances وتربطها
- تحقن الـ dependencies (driver, consumer) من `lSetting`
- تُرجع واجهة نظيفة — المستخدم لا يرى الـ instances أبداً

```typescript
function lQuery(schema: LSchema, defaultArgs: FindManyArgs) {
  const state = new QueryStateInstance(schema, defaultArgs)

  // ترجع object يحمل الـ methods فقط
  return {
    read:   () => state.read(),
    modify: (next: FindManyArgs) => state.modify(next),
  }
}
```

---

### 3. Functor (Callable Object)

عندما تحتاج الواجهة أن تكون **قابلة للاستدعاء كـ function** وتحمل methods في نفس الوقت. يُستخدم هذا النمط في `lQuery` و`list` — المستخدم يستطيع أن يكتب `posts()` و`posts.create()` معاً.

المبادئ:
- `Object.assign` تجمع الـ callable function والـ methods
- الـ function الأساسية هي الـ "call" — الـ binding الرئيسي
- الـ methods الإضافية هي العمليات المرتبطة

```typescript
function list(query: LQueryInstance) {
  const bindingInstance  = new ListBindingInstance(query, ...)
  const mutationInstance = new ListMutationInstance(...)

  // callable  → posts()          يُرجع الـ Signal
  // methods   → posts.create()   يُجري الـ mutation
  return Object.assign(
    () => bindingInstance.bind(),
    {
      create:     mutationInstance.create.bind(mutationInstance),
      update:     mutationInstance.update.bind(mutationInstance),
      delete:     mutationInstance.delete.bind(mutationInstance),
      findUnique: mutationInstance.findUnique.bind(mutationInstance),
    }
  )
}
```

---

### العلاقة بين الثلاثة

```
Class Instance   →   يحمل المنطق والـ state
Factory Function →   تُنشئ الـ instances وتجمّعها
Functor          →   يُغلّف الـ factory output في callable object
```

كل جزء في الـ Core يمر بهذه المراحل الثلاث. إضافة أي feature جديد يعني: بناء الـ instance أولاً، ثم تضمينه في الـ factory، ثم تعريض ما يحتاجه المستخدم عبر الـ functor.

---

## Reactive Adapter — uni-reactive

المكتبة الداخلية التي تفصل الـ Core عن أي framework.

```typescript
interface IReactive<T> {
  readonly state: TReadonlyState<T>   // Signal<T> حسب الـ adapter
  init(initial: T): void
  modify(fn: (prev: T) => T): void
}
```

**ثلاثة مبادئ صارمة:**
- **Adapter واحد فقط** — لا يمكن تسجيل أكثر من adapter.
- **التسجيل إجباري** — غيابه خطأ compile-time.
- **النوع يُحسم compile-time** — `TReadonlyState<T>` تُرجع `Signal<T>` بدون أي casting.

---

## Driver Contract

```typescript
interface IDriver {
  findMany(args: FindManyArgs):   Promise<unknown[]>
  findUnique(where: UniqueWhere): Promise<unknown | null>
  create(opts: CreateOpts):       Promise<unknown>
  update(opts: UpdateOpts):       Promise<unknown>
  delete(opts: DeleteOpts):       Promise<unknown>
}
```

الـ driver يتلقّى `TWhere` كـ typed IR ويترجمه بنفسه لما يناسب محرك التخزين — لا Core logic داخل الـ driver. `lIndexeddb` هو التنفيذ الجزئي الحالي لهذا الـ contract.

---

## قرارات تصميمية مهمة

| القرار | التفاصيل |
|---|---|
| **string IDs فقط** | كل ID type يُسلسَل إلى `string` — لا generics معقّدة في الـ type system |
| **autogen في Core** | `lField.id.autogen()` — Core يُولّد الـ ID قبل أن يصل للـ driver |
| **autoIncrement في Driver** | الوحيد الذي لا يُغطّيه Core — الـ driver هو من يُولّده |
| **Relations lazy دائماً** | `() => lField.oneFrom(...)` — يكسر الـ circular reference بين الـ schemas |
| **Driver stateless** | لا يحمل state، لا يعرف الـ consumer — يُنفّذ الأمر ويُرجع النتيجة |
| **Serializer/Codec فوق Driver** | تحويل الأنواع (Date ↔ ISO string) في طبقة فوق الـ driver، ليس داخله |
| **TWhere كـ IR** | typed object — كل driver يترجمه بنفسه لما يناسبه |

---

## Beta Features

بعد اكتمال الـ MVP، سيُضاف دعم:

**File Driver** — تخزين الملفات عبر طبقتين: online-first storage و local cache storage.
```typescript
lSetting.filesDriver(onlineFirstStorage, localCacheStorage)
```

**Replica Driver** — مزامنة البيانات بين الـ driver المحلي وقاعدة بيانات خارجية (Firestore في البداية).
```typescript
lSetting.replicaWith(lFirestoreReplicaDriver)
```

كلاهما optional layers فوق الـ Core، لا يؤثران على الـ MVP API.

---

## Terminology

| Term | Meaning |
|---|---|
| `UDL` | Universal Data Layer — abstraction موحّد للبيانات |
| `lSchema` | تعريف الـ schema والـ fields — مصدر الحقيقة |
| `lField` | تعريف field واحد مع type والـ constraints |
| `lQuery` | Functor — reactive query definition |
| `list` | Functor — binding + mutations |
| `LInfer<S>` | يستخرج كل الـ TypeScript types من الـ schema |
| `IDriver` | Contract الـ driver |
| `lIndexeddb` | تنفيذ جزئي لـ IDriver على IndexedDB |
| `IReactive<T>` | Contract الـ consumer |
| `uni-reactive` | المكتبة الداخلية للـ reactive adapter system |
| `TReadonlyState<T>` | يرجع `Signal<T>` بناءً على الـ adapter المسجّل |
| `TWhere` | Typed IR للـ where filter |
| `lSetting` | نقطة التسجيل العالمية للـ driver والـ consumer |
| `autogen` | string ID تلقائي — Core يُولّده قبل الـ driver |
| `autoIncrement` | integer تلقائي — driver-managed فقط |
| `Class Instance` | وحدة تحمل مسؤولية واحدة ومنطقها الخاص |
| `Factory Function` | تُنشئ الـ instances وتجمّعها خلف واجهة نظيفة |
| `Functor` | callable object يجمع function و methods معاً |