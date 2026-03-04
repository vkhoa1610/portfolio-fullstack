# Admin Dashboard — `/admin`

## Process Flow

```
Mount AdminDashboardView
  → isAdmin guard:
      !isAdmin && session !== null → router.replace('/not-found')
  → Hiển thị grid 5 cards
      [User Management]   → router.push('/admin/users')
      [Import Users]      → router.push('/admin/import?tab=users')
      [Import Permissions]→ router.push('/admin/import?tab=permissions')
      [CMS Management]    → disabled (coming soon)
      [Screen Configs]    → disabled (coming soon)
```

---

## Route

| Path | Page | Component |
|------|------|-----------|
| `/admin` | `app/(protected)/admin/page.tsx` | `components/admin/admin-dashboard-view.tsx` |

---

## Auth Guard

```typescript
const { isAdmin, isLoading, session } = useAuth();
useEffect(() => {
  if (!isLoading && session !== null && !isAdmin) {
    router.replace('/not-found');
  }
}, [isLoading, session, isAdmin, router]);
```

- `session === null` → đang load hoặc chưa login (không redirect — tránh flicker)
- `session !== null && !isAdmin` → đã login nhưng không phải admin → `/not-found`

---

## UI Layout

```
Admin Dashboard
  [card] Users          — icon: Users
  [card] Import Users   — icon: Upload
  [card] Import Perms   — icon: FileText
  [card, disabled] CMS Management   — "Coming soon" badge
  [card, disabled] Screen Configs   — "Coming soon" badge
```

---

## RTK Query / API Calls

Không có — màn này chỉ navigation.
