# GET /api/v1/users/me

## Process Flow

```
BFF gọi sau khi Cognito auth thành công (com-001, com-002, com-003, com-004)
  → Backend giải mã idToken (JWT) → lấy cognito_sub
  → Query DB: users + user_roles + user_profiles
  → Trả UserProfile cho BFF
  → BFF dùng để buildUISession
```

---

## API Endpoint

- **Method**: GET
- **Path**: `/api/v1/users/me`
- **Auth**: Bearer idToken (từ BFF)

---

## Input

Không có request body / query params. Identity lấy từ JWT token.

---

## Output (Response)

| Field            | Required | Type   | Ghi chú                              |
|------------------|----------|--------|--------------------------------------|
| cognito_sub      | ✅       | string | Primary key                          |
| email            | ✅       | string |                                      |
| role             | ✅       | string | `EMPLOYEE` \| `MANAGER` \| `FINANCE` |
| budget           | ✅       | number | Budget limit của user                |
| onboardingStatus | ✅       | string | `PENDING` \| `DONE`                 |
| languageCode     | ❌       | string | Có sau khi hoàn thành onboarding     |

---

## SQL

```sql
SELECT
  u.cognito_sub,
  u.email,
  r.name AS role,
  up.language_code,
  up.onboarding_status,
  up.budget
FROM users u
JOIN user_roles ur ON u.cognito_sub = ur.user_sub
JOIN roles r ON ur.role_id = r.id
LEFT JOIN user_profiles up ON u.cognito_sub = up.user_sub
WHERE u.cognito_sub = :cognito_sub;
```
