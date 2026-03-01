# Manager Approval Detail — `/manager/approvals/:id`

## Process Flow

```
Mount component (với id từ URL params)
  → Gọi BFF: GET /api/mgr-004/:id → nhận chi tiết expense
  → Hiển thị đầy đủ thông tin expense (theo type)
  → Hiển thị file ảnh nếu RECEIPT (receiptFileUrl)
  → Hiện 2 nút: "Approve" và "Reject"

[Approve:]
  → Gọi BFF: PUT /api/mgr-002/:id
  → Thành công → Redirect → /manager/approvals

[Reject:]
  → Hiện modal nhập rejectionReason
  → Gọi BFF: PUT /api/mgr-003/:id { rejectionReason }
  → Thành công → Redirect → /manager/approvals
```

**Component**: `frontend/components/manager/approval-detail-view.tsx`
**Hooks**: `useGetManagerExpenseByIdQuery`, `useApproveExpenseMutation`, `useRejectExpenseMutation`

---

## BFF Calls

### GET /api/mgr-004/:id — Get Expense Detail

#### Input

| Field | Required | Type   |
|-------|----------|--------|
| id    | ✅       | number |

#### Output expect từ BFF

Xem [expense-detail.md](../employee/expense-detail.md) — output giống hệt nhau.

---

### PUT /api/mgr-002/:id — Approve

#### Input

| Field | Required | Type   |
|-------|----------|--------|
| id    | ✅       | number |

Không có request body.

#### Output expect từ BFF

| Field         | Required | Type     |
|---------------|----------|----------|
| processStatus | ✅       | number   |
| message       | ✅       | string[] |

---

### PUT /api/mgr-003/:id — Reject

#### Input

| Field           | Required | Type   |
|-----------------|----------|--------|
| id              | ✅       | number |
| rejectionReason | ✅       | string |

#### Output expect từ BFF

| Field         | Required | Type     |
|---------------|----------|----------|
| processStatus | ✅       | number   |
| message       | ✅       | string[] |
