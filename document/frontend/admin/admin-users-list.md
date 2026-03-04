# Admin Users List — `/admin/users`

## Process Flow

```
Mount AdminUsersListView
  → isAdmin guard → /not-found nếu không phải admin
  → RTK Query: useGetAdminUsersQuery() → GET /api/adm-001/users
  → Hiển thị search input + danh sách UserRow
  → Client-side filter theo email hoặc role (toLowerCase includes)
  → Click row → router.push('/admin/users/{cognitoSub}')
```

---

## Route

| Path | Page | Component |
|------|------|-----------|
| `/admin/users` | `app/(protected)/admin/users/page.tsx` | `components/admin/admin-users-list-view.tsx` |

---

## RTK Query

```typescript
const { data: users = [], isLoading } = useGetAdminUsersQuery();
// tag: 'AdminUsers' (adm-001)
```

---

## UI Layout

```
User Management
  [Search input] — filter by email / role

  [UserRow] email@example.com
              Status: DONE · Budget: 1500.00 €
              [EMPLOYEE badge]  [→]

  [UserRow] manager@example.com
              Status: DONE · Budget: 0.00 €
              [MANAGER badge]   [→]
```

---

## Role Badge Colors

| Role | Tailwind class |
|------|---------------|
| EMPLOYEE | `bg-blue-100 text-blue-700` |
| MANAGER | `bg-purple-100 text-purple-700` |
| FINANCE | `bg-green-100 text-green-700` |
| (không có) | `bg-neutral-100 text-neutral-400` — label "No role" |

---

## Filter Logic

```typescript
const filtered = users.filter(
  (u) =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.role ?? '').toLowerCase().includes(search.toLowerCase()),
);
```

---

## Types

```typescript
interface AdminUser {
  cognitoSub: string;
  email: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'FINANCE' | null;
  onboardingStatus: 'PENDING' | 'DONE' | null;
  budget: number | null;
}
```
