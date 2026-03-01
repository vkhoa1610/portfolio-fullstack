# Common — Auth Flow & Token Management

## Tổng quan

```
Frontend → BFF (HttpOnly cookies) → Java Backend (Bearer idToken)
                ↕
           AWS Cognito (trực tiếp)
```

## Token Storage

| Token        | Lưu ở đâu     | Ai có thể đọc |
|--------------|---------------|---------------|
| accessToken  | HttpOnly cookie | BFF only      |
| idToken      | HttpOnly cookie | BFF only      |
| refreshToken | HttpOnly cookie | BFF only      |
| UISession    | Redux store   | Frontend      |

> Frontend **không bao giờ** thấy access/id/refresh token.

## UISession (Frontend-safe)

```typescript
interface UISession {
  user: {
    email: string;
    role: 'EMPLOYEE' | 'MANAGER' | 'FINANCE';
  };
  budget: number;
  onboardingStatus: 'PENDING' | 'DONE';
}
```

## Token Refresh

- BFF tự động refresh khi idToken hết hạn (trong com-004)
- Nếu refreshToken cũng hết hạn → clearCookies → `{ authenticated: false }`
- Frontend nhận `authenticated: false` → redirect về `/auth/login`

## Auth Header (BFF → Backend)

```
Authorization: Bearer <idToken>
```

idToken là JWT từ Cognito, Backend decode để lấy `cognito_sub`.
