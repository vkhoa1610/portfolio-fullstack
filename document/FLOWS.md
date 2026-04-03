# Flows Implementation Status

> Tài liệu tổng hợp trạng thái triển khai từng flow theo layer.
> **Cập nhật lần cuối**: 2026-03-26 (Session 8: Finance Report — New Report Multi-Step Modal + Full Stack)

---

## Tổng quan

| Flow | Tên | DB | Backend | BFF | Frontend | i18n | Trạng thái |
| ---- | --- | -- | ------- | --- | -------- | ---- | ---------- |
| Flow 1 | Secure Onboarding & Compliance | ✅ | ✅ | ✅ | ✅ | ✅ | **DONE** |
| Flow 2 | Smart Expense Capture | ✅ | ✅ | ✅ | ✅ | ✅ | **DONE** |
| Flow 3 | Intelligent Approval Matrix | ✅ | ✅ | ✅ | ✅ | ✅ | **DONE** |
| Flow 4 | Settlement & Fiscal Reporting | ✅ | ✅ | ✅ | ✅ | ✅ | **DONE** |
| Flow 5 | Permission-Based Authorization & CMS UI | ✅ | ✅ | ✅ | ✅ | ✅ | **DONE** |
| Flow 6 | AI-Powered Expense Report Generator | ✅ | ✅ | ✅ | ✅ | ✅ | **DONE (Ollama real + mock fallback)** |
| Flow 7 | Report Template Designer + PDF Export | ✅ | ✅ | ✅ | ✅ | ✅ | **DONE** |
| Flow 8 | Manager AI Report View | — | ✅ | ✅ | ✅ | ✅ | **DONE** |
| Flow 9 | AI Playground (Admin) | — | ✅ | ✅ | ✅ | ✅ | **DONE** |
| Flow 10 | Finance Report Management | — | — | — | ✅ | ✅ | **DONE (frontend only)** |
| Flow 11 | Finance New Report (Multi-Step Modal) | ✅ | ✅ | ✅ | ✅ | — | **DONE** |

---

## Flow 1: Secure Onboarding & Compliance ✅

**Mục tiêu**: Đăng nhập an toàn qua Cognito → MFA → onboarding 2 bước (GDPR consent + profile setup) → dashboard.

### DB Tables
- `users` — PK = `cognito_sub`
- `roles` — EMPLOYEE / MANAGER / FINANCE
- `user_roles` — many-to-many
- `user_profiles` — language, avatar, onboardingStatus
- `policies` — GDPR/ToS documents (versioned)
- `user_consents` — consent records với IP/UA

### Backend APIs (`/api/v1/`)
| Method | Endpoint | Chức năng |
| ------ | -------- | --------- |
| GET | `/users/me` | Lấy session + profile + role + onboardingStatus |
| POST | `/onboarding/consent` | Ghi nhận GDPR + ToS consent |
| POST | `/onboarding/profile` | Lưu language → set onboardingStatus = DONE |

### BFF Products
| Product | Endpoint | Chức năng |
| ------- | -------- | --------- |
| product-003 | POST `/auth/login` | Email/password → Cognito |
| product-004 | POST `/auth/new-password` | Handle NEW_PASSWORD_REQUIRED |
| product-005 | POST `/auth/mfa` | MFA OTP verification |
| product-006 | GET `/auth/session` | Get current session |
| product-007 | POST `/auth/logout` | Clear HttpOnly cookies |
| product-008 | POST `/onboarding/consent` | Forward consent → backend |
| product-009 | POST `/onboarding/profile` | Forward profile → backend |

### Frontend Screens
| Route | Mô tả |
| ----- | ----- |
| `/auth/login` | Login form |
| `/auth/mfa` | MFA OTP input |
| `/auth/new-password` | First-login password change |
| `/onboarding/compliance` | GDPR + ToS checkboxes |
| `/onboarding/profile` | Language selector + role display |

### Auth Flow
```
Login → [MFA?] → [New Password?] → Set HttpOnly cookies
     → GET /users/me → Build UISession
     → onboardingStatus PENDING → /onboarding
     → onboardingStatus DONE   → /dashboard
```

---

## Flow 2: Smart Expense Capture (Germanized) ✅

**Mục tiêu**: Employee/Manager tạo expense (receipt/per-diem/mileage) → submit để manager review.

