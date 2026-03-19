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
| `jobId` | null = không poll; number = đang poll |
| `displayedReport` | Report hiện tại đang hiển thị |

## MarkdownRenderer

Parser nội bộ (không dùng thư viện ngoài), hỗ trợ:
- `# h1`, `## h2`, `### h3`
- `**bold**`
- `- bullet list`
- Paragraph (blank-line separated)

## Luồng vào màn hình

Admin Dashboard → card "AI Report Generator" → `/admin/ai-report`
