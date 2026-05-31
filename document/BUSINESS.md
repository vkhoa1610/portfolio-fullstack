# BUSINESS — FintechSaaS Expense Platform
> **File note chính của project** — cập nhật lần cuối: 2026-05
> Mục đích: portfolio relocation tại Đức (German Fintech/Finance market)

---

## 1. Tổng quan hệ thống

Nền tảng phục vụ quy trình ghi nhận → duyệt → thanh toán → khai báo thuế cho các khoản chi phí cá nhân của nhân viên (công tác, mua sắm, đi lại). Tích hợp **AI (Groq Vision + LLM)** để OCR hóa đơn và sinh policy insight tự động. Compliance được lái bởi **CMS-driven rules** lưu snapshot từng lần evaluate để audit.

**Stack tóm tắt:**
- Frontend: Next.js 15 App Router + RTK Query
- BFF: Express (Node.js) — proxy auth + AI orchestration
- Backend: Spring Boot + MyBatis + MySQL 8
- Auth: Auth0/Cognito (sub-based)
- Storage: MinIO (S3-compatible) cho receipt images
- AI: Groq API (LLaMA Vision + Chat)

---

## 2. 4 Role và phạm vi trách nhiệm

| Role | Mô tả | Quyền chính |
|------|------|------------|
| **EMPLOYEE** | Nhân viên thông thường | Tạo, chỉnh sửa, submit expense của bản thân |
| **MANAGER** | Trưởng nhóm / quản lý | Duyệt hoặc từ chối expense của nhân viên cấp dưới |
| **FINANCE** | Kế toán / Tài chính | Final check, batch payment, xuất file thuế (DATEV/SEPA/XRechnung) |
| **ADMIN** | Quản trị hệ thống | Quản lý user, phân quyền, import danh sách nhân viên |

Role được seed trong `db_fix.sql` (`roles` table) và map vào navigation tại `Sidebar.tsx`. Permission chi tiết (granular) lưu ở bảng `user_permissions` (vd: `EXPENSE_APPROVE`, `FINANCE_EXPORT`).

---

## 3. Expense Lifecycle (state machine)

```
       ┌──────────┐  submit   ┌─────────────────┐  approve  ┌──────────┐  pay   ┌──────┐
       │  DRAFT   │ ────────► │ PENDING_REVIEW  │ ────────► │ APPROVED │ ────► │ PAID │
       └──────────┘           └─────────────────┘           └──────────┘        └──────┘
        EMPLOYEE                  MANAGER  │                  FINANCE
                                  reject   ▼
                                       ┌──────────┐
                                       │ REJECTED │
                                       └──────────┘
```

Mỗi transition ghi audit field tương ứng (`submitted_at`, `reviewed_at`/`reviewed_by`, `rejection_reason`, paid timestamp). Định nghĩa trong `ExpenseEntity.java` + `ExpenseService.java`.

### 3 loại Expense

| Type | Trường đặc thù | Cách tính amount |
|------|---------------|-----------------|
| **RECEIPT** | `vendorName`, `receiptDate`, `vatAmount`, `receiptFileUrl` | Nhập tay sau OCR |
| **PER_DIEM** | `tripFrom`, `tripTo`, `countryCode`, `perDiemRate`, `perDiemDays` | `rate × days` (rate theo quốc gia) |
| **MILEAGE** | `distanceKm`, `ratePerKm` (default €0.30) | `distance × rate` |

> **German compliance note:** €0.30/km là Kilometerpauschale chuẩn theo §9 EStG. Per diem theo `countryCode` phản ánh đúng quy định Reisekostenabrechnung §4 EStG của Đức.

---

## 4. Workflows theo Role

### 4.1. EMPLOYEE — Tạo và submit expense

**Pages:**
- `/my-expenses` — danh sách + bento grid stats (MTD, Pending, Reimbursed YTD) + AI Editorial Insight
- `/my-expenses/create` — chọn loại (RECEIPT / PER_DIEM / MILEAGE)
- `/my-expenses/{id}` — xem chi tiết + timeline + policy snapshot

**Actions:**
1. **Tạo expense** (status = DRAFT):
   - RECEIPT: upload ảnh → BFF gọi Groq Vision OCR → auto-fill vendor/amount/VAT
   - PER_DIEM: chọn quốc gia + khoảng ngày → auto-calc days × rate
   - MILEAGE: nhập distance → auto-calc total
   - Policy compliance evaluate real-time theo form input
2. **Submit** (DRAFT → PENDING_REVIEW): `POST /expenses/{id}/submit`
3. **Xem detail**: hiển thị Editorial Insight build từ `policy_evaluation_history` đã lưu lúc create