### DB Tables
- `expenses` — type ENUM(RECEIPT, PER_DIEM, MILEAGE), status ENUM(DRAFT, PENDING_REVIEW, APPROVED, REJECTED)

### Backend APIs (`/api/v1/`)
| Method | Endpoint | Chức năng |
| ------ | -------- | --------- |
| POST | `/expenses` | Tạo expense DRAFT |
| GET | `/expenses` | Danh sách expense của user |
| GET | `/expenses/{id}` | Chi tiết |
| POST | `/expenses/{id}/submit` | Submit → PENDING_REVIEW |
| GET | `/expenses/upload-url?filename=xxx` | Tạo presigned PUT URL (15 phút) để upload thẳng lên MinIO |
| POST | `/expenses/scan` | Mock OCR (REWE GmbH 47.80€) — nhận `{ fileUrl }` |

### BFF Products
| Product | Endpoint | Chức năng |
| ------- | -------- | --------- |
| product-010 | POST `/expenses` | Tạo DRAFT |
| product-011 | GET `/expenses` | List |
| product-012 | GET `/expenses/:id` | Detail |
| product-013 | POST `/expenses/:id/submit` | Submit |
| product-014 | POST `/expenses/scan` | Mock OCR — forward `{ fileUrl }` |
| product-018 | GET `/expenses/upload-url?filename=xxx` | Presigned PUT URL từ backend |

### Frontend Screens (EMPLOYEE + MANAGER)
| Route | Component | Mô tả |
| ----- | --------- | ----- |
| `/dashboard` | `dashboard/page.tsx` | Role-based redirect |
| `/my-expenses` | `expense-list-view.tsx` | Danh sách với status badges |
| `/my-expenses/create` | `expense-type-selector.tsx` | Chọn loại: Receipt / Per Diem / Mileage |
| `/my-expenses/create/scan` | `scan-view.tsx` | Presigned PUT upload → MinIO → Mock OCR split view |
| `/my-expenses/create/per-diem` | `per-diem-view.tsx` | Auto-calc (DE=28€, AT=26.4€, CH=35€) |
| `/my-expenses/create/mileage` | `mileage-view.tsx` | 0.30€/km auto-calc |
| `/my-expenses/[id]` | `expense-detail-view.tsx` | Detail + status banner |
| `/my-expenses/[id]/review` | `expense-review-view.tsx` | Budget check + confirm submit |

### German Compliance Rules
| Type | German Term | Rule |
| ---- | ----------- | ---- |
| RECEIPT | Beleg | Browser → presigned PUT → MinIO; Mock OCR extraction |
| PER_DIEM | Verpflegungsmehraufwand | DE=28€/day, AT=26.4€/day, CH=35€/day, OTHER=48€/day |
| MILEAGE | Kilometerpauschale | 0.30€/km |

---

## Flow 3: Intelligent Approval Matrix ✅

**Mục tiêu**: Manager xem pending queue → approve hoặc reject từng expense.

> Được implement chung trong cùng session với Flow 2.

### Backend APIs (`/api/v1/`)
| Method | Endpoint | Chức năng |
| ------ | -------- | --------- |
| GET | `/manager/expenses` | Danh sách pending expenses |
| PUT | `/manager/expenses/{id}/approve` | Approve → APPROVED |
| PUT | `/manager/expenses/{id}/reject` | Reject → REJECTED (cần `rejectionReason`) |

### BFF Products
| Product | Endpoint | Chức năng |
| ------- | -------- | --------- |
| product-015 | GET `/manager/expenses` | Pending queue |
| product-016 | PUT `/manager/expenses/:id/approve` | Approve |
| product-017 | PUT `/manager/expenses/:id/reject` | Reject (validate rejectionReason) |

### Frontend Screens (MANAGER only)
| Route | Component | Mô tả |
| ----- | --------- | ----- |
| `/manager/approvals` | `approvals-view.tsx` | Pending queue + AI flag indicator |
| `/manager/approvals/[id]` | `approval-detail-view.tsx` | Approve / Reject với inline rejection form |

---

## Flow 4: Settlement & Fiscal Reporting ⚠️ (Partial)

**Mục tiêu**: Finance xem tổng quan KPI + export báo cáo → SEPA batch payment → E-Invoicing.

