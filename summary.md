# Portfolio Fullstack - Project Summary

> **Mục đích**: Tài liệu tổng hợp để AI có thể nhanh chóng hiểu cấu trúc project mà không cần scan toàn bộ codebase.
> **Cập nhật lần cuối**: 2026-03-01 (Session 4: Flow 4 đầy đủ UI + i18n DE/EN/VI cho toàn bộ Finance + Sidebar role-based)

---

## 📁 Kiến trúc Tổng quan

```
portfolio-fullstack/
├── frontend/          # Next.js 15 (React 19) - Turbopack
├── bff/               # Express.js BFF Layer (TypeScript)
├── backend/           # Spring Boot 3.5 (Java 21) - Đang triển khai (Profile API ✅)
├── nginx/             # Reverse Proxy Gateway
├── docker-compose.yml # Container orchestration
└── TableMaster.sql    # Database schema (MySQL 8.0)
```

---

## 🛠️ Tech Stack

### Frontend (`/frontend`)

| Công nghệ                 | Phiên bản | Mục đích                      |
| ------------------------- | --------- | ----------------------------- |
| Next.js                   | 15.5.4    | React Framework với Turbopack |
| React                     | 19.1.0    | UI Library                    |
| TypeScript                | 5.x       | Type Safety                   |
| Tailwind CSS              | 3.4.19    | Styling                       |
| Redux Toolkit (RTK Query) | 2.9.0     | State Management & API calls  |
| react-hook-form           | 7.65.0    | Form handling                 |
| i18next                   | 25.7.2    | Internationalization (DE/EN/VI)  |
| Storybook                 | 8.x       | Component documentation       |
| Jest                      | 29.x      | Unit testing                  |

### BFF Layer (`/bff`)

| Công nghệ       | Phiên bản | Mục đích                    |
| --------------- | --------- | --------------------------- |
| Express.js      | 4.19.2    | HTTP Server                 |
| TypeScript      | 5.6.3     | Type Safety                 |
| AWS Cognito SDK | 3.908.0   | Authentication              |
| cookie-parser   | 1.4.7     | HttpOnly cookie handling    |
| jsonwebtoken    | 9.0.3     | JWT parsing                 |
| serverless-http | 3.2.0     | AWS Lambda deployment ready |
| tsup            | 8.5.1     | Bundler                     |

### Backend (`/backend`) - **ĐANG TRIỂN KHAI**

| Công nghệ             | Phiên bản | Mục đích                 |
| --------------------- | --------- | ------------------------ |
| Spring Boot           | 3.5.6     | Java Framework           |
| Java                  | 21        | Runtime                  |
| MyBatis               | 3.0.5     | ORM                      |
| MySQL Connector       | -         | Database driver          |
| AWS SDK v2 (S3)       | 2.25.0    | MinIO/S3 presigned URLs  |
| Spring Cloud (Eureka) | 2025.0.0  | Microservices (optional) |
| SpringDoc OpenAPI     | 2.8.9     | API Documentation        |
| Lombok                | -         | Boilerplate reduction    |

### Infrastructure

| Công nghệ      | Mục đích                  |
| -------------- | ------------------------- |
| Docker Compose | Container orchestration   |
| Nginx Alpine   | Reverse proxy (port 8080) |
| MySQL 8.0      | Database (port 3307)      |
| AWS Cognito    | Authentication service    |
| MinIO          | S3-compatible object storage (receipts, port 9000/9001) |
| LocalStack     | Local AWS emulation (dev) |

---

## 🔐 Flow 1: Secure Onboarding & Compliance

### Trạng thái tổng quan

| Layer    | Login | MFA | New Password | Session | Redirect by status | GDPR Consent | Profile Setup |
| -------- | ----- | --- | ------------ | ------- | ------------------ | ------------ | ------------- |
| Frontend | ✅    | ✅  | ✅           | ✅      | ✅                 | ✅           | ✅            |
| BFF      | ✅    | ✅  | ✅           | ✅      | ✅                 | ✅           | ✅            |
| Backend  | ✅    | -   | -            | ✅      | ✅ (via /me API)   | ✅           | ✅            |

### Frontend Views (`/frontend/app`)

