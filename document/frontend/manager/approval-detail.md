# Manager Approval Detail — `/manager/approvals/:id`

## Process Flow

```
Mount component (với id từ URL params)
  → Permission check:
      hasPermission("EXPENSE_APPROVE") === false → router.replace('/not-found')
  → Gọi BFF: GET /api/mgr-004/:id → nhận chi tiết expense
  → Gọi RTK Query: GET /api/scr-001/manager.approvals.detail → CMS config
  → Zod safeParse(config) → thành công: CmsNode tree / thất bại: StaticFallback

[CMS Rendering:]
  → renderNode(root, context)
  → Mỗi node check function_id → ẩn nếu user không có function đó
  → layout.action-bar ← ẩn khi activeFormId !== null
  → layout.form       ← chỉ hiện khi activeFormId === node.id

[Approve (EXPENSE_ACCEPT):]
  → actionHandlers["EXPENSE_ACCEPT"]
  → Gọi BFF: PUT /api/mgr-002/:id
  → Thành công → navigate('/manager/approvals')

[Reject (EXPENSE_REJECT):]
  → actionHandlers["EXPENSE_REJECT"]
  → setActiveFormId('reject-form') → layout.action-bar ẩn, reject form hiện

[Confirm Reject (EXPENSE_REJECT_SUBMIT):]
  → actionHandlers["EXPENSE_REJECT_SUBMIT"]
  → Gọi BFF: PUT /api/mgr-003/:id { rejectionReason }
  → Thành công → navigate('/manager/approvals')
```

**Component**: `frontend/components/manager/approval-detail-view.tsx`
**CMS Renderer**: `frontend/lib/cms/renderNode.tsx`
**Hooks**:
- `useGetManagerExpenseByIdQuery` (expenseApi)
- `useApproveExpenseMutation`, `useRejectExpenseMutation` (expenseApi)
- `useGetScreenConfigQuery("manager.approvals.detail")` (cmsApi)
- `useAuth()` → `hasPermission`, `hasFunctionId`

---

## CMS Node Types dùng trong màn này

| node.type | node.id | Mô tả |
|-----------|---------|-------|
| `layout.page` | `root` | Container cấp trang |
| `layout.card` | `card-main` | Card chi tiết expense |
| `display.field` | `field-*` | Hiển thị field value từ expense |
| `layout.action-bar` | `action-bar` | Row 2 nút — ẩn khi reject form active |
| `input.button` | `btn-accept` | function_id=1, action=EXPENSE_ACCEPT |
| `input.button` | `btn-reject` | function_id=2, action=EXPENSE_REJECT |
| `layout.form` | `reject-form` | Chỉ hiện khi activeFormId="reject-form" |
| `input.textarea` | `txt-reason` | Nhập rejection reason |
| `input.button` | `btn-confirm-reject` | action=EXPENSE_REJECT_SUBMIT |

---

## BFF Calls

### GET /api/mgr-004/:id — Get Expense Detail

#### Input

| Field | Required | Type |
|-------|----------|------|
| id | ✅ | number |

#### Output

Xem [expense-detail.md](../employee/expense-detail.md) — output giống hệt nhau.

---

### GET /api/scr-001/manager.approvals.detail — CMS Config

#### Output

CMS JSON object — xem [scr-001.md](../../bff/common/scr-001.md).

---

### PUT /api/mgr-002/:id — Approve

#### Input

| Field | Required | Type |
|-------|----------|------|
| id | ✅ | number |

Không có request body.

#### Output

| Field | Required | Type |
|-------|----------|------|
| processStatus | ✅ | number |
| message | ✅ | string[] |

---

### PUT /api/mgr-003/:id — Reject

#### Input

| Field | Required | Type |
|-------|----------|------|
| id | ✅ | number |
| rejectionReason | ✅ | string |

#### Output

| Field | Required | Type |
|-------|----------|------|
| processStatus | ✅ | number |
| message | ✅ | string[] |

---

## Permission & Function Guards

| Guard | Check | Hành động nếu thiếu |
|-------|-------|---------------------|
| Page-level | `hasPermission("EXPENSE_APPROVE")` | `router.replace('/not-found')` |
| Approve button | `hasFunctionId(1)` (via CMS function_id) | Node không render |
| Reject button+form | `hasFunctionId(2)` (via CMS function_id) | Node không render |

---

## i18n Keys dùng

| Key | en | vi | de |
|-----|----|----|-----|
| `manager.btn.accept` | Approve | Phê duyệt | Genehmigen |
| `manager.btn.reject` | Reject | Từ chối | Ablehnen |
| `manager.btn.confirm_reject` | Confirm Rejection | Xác nhận từ chối | Ablehnung bestätigen |
| `manager.rejection_reason` | Rejection Reason | Lý do từ chối | Ablehnungsgrund |
