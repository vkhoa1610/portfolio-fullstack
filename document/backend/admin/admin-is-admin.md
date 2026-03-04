# GET /api/v1/users/me/is-admin

> BFF gọi endpoint này để kiểm tra xem user hiện tại có phải system_admin không.
> Được gọi trong `Promise.all` cùng với `users/me` và `users/me/permissions` khi build UISession.

## Process Flow

```
BFF gọi với idToken
  → Backend decode JWT → lấy cognitoSub
  → SystemAdminRepository.existsBySub(cognitoSub)
      SELECT COUNT(*) FROM system_admins WHERE cognito_sub = :sub AND is_deleted = 0
  → Trả { isAdmin: true/false }
```

---

## API Endpoint

- **Method**: GET
- **Path**: `/api/v1/users/me/is-admin`
- **Auth**: Bearer idToken
- **Controller**: `UserPermissionController.java`
- **Repository**: `SystemAdminRepository.java`

---

## Input

Không có request body. `cognitoSub` lấy từ JWT attribute được set bởi filter.

---

## Output

```json
{ "isAdmin": true }
```

hoặc

```json
{ "isAdmin": false }
```

---

## Ghi chú

- Không throw lỗi — kể cả khi user không có trong `system_admins`, trả `{ isAdmin: false }`
- BFF catch exception → fallback `false` (không block login flow)
- `isAdmin` được đưa vào `UISession` và persist suốt session

## Guard pattern trên các màn admin (Frontend)

```typescript
const { isAdmin, isLoading, session } = useAuth();
useEffect(() => {
  if (!isLoading && session !== null && !isAdmin) {
    router.replace('/not-found');
  }
}, [isLoading, session, isAdmin, router]);
```
