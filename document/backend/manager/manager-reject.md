# PUT /api/v1/manager/expenses/:id/reject

## Process Flow

```
BFF gọi từ mgr-003 (kèm idToken + { rejectionReason })
  → Backend giải mã idToken → validate role = MANAGER
  → Query expense, validate status = PENDING_REVIEW
  → Update: status = REJECTED, rejection_reason = :reason,
            reviewed_at = NOW(), reviewed_by = cognito_sub
  → Trả success
```

---

## API Endpoint

- **Method**: PUT
- **Path**: `/api/v1/manager/expenses/:id/reject`
- **Auth**: Bearer idToken — chỉ MANAGER role

---

## Input

### Path Params

| Field | Required | Type   |
|-------|----------|--------|
| id    | ✅       | number |

### Request Body

| Field           | Required | Type   |
|-----------------|----------|--------|
| rejectionReason | ✅       | string |

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
SET status = 'REJECTED',
    rejection_reason = :rejectionReason,
    reviewed_at = NOW(),
    reviewed_by = :cognito_sub
WHERE id = :id
  AND status = 'PENDING_REVIEW';
```