### Backend APIs (`/api/v1/`) — ✅ Done
| Method | Endpoint | Chức năng |
| ------ | -------- | --------- |
| GET | `/finance/expenses` | Danh sách APPROVED + PAID |
| PUT | `/finance/expenses/{id}/pay` | Mark single PAID |
| PUT | `/finance/expenses/batch-pay` | Mark batch PAID |
| @Scheduled | — | Auto batch-pay ngày 15 và cuối tháng |

### BFF Products — ✅ Done
| Product | Endpoint | Chức năng |
| ------- | -------- | --------- |
| fin-001 | GET `/fin-001` | Danh sách expenses APPROVED + PAID |
| fin-002 | PUT `/fin-002/:id/pay` | Single pay |
| fin-003 | PUT `/fin-003/batch-pay` | Batch pay |

### Frontend Screens (FINANCE only)
| Route | Component | Trạng thái |
| ----- | --------- | ---------- |
| `/finance/overview` | `overview-view.tsx` | ✅ Done |
| `/finance/reports` | `report-management-view.tsx` | ✅ Done (client-side filter, xem Flow 10) |
| `/finance/check` | `check-view.tsx` | ✅ Done |
| `/finance/payment` | `payment-view.tsx` | ✅ Done |
| `/finance/export` | `export-view.tsx` | ✅ Done |

---

---

## Flow 5: Permission-Based Authorization & CMS UI ✅

**Mục tiêu**: Thêm hai lớp phân quyền granular (page-level + element-level) và CMS-driven UI rendering — bắt đầu với màn hình Manager Approvals Detail.

### Kiến trúc hai lớp

```
Layer 1 — permissions (string[])
  → Kiểm tra cấp trang (page-level guard)
  → Ví dụ: EXPENSE_APPROVE, EXPENSE_REJECT, FINANCE_VIEW, FINANCE_EXPORT
  → Frontend: hasPermission("CODE") → redirect /not-found nếu thiếu

Layer 2 — functions (number[])
  → Kiểm tra cấp phần tử UI (element-level)
  → Ví dụ: function_id=1 (EXPENSE_ACCEPT), function_id=2 (EXPENSE_REJECT)
  → CMS: function_id trên node → hasFunctionId() → ẩn nếu user không có
```

### DB Tables mới (trong `TableMaster.sql` / `db_fix.sql`)

| Bảng | Mô tả |
|------|-------|
| `permissions` | Danh sách permission codes, PK=id, UNIQUE=permission_code |
| `user_permissions` | Map cognito_sub → permission_id, PK=(user_sub, permission_id) |
| `system_admins` | Admin pool riêng, tách khỏi bảng users |
| `functions` | Danh sách UI action IDs với function_key |
| `items` | Map cognito_sub → function_id (tên bảng là `items`) |
| `screen_configs` | CMS JSON, PK=(screen_key, version), `is_active` flag |

**Seed data:** 4 permissions + 4 functions, manager test user có permission 1+2 & function 1+2.

### Phase 2 — Backend APIs (`/api/v1/`)

| Method | Endpoint | Chức năng |
|--------|----------|-----------|
| GET | `/users/me/permissions` | List permission codes của current user |
| GET | `/users/me/functions` | List function IDs của current user |
| GET | `/screen-configs/{screenKey}` | Lấy active CMS config JSON |
| POST | `/admin/screen-configs/{screenKey}/patch` | CSV patch → new version |
| GET | `/admin/users/{sub}/permissions` | Admin: xem permissions của user |
| POST | `/admin/users/{sub}/permissions` | Admin: grant permission |
| DELETE | `/admin/users/{sub}/permissions/{code}` | Admin: revoke permission |
| GET | `/admin/users/{sub}/functions` | Admin: xem functions của user |
| POST | `/admin/users/{sub}/functions` | Admin: grant function |
| DELETE | `/admin/users/{sub}/functions/{key}` | Admin: revoke function |

**Java files mới:** PermissionEntity, FunctionEntity, ScreenConfigEntity, SystemAdminEntity, UserPermissionEntity + tương ứng Mapper interface + XML + Repository + Service + Controller.

### Phase 3 — BFF

| Product | Endpoint | Chức năng |
|---------|----------|-----------|
| scr-001 | GET `/scr-001/:screenKey` | Proxy → Java `/api/v1/screen-configs/{key}`, parse JSON string |

