# Manager — AI Report View

> Manager xem report AI mới nhất (read-only). Không có quyền generate. Có thể chọn template và download PDF.

## Route

`/manager/ai-report`

## Files

| File | Mô tả |
|------|-------|
| `app/(protected)/manager/ai-report/page.tsx` | Page wrapper |
| `components/manager/manager-ai-report-view.tsx` | Read-only report view |
| `ducks/admin/adminApi.ts` | RTK: `useGetManagerLatestReportQuery`, `useGetReportTemplatesQuery` |

## UI Flow

```
Load trang
  → useGetManagerLatestReportQuery() → GET mgr-005/reports/latest
  → exists=true  → hiện markdown report
  → exists=false → hiện empty state

Chọn template (select dropdown)
  → state: selectedTemplateId

Download PDF
  → POST adm-016/report-templates/generate-pdf { templateId, reportId }
  → nhận PDF binary → browser.download()
```

## Khác biệt với Admin AI Report View

| Tính năng | Admin | Manager |
|-----------|-------|---------|
| Generate Report | ✅ | ❌ (read-only) |
| Period selector | ✅ | ❌ |
| Chọn template | ✅ | ✅ |
| Download PDF | ✅ | ✅ |
| Xem report | ✅ | ✅ |

## BFF Routing

- Manager report: **MGR-005** (`/api/v1/manager/reports/latest`) — không cần admin check
- PDF generation: **ADM-016** — dùng chung với admin (idToken check, không check admin role ở PDF endpoint)

## Luồng vào màn hình

Sidebar (Manager) → "AI Report" → `/manager/ai-report`
