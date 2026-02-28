# Portfolio Fullstack - Project Summary

> **Mục đích**: Tài liệu tổng hợp để AI có thể nhanh chóng hiểu cấu trúc project mà không cần scan toàn bộ codebase.
> **Cập nhật lần cuối**: 2026-02-28 (Session 2: MinIO S3 storage)

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
| i18next                   | 25.7.2    | Internationalization (DE/EN)  |
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

### BFF Endpoints (`/bff/src/product`)

| Endpoint                    | Method | File        | Chức năng                      | Trạng thái |
| --------------------------- | ------ | ----------- | ------------------------------ | ---------- |
| `/api/auth/login`           | POST   | product-003 | Email/Password login → Cognito | ✅ Done    |
| `/api/auth/mfa`             | POST   | product-005 | MFA verification (TOTP)        | ✅ Done    |
| `/api/auth/session`         | GET    | product-006 | Get current session            | ✅ Done    |
| `/api/auth/logout`          | POST   | product-007 | Logout & clear cookies         | ✅ Done    |
| `/api/auth/new-password`    | POST   | product-004 | Handle NEW_PASSWORD_REQUIRED   | ✅ Done    |
| `/api/onboarding/consent`   | POST   | product-008 | Ghi nhận GDPR + ToS consent    | ✅ Done    |
| `/api/onboarding/profile`   | POST   | product-009 | Lưu language → tạo profile     | ✅ Done    |

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
    └── overview/page.tsx            # KPI cards + full expense table
```

### Components

```
components/
├── expenses/
│   ├── expense-type-selector.tsx    # 3 card buttons (Camera/Calendar/Car)
│   ├── scan-view.tsx                # Presigned PUT upload → MinIO → Mock OCR split view
│   ├── per-diem-view.tsx            # Country rates (DE=28€, AT=26.4€, CH=35€)
│   ├── mileage-view.tsx             # RATE_PER_KM=0.30, auto-calc total
│   ├── expense-list-view.tsx        # List with status badges
│   ├── expense-detail-view.tsx      # Detail with conditional split for RECEIPT
│   └── expense-review-view.tsx      # Budget check from session.budget
├── manager/
│   ├── approvals-view.tsx           # Queue with AI flag indicator
│   └── approval-detail-view.tsx     # Approve/reject inline
└── finance/
    └── overview-view.tsx            # KPI + expenses table
```

### BFF Endpoints (product-010 → product-018)

| Product | Method | Endpoint | Chức năng |
| ------- | ------ | -------- | --------- |
| product-010 | POST | `/expenses` | Tạo DRAFT expense |
| product-011 | GET | `/expenses` | Danh sách expense của user |
| product-012 | GET | `/expenses/:id` | Chi tiết expense |
| product-013 | POST | `/expenses/:id/submit` | Submit → PENDING_REVIEW |
| product-014 | POST | `/expenses/scan` | Mock OCR (REWE GmbH data) |
| product-015 | GET | `/manager/expenses` | Pending queue cho Manager |
| product-016 | PUT | `/manager/expenses/:id/approve` | Approve expense |
| product-017 | PUT | `/manager/expenses/:id/reject` | Reject (cần rejectionReason) |
| product-018 | GET | `/expenses/upload-url?filename=xxx` | Lấy presigned PUT URL để upload thẳng lên MinIO |

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

### Trạng thái: **✅ UI + BFF + Backend (Finance Overview) HOÀN THÀNH**

### Frontend Views

```
(protected)/
└── finance/overview/page.tsx   # KPI cards + full expense table (FINANCE role)
```

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

## ⚠️ Lưu ý Quan trọng

1. **Backend Flow 2 hoàn thành**: Expense APIs + Manager APIs + Storage APIs đã implement đầy đủ.
2. **BFF products 001–018**: Auth (001-009) + Expense/Manager/Storage (010-018) đều done.
3. **Session handling**: Đã hoàn tất integrate full flow (Cognito → BFF → Backend).
4. **Mock OCR**: `ExpenseService.mockScan()` trả hardcoded data (REWE GmbH, 47.80€). Thay bằng real OCR sau.
5. **Route ordering quan trọng**: BFF phải register theo thứ tự: product-018 (`/expenses/upload-url`) → product-014 (`/expenses/scan`) → product-012 (`/expenses/:id`) để tránh route conflict.
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
