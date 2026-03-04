# Admin — GET /api/v1/admin/users/{sub}/permissions/status

> Trả **toàn bộ danh sách permissions** kèm trạng thái 3-state của user.
> Khác với `GET /api/v1/admin/users/{sub}/permissions` (trả list code đang active).

## Process Flow

```
Admin gọi với idToken
  → requireAdmin(): kiểm tra system_admins
  → PermissionMapper.findAllPermissionsWithStateForUser(sub)
      LEFT JOIN user_permissions ON permission_id + user_sub
      CASE WHEN: ACTIVE / INACTIVE / NEVER_GRANTED
  → Trả List<UserPermissionStatusDto>
```

---

## API Endpoint

- **Method**: GET
- **Path**: `/api/v1/admin/users/{sub}/permissions/status`
- **Auth**: Bearer idToken — chỉ system_admins
- **Controller**: `AdminController.java`
- **DTO**: `UserPermissionStatusDto.java`

---

## Input (Path Params)

| Field | Required | Type | Ghi chú |
|-------|----------|------|---------|
| sub | ✅ | string | cognito_sub của user cần xem |

---

## Output

```json
[
  {
    "permissionCode": "EXPENSE_APPROVE",
    "description": "Approve expense reports",
    "state": "ACTIVE",
    "grantedBy": "system",
    "createdAt": "2026-03-01T10:00:00"
  },
  {
    "permissionCode": "EXPENSE_REJECT",
    "description": "Reject expense reports",
    "state": "INACTIVE",
    "grantedBy": "system",
    "createdAt": "2026-03-01T10:00:00"
  },
  {
    "permissionCode": "FINANCE_VIEW",
    "description": "View finance overview",
    "state": "NEVER_GRANTED",
    "grantedBy": null,
    "createdAt": null
  }
]
```

| Field | Type | Ghi chú |
|-------|------|---------|
| permissionCode | string | |
| description | string | |
| state | `ACTIVE` \| `INACTIVE` \| `NEVER_GRANTED` | |
| grantedBy | string \| null | null nếu NEVER_GRANTED |
| createdAt | string \| null | ISO datetime, null nếu NEVER_GRANTED |

---

## 3-State Logic (SQL)

```sql
SELECT p.permission_code, p.description,
  CASE
    WHEN up.user_sub IS NULL THEN 'NEVER_GRANTED'
    WHEN up.is_active = 1    THEN 'ACTIVE'
    ELSE                          'INACTIVE'
  END AS state,
  up.granted_by, up.created_at
FROM permissions p
LEFT JOIN user_permissions up
       ON up.permission_id = p.id AND up.user_sub = #{userSub}
WHERE p.is_deleted = 0
```

---

## Lỗi

| Status | Trường hợp |
|--------|-----------|
| 403 | Caller không phải system_admin |
