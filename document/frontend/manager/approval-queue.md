# Manager Approval Queue — `/manager/approvals`

## Process Flow

```
Mount component
  → Gọi BFF: GET /api/mgr-001 → nhận danh sách expenses PENDING_REVIEW
  → Hiển thị danh sách với thông tin employee + amount + type + ngày submit
  → Click item → /manager/approvals/:id
```

**Component**: `frontend/components/manager/` (approval queue list)
**Hook**: `useGetManagerQueueQuery` từ `expenseApi`

---

## BFF Calls

### GET /api/mgr-001 — Get Pending Queue

#### Input

Không có (cookies tự động gửi).

#### Output expect từ BFF

Mảng `Expense[]` (chỉ status `PENDING_REVIEW`):

| Field       | Required | Type   | Ghi chú                              |
|-------------|----------|--------|--------------------------------------|
| id          | ✅       | number |                                      |
| userSub     | ✅       | string | Cognito sub của employee             |
| type        | ✅       | string | `RECEIPT` \| `PER_DIEM` \| `MILEAGE` |
| status      | ✅       | string | `PENDING_REVIEW`                     |
| amount      | ❌       | number |                                      |
| currency    | ✅       | string |                                      |
| title       | ❌       | string |                                      |
| submittedAt | ❌       | string | ISO datetime                         |
| createdAt   | ❌       | string | ISO datetime                         |
