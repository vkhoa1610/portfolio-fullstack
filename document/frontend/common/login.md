# Login Screen — `/auth/login`

## Process Flow

```
User nhập email + password → submit form
  → Gọi BFF: POST /api/com-001
  ├── LoginSuccessResponse (authenticated: true)
  │     → Lưu UISession vào Redux (AuthContext)
  │     → Redirect: /onboarding (PENDING) | /dashboard (DONE) | /admin (isAdmin)
  └── MfaRequiredResponse
        → Lưu { session: mfa_token, email } vào URL params
        → Redirect → /auth/mfa
```

> ⚠️ Không còn `NewPasswordRequiredResponse` — Auth0 không có NEW_PASSWORD_REQUIRED flow.

**Component**: `frontend/components/auth/login-view.tsx`
**Hook**: `useLoginMutation` từ `authApi`

---

## BFF Calls

### POST /api/com-001 — Login

#### Input gửi lên BFF

| Field    | Required | Type   |
|----------|----------|--------|
| email    | ✅       | string |
| password | ✅       | string |

#### Output expect từ BFF

**Case 1 — Thành công:**

| Field         | Required | Type      |
|---------------|----------|-----------|
| authenticated | ✅       | true      |
| session       | ✅       | UISession |
| redirectTo    | ✅       | string    |

**UISession:**

| Field                 | Required | Type                              |
|-----------------------|----------|-----------------------------------|
| user.email            | ✅       | string                            |
| user.role             | ✅       | `EMPLOYEE` \| `MANAGER` \| `FINANCE` |
| budget                | ✅       | number                            |
| onboardingStatus      | ✅       | `PENDING` \| `DONE`             |
| permissions           | ✅       | string[]                          |
| functions             | ✅       | number[]                          |
| isAdmin               | ✅       | boolean                           |

**Case 2 — MFA Required:**

| Field         | Required | Type   | Ghi chú                    |
|---------------|----------|--------|----------------------------|
| authenticated | ✅       | false  |                            |
| mfaRequired   | ✅       | true   |                            |
| challengeName | ✅       | string | `MFA_REQUIRED`             |
| session       | ✅       | string | Auth0 `mfa_token` (opaque) |
| maskedEmail   | ✅       | string |                            |
