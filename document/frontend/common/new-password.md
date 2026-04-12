# New Password Screen — `/auth/new-password`

## Trạng thái: ❌ KHÔNG SỬ DỤNG (Auth0)

Screen này dành cho Cognito `NEW_PASSWORD_REQUIRED` flow — không còn tồn tại với Auth0.

Route `/auth/new-password` vẫn có trong codebase nhưng không được redirect đến.
`com-003` trả `410 Gone`.
`useSetNewPasswordMutation` đã bị xóa khỏi `authApi.ts`.
