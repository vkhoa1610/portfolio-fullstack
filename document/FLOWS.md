# Flows Implementation Status

> Tài liệu tổng hợp trạng thái triển khai từng flow theo layer.
> **Cập nhật lần cuối**: 2026-02-28 (Session 2: MinIO S3 storage, product-018)

---

## Tổng quan

| Flow | Tên | DB | Backend | BFF | Frontend | i18n | Trạng thái |
| ---- | --- | -- | ------- | --- | -------- | ---- | ---------- |
| Flow 1 | Secure Onboarding & Compliance | ✅ | ✅ | ✅ | ✅ | ✅ | **DONE** |
| Flow 2 | Smart Expense Capture | ✅ | ✅ | ✅ | ✅ | ✅ | **DONE** |
| Flow 3 | Intelligent Approval Matrix | ✅ | ✅ | ✅ | ✅ | ✅ | **DONE** |
| Flow 4 | Settlement & Fiscal Reporting | ✅ | ⚠️ | ⚠️ | ⚠️ | ✅ | **PARTIAL** |

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

### Đã implement
| Layer | Mô tả |
| ----- | ----- |
| Frontend | Finance Overview: KPI cards + full expense table |
| i18n | `finance.*` keys (en/de/vi) |

### Chưa implement
| Feature | Mô tả |
| ------- | ----- |
| Backend API | `/finance/*` endpoints — aggregate stats, export |
| BFF Products | product-019+ cho finance endpoints |
| SEPA Batch | Tạo file XML SEPA cho batch payment |
| E-Invoicing | Xuất hóa đơn điện tử (ZUGFeRD / XRechnung) |
| Export | CSV/PDF export báo cáo chi phí |

### Frontend Screens (FINANCE only)
| Route | Component | Trạng thái |
| ----- | --------- | ---------- |
| `/finance/overview` | `overview-view.tsx` | ✅ Done (UI + mock data) |
| `/finance/export` | — | ❌ Chưa implement |
| `/finance/sepa` | — | ❌ Chưa implement |

---

## Ghi chú chung

| Hạng mục | Chi tiết |
| -------- | -------- |
| **Auth** | AWS Cognito — HttpOnly cookies, SameSite=Strict |
| **DB** | MySQL 8.0 — Docker port 3307, `db_fix.sql` là reset script |
| **BFF pattern** | Mỗi product = `controller.ts` + `index.ts`, đánh số product-001 → product-018 |
| **RTK Query** | `authApi` (auth/onboarding) + `expenseApi` (expense/manager/storage) |
| **i18n** | de-DE, en-US, vi-VN |
| **Mock OCR** | `ExpenseService.mockScan()` — thay bằng real OCR khi cần |
| **Route ordering** | BFF: `/expenses/upload-url` (018) → `/expenses/scan` (014) → `/expenses/:id` (012) |
| **MinIO** | S3-compatible, Docker port 9000 (API) / 9001 (Console). Bucket: `receipts` |
| **Presigned URL** | S3Presigner dùng public endpoint; S3Client dùng internal endpoint. Cả hai cần path-style |
