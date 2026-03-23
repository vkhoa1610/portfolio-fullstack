# Admin — Report Template Designer

> Admin tạo và chỉnh sửa template để render PDF báo cáo chi phí. Hỗ trợ drag-and-drop reorder sections, live preview, download PDF.

## Route

`/admin/report-template`

## Files

| File | Mô tả |
|------|-------|
| `app/(protected)/admin/report-template/page.tsx` | Page wrapper |
| `components/admin/report-template-designer.tsx` | Main designer component |
| `common/report-template/build-html-preview.ts` | Build HTML string cho preview trong browser |
| `ducks/admin/adminApi.ts` | RTK: `useGetReportTemplatesQuery`, `useGetReportTemplateByIdQuery`, `useCreateReportTemplateMutation`, `useUpdateReportTemplateMutation` |
| `ducks/admin/types.ts` | `TemplateConfig`, `SectionKey`, `SectionItem` |

## Dependencies

- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` — drag-and-drop reorder sections

## UI Flow

```
Load trang
  → GET adm-014/report-templates → danh sách templates
  → Auto-select template đầu tiên
  → Load config → normalizeSections() → render form + preview

Chỉnh sửa config (title, company, primaryColor)
  → Live update preview ngay lập tức (client-side HTML rebuild)

Drag-and-drop section
  → PointerSensor với activationConstraint: { distance: 8 }
  → handleDragEnd → arrayMove(sections, oldIndex, newIndex)
  → Update preview

Toggle enable/disable section
  → setEnabled(key, boolean)
  → Update preview

Save Template
  → PUT adm-015/:id (update existing) hoặc POST adm-014 (tạo mới)

Download PDF
  → POST adm-016/report-templates/generate-pdf { templateId, reportId }
  → BFF fetch template + report → Puppeteer → PDF binary
  → browser.download()
```

## Sections

| Key | Tên hiển thị |
|-----|-------------|
| `executiveSummary` | Executive Summary |
| `breakdownByCategory` | Breakdown by Category |
| `byEmployee` | By Employee |
| `anomalies` | Anomalies Detected |
| `recommendations` | Recommendations |
| `aiAnalysis` | Financial Analysis (AI) |

## normalizeSections()

Backward compat: templates cũ trong DB dùng `{ executiveSummary: true, ... }` (object). Templates mới dùng `SectionItem[]` (ordered array). `normalizeSections()` detect `Array.isArray()` và convert về array format nếu cần.

```typescript
function normalizeSections(raw: any): SectionItem[] {
  if (Array.isArray(raw)) return raw as SectionItem[];
  const DEFAULT_ORDER: SectionKey[] = ['executiveSummary','breakdownByCategory','byEmployee','anomalies','recommendations','aiAnalysis'];
  return DEFAULT_ORDER.map(key => ({ key, enabled: key === 'aiAnalysis' ? true : Boolean(raw[key]) }));
}
```

## renderAiAnalysis()

Regex-based markdown → HTML converter (không dùng lib ngoài). Dùng cả ở `build-html-preview.ts` (frontend) và `report-html-template.ts` (BFF).

## Luồng vào màn hình

Admin Dashboard → "Report Template" → `/admin/report-template`
