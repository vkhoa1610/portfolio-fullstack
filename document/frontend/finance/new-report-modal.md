# Frontend — New Report Modal (Flow 11)

> Cập nhật: 2026-03-26 (Session 8)

## Component

`components/finance/new-report-modal.tsx`

## Architecture

```
NewReportModal
  props: open, onClose
  state: step (1-5), form: FormData, agreed: boolean
  mutation: useCreateFinanceReportMutation

  ├── Header: "New report" + close button
  ├── Stepper (5 dots + connectors)
  ├── Content (switch step)
  │   ├── Step1 — General info
  │   ├── Step2 — Financial details
  │   ├── Step3 — Attachments
  │   ├── Step4 — Approval route
  │   └── Step5 — Review & submit
  └── Footer: Back | Save draft | Step N of 5 | Next → / Submit report
```

## Steps

### Step 1 — General info
| Field | Input | Ghi chú |
|-------|-------|---------|
| `title` | text input | Required — Next disabled nếu trống |
| `reportType` | pill buttons | FINANCIAL / ANALYTICS / OPERATIONS / COMPLIANCE |
| `fiscalPeriod` | select | Q1/Q2/Q3/Q4 2025-2026 |
| `dueDate` | date input | Optional |
| `description` | textarea (3 rows) | Optional |
| `priority` | pill buttons | LOW / NORMAL / HIGH / URGENT |

### Step 2 — Financial details
| Field | Input | Ghi chú |
|-------|-------|---------|
| `totalAmount` | number | Required concept |
| `currency` | select | EUR / USD / GBP |
| `lineItems` | table | Add/Remove rows; category: OPEX / CAPEX |

**Subtotal** tính real-time từ line items — cảnh báo nếu khác `totalAmount`.

### Step 3 — Attachments
- File picker (multiple) — accept PDF, Excel, Word
- File list với PRIMARY/SUPPORTING toggle (click badge để swap)
- Demo UI — không thực sự upload lên MinIO

### Step 4 — Approval route
- Hard-coded 3 level cards: L1 Minh Tran (Finance Manager), L2 Hoa Nguyen (Finance Director), L3 Long Pham (CFO)
- Deadline days input cho mỗi level
- CC chip input (dùng `prompt()` để thêm tên)

### Step 5 — Review & submit
- Summary cards: General info | Financial | Approval route
- "Edit" buttons → setStep(n) để quay lại
- Declaration checkbox (required để Submit)
- **Submit report** → `createReport({ ..., submitNow: true })` → status PENDING_REVIEW
- **Save draft** → `createReport({ ..., submitNow: false })` → status DRAFT

## Footer Logic

| Condition | Buttons shown |
|-----------|---------------|
| step = 1, title empty | Save draft + Next (disabled) |
| step = 1, title filled | Save draft + Next |
| step 2-4 | Back + Save draft + Next |
| step 5, !agreed | Back + Save draft + Submit (disabled) |
| step 5, agreed | Back + Save draft + Submit (green) |

## RTK Integration

```ts
// ducks/expenses/expenseApi.ts
createFinanceReport: builder.mutation<FinanceReport, CreateFinanceReportRequest>({
  query: (body) => ({ url: '/fin-004/reports', method: 'POST', body }),
  invalidatesTags: ['FinanceQueue'],
})
```

On success: `handleClose()` → reset form + step + close modal. `invalidatesTags` trigger refetch `getFinanceReports`.