**Thay đổi `buildUISession`:** thêm `functions: number[]` — gọi `fetchUserFunctions()` trong `Promise.all` của com-001/002/003/004.

### Phase 4 — Frontend

| Tính năng | Mô tả |
|-----------|-------|
| `UISession.functions` | Thêm `functions: number[]` vào `ducks/auth/types.ts` |
| `AuthContext.hasFunctionId` | `(functionId: number) => boolean` — kiểm tra element-level |
| `AuthContext.hasPermission` | `(code: string) => boolean` — kiểm tra page-level |
| CMS Schema | `lib/cms/schema.ts` — Zod recursive `CmsNodeSchema` (`z.lazy()`) |
| CMS Renderer | `lib/cms/renderNode.tsx` — dispatch theo `node.type`, check `function_id`, i18n qua `t(label_key)` |
| CMS RTK Query | `ducks/cms/cmsApi.ts` — `useGetScreenConfigQuery(screenKey)` |
| NodeErrorBoundary | `lib/cms/NodeErrorBoundary.tsx` — bad node render → null, không crash trang |
| StaticFallback | Render khi Zod parse fail hoặc config fetch fail |
| not-found page | `app/not-found.tsx` — dùng Next.js built-in convention |

### CMS JSON Flow

```
screen_configs (DB)
  → GET /api/v1/screen-configs/{key} (Java)
  → GET /scr-001/{key} (BFF — parse string → JSON object)
  → useGetScreenConfigQuery() (RTK Query)
  → Zod safeParse → CmsNode tree
  → renderNode() + RenderContext
       ├── hasFunctionId → ẩn node
       ├── t(label_key)  → i18n en/vi/de
       ├── data_key      → map → Expense field
       └── actionHandlers → EXPENSE_ACCEPT / EXPENSE_REJECT / EXPENSE_REJECT_SUBMIT
```

### CSV Patch Admin Workflow

```
Admin POST /admin/screen-configs/{key}/patch (body: CSV)
  → ScreenConfigService.applyPatch()
  → DFS tìm node theo id
  → set nested property (dot-path)
  → saveNewVersion() = INSERT + deactivatePreviousVersions()
```

---

---

## Flow 6: AI-Powered Expense Report Generator ✅ (mock AI)

**Mục tiêu**: Admin trigger job → backend aggregate expense data từ DB → gọi AI (mock) → sinh markdown → frontend render report.

### DB Table mới

| Bảng | Mô tả |
|------|-------|
| `expense_reports` | Lưu job status, report_data JSON, markdown output |

### Backend APIs (`/api/v1/admin/reports/`)

| Method | Endpoint | Chức năng |
|--------|----------|-----------|
| POST | `/generate?period=2026-03` | Tạo PENDING job, trigger async runJob |
| GET | `/status/{jobId}` | Poll job status (PENDING / DONE / FAILED) |
| GET | `/latest` | Lấy report DONE mới nhất |

**Java files:** `ExpenseReportEntity`, `ExpenseReportMapper` + XML, `ExpenseReportRepository`, `ExpenseReportService`, `ExpenseReportController`

**`@EnableAsync`** thêm vào `MyJavaAppApplication` để hỗ trợ `CompletableFuture.runAsync`.

### BFF Endpoints

| Endpoint | Chức năng |
|----------|-----------|
| `adm-011` POST `/adm-011/reports/generate` | Forward generate |
| `adm-012` GET `/adm-012/reports/status/:jobId` | Forward poll |
| `adm-013` GET `/adm-013/reports/latest` | Forward latest |

### Frontend

| File | Mô tả |
|------|-------|
| `components/admin/ai-report-view.tsx` | UI: dropdown period + Generate button + poll + markdown display |
| `common/markdown-renderer/MarkdownRenderer.tsx` | Render markdown nội bộ (h1/h2/h3/p/ul/bold) |
| `ducks/admin/adminApi.ts` | RTK: `useGenerateReportMutation`, `useGetReportStatusQuery`, `useGetLatestReportQuery` |
| `app/(protected)/admin/ai-report/page.tsx` | Page wrapper |

### Async Job Flow

```
Admin click "Generate"
  → POST adm-011 → Backend tạo job PENDING → trả jobId ngay
  → Frontend setJobId → poll mỗi 2 giây (adm-012)
  → Backend background: aggregate DB → mockAI → UPDATE DONE
  → Frontend nhận DONE → hiện markdown, dừng poll
```

