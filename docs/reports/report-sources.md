# تقرير تصميم منظومة المصادر `sources` — المرحلة 2 (`docs/reports/report-sources.md`)

## 1. جرد الوضع الحالي (Current State Inventory)

- **طريقة التسجيل والتخزين الحالية:**
  تعتمد المكتبة اليوم في `packages/drivers/abstract/src/index.ts` على دالة `registerDriver(driver: LDriver)` لتخزين متغير عالمي مفرد `regitredDriver: LDriver` (مع وجود خطأ مطبعي في اسم المتغير)، ويتم التعريض للمستخدم عبر `lSetting.driver(d: LDriver)` في `packages/core/src/lib/setting.ts`.
- **المستهلكون (Consumers):**
  - `packages/core/src/lib/list/list.ts`: يستدعي `getDriver()` لتلقي السائق واستدعاء `driver.ensureReady(schemas)` متبوعاً بـ `driver.create(...)`.
  - `playgrounds/angular/angular-plg/src/app/app.ts`: يستدعي `lSetting.driver(lIndexeddb())`.

---

## 2. تصميم الأنواع المقترح (Proposed Type Definitions)

### أ) `LDriverCapabilities`
مصفوفة/كائن Flags تحدد الميزات المدعومة من قبل السائق:
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
}
```

### ب) `IDataDriver` و Base Class المقترح
العقد الذي يحكم سائق البيانات:
```typescript
export interface IDataDriver {
  readonly capabilities: LDriverCapabilities;
  serializeId(id: unknown): string;
  deserializeId(id: string): unknown;
  ensureReady(schemas: any): Promise<void>;
  create(list: string, input: any): Promise<any>;
  update(list: string, where: any, input: any): Promise<any>;
  delete(list: string, where: any): Promise<any>;
  findUnique(list: string, where: any): Promise<any>;
}
```

#### حماية السباق `race` والجاهزية عبر `LDataDriver` (Base Class):
لتجنب استدعاء أي عملية قبل جاهزية المحرك، يلتف الـ Base Class على استدعاءات العمليات التشغيلية بحماية تلقائية:
```typescript
export abstract class LDataDriver implements IDataDriver {
  abstract readonly capabilities: LDriverCapabilities;
  private _readyPromise: Promise<void> | null = null;
  private _isReady = false;

  async ensureReady(schemas: any): Promise<void> {
    if (this._isReady) return;
    if (!this._readyPromise) {
      this._readyPromise = this._init(schemas).then(() => {
        this._isReady = true;
      });
    }
    return this._readyPromise;
  }

  protected abstract _init(schemas: any): Promise<void>;

  serializeId(id: unknown): string {
    return String(id);
  }

  deserializeId(id: string): unknown {
    return id;
  }

  // العمليات المحمية
  async create(list: string, input: any): Promise<any> {
    await this.ensureReady(null);
    return this._create(list, input);
  }

  async update(list: string, where: any, input: any): Promise<any> {
    await this.ensureReady(null);
    return this._update(list, where, input);
  }

  async delete(list: string, where: any): Promise<any> {
    await this.ensureReady(null);
    return this._delete(list, where);
  }

  async findUnique(list: string, where: any): Promise<any> {
    await this.ensureReady(null);
    return this._findUnique(list, where);
  }

  protected abstract _create(list: string, input: any): Promise<any>;
  protected abstract _update(list: string, where: any, input: any): Promise<any>;
  protected abstract _delete(list: string, where: any): Promise<any>;
  protected abstract _findUnique(list: string, where: any): Promise<any>;
}
```

### ج) `IFilesDriver` (الحد الأدنى)
```typescript
export interface IFilesDriver {
  put(path: string, file: Blob | Buffer | Uint8Array, options?: any): Promise<{ path: string; url?: string }>;
  get(path: string): Promise<Blob | Buffer | Uint8Array>;
  remove(path: string): Promise<void>;
  getUrl(path: string): Promise<string>;
}
```
*ما تم تأجيله في الملفات:* المزامنة المحلية للذاكرة المؤقتة (local cache storage) والدعم للعمليات المتقدمة كـ multipart uploads والتعامل مع الإذونات المتقدمة.

### د) `LSourcesConfig` و `LSourceRole`
```typescript
export type LSourceRole = 'primary' | 'replica';