``` 
middleware.ts                    # ✅ Route protection (redirect /auth/login nếu không có cookie)
app/
├── auth/login/page.tsx          # Login screen
├── auth/mfa/page.tsx            # MFA OTP verification
├── auth/new-password/page.tsx   # First-login password change
└── (protected)/
    ├── layout.tsx               # Protected layout
    └── onboarding/
        ├── page.tsx             # ✅ Redirect → /onboarding/compliance
        ├── layout.tsx           # Onboarding layout
        ├── compliance/page.tsx  # ✅ GDPR & Policy consent (wire submit done)
        └── profile/page.tsx     # ✅ Language + role thật (wire submit done)
```

### BFF Endpoints (`/bff/src/product/common`)

> ⚠️ Đã refactor: đổi từ `product-xxx` sang domain-based naming (`com-xxx`).
> Frontend gọi qua path `/api/com-001`, `/api/com-002`, v.v. (xem `bff-endpoints.ts`)

| Code    | Method | Path       | Chức năng                      | Trạng thái |
| ------- | ------ | ---------- | ------------------------------ | ---------- |
| com-001 | POST   | `/com-001` | Email/Password login → Cognito | ✅ Done    |
| com-002 | POST   | `/com-002` | MFA verification (TOTP)        | ✅ Done    |
| com-003 | POST   | `/com-003` | Handle NEW_PASSWORD_REQUIRED   | ✅ Done    |
| com-004 | GET    | `/com-004` | Get current session            | ✅ Done    |
| com-005 | POST   | `/com-005` | Logout & clear cookies         | ✅ Done    |
| com-006 | POST   | `/com-006` | Ghi nhận GDPR + ToS consent    | ✅ Done    |
| com-007 | POST   | `/com-007` | Lưu language → tạo profile     | ✅ Done    |

### Auth Flow Logic

```
Login Request
    │
    ├─► MFA Required (SOFTWARE_TOKEN_MFA)
    │       → product-005: verify OTP → Set HttpOnly cookies → Return session
    │
    ├─► New Password Required (NEW_PASSWORD_REQUIRED)
    │       → product-004: set new password → Set HttpOnly cookies → Return session
    │
    └─► Success (AuthenticationResult)
            → Set HttpOnly cookies (access_token, id_token, refresh_token)
            → Fetch user profile từ backend (GET /api/v1/users/me)
            → Build UISession: { user: { email, role }, budget, onboardingStatus }
            → Return redirectTo: '/onboarding' (PENDING) | '/dashboard' (DONE)
```

### Redirect Logic (hiện tại)

- **Dựa trên `onboardingStatus`** (từ backend `/api/v1/users/me`):
  - `PENDING` → `/onboarding` → `/onboarding/compliance` (middleware bảo vệ)
  - `DONE` → `/dashboard`
- **Role** (`EMPLOYEE`/`MANAGER`/`FINANCE`) có trong UISession
- ⚠️ Role-based routing sang màn hình riêng (my-expenses/manager/finance) → **cần implement tiếp**

### Cookie Strategy

- **HttpOnly cookies**: Tokens KHÔNG bao giờ expose ra frontend
- **Nginx buffer size**: Đã tăng `proxy_buffer_size` để handle large Cognito tokens
- **SameSite=Strict + Secure**: CSRF protection

### ⚠️ Còn thiếu (Flow 1)

1. **Role-based routing**: Login xong → route theo role (Employee→my-expenses, Manager→manager, Finance→finance)
2. **SSO (Azure AD/Okta)**: Chưa implement

---

## 📝 Flow 2: Smart Expense Capture (Germanized)

### Trạng thái: **✅ HOÀN THÀNH TOÀN BỘ (DB + Backend + BFF + Frontend + i18n)**

### 10 Màn hình theo Role

