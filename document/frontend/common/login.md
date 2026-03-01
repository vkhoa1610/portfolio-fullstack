# Login Screen — `/auth/login`

## Process Flow

```
User nhập email + password → submit form
  → Gọi BFF: POST /api/com-001
  ├── LoginSuccessResponse (authenticated: true)
  │     → Lưu UISession vào Redux
  │     → Redirect: /onboarding (PENDING) hoặc /dashboard (DONE)
  ├── MfaRequiredResponse
  │     → Lưu { session, maskedEmail } vào local state
  │     → Redirect → /auth/mfa
  └── NewPasswordRequiredResponse
        → Lưu { session, username } vào local state
        → Redirect → /auth/new-password
```

**Component**: `frontend/components/login/` (login form)
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

**Case 2 — MFA Required:**

| Field         | Required | Type   |
|---------------|----------|--------|
| authenticated | ✅       | false  |
| mfaRequired   | ✅       | true   |
| session       | ✅       | string |
| maskedEmail   | ✅       | string |

**Case 3 — New Password Required:**

| Field               | Required | Type   |
|---------------------|----------|--------|
| authenticated       | ✅       | false  |
| newPasswordRequired | ✅       | true   |
| session             | ✅       | string |
| username            | ✅       | string |
