# Portfolio Fullstack - Project Summary

> **Mục đích**: Tài liệu tổng hợp để AI có thể nhanh chóng hiểu cấu trúc project mà không cần scan toàn bộ codebase.
> **Cập nhật lần cuối**: 2026-01-05

---

## 📁 Kiến trúc Tổng quan

```
portfolio-fullstack/
├── frontend/          # Next.js 15 (React 19) - Turbopack
├── bff/               # Express.js BFF Layer (TypeScript)
├── backend/           # Spring Boot 3.5 (Java 21) - Chưa triển khai
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

### Backend (`/backend`) - **CHƯA TRIỂN KHAI**

| Công nghệ             | Phiên bản | Mục đích                 |
| --------------------- | --------- | ------------------------ |
| Spring Boot           | 3.5.6     | Java Framework           |
| Java                  | 21        | Runtime                  |
| MyBatis               | 3.0.5     | ORM                      |
| MySQL Connector       | -         | Database driver          |
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
| LocalStack     | Local AWS emulation (dev) |

---

## 🔐 Flow 1: Secure Onboarding & Compliance

### Trạng thái: **Frontend ✅ | BFF ✅ (đang ở bước session) | Backend ❌**

### Frontend Views (`/frontend/app`)

```
app/
├── login/page.tsx           # Login screen
├── auth/                    # Auth routes (SSO callback)
└── (protected)/
    └── onboarding/
        ├── layout.tsx       # Onboarding layout
        ├── compliance/      # GDPR & Policy consent
        └── profile/         # Profile localization
```

### BFF Endpoints (`/bff/src/product`)

| Endpoint                 | Method | File        | Chức năng                      |
| ------------------------ | ------ | ----------- | ------------------------------ |
| `/api/auth/login`        | POST   | product-003 | Email/Password login → Cognito |
| `/api/auth/mfa`          | POST   | product-005 | MFA verification (TOTP)        |
| `/api/auth/session`      | GET    | product-006 | Get current session            |
| `/api/auth/logout`       | POST   | product-007 | Logout & clear cookies         |
| `/api/auth/new-password` | POST   | product-004 | Handle NEW_PASSWORD_REQUIRED   |

### Auth Flow Logic (từ `product-003/controller.ts`)

```
Login Request
    │
    ├─► MFA Required (SOFTWARE_TOKEN_MFA)
    │       → Return session token for MFA step
    │
    ├─► New Password Required (NEW_PASSWORD_REQUIRED)
    │       → Return session token for password change
    │
    └─► Success (AuthenticationResult)
            → Set HttpOnly cookies (access_token, id_token, refresh_token)
            → Fetch user profile from backend
            → Return UI session + redirect URL
```

### Cookie Strategy

- **HttpOnly cookies**: Tokens KHÔNG bao giờ expose ra frontend
- **Nginx buffer size**: Đã tăng `proxy_buffer_size` để handle large Cognito tokens

---

## 📝 Flow 2: Smart Expense Capture (Germanized)

### Trạng thái: **Frontend ✅ (UI hoàn thành) | BFF ❌ | Backend ❌**

### Frontend Views (`/frontend/app/(protected)/my-expenses`)

```
my-expenses/
├── layout.tsx           # Expenses layout
├── page.tsx             # Expense list
├── create/              # Create new expense
│   ├── page.tsx
│   ├── mileage/         # Kilometerpauschale
│   ├── per-diem/        # Verpflegungsmehraufwand
│   └── receipt/         # Beleg upload
└── [id]/                # Expense detail view
```

### Expense Types (German Compliance)

| Type     | German Term             | Logic                                 |
| -------- | ----------------------- | ------------------------------------- |
| Receipt  | Beleg                   | Photo/PDF upload, OCR extraction      |
| Per Diem | Verpflegungsmehraufwand | Auto-calculate by law (dates/country) |
| Mileage  | Kilometerpauschale      | Distance × rate (e.g., 0.30€/km)      |

---

## 🔍 Flow 3: Intelligent Approval Matrix

### Trạng thái: **Frontend ✅ (UI) | BFF ❌ | Backend ❌**

### Frontend Views

```
(protected)/
└── manager/             # Manager approval views
    ├── page.tsx         # Pending list (Kanban/List)
    └── [id]/            # Detail review with AI flags
```

---

## 💰 Flow 4: Settlement & Fiscal Reporting

### Trạng thái: **Frontend ✅ (UI) | BFF ❌ | Backend ❌**

### Frontend Views

```
(protected)/
└── finance/             # Finance/Accountant views
    └── page.tsx         # SEPA batch, E-Invoicing, Dashboard
```

---

## 🗄️ Database Schema (`TableMaster.sql`)

### Tables

| Table           | Mục đích                                 |
| --------------- | ---------------------------------------- |
| `users`         | Core user (PK = `cognito_sub` UUID)      |
| `roles`         | Role definitions (ADMIN, MEMBER, etc.)   |
| `user_roles`    | Many-to-many user ↔ role                 |
| `user_profiles` | Profile details (name, language, avatar) |
| `policies`      | GDPR/Legal documents (versioned)         |
| `user_consents` | User consent records with IP/UA          |
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
├── login/           # Login specific state
├── slice/           # Feature slices
└── types/           # TypeScript types
```

### Localization (`/frontend/locales`)

- Supported: `de-DE`, `en-US`, `vi-VN`
- Library: i18next + react-i18next + browser language detector

---

## 🐳 Docker Services

| Service  | Container       | Port | Status             |
| -------- | --------------- | ---- | ------------------ |
| frontend | react-frontend  | 3000 | ✅ Ready           |
| bff      | nextjs-bff      | 4000 | ✅ Ready           |
| backend  | spring-backend  | 8081 | ⚠️ Not implemented |
| mysql    | mysql           | 3307 | ✅ Ready           |
| gateway  | gateway (nginx) | 8080 | ✅ Ready           |

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

## ⚠️ Lưu ý Quan trọng

1. **Backend chưa triển khai**: Tất cả backend APIs cần được implement trong Spring Boot
2. **BFF đang ở Flow 1**: Auth flow hoàn thành, cần thêm APIs cho Flow 2-4
3. **Session handling**: Đang ở bước xử lý session (cookies đã set, cần integrate với backend)
4. **LocalStack**: Có thể dùng để emulate AWS Cognito locally (xem conversation history)
5. **Nginx header size**: Đã fix issue `502 Bad Gateway` do Cognito tokens quá lớn

---

## 🔗 Liên kết Nội bộ

- [MONOREPO_GUIDE.md](./MONOREPO_GUIDE.md) - Hướng dẫn cấu trúc monorepo
- [TableMaster.sql](./TableMaster.sql) - Full database schema với sample data
- [docker-compose.yml](./docker-compose.yml) - Container orchestration
