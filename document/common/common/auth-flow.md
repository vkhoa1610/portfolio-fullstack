# Common — Auth Flow & Token Management

## Tổng quan

```
Frontend → BFF (HttpOnly cookies) → Java Backend (Bearer accessToken)
                ↕
           Auth0 (Resource Owner Password grant)
```

## Token Storage

| Token        | Lưu ở đâu       | Ai có thể đọc |
|--------------|-----------------|---------------|
| accessToken  | HttpOnly cookie | BFF only      |
| refreshToken | HttpOnly cookie | BFF only      |
| UISession    | Redux store     | Frontend      |

> Frontend **không bao giờ** thấy access/refresh token.

> ⚠️ Không còn `idToken` riêng — Auth0 Resource Owner Password trả `access_token` + `refresh_token`.

## UISession (Frontend-safe)

```typescript
interface UISession {
  user: {
    email: string;
    role: 'EMPLOYEE' | 'MANAGER' | 'FINANCE';
  };
  budget: number;
  onboardingStatus: 'PENDING' | 'DONE';
  permissions: string[];
  functions: number[];
  isAdmin: boolean;
}
```

## Token Refresh

- BFF tự động refresh khi accessToken hết hạn (trong com-004)
- Nếu refreshToken cũng hết hạn → clearCookies → `{ authenticated: false }`
- Frontend nhận `authenticated: false` → redirect về `/auth/login`

## Auth Header (BFF → Backend)

```
Authorization: Bearer <accessToken>
```

accessToken là JWT từ Auth0. Backend decode để lấy `sub` (Auth0 user ID).

## Role Claim

Auth0 role claim: `https://portfolio.app/role` (namespaced custom claim)
Set bởi Auth0 Action "Add Role to Token" trong Post Login flow.

```javascript
// Auth0 Action
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://portfolio.app/';
  const role = event.user.app_metadata?.role || 'EMPLOYEE';
  api.accessToken.setCustomClaim(namespace + 'role', role);
};
```

## Auth Provider: Auth0

- Grant type: Resource Owner Password (`password-realm`)
- MFA: `mfa-otp` grant với `mfa_token`
- Logout: `POST /oauth/revoke` (refresh token revocation)
- No redirect flow — BFF giao tiếp trực tiếp với Auth0

## Demo Users

| Role     | Email                    | Auth0 sub                              |
|----------|--------------------------|----------------------------------------|
| EMPLOYEE | employee@portfolio.app   | auth0|69db9135b65ad959bd52d81e         |
| MANAGER  | manager@portfolio.app    | auth0|69db914919afd97398d23e56         |
| FINANCE  | finance@portfolio.app    | auth0|69db915cb65ad959bd52d82d         |
| ADMIN    | admin@portfolio.app      | auth0|69db916e19afd97398d23e73         |
