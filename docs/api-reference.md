# API Reference

All endpoints exposed by the Spring Boot backend, grouped by role.

## Overview

- Every endpoint requires an authenticated `cognito_sub` (extracted from the JWT cookie by `JwtAuthFilter`).
- Role-based endpoints additionally check granular permissions (e.g. `EXPENSE_APPROVE`).
- Response shape: `ResponseEntity<T>` — either DTO or `{ message, code }` for errors.

## Employee

```
POST   /api/v1/expenses                        Create expense (DRAFT)
GET    /api/v1/expenses                        List own expenses
GET    /api/v1/expenses/{id}                   Detail + policy snapshot
POST   /api/v1/expenses/{id}/submit            Submit (→ PENDING_REVIEW)
POST   /api/v1/expenses/scan                   OCR receipt (Groq Vision)
GET    /api/v1/expenses/upload-url             Presigned PUT for MinIO
GET    /api/v1/expenses/view-url               Presigned GET (1h TTL)

GET    /api/v1/user/privacy/data-map           Data inventory (GDPR)
GET    /api/v1/user/privacy/consents           Consent history
GET    /api/v1/user/privacy/erasure-status     Current erasure request
POST   /api/v1/user/privacy/erasure-request    Submit erasure (GDPR Art. 17)
GET    /api/v1/user/data-export                ZIP export (GDPR Art. 20)
```

## Manager

```
GET    /api/v1/manager/expenses                Queue PENDING_REVIEW
PUT    /api/v1/manager/expenses/{id}/approve   Approve (EXPENSE_APPROVE)
PUT    /api/v1/manager/expenses/{id}/reject    Reject (EXPENSE_REJECT) + reason
GET    /api/v1/manager/reports/latest          Latest AI report
```

## Finance

```
GET    /api/v1/finance/expenses                APPROVED + PAID list
PUT    /api/v1/finance/expenses/{id}/pay       Mark PAID
PUT    /api/v1/finance/expenses/batch-pay      Bulk mark PAID
POST   /api/v1/finance/reports                 Create finance report
GET    /api/v1/finance/reports                 List finance reports
GET    /api/v1/finance/gdpr/pending            Pseudonymizations awaiting GoBD sign-off
PUT    /api/v1/finance/gdpr/confirm/{id}       Confirm GoBD pseudonymization
```

## Admin

```
GET    /api/v1/admin/users                     List all users
GET    /api/v1/admin/users/{sub}/permissions   Permission grid
GET    /api/v1/admin/users/{sub}/functions     UI function grid
GET    /api/v1/admin/gdpr/requests             Erasure request queue
GET    /api/v1/admin/gdpr/data-map/{sub}       Per-user data inventory
POST   /api/v1/admin/gdpr/process/{id}         Run 2-phase erasure
GET    /api/v1/admin/gdpr/audit-log            GDPR audit events
```

> 🚧 Full request/response schemas coming soon.
