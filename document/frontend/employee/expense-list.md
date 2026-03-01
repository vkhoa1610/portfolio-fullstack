# Expense List Screen — `/my-expenses`

## Process Flow

```
Mount component
  → Gọi BFF: GET /api/emp-004 (danh sách expense của user)
  → Hiển thị danh sách với status badges
  → Click "Create" → /my-expenses/create
  → Click item → /my-expenses/:id
```

**Component**: `frontend/components/expenses/expense-list-view.tsx`
**Hook**: `useGetExpensesQuery` từ `expenseApi`

---

## BFF Calls

### GET /api/emp-004 — Get Expense List

#### Input

Không có (cookies tự động gửi).

#### Output expect từ BFF

Mảng `Expense[]`:

| Field           | Required | Type   | Ghi chú                                         |
|-----------------|----------|--------|-------------------------------------------------|
| id              | ✅       | number |                                                 |
| type            | ✅       | string | `RECEIPT` \| `PER_DIEM` \| `MILEAGE`          |
| status          | ✅       | string | `DRAFT` \| `PENDING_REVIEW` \| `APPROVED` \| `REJECTED` |
| title           | ❌       | string |                                                 |
| amount          | ❌       | number |                                                 |
| currency        | ✅       | string |                                                 |
| submittedAt     | ❌       | string | ISO datetime                                    |
| rejectionReason | ❌       | string |                                                 |
| createdAt       | ❌       | string | ISO datetime                                    |
