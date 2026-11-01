# وثيقة `lQuery`

> الواجهة الرسمية والتفاعلية لقراءة البيانات في **ListedBase**.

---

## 1. الفلسفة العامة

`lQuery` هي الطريقة الوحيدة لقراءة البيانات في المكتبة. تتسم بكونها **Reactive** بالكامل:
تتحدّث نتائج البيانات وحالتها والعدد تلقائياً إما عند تعديل معاملات الاستعلام (`modify`) أو عند حدوث أي عملية كتابة (`create`, `update`, `delete`) في الـ `list`.

---

## 2. أشكال الاستخدام (Overload Forms)

### أ) Many Query
قراءة مجموعة من السجلات مع دعم التصفية والترتيب والتصفح:
```typescript
const posts = list(postSchema);
const q = lQuery(posts, {
  where: { published: true },
  sort: { createdAt: 'desc' },
  take: 20,
});

// قراءة البيانات (في Angular تعيد Signal<Post[]>)
const data = q.data();

// تعديل الاستعلام reactively
q.modify((prev) => ({ ...prev, take: 50 }));

// التصفح التراكمي
if (q.hasNext()) {
  await q.loadNext();
}
```

### ب) IDs Query
قراءة سجلات محددة بمصفوفة معرفات مع الحفاظ الصارم على ترتيب المدخلات:
```typescript
const q = lQuery(posts, ['id-3', 'id-1', 'id-2']);
const items = q.data(); // [item3, item1, item2]
```

### ج) Single Query
قراءة سجل وحيد (`T | null`):
```typescript
const q = lQuery.single(posts, {
  where: { id: 'post-123' },
});
const post = q.data();
```

---

## 3. مؤشرات الحالة `status()`

تتيح دالة `status()` اختيار ومراقبة المؤشرات المطلوبة فقط دون تكلفة استعلامات إضافية:
```typescript
const { count, error, loading, refreshing } = q.status({
  count: true,
  error: true,
  loading: true,
  refreshing: true,
});
```

---

## 4. إنهاء الاستماع `destroy()`
```typescript
q.destroy();
```
توقف الدالة الاستماع إلى أحداث القائمة وتلغي أي استجابات متأخرة استناداً لمبدأ Latest-Wins.