export interface LSourceDefinition {
  data: IDataDriver;
  files?: IFilesDriver;
}

export interface LSourcesConfig {
  primary: LSourceDefinition;
  replica?: LSourceDefinition;
  // نقطة توسعة مستقبلية كـ analytics, cache الخ.
}
```

---

## 3. السجل التجاري والتحقق (Registry Logic)

- يتم الاحتفاظ بالكائنات المسجلة في الذاكرة عبر السجل الخاص بـ `drivers/abstract`:
```typescript
let sourcesConfig: LSourcesConfig | null = null;

export function registerSources(config: LSourcesConfig): void {
  if (sourcesConfig) {
    throw new LError({
      code: 'OP/INVALID',
      message: 'Sources have already been registered. Duplicate registration is forbidden.',
    });
  }

  if (!config || !config.primary || !config.primary.data) {
    throw new LError({
      code: 'VALIDATION/REQUIRED',
      message: 'Primary data source is required in LSourcesConfig.',
    });
  }

  if (config.replica && config.primary.data === config.replica.data) {
    throw new LError({
      code: 'OP/INVALID',
      message: 'Primary and Replica cannot use the exact same IDataDriver instance.',
    });
  }

  sourcesConfig = config;
}

export function getPrimarySource(): LSourceDefinition {
  if (!sourcesConfig) {
    throw new LError({
      code: 'DRIVER/CONNECTION',
      message: 'No sources registered. Call lSetting.sources(...) first.',
    });
  }
  return sourcesConfig.primary;
}

export function getReplicaSource(): LSourceDefinition | undefined {
  return sourcesConfig?.replica;
}
```

---

## 4. النطاق الوظيفي والـ Replica (Functional Scope)

- الـ Core سيتفاعل ويقرأ/يكتب حصريًا من الـ `primary.data` في هذه المرحلة.
- الـ `replica` سيكون صياغة لنية المعمارية فقط دون محرك مزامنة نشط في MVP.

### أسئلة مفتوحة حول عقد الـ Replica التجريبي:
1. **اتجاه المزامنة (Sync Direction):** هل المزامنة ثنائية الاتجاه (Bi-directional) أم أحادية الاتجاه من المصدر المحلي للبعيد (Primary-to-Replica Push only)؟
2. **استراتيجية حسم التعارض (Conflict Resolution):** عند وقوع تعارض في البيانات، هل المرجع دائماً هو الـ Replica (Server Wins) أم يعتمد على الـ Last-Write-Wins بناء على Timestamp؟

---

## 5. خطة الانتقال (Migration Plan)

- **قرار الانتقال:** يتم حذف `lSetting.driver` بالكامل وتحديث `lSetting.sources` لتكون هي الواجهة الرسمية الوحيدة، نظراً لأن المكتبة غير منشورة بعد ولا داعي لـ Legacy Shims.
- **في الـ Playground:**
  سيتم استبدال الاستدعاء القديم:
  ```typescript
  lSetting.driver(lIndexeddb());
  ```
  بالشكل الحديث المعايَر:
  ```typescript
  lSetting.sources({
    primary: {
      data: lIndexeddb()
    }
  });
  ```

---

## 6. قائمة الأسئلة المفتوحة المواجهة لموافقتك (Open Questions)

1. **حذف `lSetting.driver`:** هل نعتمد حذف `lSetting.driver` نهائياً واستبدالها بـ `lSetting.sources` عبر الكود والـ playgrounds؟
2. **وراثة الكلاس `LIndexeddb`:** هل نغير وراثة `LIndexeddb` لترث من الكلاس الجديد `LDataDriver` وتطبيق دالة `capabilities` والافتراضات الجديدة؟

---
**أنا الآن متوقف بانتظار موافقتك على هذا التقرير والتصميم قبل البدء في التنفيذ (الخطوة ب).**
