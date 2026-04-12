# Portfolio Fullstack - Project Summary

> **Mục đích**: Tài liệu tổng hợp để AI có thể nhanh chóng hiểu cấu trúc project mà không cần scan toàn bộ codebase.
> **Cập nhật lần cuối**: 2026-04-12 (Session N: Cognito→Auth0, Ollama→Groq, MinIO→Backblaze B2, Sidebar redesign, Flow 11 Finance New Report)

---

## 📁 Kiến trúc Tổng quan

```
portfolio-fullstack/
├── frontend/          # Next.js 15 (React 19) - Turbopack
├── bff/               # Express.js BFF Layer (TypeScript)
├── backend/           # Spring Boot 3.5 (Java 21)
├── nginx/             # Reverse Proxy Gateway
├── docker-compose.yml # Container orchestration
├── TableMaster.sql    # Database schema (MySQL 8.0)
├── db_fix.sql         # Schema + seed data (init.sql for Docker)
└── .env               # Secrets (Auth0, Groq, B2)
```

---

## 🛠️ Tech Stack

### Frontend (`/frontend`)

| Công nghệ                 | Phiên bản | Mục đích                      |
| ------------------------- | --------- | ----------------------------- |
| Next.js                   | 15.x      | React Framework với Turbopack |
| React                     | 19.x      | UI Library                    |
| TypeScript                | 5.x       | Type Safety                   |
| Tailwind CSS              | 3.4.x     | Styling                       |
| Redux Toolkit (RTK Query) | 2.x       | State Management & API calls  |
| react-hook-form           | 7.x       | Form handling                 |
| i18next                   | 25.x      | Internationalization (DE/EN/VI)|
| Material Symbols Outlined | (Google Fonts) | Icon system (replaces Lucide) |
| Manrope font              | (Google Fonts) | UI font                   |

### BFF Layer (`/bff`)

| Công nghệ       | Phiên bản | Mục đích                    |
| --------------- | --------- | --------------------------- |
| Express.js      | 4.19.2    | HTTP Server                 |
| TypeScript      | 5.6.3     | Type Safety                 |
| Auth0           | (REST API) | Authentication (replaces Cognito) |
| cookie-parser   | 1.4.7     | HttpOnly cookie handling    |
| jsonwebtoken    | 9.0.3     | JWT parsing                 |
| serverless-http | 3.2.0     | AWS Lambda deployment ready |
| tsup            | 8.5.1     | Bundler                     |

### Backend (`/backend`)

| Công nghệ             | Phiên bản | Mục đích                  |
| --------------------- | --------- | ------------------------- |
| Spring Boot           | 3.5.x     | Java Framework            |
| Java                  | 21        | Runtime                   |
| MyBatis               | 3.0.x     | ORM                       |
| MySQL Connector       | -         | Database driver           |
| AWS SDK v2 (S3)       | 2.x       | Backblaze B2 presigned URLs|
| Groq API              | (REST)    | AI (replaces Ollama)      |
| SpringDoc OpenAPI     | 2.x       | API Documentation         |
| Lombok                | -         | Boilerplate reduction     |

### Infrastructure

| Công nghệ        | Mục đích                                          |
| ---------------- | ------------------------------------------------- |
| Docker Compose   | Container orchestration                           |
| Nginx Alpine     | Reverse proxy (port 8080)                         |
| MySQL 8.0        | Database (port 3307)                              |
| Auth0            | Authentication (Resource Owner Password grant)    |
| Backblaze B2     | S3-compatible object storage (private bucket)     |
| Groq API         | AI inference (llama-3.3-70b-versatile, free tier) |

---

## 🔐 Auth System (Auth0)

### Architecture

```
Frontend → BFF (HttpOnly cookies) → Java Backend (Bearer accessToken)
                ↕
           Auth0 (Resource Owner Password: password-realm + mfa-otp)
```

### Token Storage