---

### 4.2. MANAGER — Duyệt expense

**Pages:**
- `/manager/approvals` — queue PENDING_REVIEW (có badge count realtime trong sidebar)
- `/manager/approvals/{id}` — chi tiết + nút Approve / Reject
- `/manager/ai-report` — báo cáo AI sinh tự động (monthly trends, anomalies)
- `/manager/report-template` — config sections cho AI report
- `/manager/ai-playground` — chat playground với Groq để test prompt

**Actions:**
1. **Approve** (PENDING_REVIEW → APPROVED): `PUT /manager/expenses/{id}/approve`
2. **Reject** (PENDING_REVIEW → REJECTED): modal nhập lý do → `PUT /manager/expenses/{id}/reject`
3. **Xem AI report**: Groq phân tích chi tiêu của team, sinh markdown (executive summary, breakdown by category/employee, anomalies, recommendations)
4. **Customize report**: bật/tắt từng section của AI report

Permission check: `EXPENSE_APPROVE` / `EXPENSE_REJECT` (granular, không chỉ dựa role).

---

### 4.3. FINANCE — Final check, payment, tax export

Đây là role có nhiều screen nhất, gồm 5 màn hình chuyên biệt:

#### 4.3.1. Overview Dashboard (`/finance/overview`)
- **KPI cards**: Total Spend, Pending Approvals, Approved, Paid
- **Budget bar**: tổng spend vs budget (từ `session.budget`)
- **Charts**: Monthly trend (6 tháng gần nhất), Breakdown by type (RECEIPT / PER_DIEM / MILEAGE)
- Data: `GET /finance/expenses` (lọc APPROVED + PAID)

#### 4.3.2. Finance Reports (`/finance/reports`)
Báo cáo tài chính độc lập phục vụ CFO / auditor — KHÔNG phải báo cáo tổng hợp expense.

- Entity riêng: `FinanceReportEntity` với status DRAFT / PENDING_REVIEW / APPROVED / REJECTED
- Loại report: `FINANCIAL`, `ANALYTICS`, `OPERATIONS`, `COMPLIANCE`
- Có `approvalRoute` (JSON nhiều cấp: level, reviewer, deadline) và `notifyCc`
- Hỗ trợ `lineItems` (OPEX/CAPEX), `attachments` (PRIMARY/SUPPORTING)
- Fiscal period + due date + priority (LOW/NORMAL/HIGH/URGENT)

#### 4.3.3. Final Check (`/finance/check`)
Bước review trung gian sau khi MANAGER đã approve:

- **3 trạng thái UI** (local state, chưa persist):
  1. **Pending Check** — APPROVED expense chờ kế toán review
  2. **Released for Payment** — đã release, sẵn sàng batch payment
  3. **Flagged** — flag để điều tra thêm
- Mục tiêu: tách quyền duyệt nghiệp vụ (manager) khỏi quyền duyệt thanh toán (finance)

#### 4.3.4. Batch Payment (`/finance/payment`)
- Select multiple / select all APPROVED expenses
- **Download SEPA XML** (format pain.001.001.03, chuẩn ngân hàng Châu Âu)
  - MsgId, transaction count, control sum, Debtor / creditor IBAN
- Sau khi download → mark PAID: `PUT /finance/expenses/batch-pay` với list ID
- **Auto-job**: scheduled batch-pay vào ngày 15 và ngày cuối tháng, 08:00 UTC

#### 4.3.5. Tax Export (`/finance/export`)

| Format | Mục đích | Đặc tả |
|--------|---------|--------|
| **DATEV CSV** | Kế toán Đức (Reisekostenabrechnung) | Cột: Umsatz, Soll/Haben, WKZ, Konto (6300=RECEIPT, 6310=PER_DIEM, 6320=MILEAGE), Gegenkonto 1600, Belegdatum, Kostenstelle, Steuercode VST |
| **SEPA XML** | Bank file import | pain.001.001.03 |
| **XRechnung** | Hóa đơn EN16931 | Invoice lines + 19% VAT category |

> **TODO (German market):** Bổ sung Leitweg-ID (bắt buộc cho B2G), ZUGFeRD 2.x hybrid PDF option, UBL 2.1 / CII D16B format mention. Thêm Buchungsperiode mapping (1–12) và Vorsteuerabzug flow vào DATEV documentation.

---

### 4.4. ADMIN — Quản lý user

**Pages:** `/admin`, `/admin/users`, `/admin/import`

