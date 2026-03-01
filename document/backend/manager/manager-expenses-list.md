# GET /api/v1/manager/expenses

## Process Flow

```
BFF gọi từ mgr-001 (kèm idToken)
  → Backend giải mã idToken → validate role = MANAGER
  → Query tất cả expenses có status = PENDING_REVIEW
  → Trả Expense[]
```

---

## API Endpoint

- **Method**: GET
- **Path**: `/api/v1/manager/expenses`
- **Auth**: Bearer idToken — chỉ MANAGER role

---

## Input

Không có request body / query params.

---

## Output (Response)

Mảng `Expense[]` — chỉ status `PENDING_REVIEW`. Schema xem [expenses-detail.md](../employee/expenses-detail.md).

---

## SQL

```sql
SELECT *
FROM expenses
WHERE status = 'PENDING_REVIEW'
ORDER BY submitted_at ASC;
```
