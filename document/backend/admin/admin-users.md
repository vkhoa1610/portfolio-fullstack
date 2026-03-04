# Admin — GET /api/v1/admin/users

> Chỉ dành cho `system_admins`. Trả danh sách toàn bộ user trong hệ thống.

## Process Flow

```
Admin gọi với idToken
  → Backend kiểm tra cognitoSub trong system_admins (requireAdmin)
  → AdminController.listUsers()
  → AdminUserMapper.findAllUsers()
      JOIN users + user_roles + roles + user_profiles
  → Trả List<Map<String, Object>>
```

---

## API Endpoint

- **Method**: GET
- **Path**: `/api/v1/admin/users`
- **Auth**: Bearer idToken — chỉ system_admins
- **Controller**: `AdminController.java`
- **Mapper**: `AdminUserMapper.java` + `AdminUserMapper.xml`

---

## Input

Không có request body hoặc query params.

---

## Output

```json
[
  {
    "cognitoSub": "47b40a38-2091-70e4-b5cb-a04aa64856f8",
    "email": "vanb@gmail.com",
    "role": "EMPLOYEE",
    "onboardingStatus": "DONE",
    "budget": 0
  },
  {
    "cognitoSub": "37e4ca68-3051-7093-ee11-658d3aa0a191",
    "email": "vkhoajap1610@gmail.com",
    "role": "MANAGER",
    "onboardingStatus": "DONE",
    "budget": 0
  }
]
```

| Field | Type | Ghi chú |
|-------|------|---------|
| cognitoSub | string | cognito_sub của user |
| email | string | |
| role | string \| null | EMPLOYEE / MANAGER / FINANCE — null nếu chưa được assign |
| onboardingStatus | string \| null | PENDING / DONE — null nếu chưa có user_profiles |
| budget | number | Từ user_profiles.budget |

---

## SQL (AdminUserMapper.xml)

```sql
SELECT u.cognito_sub AS cognitoSub, u.email,
       r.role_name AS role,
       p.onboarding_status AS onboardingStatus,
       p.budget
FROM users u
LEFT JOIN user_roles ur ON u.cognito_sub = ur.user_sub
LEFT JOIN roles r ON ur.role_id = r.id
LEFT JOIN user_profiles p ON u.cognito_sub = p.user_sub
WHERE u.is_deleted = 0
ORDER BY u.email
```

---

## Lỗi

| Status | Trường hợp |
|--------|-----------|
| 403 | cognitoSub không có trong system_admins |