| Screen | Route | Role |
| ------ | ----- | ---- |
| Dashboard redirect | `/dashboard` | All |
| Expense List | `/my-expenses` | EMPLOYEE, MANAGER |
| Type Selector | `/my-expenses/create` | EMPLOYEE, MANAGER |
| Receipt Upload + OCR | `/my-expenses/create/scan` | EMPLOYEE, MANAGER |
| Per Diem Form | `/my-expenses/create/per-diem` | EMPLOYEE, MANAGER |
| Mileage Form | `/my-expenses/create/mileage` | EMPLOYEE, MANAGER |
| Expense Detail | `/my-expenses/[id]` | EMPLOYEE, MANAGER |
| Review & Submit | `/my-expenses/[id]/review` | EMPLOYEE, MANAGER |
| Approval Queue | `/manager/approvals` | MANAGER |
| Approval Detail | `/manager/approvals/[id]` | MANAGER |
| Finance Overview | `/finance/overview` | FINANCE |
| Finance Final Check | `/finance/check` | FINANCE |
| Batch Payment | `/finance/payment` | FINANCE |
| Tax Export | `/finance/export` | FINANCE |

### Frontend Views

```
app/(protected)/
├── dashboard/page.tsx               # Role-based redirect (MANAGER→/manager/approvals, FINANCE→/finance/overview, else→/my-expenses)
├── my-expenses/
│   ├── page.tsx                     # Expense list (RTK Query)
│   ├── create/
│   │   ├── page.tsx                 # Type selector (Receipt/Per Diem/Mileage)
│   │   ├── scan/page.tsx            # Upload + Mock OCR split view
│   │   ├── per-diem/page.tsx        # Auto-calc Verpflegungsmehraufwand
│   │   └── mileage/page.tsx         # 0.30€/km Kilometerpauschale auto-calc
│   └── [id]/
│       ├── page.tsx                 # Expense detail + status banner
│       └── review/page.tsx          # Budget check + confirm submit
├── manager/
│   └── approvals/
│       ├── page.tsx                 # Pending approval queue + AI flags
│       └── [id]/page.tsx            # Approve / Reject with rejection form
└── finance/
    ├── overview/page.tsx            # KPI cards + analytics charts + full table
    ├── check/page.tsx               # Accountant 2nd review — Release / Hold
    ├── payment/page.tsx             # Checkbox multi-select + SEPA XML + mark paid
    └── export/page.tsx              # Period filter + DATEV CSV + XRechnung XML
```

### Components

```
components/
├── layout/
│   └── Sidebar.tsx                  # Role-based nav — EMPLOYEE/MANAGER/FINANCE
├── expenses/
│   ├── expense-type-selector.tsx    # 3 card buttons (Camera/Calendar/Car)
│   ├── scan-view.tsx                # Presigned PUT upload → MinIO → Mock OCR split view
│   ├── per-diem-view.tsx            # Country rates (DE=28€, AT=26.4€, CH=35€)
│   ├── mileage-view.tsx             # RATE_PER_KM=0.30, auto-calc total
│   ├── expense-list-view.tsx        # List with status badges (incl. PAID)
│   ├── expense-detail-view.tsx      # Detail with conditional split for RECEIPT
│   └── expense-review-view.tsx      # Budget check from session.budget
├── manager/
│   ├── approvals-view.tsx           # Queue with AI flag indicator
│   └── approval-detail-view.tsx     # Approve/reject inline
└── finance/
    ├── overview-view.tsx            # KPI + Budget bar + Category bars + Monthly chart + table
    ├── check-view.tsx               # Release/Hold actions (local state mock)
    ├── payment-view.tsx             # SEPA XML generator (pain.001.001.03) + mark paid
    └── export-view.tsx              # DATEV CSV + XRechnung EN16931 UBL XML generators
```

### BFF Endpoints (Employee & Manager — sau refactor)

> ⚠️ Đã refactor: `product-010→018` → `emp-xxx` / `mgr-xxx` domain-based naming.

**Employee (`/bff/src/product/employee`):**

| Code    | Method | Path           | Chức năng                                     |
| ------- | ------ | -------------- | --------------------------------------------- |
| emp-001 | GET    | `/emp-001`     | Presigned PUT URL → upload thẳng lên MinIO    |
| emp-002 | POST   | `/emp-002`     | Mock OCR scan (REWE GmbH data)                |
| emp-003 | POST   | `/emp-003`     | Tạo DRAFT expense                             |
| emp-004 | GET    | `/emp-004`     | Danh sách expense của user                    |
| emp-005 | GET    | `/emp-005/:id` | Chi tiết expense (canonical — shared mgr-004) |
| emp-006 | POST   | `/emp-006/:id` | Submit → PENDING_REVIEW                       |

