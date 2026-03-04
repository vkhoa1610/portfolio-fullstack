# Admin Function APIs — /api/v1/admin/users/{sub}/functions

> Chỉ dành cho `system_admins`. Function IDs kiểm soát UI elements trong CMS.

## GET /api/v1/admin/users/{sub}/functions

### API Endpoint

- **Method**: GET
- **Path**: `/api/v1/admin/users/{sub}/functions`
- **Auth**: Bearer idToken — chỉ system_admins

### Input (Path Params)

| Field | Required | Type |
|-------|----------|------|
| sub | ✅ | string |

### Output

```json
[1, 2]
```

---

## POST /api/v1/admin/users/{sub}/functions

### Process Flow

```
Admin gọi với { functionKey }
  → Kiểm tra system_admins
  → Lookup function_id từ function_key trong bảng functions
  → INSERT INTO items (cognito_sub, function_id, granted_by)
  → Trả success
```

### API Endpoint

- **Method**: POST
- **Path**: `/api/v1/admin/users/{sub}/functions`
- **Auth**: Bearer idToken — chỉ system_admins

### Input

| Field | Required | Type | Ghi chú |
|-------|----------|------|---------|
| sub | ✅ | string | Path param |
| functionKey | ✅ | string | Body — ví dụ: `EXPENSE_ACCEPT` |

### Output

| Field | Required | Type |
|-------|----------|------|
| processStatus | ✅ | number |
| message | ✅ | string[] |

---

## DELETE /api/v1/admin/users/{sub}/functions/{key}

### API Endpoint

- **Method**: DELETE
- **Path**: `/api/v1/admin/users/{sub}/functions/{key}`
- **Auth**: Bearer idToken — chỉ system_admins

### Input (Path Params)

| Field | Required | Type |
|-------|----------|------|
| sub | ✅ | string |
| key | ✅ | string |

### Output

| Field | Required | Type |
|-------|----------|------|
| processStatus | ✅ | number |
| message | ✅ | string[] |

---

## Bảng functions hiện tại

| ID | function_key | Màn hình |
|----|-------------|---------|
| 1 | `EXPENSE_ACCEPT` | manager/approvals/:id — nút Approve |
| 2 | `EXPENSE_REJECT` | manager/approvals/:id — nút Reject + form |
| 3 | `FINANCE_VIEW_OVERVIEW` | finance/overview |
| 4 | `FINANCE_EXPORT` | finance/export |
