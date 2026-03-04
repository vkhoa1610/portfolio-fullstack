# Admin — GET /api/v1/admin/users/{sub}/functions/status

> Trả **toàn bộ danh sách UI functions** kèm trạng thái 3-state của user.
> Khác với `GET /api/v1/admin/users/{sub}/functions` (trả list IDs đang active).

## Process Flow

```
Admin gọi với idToken
  → requireAdmin(): kiểm tra system_admins
  → FunctionMapper.findAllFunctionsWithStateForUser(sub)
      LEFT JOIN items ON function_id + cognito_sub
      CASE WHEN: ACTIVE / INACTIVE / NEVER_GRANTED
  → Trả List<UserFunctionStatusDto>
```

---

## API Endpoint

- **Method**: GET
- **Path**: `/api/v1/admin/users/{sub}/functions/status`
- **Auth**: Bearer idToken — chỉ system_admins
- **Controller**: `AdminController.java`
- **DTO**: `UserFunctionStatusDto.java`

---

## Input (Path Params)

| Field | Required | Type |
|-------|----------|------|
| sub | ✅ | string — cognito_sub của user |

---

## Output

```json
[
  {
    "functionId": 1,
    "functionKey": "EXPENSE_ACCEPT",
    "module": "MANAGER",
    "description": "Accept an expense report",
    "state": "ACTIVE"
  },
  {
    "functionId": 2,
    "functionKey": "EXPENSE_REJECT",
    "module": "MANAGER",
    "description": "Reject an expense report",
    "state": "NEVER_GRANTED"
  },
  {
    "functionId": 3,
    "functionKey": "FINANCE_VIEW_OVERVIEW",
    "module": "FINANCE",
    "description": "View finance overview page",
    "state": "INACTIVE"
  }
]
```

| Field | Type | Ghi chú |
|-------|------|---------|
| functionId | number | |
| functionKey | string | |
| module | string | MANAGER / FINANCE / ... |
| description | string | |
| state | `ACTIVE` \| `INACTIVE` \| `NEVER_GRANTED` | |

---

## 3-State Logic (SQL)

```sql
SELECT f.function_id, f.function_key, f.module, f.description,
  CASE
    WHEN i.cognito_sub IS NULL THEN 'NEVER_GRANTED'
    WHEN i.is_active = 1       THEN 'ACTIVE'
    ELSE                            'INACTIVE'
  END AS state
FROM functions f
LEFT JOIN items i
       ON i.function_id = f.function_id AND i.cognito_sub = #{cognitoSub}
WHERE f.is_deleted = 0
```

---

## Lỗi

| Status | Trường hợp |
|--------|-----------|
| 403 | Caller không phải system_admin |