**Manager (`/bff/src/product/manager`):**

| Code    | Method | Path           | Chức năng                                     |
| ------- | ------ | -------------- | --------------------------------------------- |
| mgr-001 | GET    | `/mgr-001`     | Pending approval queue                        |
| mgr-002 | PUT    | `/mgr-002/:id` | Approve expense                               |
| mgr-003 | PUT    | `/mgr-003/:id` | Reject expense (cần rejectionReason)          |
| mgr-004 | GET    | `/mgr-004/:id` | Chi tiết expense cho Manager (alias emp-005)  |

**Finance (`/bff/src/product/finance`):**

| Code    | Method | Path       | Chức năng                                            | Trạng thái |
| ------- | ------ | ---------- | ---------------------------------------------------- | ---------- |
| fin-001 | GET    | `/fin-001` | All expenses (proxies `/api/v1/manager/expenses`)    | ✅ Done (temporary proxy) |
| fin-002 | POST   | `/fin-002` | Mark batch as PAID                                   | ❌ Chưa có (frontend mock local state khi 404) |

### Expense Types (German Compliance)

| Type | German Term | Logic |
| ---- | ----------- | ----- |
| RECEIPT | Beleg | Photo/PDF upload, Mock OCR extraction |
| PER_DIEM | Verpflegungsmehraufwand | Auto-calculate by country/dates |
| MILEAGE | Kilometerpauschale | Distance × 0.30€/km |

### RTK Query (`ducks/expenses/`)

```
ducks/expenses/
├── types.ts        # ExpenseType, ExpenseStatus, Expense, ScanResponse, UploadUrlResponse
├── expenseApi.ts   # 9 endpoints với cache invalidation (tags: Expense, ManagerQueue)
│                   # Thêm: getUploadUrl (GET presigned URL), scanReceipt nhận { fileUrl }
└── index.ts        # Re-exports
```

---

## 🔍 Flow 3: Intelligent Approval Matrix

### Trạng thái: **✅ UI + BFF + Backend HOÀN THÀNH** (implement chung trong Flow 2)

### Frontend Views

```
(protected)/
└── manager/approvals/
    ├── page.tsx           # Pending list + AI flag indicator
    └── [id]/page.tsx      # Detail review: approve / reject
```

---

## 💰 Flow 4: Settlement & Fiscal Reporting

### Trạng thái: **✅ ~85% — UI đầy đủ, mock phức tạp, backend FIN_001 pending**

| Sub-feature | Trạng thái | Ghi chú |
| --- | --- | --- |
| Finance Overview (KPI + bảng + analytics) | ✅ Done | Budget bar, Spend by Category bars, Monthly Trend chart, All Expenses table |
| Finance Final Check (accountant 2nd review) | ✅ Mock | Release/Hold actions — local state (no backend write yet) |
| Batch Payment / SEPA XML | ✅ Mock | Checkbox select, client-side `pain.001.001.03` XML generation + download |
| E-Invoicing / XRechnung XML | ✅ Mock | Client-side EN16931 UBL XML generation + download |
| DATEV Export (CSV) | ✅ Mock | Client-side Buchungsstapel CSV generation + download |
| Analytics (spend vs budget, by category, by month) | ✅ Done | CSS-based charts, budget utilization progress bar |
| Finance BFF — `FIN_001` | ✅ Done | GET `/fin-001` → proxies `/api/v1/manager/expenses` |
| Finance BFF — `FIN_002` (mark as paid) | ❌ Chưa có | Frontend gọi `/fin-002` (endpoint chưa có → error bị catch, state update locally) |
| Backend finance endpoint | ❌ Chưa có | FIN_001 dùng lại manager endpoint; cần `GET /api/v1/finance/expenses` riêng |
| `PAID` status persist | ❌ Chưa có | UI mock local state, backend không có transition APPROVED→PAID |

### Frontend Views

