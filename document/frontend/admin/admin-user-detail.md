# Admin User Detail — `/admin/users/:sub`

## Process Flow

```
Mount AdminUserDetailView (props: sub = cognito_sub từ URL)
  → isAdmin guard → /not-found nếu không phải admin
  → RTK Query (parallel):
      useGetUserPermissionsQuery(sub)  → GET /api/adm-002/:sub/permissions
      useGetUserFunctionsQuery(sub)    → GET /api/adm-005/:sub/functions
  → Hiển thị 2 sections: Permissions + UI Functions

[Toggle permission:]
  → ACTIVE   → click "Deactivate" → useRevokePermissionMutation()
                  POST DELETE /api/adm-004/:sub/permissions/:code
                  invalidatesTags: ['UserPermissions'] → tự refresh
  → INACTIVE → click "Activate"   → useGrantPermissionMutation()
                  POST /api/adm-003/:sub/permissions { permissionCode }
                  invalidatesTags: ['UserPermissions']
  → NEVER_GRANTED → click "Grant" → useGrantPermissionMutation()

[Toggle function — logic tương tự:]
  → dùng useGrantFunctionMutation / useRevokeFunctionMutation (adm-006/007)
```

---

## Route

| Path | Page | Component |
|------|------|-----------|
| `/admin/users/:sub` | `app/(protected)/admin/users/[sub]/page.tsx` | `components/admin/admin-user-detail-view.tsx` |

Page là `async` — unwrap params trước khi pass `sub` xuống component:

```tsx
export default async function AdminUserDetailPage({ params }: Props) {
  const { sub } = await params;
  return <AdminUserDetailView sub={sub} />;
}
```

---

## RTK Query

| Hook | Tag | Invalidated by |
|------|-----|---------------|
| `useGetUserPermissionsQuery(sub)` | `UserPermissions` | adm-003, adm-004 |
| `useGetUserFunctionsQuery(sub)` | `UserFunctions` | adm-006, adm-007 |
| `useGrantPermissionMutation()` | — | invalidates `UserPermissions` |
| `useRevokePermissionMutation()` | — | invalidates `UserPermissions` |
| `useGrantFunctionMutation()` | — | invalidates `UserFunctions` |
| `useRevokeFunctionMutation()` | — | invalidates `UserFunctions` |

---

## UI Layout

```
← Back    [sub / cognito_sub title]

─── Permissions ──────────────────────────────
Code             Description   State           Action
EXPENSE_APPROVE  Approve...    🟢 Active        [Deactivate]
EXPENSE_REJECT   Reject...     🟡 Inactive      [Activate]
FINANCE_VIEW     View...       ⚪ Never Granted  [Grant]
FINANCE_EXPORT   Export...     ⚪ Never Granted  [Grant]

─── UI Functions ─────────────────────────────
Key                   Module   State           Action
EXPENSE_ACCEPT        MANAGER  🟢 Active        [Deactivate]
EXPENSE_REJECT        MANAGER  ⚪ Never Granted  [Grant]
FINANCE_VIEW_OVERVIEW FINANCE  ⚪ Never Granted  [Grant]
FINANCE_EXPORT        FINANCE  ⚪ Never Granted  [Grant]
```

---

## 3-State Badge & Button

| State | Badge class | Button label | Button style |
|-------|-------------|--------------|--------------|
| `ACTIVE` | `bg-green-100 text-green-700` | Deactivate | red outline |
| `INACTIVE` | `bg-amber-100 text-amber-700` | Activate | primary outline |
| `NEVER_GRANTED` | `bg-neutral-100 text-neutral-500` | Grant | primary outline |

---

## Types

```typescript
type PermissionState = 'ACTIVE' | 'INACTIVE' | 'NEVER_GRANTED';

interface PermissionStatus {
  permissionCode: string;
  description: string;
  state: PermissionState;
  grantedBy?: string;
  createdAt?: string;
}

interface FunctionStatus {
  functionId: number;
  functionKey: string;
  module: string;
  description: string;
  state: PermissionState;
}
```