**Actions:**
- Tạo / cập nhật / khóa user
- Gán role (EMPLOYEE / MANAGER / FINANCE) và granular permission
- Import batch từ CSV

---

## 5. Cross-cutting features

### 5.1. Policy Compliance System (CMS-driven)

- **`screen_configs`**: định nghĩa rules cho từng screen, mỗi rule có `id`, `icon`, i18n keys, `severity` (error/warning/info/success), `blocks_save`, `condition`
- Condition evaluate ở frontend dựa trên form input (vd: `distance_over_limit`, `currency_mismatch`, `possible_commute`)
- Frontend resolve i18n key qua `t()` của react-i18next

**Snapshot history:** Mỗi khi expense được create, snapshot toàn bộ compliance evaluation được lưu vào `policy_evaluation_history`:

```
domain=EXPENSE, entity_type=EXPENSE, entity_id=<id>, event_type=CREATE,
screen_key=<screen>, screen_version=<v>,
result_json=[{ id, severity, state, titleKey, resolvedTitle, ... }],
input_json={ form snapshot }
```

→ Detail view đọc lại snapshot này để render Editorial Insight — **immutable**, không phụ thuộc rule hiện tại.

### 5.2. AI Integration (Groq)

| Use case | Endpoint | Model | Output |
|----------|----------|-------|--------|
| Receipt OCR | `POST /expenses/scan` | LLaMA 3.2 Vision | `{ vendor, date, amount, vatAmount, vatRate, flags[] }` |
| Policy Insight | BFF `ins-001` | LLaMA Chat | Editorial text per expense type + summary |
| Manager AI Report | Async job | LLaMA Chat | Markdown report: summary, breakdown, anomalies, recommendations |

- Frontend debounce 600–800ms, skeleton shimmer khi loading
- "AI-assisted" badge để minh bạch nguồn
- AI report lưu vào `expense_reports` (status PENDING → DONE/FAILED)

### 5.3. Auth & Session

- Auth0/Cognito: `cognito_sub` định dạng `auth0|<hex24>`
- JWT lưu trong **HttpOnly cookie** (không expose token ra frontend)
- BFF có `JwtAuthFilter` extract `cognito_sub` từ JWT → request attribute
- Frontend nhận `UISession` (KHÔNG có token): `{ user, role, permissions[], functions[], isAdmin, budget }`
- Session in-memory only, lost on refresh — re-hydrate từ cookie qua `GET /auth/session`

### 5.4. Storage

- MinIO S3-compatible, bucket cho receipt images
- **Presigned PUT URL** — browser upload trực tiếp, không qua server: `GET /expenses/upload-url`
- **Presigned GET URL** (validity 1h) cho viewing: `GET /expenses/view-url`
- Path lưu ở `receipt_file_url` của expense

> **GoBD note (TODO):** Cần thêm MinIO versioning enabled + WORM policy để đảm bảo immutability cho receipt images. GoBD §14 yêu cầu lưu trữ chứng từ 10 năm, không được phép sửa sau khi lưu.

---

## 6. Database entities

| Bảng | States | Vai trò |
|------|--------|---------|
| `expenses` | DRAFT, PENDING_REVIEW, APPROVED, REJECTED, PAID | Expense chính, 3 type |
| `finance_reports` | DRAFT, PENDING_REVIEW, APPROVED, REJECTED | Báo cáo tài chính của FINANCE |
| `expense_reports` | PENDING, DONE, FAILED | AI-generated markdown report |
| `policy_evaluation_history` | (audit) | Snapshot compliance evaluation, immutable |
| `screen_configs` | (CMS) | Rules + insights, có version |
| `users` | active, inactive, banned | Linked Auth0/Cognito sub |
| `user_roles` | (junction) | Map user → role |
| `user_permissions` | is_active | Granular permission per user |
| `user_profiles` | (metadata) | first_name, last_name, avatar_url, language_code |
| `policies` + `user_consents` | is_current_active | Terms of Service / Privacy compliance |

---

## 7. Backend API map

