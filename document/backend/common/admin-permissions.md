# Admin Permission APIs — /api/v1/admin/users/{sub}/permissions

> Chỉ dành cho `system_admins`. Không phải MANAGER hay FINANCE thông thường.

## GET /api/v1/admin/users/{sub}/permissions

### Process Flow

```
Admin gọi với idToken
  → Backend kiểm tra cognitoSub trong system_admins
  → Query user_permissions JOIN permissions WHERE user_sub = :sub
  → Trả List<String> permission codes
```

### API Endpoint

- **Method**: GET
- **Path**: `/api/v1/admin/users/{sub}/permissions`
- **Auth**: Bearer idToken — chỉ system_admins

### Input (Path Params)

| Field | Required | Type | Ghi chú |
|-------|----------|------|---------|
| sub | ✅ | string | cognito_sub của user cần xem |

### Output

```json
["EXPENSE_APPROVE", "EXPENSE_REJECT"]
```

---

## POST /api/v1/admin/users/{sub}/permissions

### Process Flow

```
Admin gọi với { permissionCode }
  → Kiểm tra system_admins
  → Lookup permission_id từ permission_code
  → INSERT INTO user_permissions (user_sub, permission_id, granted_by)
  → Trả success
```

### API Endpoint

- **Method**: POST
- **Path**: `/api/v1/admin/users/{sub}/permissions`
- **Auth**: Bearer idToken — chỉ system_admins

### Input

| Field | Required | Type | Ghi chú |
|-------|----------|------|---------|
| sub | ✅ | string | Path param — cognito_sub |
| permissionCode | ✅ | string | Body — ví dụ: `EXPENSE_APPROVE` |

### Output

| Field | Required | Type |
|-------|----------|------|
| processStatus | ✅ | number |
| message | ✅ | string[] |

---

## DELETE /api/v1/admin/users/{sub}/permissions/{code}

### Process Flow

```
Admin gọi DELETE
  → Kiểm tra system_admins
  → Lookup permission_id từ code
  → DELETE FROM user_permissions WHERE user_sub = :sub AND permission_id = :id
  → Trả success
```

### API Endpoint

- **Method**: DELETE
- **Path**: `/api/v1/admin/users/{sub}/permissions/{code}`
- **Auth**: Bearer idToken — chỉ system_admins

### Input (Path Params)

| Field | Required | Type |
|-------|----------|------|
| sub | ✅ | string |
| code | ✅ | string |

### Output

| Field | Required | Type |
|-------|----------|------|
| processStatus | ✅ | number |
| message | ✅ | string[] |
