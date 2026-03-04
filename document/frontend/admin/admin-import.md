# Admin Import — `/admin/import`

## Process Flow

```
Mount AdminImportView (tab từ useSearchParams: ?tab=users hoặc ?tab=permissions)
  → isAdmin guard → /not-found nếu không phải admin
  → Tab selection: "Import Users" | "Import Permissions"

[Tab content — ví dụ tab Users:]

  Step 1: Download Template
    → <a href="/api/adm-010/template/users"> → browser download CSV

  Step 2: File Upload
    → Drag & drop hoặc click upload zone
    → Chọn file .csv
    → FileReader.readAsText(file) → parse CSV → setPreviewRows

  Step 3: Preview
    → Hiển thị table header + rows (từ CSV header row)
    → [Confirm Import] button

  Step 4: Confirm
    → FormData.append('file', selectedFile)
    → useImportUsersMutation() → POST /api/adm-008/import/users
    → setImportResult(result)

  Step 5: Result
    → ✅ X thành công / ❌ Y thất bại
    → [Nếu có lỗi] Error table: Row | Message
```

---

## Route

| Path | Page | Component |
|------|------|-----------|
| `/admin/import` | `app/(protected)/admin/import/page.tsx` | `components/admin/admin-import-view.tsx` |

**Lưu ý**: Page phải wrap component trong `<Suspense>` vì `useSearchParams()` yêu cầu Suspense boundary trong Next.js:

```tsx
import { Suspense } from 'react';
export default function AdminImportPage() {
  return <Suspense><AdminImportView /></Suspense>;
}
```

---

## RTK Query

| Hook | Endpoint |
|------|----------|
| `useImportUsersMutation()` | adm-008 — POST /adm-008/import/users |
| `useImportPermissionsMutation()` | adm-009 — POST /adm-009/import/permissions |

---

## UI Layout

```
Admin Import

[Tab: Import Users] [Tab: Import Permissions]

────────────────────────────────────────────
  1. Download template
     [↓ Download users_template.csv]

  2. Upload file
     ┌─────────────────────────────────────┐
     │  Drag & drop CSV here               │
     │  or click to select                 │
     └─────────────────────────────────────┘
     (after file selected: "Selected: filename.csv")

  3. Preview (nếu đã chọn file)
     ┌──────────┬───────────┬─────────┐
     │ Email    │ Role      │ Budget  │
     ├──────────┼───────────┼─────────┤
     │ a@b.com  │ EMPLOYEE  │ 1500    │
     └──────────┴───────────┴─────────┘

     [Confirm Import]

  4. Result (sau khi import)
     ✅ 2 rows imported successfully
     ❌ 1 row failed

     ┌──────┬──────────────────────────────┐
     │ Row  │ Error                        │
     ├──────┼──────────────────────────────┤
     │  3   │ Email not found: x@y.com     │
     └──────┴──────────────────────────────┘
```

---

## CSV Preview (Browser-side)

Không dùng SheetJS — parse CSV thuần JavaScript:

```typescript
const text = await file.text(); // hoặc FileReader.readAsText
const lines = text.split('\n').filter(Boolean);
const headers = lines[0].split(',');
const rows = lines.slice(1).map((line) => {
  const values = line.split(',');
  return Object.fromEntries(headers.map((h, i) => [h.trim(), values[i]?.trim() ?? '']));
});
setPreviewRows(rows);
```

---

## Tab Query Param

```typescript
const searchParams = useSearchParams();
const tab = searchParams.get('tab') ?? 'users'; // 'users' | 'permissions'
```

Điều hướng từ Dashboard: `/admin/import?tab=users` hoặc `?tab=permissions`.
