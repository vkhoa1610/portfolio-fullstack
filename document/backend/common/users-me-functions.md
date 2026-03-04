# GET /api/v1/users/me/functions

## Process Flow

```
BFF gọi sau khi Cognito auth thành công (com-001/002/003/004)
  → Backend giải mã idToken → lấy cognitoSub
  → Query DB: items JOIN functions WHERE cognito_sub = cognitoSub
  → Trả List<Integer> function IDs cho BFF
  → BFF thêm vào UISession.functions
  → Frontend: hasFunctionId(id) ẩn/hiện node trong CMS
```

---

## API Endpoint

- **Method**: GET
- **Path**: `/api/v1/users/me/functions`
- **Auth**: Bearer idToken (từ BFF)

---

## Input

Không có request body / query params. Identity lấy từ JWT token.

---

## Output (Response)

Danh sách function IDs dạng integer array:

```json
[1, 2]
```

| Kiểu | Mô tả |
|------|-------|
| `number[]` | Danh sách function IDs của user hiện tại |

---

## SQL

```sql
SELECT f.id
FROM items i
JOIN functions f ON i.function_id = f.id
WHERE i.cognito_sub = #{cognitoSub}
  AND f.is_deleted = 0;
```

---

## Function IDs hiện tại

| ID | function_key | Mô tả |
|----|-------------|-------|
| 1 | `EXPENSE_ACCEPT` | Nút Approve trên màn approval detail |
| 2 | `EXPENSE_REJECT` | Nút Reject + form trên màn approval detail |
| 3 | `FINANCE_VIEW_OVERVIEW` | Xem finance overview |
| 4 | `FINANCE_EXPORT` | Export báo cáo |
