# Frontend — Finance

> Cập nhật: 2026-03-26 (Session 8)

## Màn hình

| Route               | Component                       | Role    | Trạng thái |
|---------------------|---------------------------------|---------|------------|
| `/finance/overview` | `overview-view.tsx`             | FINANCE | ✅ Done    |
| `/finance/reports`  | `report-management-view.tsx`    | FINANCE | ✅ Done    |
| `/finance/check`    | `check-view.tsx`                | FINANCE | ✅ Mock    |
| `/finance/payment`  | `payment-view.tsx`              | FINANCE | ✅ Done    |
| `/finance/export`   | `export-view.tsx`               | FINANCE | ✅ Done    |

## Chi tiết màn hình

### 1. Finance Overview (`/finance/overview`)

**Component**: `components/finance/overview-view.tsx`

**Chức năng:**
- 4 KPI cards: Total Submitted (€), Pending Review (count), Approved (count), Paid (count)
- Budget Utilization progress bar — màu xanh/vàng/đỏ theo % (< 70% / < 90% / ≥ 90%)
- "Spend by Category" — CSS bar chart theo RECEIPT / PER_DIEM / MILEAGE
- "Monthly Trend" — CSS bar chart 6 tháng gần nhất, hover tooltip hiển thị tổng €
- "All Expenses" table — tất cả expenses, status badge, type icon

**Data**: `useGetFinanceExpensesQuery()` → `GET /api/fin-001`

**i18n**: `finance.overview.*` (DE/EN/VI)

---

### 2. Report Management (`/finance/reports`)

**Component**: `components/finance/report-management-view.tsx`

**Chức năng:**
- Full-bleed layout: `-mx-6 md:-mx-8 -my-6 md:-my-8 h-[calc(100vh-64px)]`
- Collapsible filter sidebar (collapse → icon strip; expand → 56px → 14rem)
- **2 tabs**:
  - **Finance Reports** — danh sách FinanceReport từ `fin-005`, hiện type badge (FINANCIAL/ANALYTICS/...) + status + amount
  - **Expense Items** — danh sách expenses từ `fin-001`, filter sidebar + KPI cards + pagination
- **"+ New report"** button → mở `NewReportModal`

**Data**:
- `useGetFinanceReportsQuery()` → `GET /api/fin-005/reports`
- `useGetFinanceExpensesQuery()` → `GET /api/fin-001`

**Modal**: [new-report-modal.md](./new-report-modal.md)

---

### 3. Finance Final Check (`/finance/check`)

**Component**: `components/finance/check-view.tsx`

**Chức năng (mock — local state):**
- Hiển thị tất cả expenses có status `APPROVED`
- 3 stat cards: Pending Review / Released / Flagged (local count)
- Table "Awaiting Accountant Review": nút **Release** → released set, **Hold** → flagged set
- Section "Released for Payment" và "Flagged / On Hold"

**Ghi chú**: Chưa có backend write → toàn bộ state là local `useState<Set<number>>`.

**i18n**: `finance.check.*` (DE/EN/VI)

---

### 4. Batch Payment (`/finance/payment`)

**Component**: `components/finance/payment-view.tsx`

**Chức năng:**
- Multi-select checkbox các APPROVED expenses
- **Download SEPA XML** — `pain.001.001.03` XML client-side → blob download
- **Mark as Paid** — `useMarkAsPaidMutation` (POST `/api/fin-003/batch-pay`)
- "Paid this session" counter, Footer tổng eligible €, Toast success 3s

**i18n**: `finance.payment.*` (DE/EN/VI)

---

### 5. Tax Export (`/finance/export`)

**Component**: `components/finance/export-view.tsx`

**Chức năng:**
- Period filter: Current Month / Last Month / Current Quarter / All Time
- Summary: số expenses, Gross, VAT (19%), Net
- **DATEV Export (CSV)** — Buchungsstapel, semicolon-delimited, UTF-8
  - Konto mapping: RECEIPT=6300, MILEAGE=6320, PER_DIEM=6310
- **XRechnung / E-Rechnung (XML)** — EN16931 UBL 2.1, XRechnung 2.0
- Preview table theo period đã chọn

**i18n**: `finance.export.*` (DE/EN/VI)

---

## Navigation (Sidebar)

Finance group trong `components/layout/Sidebar.tsx` chỉ hiển thị cho `FINANCE` role:

```
Finance (nav.group_finance)
├── Overview      (nav.overview)      → /finance/overview
├── Reports       (nav.reports)       → /finance/reports
├── Final Check   (nav.final_check)   → /finance/check
├── Batch Payment (nav.batch_payment) → /finance/payment
└── Tax Export    (nav.tax_export)    → /finance/export
```
