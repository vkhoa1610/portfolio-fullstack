# Admin — AI Report Generator (Flow 6)

> Màn hình admin để trigger AI report và xem kết quả markdown.

## Route

`/admin/ai-report`

## Files

| File | Mô tả |
|------|-------|
| `app/(protected)/admin/ai-report/page.tsx` | Page wrapper |
| `components/admin/ai-report-view.tsx` | Main view component |
| `common/markdown-renderer/MarkdownRenderer.tsx` | Render markdown → React elements |
| `ducks/admin/adminApi.ts` | RTK Query: generateReport, getReportStatus, getLatestReport |
| `ducks/admin/types.ts` | ExpenseReport, GenerateReportResponse, LatestReportResponse |

## UI Flow

```
Load trang
  → useGetLatestReportQuery() → hiển thị report cũ nếu exists=true

Chọn period (dropdown 6 tháng gần nhất)
  → Click "Generate Report"
  → generateReport(period) → POST adm-011 → nhận { jobId }
  → setJobId → bắt đầu poll

Poll mỗi 2 giây
  → getReportStatusQuery(jobId) → GET adm-012
  → PENDING → tiếp tục poll
  → DONE    → setDisplayedReport, dừng poll, hiện markdown
  → FAILED  → dừng poll, hiện error message
```

## State

| State | Mô tả |
|-------|-------|
| `period` | Period đang chọn, default = tháng hiện tại |
| `reportCollapsed` | Boolean — collapse/expand report card |
| `jobId` | null = không poll; number = đang poll |
| `displayedReport` | Report hiện tại đang hiển thị |
| `selectedTemplateId` | Template chọn để download PDF |

## UX Features

### Period Selector (Tab Pills)
Thay native `<select>`, 6 tháng gần nhất hiển thị dạng pill buttons nằm ngang. Tháng đang chọn highlight primary — 1 click để chọn.

### Collapsible Report Card
Header row của report card là button — click toggle `reportCollapsed`. ChevronUp khi expanded, ChevronDown khi collapsed.

### Download PDF
Sau khi có report: chọn Template (select) → "PDF" button → POST adm-016 → nhận PDF binary → `browser.download()`.

## MarkdownRenderer

Parser nội bộ (không dùng thư viện ngoài), hỗ trợ:
- `# h1`, `## h2`, `### h3`
- `**bold**`
- `- bullet list`
- Paragraph (blank-line separated)

## Luồng vào màn hình

Admin Dashboard → card "AI Report Generator" → `/admin/ai-report`
