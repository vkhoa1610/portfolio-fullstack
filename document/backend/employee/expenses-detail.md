# GET /api/v1/expenses/:id

## Process Flow

```
BFF gọi từ emp-005 hoặc mgr-004 (kèm idToken)
  → Backend giải mã idToken → lấy cognito_sub
  → Query expense theo id
  → Validate: expense phải thuộc user hoặc user là MANAGER (nếu PENDING_REVIEW+)
  → Trả Expense object
```

---

## API Endpoint

- **Method**: GET
- **Path**: `/api/v1/expenses/:id`
- **Auth**: Bearer idToken

---

## Input (Path Params)

| Field | Required | Type   |
|-------|----------|--------|
| id    | ✅       | number |

---

## Output (Response)

| Field           | Required | Type   | Ghi chú                                         |
|-----------------|----------|--------|-------------------------------------------------|
| id              | ✅       | number |                                                 |
| userSub         | ✅       | string | Cognito sub của employee                        |
| type            | ✅       | string | `RECEIPT` \| `PER_DIEM` \| `MILEAGE`          |
| status          | ✅       | string | `DRAFT` \| `PENDING_REVIEW` \| `APPROVED` \| `REJECTED` |
| title           | ❌       | string |                                                 |
| amount          | ❌       | number |                                                 |
| currency        | ✅       | string |                                                 |
| vendorName      | ❌       | string | RECEIPT                                         |
| receiptDate     | ❌       | string | RECEIPT                                         |
| vatAmount       | ❌       | number | RECEIPT                                         |
| receiptFileUrl  | ❌       | string | RECEIPT                                         |
| aiExtractedData | ❌       | string | RECEIPT                                         |
| aiFlags         | ❌       | string | RECEIPT                                         |
| tripFrom        | ❌       | string | PER_DIEM                                        |
| tripTo          | ❌       | string | PER_DIEM                                        |
| countryCode     | ❌       | string | PER_DIEM                                        |
| perDiemRate     | ❌       | number | PER_DIEM                                        |
| perDiemDays     | ❌       | number | PER_DIEM                                        |
| distanceKm      | ❌       | number | MILEAGE                                         |
| ratePerKm       | ❌       | number | MILEAGE                                         |
| submittedAt     | ❌       | string | ISO datetime                                    |
| reviewedAt      | ❌       | string | ISO datetime                                    |
| reviewedBy      | ❌       | string | Cognito sub của manager                         |
| rejectionReason | ❌       | string | Có khi REJECTED                                 |
| createdAt       | ❌       | string | ISO datetime                                    |

---

## SQL

```sql
SELECT *
FROM expenses
WHERE id = :id
  AND (user_sub = :cognito_sub OR :role = 'MANAGER');
```
