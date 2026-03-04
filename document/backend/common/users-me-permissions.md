# GET /api/v1/users/me/permissions

## Process Flow

```
BFF gọi sau khi Cognito auth thành công (com-001/002/003/004)
  → Backend giải mã idToken → lấy cognitoSub
  → Query DB: user_permissions JOIN permissions WHERE user_sub = cognitoSub
  → Trả List<String> permission codes cho BFF
  → BFF thêm vào UISession.permissions
```

---

## API Endpoint

- **Method**: GET
- **Path**: `/api/v1/users/me/permissions`
- **Auth**: Bearer idToken (từ BFF)

---

## Input

Không có request body / query params. Identity lấy từ JWT token.

---

## Output (Response)

Danh sách permission codes dạng string array:

```json
["EXPENSE_APPROVE", "EXPENSE_REJECT"]
```

| Kiểu | Mô tả |
|------|-------|
| `string[]` | Danh sách permission codes của user hiện tại |

---

## SQL

```sql
SELECT p.permission_code
FROM user_permissions up
JOIN permissions p ON up.permission_id = p.id
WHERE up.user_sub = #{cognitoSub}
  AND p.is_deleted = 0;
```

---

## Permission Codes hiện tại

| Code | Mô tả |
|------|-------|
| `EXPENSE_APPROVE` | Phê duyệt expense |
| `EXPENSE_REJECT` | Từ chối expense |
| `FINANCE_VIEW` | Xem tổng quan finance |
| `FINANCE_EXPORT` | Export báo cáo finance |