| Token        | Lưu ở đâu       | Ai có thể đọc |
|--------------|-----------------|---------------|
| accessToken  | HttpOnly cookie | BFF only      |
| refreshToken | HttpOnly cookie | BFF only      |
| UISession    | Redux / AuthContext | Frontend  |

### Role Claim

Auth0 namespaced claim: `https://portfolio.app/role`
Set bởi Auth0 Action "Add Role to Token" (Post Login flow):

```javascript
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://portfolio.app/';
  const role = event.user.app_metadata?.role || 'EMPLOYEE';
  api.accessToken.setCustomClaim(namespace + 'role', role);
};
```

### Demo Users (Auth0 + DB)

| Role     | Name          | Email                  | Auth0 sub                          |
|----------|---------------|------------------------|------------------------------------|
| EMPLOYEE | Anna Müller   | employee@portfolio.app | auth0|69db9135b65ad959bd52d81e     |
| MANAGER  | Thomas Weber  | manager@portfolio.app  | auth0|69db914919afd97398d23e56     |
| FINANCE  | Sarah Chen    | finance@portfolio.app  | auth0|69db915cb65ad959bd52d82d     |
| ADMIN    | David Kim     | admin@portfolio.app    | auth0|69db916e19afd97398d23e73     |

### BFF Auth Endpoints

| Code    | Method | Path       | Chức năng                                      | Trạng thái |
| ------- | ------ | ---------- | ---------------------------------------------- | ---------- |
| com-001 | POST   | `/com-001` | Login (Auth0 password-realm)                   | ✅ Done    |
| com-002 | POST   | `/com-002` | MFA verify (Auth0 mfa-otp)                     | ✅ Done    |
| com-003 | POST   | `/com-003` | **Stubbed** — 410 Gone (no NEW_PASSWORD in Auth0) | ⛔ Stub  |
| com-004 | GET    | `/com-004` | Session refresh (Auth0 refresh_token grant)    | ✅ Done    |
| com-005 | POST   | `/com-005` | Logout (Auth0 /oauth/revoke)                   | ✅ Done    |
| com-006 | POST   | `/com-006` | GDPR consent                                   | ✅ Done    |
| com-007 | POST   | `/com-007` | Profile setup (language)                       | ✅ Done    |

---

## 📝 Flow 1: Secure Onboarding & Compliance

### Trạng thái: ✅ HOÀN THÀNH

| Layer    | Login | MFA | Session | Redirect | GDPR Consent | Profile Setup |
| -------- | ----- | --- | ------- | -------- | ------------ | ------------- |
| Frontend | ✅    | ✅  | ✅      | ✅       | ✅           | ✅            |
| BFF      | ✅    | ✅  | ✅      | ✅       | ✅           | ✅            |
| Backend  | ✅    | -   | ✅      | ✅       | ✅           | ✅            |

### Redirect Logic

- `onboardingStatus = PENDING` → `/onboarding` → `/onboarding/compliance`
- `onboardingStatus = DONE` + role:
  - `EMPLOYEE` → `/dashboard` → `/my-expenses`
  - `MANAGER` → `/dashboard` → `/manager/approvals`
  - `FINANCE` → `/dashboard` → `/finance/overview`
  - `isAdmin = true` → `/admin`

---

## 📝 Flow 2: Smart Expense Capture

### Trạng thái: ✅ HOÀN THÀNH

### BFF Endpoints — Employee & Manager