```
(protected)/finance/
├── overview/page.tsx  # ✅ KPI + Budget bar + Category chart + Month chart + table
├── check/page.tsx     # ✅ Accountant final check — Release / Hold actions (mock)
├── payment/page.tsx   # ✅ Checkbox batch + SEPA XML download + Mark as Paid (mock)
└── export/page.tsx    # ✅ Period filter + DATEV CSV + XRechnung XML download
```

### BFF Endpoints (`/bff/src/product/finance`)

| Code | Method | Path | Chức năng | Trạng thái |
| --- | --- | --- | --- | --- |
| fin-001 | GET | `/fin-001` | All expenses for finance (proxies mgr endpoint) | ✅ Done |
| fin-002 | POST | `/fin-002` | Mark batch as PAID | ❌ Chưa có |

### Còn thiếu để hoàn chỉnh

1. **Backend** `GET /api/v1/finance/expenses` — trả APPROVED+PAID (không lọc theo user)
2. **Backend** `POST /api/v1/finance/expenses/mark-paid` — cập nhật status APPROVED→PAID
3. **BFF** `fin-002` — proxy tới backend mark-paid
4. **DB** thêm `PAID` vào `expense_status` enum

---

## 🗄️ Database Schema (`TableMaster.sql`)

### Tables

| Table           | Mục đích                                 |
| --------------- | ---------------------------------------- |
| `users`         | Core user (PK = `cognito_sub` UUID)      |
| `roles`         | Role definitions (EMPLOYEE, MANAGER, FINANCE) |
| `user_roles`    | Many-to-many user ↔ role                 |
| `user_profiles` | Profile details (name, language, avatar) |
| `policies`      | GDPR/Legal documents (versioned)         |
| `user_consents` | User consent records with IP/UA          |
| `expenses`      | Expense records (RECEIPT/PER_DIEM/MILEAGE) — Flow 2 |
| `audit_logs`    | Immutable action trail                   |

### Key Design Decisions

- **Primary Key**: `cognito_sub` (UUID from AWS Cognito)
- **Soft Delete**: `is_deleted` flag on all tables
- **Audit Columns**: `created_at`, `created_by`, `updated_at`, `updated_by`
- **Language**: Default `vi-VN`, supports `de-DE`, `en-US`

---

## 🧩 Frontend Architecture

### Sidebar / Navigation (`/frontend/components/layout/Sidebar.tsx`)

> ✅ **Đã implement** — Extracted thành component riêng, được import bởi `app/(protected)/layout.tsx`.

**Tính năng:**
- Role-based filtering: mỗi role chỉ thấy menu items tương ứng
- `<Link>` thật với `usePathname()` active detection
- `ApprovalBadge` sub-component: dùng `useGetManagerQueueQuery()` — chỉ render cho MANAGER
- Logout: `useLogoutMutation()` → `clearSession()` → redirect `/auth/login`
- i18n: tất cả labels dùng `t()` từ `react-i18next` (DE/EN/VI)
- `soon: true` items render disabled với badge "soon"

**Menu theo role:**

| Menu Item | EMPLOYEE | MANAGER | FINANCE |
| --- | --- | --- | --- |
| My Expenses | ✅ | ✅ | ❌ |
| Reports (soon) | ✅ | ✅ | ❌ |
| Approvals (+ live badge) | ❌ | ✅ | ❌ |
| Finance Overview | ❌ | ❌ | ✅ |
| Finance Final Check | ❌ | ❌ | ✅ |
| Batch Payment / SEPA | ❌ | ❌ | ✅ |
| Tax Export (DATEV) | ❌ | ❌ | ✅ |

### Common Components (`/frontend/common`)

```
common/
├── button/          # Button variants
├── card/            # Card layouts
├── checkbox/        # Checkbox with label
├── container/       # Layout containers
├── context/         # React contexts
├── error/           # Error boundaries
├── form/            # Form wrapper
├── form-group/      # Form field groups
├── input/           # Input fields
├── label/           # Form labels
├── language-switcher/ # DE/EN toggle
├── link/            # Navigation links
├── logo/            # App logo
├── select/          # Dropdown select
├── spinner/         # Loading indicator
├── subtitle/        # Typography
└── title/           # Typography
```

