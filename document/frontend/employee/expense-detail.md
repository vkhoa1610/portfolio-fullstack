# Expense Detail Screen — `/my-expenses/:id`

## Process Flow

```
Mount component (với id từ URL params)
  → Gọi BFF: GET /api/emp-005/:id → nhận Expense chi tiết
  → Hiển thị thông tin đầy đủ theo type (RECEIPT/PER_DIEM/MILEAGE)
  → Hiển thị status badge + rejectionReason nếu REJECTED
  → Nếu DRAFT: hiện nút "Submit" → gọi emp-006
```

**Component**: `frontend/components/expenses/expense-detail-view.tsx`
**Hooks**: `useGetExpenseByIdQuery`, `useSubmitExpenseMutation`

---

## BFF Calls

### GET /api/emp-005/:id — Get Expense Detail

#### Input

| Field | Required | Type   |
|-------|----------|--------|
| id    | ✅       | number |

#### Output expect từ BFF

| Field           | Required | Type   | Ghi chú                                         |
|-----------------|----------|--------|-------------------------------------------------|
| id              | ✅       | number |                                                 |
| userSub         | ✅       | string |                                                 |
| type            | ✅       | string | `RECEIPT` \| `PER_DIEM` \| `MILEAGE`          |
| status          | ✅       | string | `DRAFT` \| `PENDING_REVIEW` \| `APPROVED` \| `REJECTED` |
| currency        | ✅       | string |                                                 |
| title           | ❌       | string |                                                 |
| amount          | ❌       | number |                                                 |
| vendorName      | ❌       | string | RECEIPT                                         |
| receiptDate     | ❌       | string | RECEIPT                                         |
| vatAmount       | ❌       | number | RECEIPT                                         |
| receiptFileUrl  | ❌       | string | RECEIPT                                         |
| tripFrom        | ❌       | string | PER_DIEM                                        |
| tripTo          | ❌       | string | PER_DIEM                                        |
| countryCode     | ❌       | string | PER_DIEM                                        |
| perDiemRate     | ❌       | number | PER_DIEM                                        |
| perDiemDays     | ❌       | number | PER_DIEM                                        |
| distanceKm      | ❌       | number | MILEAGE                                         |
| ratePerKm       | ❌       | number | MILEAGE                                         |
| submittedAt     | ❌       | string |                                                 |
| reviewedAt      | ❌       | string |                                                 |
| rejectionReason | ❌       | string | Có khi REJECTED                                 |
| createdAt       | ❌       | string |                                                 |

---

### POST /api/emp-006/:id — Submit (nếu DRAFT)

Xem [expense-create.md](expense-create.md) phần Submit Expense.