| Code    | Method | Path           | Chức năng                                     |
| ------- | ------ | -------------- | --------------------------------------------- |
| emp-001 | GET    | `/emp-001`     | Presigned PUT URL → upload thẳng lên B2       |
| emp-002 | POST   | `/emp-002`     | Mock OCR scan                                 |
| emp-003 | POST   | `/emp-003`     | Tạo DRAFT expense                             |
| emp-004 | GET    | `/emp-004`     | Danh sách expense của user                    |
| emp-005 | GET    | `/emp-005/:id` | Chi tiết expense                              |
| emp-006 | POST   | `/emp-006/:id` | Submit → PENDING_REVIEW                       |
| emp-007 | GET    | `/emp-007`     | Presigned GET URL → view receipt từ B2 (private bucket) |
| mgr-001 | GET    | `/mgr-001`     | Pending approval queue                        |
| mgr-002 | PUT    | `/mgr-002/:id` | Approve expense                               |
| mgr-003 | PUT    | `/mgr-003/:id` | Reject expense                                |
| mgr-004 | GET    | `/mgr-004/:id` | Chi tiết expense cho Manager                  |

### Storage: Backblaze B2

- Bucket: `portfolio-app-receipts` (private)
- Upload: presigned PUT URL (emp-001) → browser PUT thẳng lên B2
- View: presigned GET URL (emp-007) → valid 1 giờ
- Endpoint: `https://s3.us-west-004.backblazeb2.com`

---

## 💰 Flow 4: Settlement & Fiscal Reporting

### BFF Endpoints — Finance

| Code    | Method | Path       | Chức năng                               |
| ------- | ------ | ---------- | --------------------------------------- |
| fin-001 | GET    | `/fin-001` | All expenses for finance                |
| fin-002 | POST   | `/fin-002` | Mark batch as PAID                      |
| fin-004 | POST   | `/fin-004` | Create Finance Report (flow 11)         |
| fin-005 | GET    | `/fin-005` | List Finance Reports (flow 11)          |

---

## 🤖 Flow 5 / 6: AI Features

### AI Report Generator

- **BFF**: admin endpoints → Java → Groq API
- **Groq**: `llama-3.3-70b-versatile`, free tier (14,400 req/day)
- **Endpoint**: `https://api.groq.com/openai/v1/chat/completions`
- **Config** (application-docker.yml): `groq.api-key`, `groq.base-url`, `groq.model`

### AI Playground

- Admin only, test prompts → Groq

### Report Template Designer

- Admin: CMS-driven config_json for PDF reports

---

## 📊 Flow 11: Finance New Report (Multi-step Modal)

### Trạng thái: ✅ HOÀN THÀNH

5-step modal: General info → Financial details → Attachments → Approval route → Review & Submit

### DB Table: `finance_reports`

| Column        | Type                                              |
|---------------|---------------------------------------------------|
| id            | BIGINT PK AUTO_INCREMENT                          |
| user_sub      | VARCHAR(36) FK → users.cognito_sub                |
| title         | VARCHAR(255)                                      |
| report_type   | ENUM(FINANCIAL, ANALYTICS, OPERATIONS, COMPLIANCE)|
| fiscal_period | VARCHAR(20) — "Q1 2026"                           |
| due_date      | DATE                                              |
| priority      | ENUM(LOW, NORMAL, HIGH, URGENT)                   |
| total_amount  | DECIMAL(15,2)                                     |
| currency      | VARCHAR(3)                                        |
| line_items    | JSON — [{description, category, amount}]          |
| attachments   | JSON — [{fileUrl, fileName, fileSize, fileType}]  |
| approval_route| JSON — [{level, reviewerName, deadlineDays}]      |
| notify_cc     | JSON                                              |
| status        | ENUM(DRAFT, PENDING_REVIEW, APPROVED, REJECTED)   |

---

## 🗄️ Database Schema

### Tables

