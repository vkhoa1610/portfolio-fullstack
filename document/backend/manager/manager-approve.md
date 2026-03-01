# PUT /api/v1/manager/expenses/:id/approve

## Process Flow

```
BFF gọi từ mgr-002 (kèm idToken)
  → Backend giải mã idToken → validate role = MANAGER
  → Query expense, validate status = PENDING_REVIEW
  → Update: status = APPROVED, reviewed_at = NOW(), reviewed_by = cognito_sub
  → Trả success
```

---

## API Endpoint

- **Method**: PUT
- **Path**: `/api/v1/manager/expenses/:id/approve`
- **Auth**: Bearer idToken — chỉ MANAGER role

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
SET status = 'APPROVED',
    reviewed_at = NOW(),
    reviewed_by = :cognito_sub
WHERE id = :id
  AND status = 'PENDING_REVIEW';
```
