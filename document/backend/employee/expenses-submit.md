# POST /api/v1/expenses/:id/submit

## Process Flow

```
BFF gọi từ emp-006 (kèm idToken)
  → Backend giải mã idToken → lấy cognito_sub
  → Query expense, validate: thuộc user này và status = DRAFT
  → Update: status = PENDING_REVIEW, submitted_at = NOW()
  → Trả success
```

---

## API Endpoint

- **Method**: POST
- **Path**: `/api/v1/expenses/:id/submit`
- **Auth**: Bearer idToken

---

## Input (Path Params)

| Field | Required | Type   |
|-------|----------|--------|
| id    | ✅       | number |

Không có request body.

---

## Output (Response)

| Field         | Required | Type     |
|---------------|----------|----------|
| processStatus | ✅       | number   |
| message       | ✅       | string[] |

---

## SQL

```sql
UPDATE expenses
SET status = 'PENDING_REVIEW',
    submitted_at = NOW()
WHERE id = :id
  AND user_sub = :cognito_sub
  AND status = 'DRAFT';
```