```
EMPLOYEE
  POST   /api/v1/expenses                       Tạo expense (DRAFT)
  GET    /api/v1/expenses                       List expense của user
  GET    /api/v1/expenses/{id}                  Chi tiết + policy snapshot
  POST   /api/v1/expenses/{id}/submit           Submit (→ PENDING_REVIEW)
  POST   /api/v1/expenses/scan                  OCR receipt (Groq Vision)
  GET    /api/v1/expenses/upload-url            Presigned PUT
  GET    /api/v1/expenses/view-url              Presigned GET

MANAGER
  GET    /api/v1/manager/expenses               Queue PENDING_REVIEW
  PUT    /api/v1/manager/expenses/{id}/approve  Approve
  PUT    /api/v1/manager/expenses/{id}/reject   Reject + reason
  GET    /api/v1/manager/reports/latest         AI report mới nhất

FINANCE
  GET    /api/v1/finance/expenses               APPROVED + PAID
  PUT    /api/v1/finance/expenses/{id}/pay      Mark PAID
  PUT    /api/v1/finance/expenses/batch-pay     Bulk pay
  POST   /api/v1/finance/reports                Tạo finance report
  GET    /api/v1/finance/reports                List finance reports

ADMIN
  GET    /api/v1/admin/users                    List user
  GET    /api/v1/admin/users/{sub}/permissions  Permission status
  GET    /api/v1/admin/users/{sub}/functions    Function status

AUTH
  GET    /api/auth/session                      Session với role + permissions
  POST   /api/auth/login                        Login
  POST   /api/auth/mfa/verify                   MFA verify
  POST   /api/auth/logout                       Logout

AI (BFF)
  POST   /ins-001                               Generate policy insight (Groq)
```

---

## 8. Demo users (seed)

| Role | Tên | Mục đích |
|------|-----|---------|
| EMPLOYEE | Anna Müller | Demo flow tạo + submit expense |
| MANAGER | Thomas Weber | Demo duyệt + AI report |
| FINANCE | Sarah Chen | Demo dashboard + batch payment + tax export |
| ADMIN | David Kim | Demo quản lý user |

One-click demo login button có sẵn trên `/auth/login`.

---

---

# Portfolio Review — German Market

> Phần này tổng hợp đánh giá và kế hoạch cải thiện cho mục tiêu relocation tại Đức.
> Cập nhật theo từng sprint, không xóa — chỉ thêm vào.

---

## 9. Điểm mạnh nổi bật (German Fintech context)

| Điểm mạnh | Lý do quan trọng với German market |
|-----------|-----------------------------------|
| **DATEV CSV** với Konto/Gegenkonto, Steuercode VST | Chuẩn kế toán Đức — hầu hết dev nước ngoài không biết |
| **SEPA pain.001.001.03** | Bank file chuẩn EU, chứng minh hiểu payment thực tế |
| **XRechnung / EN16931** | Bắt buộc cho B2G tại Đức từ 2025 |
| **Per diem theo countryCode** | Phản ánh đúng §4 EStG Reisekostenabrechnung |
| **Mileage €0.30/km default** | Đúng Kilometerpauschale §9 EStG |
| **Policy compliance CMS-driven + immutable snapshot** | Audit-ready, phù hợp văn hóa compliance Đức |
| **AI OCR + Policy Insight** | Modern stack, differentiation so với CRUD app thông thường |

---

## 10. Điểm cần cải thiện (TODO list)

### 🔴 Critical

- [x] **Thêm section GDPR/DSGVO** vào Wiki → **`GDPR-Compliance.md`** ✓
  - Data classification: PII (erasable) vs Financial (GoBD 10yr retained)
  - Pseudonymization pattern thay cho hard delete với financial records
  - 3 role: ADMIN (DPA), FINANCE (GoBD gatekeeper), EMPLOYEE (data subject)
  - Erasure request workflow đầy đủ với sequence flow
  - `gdpr_audit_log` table schema
  - Consent management flow (không pre-ticked checkbox — GDPR Art. 7)
  - Retention schedule per data type
  - 2 màn hình mới: `/profile/privacy` + tab GDPR trong `/admin/users`
  - 8 API endpoints mới
  - Checklist triển khai 4 phase

- [ ] **Vẽ Architecture diagrams** (xem Section 11)
  - C4 Level 1 — System Context ✅ (đã vẽ, cần export sang Wiki)
  - C4 Level 2 — Container diagram (chưa làm)
  - Sequence diagram: expense lifecycle ✅ (đã vẽ, cần export)

### 🟡 Important

- [ ] **GoBD compliance note** trong Storage section
  - MinIO versioning enabled + WORM storage policy
  - 10-year retention cho receipt images (§14 GoBD)
  - Immutability guarantee: không được sửa chứng từ sau khi lưu

- [ ] **DATEV section bổ sung**
  - Buchungsperiode mapping (period 1–12 → tháng trong Geschäftsjahr)
  - Vorsteuerabzug (VAT reclaim) flow
  - Fiscal year config (Jan–Dez vs custom)