### State Management (`/frontend/ducks`)

```
ducks/
├── store.ts         # Redux store configuration
├── apiSlice.ts      # RTK Query base API
├── auth/            # Auth slice & endpoints
├── expenses/        # Expense API slice (Flow 2) — types, expenseApi, index
├── login/           # Login specific state
├── slice/           # Feature slices
└── types/           # TypeScript types
```

### Localization (`/frontend/locales`)

- Supported: `de-DE`, `en-US`, `vi-VN`
- Library: i18next + react-i18next + browser language detector
- **Namespace keys implemented** (session 4):
  - `finance.overview.*` — overview-view.tsx
  - `finance.check.*` — check-view.tsx
  - `finance.payment.*` — payment-view.tsx
  - `finance.export.*` — export-view.tsx
  - `nav.*` — Sidebar.tsx (group labels + item labels)

---

## 🐳 Docker Services

| Service    | Container       | Port      | Status                 |
| ---------- | --------------- | --------- | ---------------------- |
| frontend   | react-frontend  | 3000      | ✅ Ready               |
| bff        | nextjs-bff      | 4000      | ✅ Ready               |
| backend    | spring-backend  | 8081      | ✅ Ready (Profile API) |
| mysql      | mysql           | 3307      | ✅ Ready               |
| gateway    | gateway (nginx) | 8080      | ✅ Ready               |
| minio      | minio           | 9000/9001 | ✅ Ready (S3-compatible object storage) |
| minio-init | minio-init      | —         | ✅ Init-only (tạo bucket `receipts` + CORS) |

### Nginx Routing

```
/api/*  → bff:4000
/*      → frontend:3000
```

---

## 📋 Development Commands

```bash
# Root level
npm run install:all      # Install frontend + bff deps
npm run docker:up        # Start all services
npm run docker:down      # Stop all services

# Frontend
cd frontend && npm run dev      # Dev server (Turbopack)
cd frontend && npm run storybook # Component docs

# BFF
cd bff && npm run dev           # Dev server (tsx)

# Backend (chưa triển khai)
cd backend && ./mvnw spring-boot:run
```

---

## 🐛 Bugs đã fix (2026-02-27)

| Bug | Root Cause | Fix |
| --- | ---------- | --- |
| `localhost:3000` login không hoạt động | Next.js không có route `/api/*`, requests không đến BFF | Thêm `rewrites()` trong `next.config.ts` để proxy `/api/*` → BFF |
| BFF không gọi được backend trong Docker | `JAVA_API_URL` không set → default `localhost:8080` trỏ sai | Thêm `JAVA_API_URL=http://spring-backend:8080` vào BFF service |
| Rewrite vẫn dùng `localhost:4000` dù đã set env | Next.js rewrites compile lúc `next build`, không phải runtime | Thêm `ARG BFF_INTERNAL_URL` vào Dockerfile builder stage trước `npm run build` |

## 🏗️ Session 4: Flow 4 + i18n DE/EN/VI + Sidebar role-based (2026-03-01)

### Những gì đã thêm/thay đổi

**Flow 4 — Finance views (4 màn hình mới):**

| File | Nội dung |
| ---- | -------- |
| `components/finance/overview-view.tsx` | Rewrite: dùng `useGetFinanceExpensesQuery`, budget bar, category CSS bars, monthly CSS chart |
| `components/finance/check-view.tsx` | NEW: Accountant 2nd review — Release/Hold (local state mock) |
| `components/finance/payment-view.tsx` | NEW: Checkbox select + SEPA XML `pain.001.001.03` + mark paid (mock) |
| `components/finance/export-view.tsx` | NEW: DATEV CSV Buchungsstapel + XRechnung EN16931 UBL XML |
| `app/(protected)/finance/check/page.tsx` | NEW: page wrapper |
| `app/(protected)/finance/payment/page.tsx` | NEW: page wrapper |
| `app/(protected)/finance/export/page.tsx` | NEW: page wrapper |

**Sidebar — role-based navigation:**

