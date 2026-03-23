# Finance — Report Management

> Màn hình quản lý báo cáo chi phí cho Finance role. Filter sidebar có thể collapse, KPI cards, table với pagination.

## Route

`/finance/reports`

## Files

| File | Mô tả |
|------|-------|
| `app/(protected)/finance/reports/page.tsx` | Page wrapper |
| `components/finance/report-management-view.tsx` | Full-bleed layout component |

## Layout

```
┌─── Filter Sidebar (collapsible) ──┬─── Main Content ──────────────────┐
│ Filters  [6 active]  [<]          │ Report Management                  │
│                                   │ Finance department  [Search] [+New]│
│ QUICK FILTERS                     ├───────────────────────────────────┤
│ ☑ Needs my action  (12)          │ Active: Needs action × Overdue ×  │
│ ☑ Overdue           (5)          ├───────────────────────────────────┤
│                                   │ Total | Needs action | Approved | Rejected │
│ CREATION            ˅             ├───────────────────────────────────┤
│  ○ Draft            (0)           │ Table: Name / Amount / Status / Date │
│                                   │ [pagination]                      │
│ REVIEW / APPROVAL   ˅             │                                   │
│  ○ Pending Review  (0)            │                                   │
│                                   │                                   │
│ FINAL               ˅             │                                   │
│  ○ Approved        (12)           │                                   │
│  ○ Rejected         (0)           │                                   │
│  ○ Paid             (0)           │                                   │
│                                   │                                   │
│ [Clear all filters]               │                                   │
└───────────────────────────────────┴───────────────────────────────────┘
```

## Full-bleed Layout

Component dùng `negative margin` để thoát khỏi padding của `(protected)/layout.tsx`:
- `-mx-6 md:-mx-8 -my-6 md:-my-8` — cancel `p-6 md:p-8` của layout
- `h-[calc(100vh-64px)]` — full height trừ header (h-16 = 64px)

## Filter Sidebar States

### Expanded (w-56)
- Header: "Filters" + active count badge + collapse button (`<`)
- Quick Filters: Needs my action, Overdue (checkboxes với count)
- Status Phases (collapsible): CREATION / REVIEW / FINAL
- "Clear all filters" button khi có filter active

### Collapsed (w-11)
- Toggle button để expand lại (`>`)
- Icon buttons cho Quick Filters và Status (với dot indicator khi active)

## Filters State

```typescript
interface FiltersState {
  needsAction: boolean;  // PENDING_REVIEW items
  overdue: boolean;      // items > 10 ngày chưa xử lý
  statuses: Set<ExpenseStatus>;
}
```

**Overdue logic**: `ageInDays > 10 && status === PENDING_REVIEW || DRAFT`

## KPI Cards

| Card | Màu | Dữ liệu |
|------|-----|---------|
| Total | neutral | all.length |
| Needs action | warning | PENDING_REVIEW count |
| Approved | success | APPROVED count + approval rate % |
| Rejected | error | REJECTED count + rejection rate % |

## Table

| Cột | Mô tả |
|-----|-------|
| Report name | title/vendorName + type icon + submitter (Finance · Minh T.) |
| Amount | amount €  |
| Status | colored badge với dot |
| Submitted | date dd/MM |
| Actions | View + More icon buttons |

**Overdue row**: `border-l-2 border-l-warning-400 bg-warning-50/20` + "OVERDUE" badge + date đỏ

## Pagination

8 items/page, prev/next + page number buttons.

## Data Source

Dùng `useGetFinanceExpensesQuery` (FIN-001) — filter client-side.

## Luồng vào màn hình

Sidebar (Finance) → "Quản lý báo cáo" → `/finance/reports`