- [ ] **XRechnung nâng cấp mô tả**
  - Thêm Leitweg-ID (bắt buộc cho B2G routing)
  - ZUGFeRD 2.x hybrid PDF+XML option
  - UBL 2.1 / CII D16B format mention

### 🟢 Nice to have

- [ ] DATEV Unternehmen Online API push (thay vì chỉ CSV export)
- [ ] Multi-currency với ECB exchange rate feed
- [ ] Steuerberater access role (read-only view cho tax advisor)

---

## 11. Architecture Documentation Plan

### Đã có (từ portfolio review session)

**C4 Level 1 — System Context**
```
Actors: Employee, Manager, Finance, Admin
External systems: Auth0/Cognito, Groq API, MinIO/S3, German Bank (SEPA)
Core message: ai dùng hệ thống, hệ thống kết nối với dịch vụ ngoài nào
```

**Sequence Diagram — Expense Lifecycle**
```
5 participants: Employee | Next.js+BFF | Spring Boot+MySQL | Groq AI | Manager+Finance
5 phases: DRAFT → SUBMIT → APPROVE → FINAL CHECK → PAID
Key flows:
  - Presigned PUT URL → browser upload thẳng MinIO (không qua server)
  - OCR: POST /scan → Groq Vision → vendor/amount/VAT auto-fill
  - Submit → notify Manager (badge count +1)
  - Approve → AI insight generate (Groq Chat)
  - Batch pay → SEPA XML download → batch-pay API → status PAID
  - Auto-job: ngày 15 & cuối tháng 08:00 UTC
```

### Còn thiếu

- [ ] **C4 Level 2 — Container diagram**: tách Next.js / BFF (Express) / Spring Boot / MySQL / MinIO thành các container riêng với giao tiếp HTTP/SQL/S3
- [ ] **ERD** cho các bảng core: `expenses`, `policy_evaluation_history`, `screen_configs`, `finance_reports`
- [ ] **ADR (Architecture Decision Records)**: tại sao dùng BFF pattern, tại sao presigned URL thay vì proxy upload, tại sao CMS-driven policy

---

## 12. Documentation Structure (README + Wiki)

### Nguyên tắc phân chia

> README = tấm biển hiệu (30 giây đọc, recruiter xem)
> Wiki = căn phòng chi tiết (tech lead / senior dev đọc kỹ)

### README.md — target: < 300 dòng

```
├── What it is          (2–3 câu + badges)
├── Live demo + screenshot
├── Tech stack          (table)
├── Quick start         (3 bước chạy local)
└── → "Full docs: see Wiki"
```

### Wiki/ — target structure

```
├── Home.md                    ← overview + navigation map
├── Architecture.md            ← C4 Level 1 + Level 2 + ADR
├── Expense-Lifecycle.md       ← sequence diagram + state machine
├── GDPR-Compliance.md         ← data retention, erasure, consent
├── GoBD-Notes.md              ← 10-year retention, immutability
├── API-Reference.md           ← endpoint map đầy đủ
├── Tax-Export.md              ← DATEV/SEPA/XRechnung deep dive
└── Demo-Guide.md              ← hướng dẫn chạy demo cho recruiter
```

### Target audience mapping

| Người đọc | Đọc gì | Họ tìm kiếm điều gì |
|-----------|--------|---------------------|
| Recruiter / HR | README | Bạn làm gì, stack gì, có demo không |
| Tech lead phỏng vấn | README → Wiki/Architecture | Bạn có hiểu system design không |
| Finance domain expert | Wiki/Tax-Export | Bạn có hiểu DATEV/GoBD thực sự không |
| Hiring manager | README + demo | Project có chạy được không, UI có đẹp không |

---

## 13. Scoring tổng kết (German market readiness)

| Tiêu chí | Điểm hiện tại | Điểm mục tiêu | Việc cần làm |
|----------|--------------|--------------|-------------|
| German tax compliance (DATEV, VAT) | 88% | 95% | Bổ sung Buchungsperiode, Vorsteuerabzug |
| Payment standards (SEPA, IBAN) | 85% | 90% | Document rõ hơn IBAN validation |
| Architecture documentation | 40% | 85% | C4 L1+L2, sequence diagram, ERD |
| Data privacy / GDPR | 35% → **92%** ✅ | 80% | **Done** — 4 phases, 37 files, Art.12/17/20/30 + GoBD §14 |
| Audit & GoBD compliance | 60% | 85% | GoBD note, MinIO WORM |
| AI / modern tech stack | 90% | 90% | Giữ nguyên |
| Role-based access control | 80% | 85% | Document granular permission rõ hơn |
| **Tổng** | **74/100** | **~88/100** | |