### Ollama Integration (thực tế, không còn mock)

`ExpenseReportService` gọi `OllamaClient.chat(prompt)` → POST `http://ollama:11434/v1/chat/completions` (OpenAI-compatible format). Nếu Ollama offline, service log lỗi và dùng fallback markdown.

**Docker profile**: `--profile ai` để start container `ollama` (image: `ollama/ollama:latest`).

---

## Flow 7: Report Template Designer + PDF Export ✅

**Mục tiêu**: Admin tạo template (title, màu, sections có thể reorder bằng DnD) → preview HTML → download PDF.

### DB Table mới

| Bảng | Mô tả |
|------|-------|
| `report_templates` | id, name, configJson (JSON string) |

### Backend APIs (`/api/v1/admin/report-templates/`)

| Method | Endpoint | Chức năng |
|--------|----------|-----------|
| GET    | `/` | List all templates |
| POST   | `/` | Create template |
| GET    | `/{id}` | Get one template |
| PUT    | `/{id}` | Update template |

### BFF Endpoints

| Product | Chức năng |
|---------|-----------|
| adm-014 | GET list + POST create |
| adm-015 | GET one + PUT update |
| adm-016 | POST generate-pdf (Puppeteer) |

### Frontend

| File | Mô tả |
|------|-------|
| `components/admin/report-template-designer.tsx` | DnD sections + live preview |
| `common/report-template/build-html-preview.ts` | Build HTML preview (browser) |
| `bff/src/common/utils/report-html-template.ts` | Build HTML cho PDF (BFF) |
| `bff/src/common/utils/pdf-generator.ts` | Puppeteer wrapper |

### DnD Kit

`@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`. Dùng `PointerSensor` với `activationConstraint: { distance: 8 }` để tránh conflict với scroll.

### sections Array Format (phá cách cũ)

Cũ: `{ executiveSummary: true, anomalies: false, ... }` (object, không có thứ tự)
Mới: `[{ key: "executiveSummary", enabled: true }, ...]` (ordered array — thứ tự = thứ tự render)

`normalizeSections()` xử lý backward compat ở cả BFF và frontend.

---

## Flow 8: Manager AI Report View ✅

**Mục tiêu**: Manager xem (read-only) report AI mới nhất + download PDF.

### Backend

`ManagerReportController` tại `/api/v1/manager/reports/latest` — không có `requireAdmin` check. Role gate tại BFF layer.

### BFF

| Product | Endpoint | Chức năng |
|---------|----------|-----------|
| mgr-005 | GET `/mgr-005/reports/latest` | Forward đến `/api/v1/manager/reports/latest` |

### Frontend

| File | Mô tả |
|------|-------|
| `components/manager/manager-ai-report-view.tsx` | Read-only view, chọn template, download PDF |
| `app/(protected)/manager/ai-report/page.tsx` | Page wrapper |

---

## Flow 9: AI Playground ✅

**Mục tiêu**: Admin test trực tiếp AI model với custom system + user prompt.

### Backend

`AiPlaygroundController` tại `POST /api/v1/admin/ai-playground/chat`. Gọi `OllamaClient.chatWithSystem(systemPrompt, userPrompt)` — hỗ trợ system message + user message roles (OpenAI format).

### BFF

| Product | Endpoint | Chức năng |
|---------|----------|-----------|
| adm-017 | POST `/adm-017/ai-playground/chat` | Proxy với timeout 150s |

### Frontend

| File | Mô tả |
|------|-------|
| `components/admin/ai-playground-view.tsx` | Split panel: left=prompts, right=output |
| `app/(protected)/admin/ai-playground/page.tsx` | Page wrapper |

---

## Flow 10: Finance Report Management ✅ (frontend only)

**Mục tiêu**: Finance xem và filter danh sách báo cáo chi phí với collapsible filter sidebar.

### Frontend

| File | Mô tả |
|------|-------|
| `components/finance/report-management-view.tsx` | Full-bleed layout với FilterSidebar + KPI + Table |
| `app/(protected)/finance/reports/page.tsx` | Page wrapper |

**Data source**: Reuse `useGetFinanceExpensesQuery` (FIN-001), filter client-side.

**Full-bleed layout**: `-mx-6 md:-mx-8 -my-6 md:-my-8 h-[calc(100vh-64px)]` — thoát khỏi padding của protected layout.

