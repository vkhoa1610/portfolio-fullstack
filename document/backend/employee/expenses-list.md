# GET /api/v1/expenses

## Process Flow

```
BFF gọi từ emp-004 (kèm idToken)
  → Backend giải mã idToken → lấy cognito_sub
  → Query expenses của user đó (tất cả status)
  → Trả Expense[]
```

---

## API Endpoint

- **Method**: GET
- **Path**: `/api/v1/expenses`
- **Auth**: Bearer idToken

---

## Input

Không có request body / query params. User identity từ JWT.

---

## Output (Response)

Mảng `Expense[]`. Xem schema đầy đủ tại [expenses-detail.md](expenses-detail.md).

---

## SQL

```sql
SELECT *
FROM expenses
WHERE user_sub = :cognito_sub
ORDER BY created_at DESC;
```
