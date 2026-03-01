# MFA Screen — `/auth/mfa`

## Process Flow

```
User nhập OTP 6 chữ số
  (session + email được truyền từ Login screen qua state/URL)
  → Gọi BFF: POST /api/com-002
  → Thành công:
      → Lưu UISession vào Redux
      → Redirect: /onboarding (PENDING) hoặc /dashboard (DONE)
  → Thất bại: Hiện lỗi "Invalid OTP"
```

**Component**: `frontend/components/auth/` (MFA form)
**Hook**: `useVerifyMfaMutation` từ `authApi`

---

## BFF Calls

### POST /api/com-002 — Verify MFA

#### Input gửi lên BFF

| Field   | Required | Type   | Ghi chú                                    |
|---------|----------|--------|--------------------------------------------|
| otp     | ✅       | string | 6 chữ số từ authenticator app             |
| session | ✅       | string | Cognito session nhận từ com-001            |
| email   | ✅       | string | Email user (từ Login state)                |

#### Output expect từ BFF

| Field         | Required | Type      |
|---------------|----------|-----------|
| authenticated | ✅       | true      |
| session       | ✅       | UISession |
| redirectTo    | ✅       | string    |
