# New Password Screen — `/auth/new-password`

## Process Flow

```
User nhập mật khẩu mới (2 lần để xác nhận)
  (session + username được truyền từ Login screen qua state)
  → Validate: passwords match, độ phức tạp
  → Gọi BFF: POST /api/com-003
  → Thành công:
      → Lưu UISession vào Redux
      → Redirect: /onboarding (PENDING) hoặc /dashboard (DONE)
```

**Component**: `frontend/components/auth/` (new password form)
**Hook**: `useSetNewPasswordMutation` từ `authApi`

---

## BFF Calls

### POST /api/com-003 — Set New Password

#### Input gửi lên BFF

| Field       | Required | Type   | Ghi chú                             |
|-------------|----------|--------|-------------------------------------|
| username    | ✅       | string | Email (từ Login state)              |
| newPassword | ✅       | string | Mật khẩu mới                        |
| session     | ✅       | string | Cognito session từ com-001          |

#### Output expect từ BFF

| Field         | Required | Type      |
|---------------|----------|-----------|
| authenticated | ✅       | true      |
| session       | ✅       | UISession |
| redirectTo    | ✅       | string    |