---

## Flow 11: Finance New Report — Multi-Step Modal ✅

**Mục tiêu**: Finance tạo `FinanceReport` mới (entity riêng, không phải expense reimbursement) qua modal 5 bước — lưu DRAFT hoặc submit trực tiếp.

### DB Table mới

| Bảng | Mô tả |
|------|-------|
| `finance_reports` | Entity riêng — không dùng bảng `expenses`. Các trường JSON: `line_items`, `attachments`, `approval_route`, `notify_cc` |

**Lý do tách bảng**: Finance report có cấu trúc khác hoàn toàn (multi-level approval, line items, priority, fiscal period) — không thể tái dùng `expenses`.

### Backend APIs (`/api/v1/finance/`)

| Method | Endpoint | Chức năng |
|--------|----------|-----------|
| POST | `/reports` | Tạo finance report (DRAFT hoặc PENDING_REVIEW) |
| GET  | `/reports` | List tất cả finance reports (không filter by user) |

**Java files mới:** `FinanceReportEntity`, `CreateFinanceReportRequestDto`, `FinanceReportResponseDto`, `FinanceReportMapper.java` + `FinanceReportMapper.xml`, `FinanceReportRepository`, `FinanceReportService`

**`FinanceController`** mở rộng: thêm `POST /reports` và `GET /reports`.

### BFF Endpoints

| Product | Method | Path | Chức năng |
|---------|--------|------|-----------|
| fin-004 | POST | `/fin-004/reports` | Create finance report |
| fin-005 | GET  | `/fin-005/reports` | List finance reports |

### Frontend

| File | Mô tả |
|------|-------|
| `components/finance/new-report-modal.tsx` | Modal 5 bước (Stepper + 5 Step components) |
| `components/finance/report-management-view.tsx` | Update: thêm tabs "Finance Reports" / "Expense Items" + "+ New report" button |
| `ducks/expenses/types.ts` | Thêm `FinanceReport`, `CreateFinanceReportRequest`, `LineItem`, `ApprovalLevel`, `ReportAttachment` |
| `ducks/expenses/expenseApi.ts` | Thêm `createFinanceReport` (fin-004) + `getFinanceReports` (fin-005) |

### Modal Architecture (5 bước)

```
Step 1 — General info: title, reportType (FINANCIAL/ANALYTICS/OPERATIONS/COMPLIANCE), fiscalPeriod, dueDate, description, priority (LOW/NORMAL/HIGH/URGENT)
Step 2 — Financial details: totalAmount, currency, lineItems table (description + OPEX/CAPEX + amount)
Step 3 — Attachments: file picker → list với PRIMARY/SUPPORTING toggle (UI demo, không upload thật)
Step 4 — Approval route: 3 level cards hard-coded (Minh Tran, Hoa Nguyen, Long Pham) + CC chip input
Step 5 — Review & submit: summary cards + declaration checkbox → "Submit report" (submitNow=true) hoặc "Save draft" (submitNow=false)
```

**Stepper**: dot + connector, green checkmark = done, blue = active, gray = pending.

---

## Ghi chú chung

| Hạng mục | Chi tiết |
| -------- | -------- |
| **Auth** | AWS Cognito — HttpOnly cookies, SameSite=Strict |
| **DB** | MySQL 8.0 — Docker port 3307, `db_fix.sql` là reset script |
| **BFF pattern** | Mỗi product = `controller.ts` + `index.ts`, đánh số product-001 → product-018; screen config = scr-001+ |
| **RTK Query** | `authApi` (auth/onboarding) + `expenseApi` (expense/manager/storage) + `cmsApi` (screen configs) |
| **i18n** | de-DE, en-US, vi-VN |
| **Mock OCR** | `ExpenseService.mockScan()` — thay bằng real OCR khi cần |
| **Route ordering** | BFF: `/expenses/upload-url` (018) → `/expenses/scan` (014) → `/expenses/:id` (012) |
| **MinIO** | S3-compatible, Docker port 9000 (API) / 9001 (Console). Bucket: `receipts` |
| **Presigned URL** | S3Presigner dùng public endpoint; S3Client dùng internal endpoint. Cả hai cần path-style |
| **Mock AI** | `ExpenseReportService.mockAiCall()` — thay bằng POST đến LM Studio khi sẵn sàng |