| File | Thay đổi |
| ---- | -------- |
| `components/layout/Sidebar.tsx` | NEW: Role-based nav, `<Link>` thật, `usePathname()` active, `ApprovalBadge`, logout, i18n |
| `app/(protected)/layout.tsx` | Thay thế hardcoded sidebar HTML bằng `<Sidebar />` |

**Types & RTK Query:**

| File | Thay đổi |
| ---- | -------- |
| `ducks/expenses/types.ts` | Thêm `'PAID'` vào `ExpenseStatus`, thêm `MarkAsPaidRequest` |
| `ducks/expenses/expenseApi.ts` | Thêm `getFinanceExpenses` (GET `/fin-001`), `markAsPaid` (POST `/fin-002` mock) |
| `components/expenses/expense-list-view.tsx` | Thêm `PAID` vào `STATUS_STYLE` + `STATUS_LABEL` |
| `components/expenses/expense-detail-view.tsx` | Thêm `PAID` vào `STATUS_CONFIG` |

**BFF (Finance domain):**

| File | Thay đổi |
| ---- | -------- |
| `bff/src/common/config/bff-endpoints.ts` | Thêm `FIN_001` |
| `bff/src/product/finance/fin-001/controller.ts` | NEW: Proxy → `/api/v1/manager/expenses` (TODO: dedicated endpoint) |
| `bff/src/product/finance/routes.ts` | Đăng ký `bffFin001` |

**i18n — DE/EN/VI đầy đủ cho Finance + Sidebar:**

| File | Keys thêm |
| ---- | --------- |
| `locales/en.json` | `finance.check.*`, `finance.payment.*`, `finance.export.*`, mở rộng `finance.overview.*`, `nav.*` mới, `expense.list.status_paid`, `expense.detail.status_paid` |
| `locales/de.json` | Bản dịch Đức tương ứng |
| `locales/vi.json` | Bản dịch Việt tương ứng |

**Wire `useTranslation()` vào components:**

| Component | Keys sử dụng |
| --------- | ------------ |
| `overview-view.tsx` | `finance.overview.*` (title, kpi, budget, charts, table) |
| `check-view.tsx` | `finance.check.*` (title, stats, sections, columns, buttons) |
| `payment-view.tsx` | `finance.payment.*` (title, action bar, table, empty states) |
| `export-view.tsx` | `finance.export.*` (title, periods, summary, cards, preview) |
| `Sidebar.tsx` | `nav.*` (group labels + item labels) |

### ESLint / TypeScript fixes trong session này

| Lỗi | Fix |
| --- | --- |
| `STATUS_BADGE` unused trong `check-view.tsx` | Xóa constant + import |
| `jsx-a11y/label-has-associated-control` trong `export-view.tsx` | Đổi `<label>` → `<p>` |
| Unused ternary expression trong `payment-view.tsx` | Đổi sang `if/else` block |
| `PAID` thiếu trong `Record<ExpenseStatus, ...>` | Thêm vào `STATUS_CONFIG`, `STATUS_STYLE`, `STATUS_LABEL` |
| Duplicate `expense` key trong `en.json` | Gộp vào block đã có, xóa duplicate |
| Arrow param `(t) =>` conflict với `useTranslation` `t` | Đổi param thành `(expType) =>` trong `overview-view.tsx` |

---

## 🏗️ Session 3: BFF Refactor — Domain-based Naming (2026-03-01)

### Thay đổi cấu trúc BFF

Toàn bộ `product-xxx` đã được đổi tên và tổ chức lại theo domain:

```
bff/src/product/
├── common/      com-001 → com-007   (auth + onboarding)
├── employee/    emp-001 → emp-006   (expense management)
├── manager/     mgr-001 → mgr-004   (approval workflow)
└── finance/     (placeholder — router rỗng)
```

Mỗi domain có file `routes.ts` riêng thay vì 1 file `routes.ts` chung.

### Files mới / thay đổi

