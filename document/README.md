# Documentation Index

## Cấu trúc thư mục

```
document/
├── README.md               ← File này
├── FLOWS.md                ← Tổng quan flows & trạng thái implement
├── RULES.md                ← Quy tắc triển khai (backend/BFF/frontend patterns)
│
├── common/                 ← Shared concepts & domain overview
│   ├── common/             → Auth flow, error format, shared types
│   ├── employee/           → Employee domain overview
│   ├── manager/            → Manager domain overview
│   └── finance/            → Finance domain overview
│
├── frontend/               ← Frontend screens documentation
│   ├── common/             → Auth & Onboarding screens
│   │   ├── login.md
│   │   ├── mfa.md
│   │   ├── new-password.md
│   │   ├── onboarding-consent.md
│   │   └── onboarding-profile.md
│   ├── employee/           → Expense management screens
│   │   ├── expense-list.md
│   │   ├── expense-create.md
│   │   └── expense-detail.md
│   ├── manager/            → Approval + AI Report screens
│   │   ├── approval-queue.md
│   │   ├── approval-detail.md (CMS-driven, permission guard)
│   │   └── ai-report.md (read-only AI report view)
│   ├── finance/            → Finance screens
│   │   └── report-management.md (collapsible filter sidebar + KPI + table)
│   └── admin/              → Admin screens
│       ├── admin-dashboard.md
│       ├── admin-users-list.md
│       ├── admin-user-detail.md
│       ├── admin-import.md
│       ├── ai-report.md (generate + tab pills + collapsible)
│       ├── report-template.md (DnD designer + PDF preview)
│       └── ai-playground.md (Ollama test UI)
│
├── bff/                    ← BFF layer documentation
│   ├── common/             → com-001 đến com-007 (auth + onboarding), scr-001 (CMS proxy)
│   ├── employee/           → emp-001 đến emp-006 (expense)
│   ├── manager/            → mgr-001 đến mgr-004 (approval), mgr-005 (AI report read-only)
│   ├── admin/              → adm-001 đến adm-017
│   │   ├── adm-001 – adm-010: Users, permissions, functions, CSV import
│   │   ├── adm-011 – adm-013: AI Report generate/poll/latest
│   │   ├── adm-014 – adm-015: Report Template CRUD
│   │   ├── adm-016: Generate PDF (Puppeteer)
│   │   └── adm-017: AI Playground chat
│   └── finance/            → fin-001 đến fin-003 (expense list, pay, batch-pay)
│
└── backend/                ← Java Backend API documentation
    ├── common/             → users/me, permissions, functions, screen-configs, admin APIs
    ├── employee/           → expense CRUD APIs
    ├── manager/            → manager approval APIs
    └── finance/            → (placeholder)
```

## Mỗi file MD bao gồm

### Frontend
- **Process Flow**: Luồng xử lý trong component
- **BFF Calls**: Input gửi lên BFF, Output expect từ BFF

### BFF
- **Process Flow**: Luồng xử lý trong BFF
- **BFF Endpoint**: Method, Path, Auth
- **Input**: Fields, Required, Type
- **Output**: Fields, Required, Type
- **Backend API gọi**: Method, URL, Auth

### Backend
- **Process Flow**: Luồng xử lý trong Java
- **API Endpoint**: Method, Path, Auth
- **Input**: Fields, Required, Type
- **Output**: Fields, Required, Type
- **SQL**: Queries liên quan

## Domain Mapping

| Domain   | BFF Prefix | Backend Prefix           | Roles       |
|----------|------------|--------------------------|-------------|
| Auth     | COM (1-5)  | Cognito trực tiếp        | All         |
| Onboarding| COM (6-7) | /api/v1/onboarding/      | All         |
| Employee | EMP (1-6)  | /api/v1/expenses/        | EMPLOYEE, MANAGER |
| Manager  | MGR (1-4)  | /api/v1/manager/expenses/| MANAGER     |
| Finance  | FIN (1-3)  | /api/v1/finance/         | FINANCE     |
| CMS / Screen Config | SCR (1+) | /api/v1/screen-configs/ | All authenticated |
| Admin (Permission/Function/Template/AI) | ADM (1-17) | /api/v1/admin/ | system_admins only |
| Manager AI Report | MGR (5) | /api/v1/manager/ | MANAGER |