| Table              | Mục đích                                        |
| ------------------ | ----------------------------------------------- |
| `users`            | Core user (PK = `cognito_sub` = Auth0 sub)      |
| `roles`            | Role definitions (EMPLOYEE, MANAGER, FINANCE)   |
| `user_roles`       | Many-to-many user ↔ role                        |
| `user_profiles`    | Profile details (name, language, avatar)        |
| `policies`         | GDPR/Legal documents (versioned)                |
| `user_consents`    | User consent records with IP/UA                 |
| `expenses`         | Expense records (RECEIPT/PER_DIEM/MILEAGE)      |
| `permissions`      | Permission definitions                          |
| `user_permissions` | User ↔ permission grants                        |
| `system_admins`    | Admin users (separate from roles)               |
| `functions`        | CMS-driven UI function gates                    |
| `items`            | User ↔ function grants                          |
| `screen_configs`   | JSON config for dynamic screens                 |
| `report_templates` | PDF report template configs                     |
| `expense_reports`  | AI-generated monthly expense reports            |
| `finance_reports`  | Finance team reports (Flow 11)                  |

### Key Design

- **PK**: `cognito_sub` column stores Auth0 `sub` (format: `auth0|<24hex>`)
- **Soft Delete**: `is_deleted` flag
- **Seed file**: `db_fix.sql` (used as Docker init.sql)

---

## 🎨 UI Design System

### "The Financial Editor"

| Token         | Value         |
|---------------|---------------|
| Primary       | `#4244db`     |
| Surface       | `#f5f2ff`     |
| Sidebar bg    | `#f5f2ff`     |
| Navbar bg     | `#fcf8ff`     |
| Active nav    | `bg-indigo-100 text-indigo-800` |
| Muted text    | `#9592b8`     |
| Font          | Manrope + Inter |
| Icons         | Material Symbols Outlined (Google Fonts) |
| Nav items     | `rounded-full` pill shape |

### Sidebar

- `MIcon` component wraps Material Symbols Outlined
- Role-based menu items
- User footer: glassmorphism `bg-white/60 backdrop-blur-sm`
- Active: `bg-indigo-100 text-indigo-800`

---

## 🐳 Docker Services

| Service    | Container       | Port | Status   |
| ---------- | --------------- | ---- | -------- |
| frontend   | react-frontend  | 3000 | ✅       |
| bff        | nextjs-bff      | 4000 | ✅       |
| backend    | spring-backend  | 8081 | ✅       |
| mysql      | mysql           | 3307 | ✅       |
| gateway    | gateway (nginx) | 8080 | ✅       |

> MinIO, Ollama, LocalStack, Cognito đã bị xóa khỏi docker-compose.yml.

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
npm run docker:up        # Start all services (docker compose up --build)
npm run docker:down      # Stop all services

# Frontend
cd frontend && npm run dev      # Dev server (Turbopack)

# BFF
cd bff && npm run dev           # Dev server (tsx)

# Backend
cd backend && ./mvnw spring-boot:run
```

---

## ⚠️ Lưu ý Quan trọng

1. **Auth0 Grant Type**: Application phải enable "Password" grant type (Advanced Settings → Grant Types).
2. **Auth0 Role Claim**: Custom claim `https://portfolio.app/role` phải được add bởi Auth0 Action "Add Role to Token".
3. **B2 Private Bucket**: Receipt viewing dùng presigned GET URL (1h TTL), không phải public URL.
4. **Groq API**: Free tier 14,400 req/day. Key trong `.env` GROQ_API_KEY.
5. **cognito_sub column**: Vẫn dùng tên `cognito_sub` trong DB nhưng giờ lưu Auth0 sub (`auth0|...`).
6. **Next.js rewrites là build-time**: Env var `BFF_INTERNAL_URL` phải truyền qua Docker build `ARG`.
7. **NEW_PASSWORD flow**: Đã bị xóa — com-003 trả 410, `useSetNewPasswordMutation` đã bị xóa.
8. **CORS B2**: Cần set CORS cho bucket trước khi browser có thể PUT presigned URL.

---

## 🔗 Liên kết Nội bộ

- [TableMaster.sql](./TableMaster.sql) - Database schema
- [db_fix.sql](./db_fix.sql) - Schema + seed data
- [docker-compose.yml](./docker-compose.yml) - Container orchestration
- [.env](./.env) - Environment variables (Auth0, Groq, B2)
- [Document/](./Document/) - Per-feature documentation