| File | Thay đổi |
| ---- | -------- |
| `bff/src/common/config/bff-endpoints.ts` | Centralized endpoint constants (COM_001, EMP_001, ...) |
| `bff/src/common/util/create-bff-router.ts` | Factory function tạo router cho từng domain |
| `bff/src/product/common/routes.ts` | Router cho auth + onboarding |
| `bff/src/product/employee/routes.ts` | Router cho expense |
| `bff/src/product/manager/routes.ts` | Router cho approval |
| `bff/src/product/finance/routes.ts` | Router placeholder |
| `bff/src/product/manager/mgr-004/index.ts` | New — alias GET /expenses/:id cho Manager |
| `bff/src/product/app.ts` | Cập nhật: mount 4 domain routers |

### Frontend API paths thay đổi

| Trước | Sau |
| ----- | ---- |
| `/api/auth/login` | `/api/com-001` |
| `/api/auth/mfa` | `/api/com-002` |
| `/api/auth/new-password` | `/api/com-003` |
| `/api/auth/session` | `/api/com-004` |
| `/api/auth/logout` | `/api/com-005` |
| `/api/onboarding/consent` | `/api/com-006` |
| `/api/onboarding/profile` | `/api/com-007` |
| `/expenses` (create) | `/api/emp-003` |
| `/expenses` (list) | `/api/emp-004` |
| `/expenses/:id` | `/api/emp-005/:id` |
| `/expenses/:id/submit` | `/api/emp-006/:id` |
| `/expenses/upload-url` | `/api/emp-001` |
| `/expenses/scan` | `/api/emp-002` |
| `/manager/expenses` | `/api/mgr-001` |
| `/manager/expenses/:id/approve` | `/api/mgr-002/:id` |
| `/manager/expenses/:id/reject` | `/api/mgr-003/:id` |
| *(new)* | `/api/mgr-004/:id` — expense detail for Manager |

### Document Structure (new)

```
document/
├── README.md
├── common/{common,employee,manager,finance}/   ← shared concepts
├── frontend/{common,employee,manager,finance}/ ← screen docs
├── bff/{common,employee,manager,finance}/      ← BFF endpoint docs
└── backend/{common,employee,manager,finance}/  ← API + SQL docs
```

---

## ⚠️ Lưu ý Quan trọng

1. **Backend Flow 2 hoàn thành**: Expense APIs + Manager APIs + Storage APIs đã implement đầy đủ.
2. **BFF refactor done**: Tất cả product-xxx → com/emp/mgr domain naming. Frontend `authApi.ts` và `expenseApi.ts` đã cập nhật endpoints tương ứng.
3. **Session handling**: Đã hoàn tất integrate full flow (Cognito → BFF → Backend).
4. **Mock OCR**: `ExpenseService.mockScan()` trả hardcoded data (REWE GmbH, 47.80€). Thay bằng real OCR sau.
5. **Route ordering**: BFF dùng `create-bff-router` — route conflict không còn là vấn đề do mỗi endpoint có path riêng (`/emp-001`, `/emp-002`, v.v.).
6. **MinIO presigned URL — path-style bắt buộc**: `S3Presigner` cần `S3Configuration.pathStyleAccessEnabled(true)`, không thì SDK dùng virtual-hosted style (`bucket.localhost:9000`) → browser 400.
7. **MinIO endpoint phân ly**: `S3Client` dùng internal endpoint (`http://minio:9000`); `S3Presigner` dùng public endpoint (`http://localhost:9000`) để browser truy cập được URL được sign.
8. **CORS MinIO**: Được cấu hình qua `minio-init` container (`mc cors set`). Không nên dùng Java SDK để init CORS/bucket vì MinIO XML parser có thể lỗi.
9. **LocalStack**: Có thể dùng để emulate AWS Cognito locally (xem conversation history)
10. **Nginx header size**: Đã fix issue `502 Bad Gateway` do Cognito tokens quá lớn
11. **Next.js rewrites là build-time**: Mọi env var dùng trong `next.config.ts` phải được truyền qua Docker build `ARG`, không phải runtime `ENV`

---

## 🔗 Liên kết Nội bộ

- [MONOREPO_GUIDE.md](./MONOREPO_GUIDE.md) - Hướng dẫn cấu trúc monorepo
- [TableMaster.sql](./TableMaster.sql) - Full database schema với sample data
- [docker-compose.yml](./docker-compose.yml) - Container orchestration
- [document/README.md](./document/README.md) - Documentation index (frontend/bff/backend/common)
