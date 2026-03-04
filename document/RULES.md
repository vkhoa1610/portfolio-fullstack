# Implementation Rules

> Quy tắc triển khai chuẩn cho từng layer. Đọc trước khi implement feature mới.

---

## 1. Database

### Quy tắc chung

- Column naming: `snake_case`
- PK: `INT AUTO_INCREMENT` (trừ bảng dùng `cognito_sub` làm PK)
- Soft delete: dùng `is_deleted TINYINT(1) DEFAULT 0`, không xoá thật
- Timestamp: `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- Thêm vào cả `TableMaster.sql` (full schema) và `db_fix.sql` (reset script)

### Khi thêm bảng mới

```sql
-- Pattern chuẩn
CREATE TABLE xxx (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ...fields...,
  is_deleted TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Thêm seed data ngay bên dưới nếu cần
INSERT INTO xxx (field1, field2) VALUES (...);
```

### FK Pattern

- `ON DELETE CASCADE` khi child không có nghĩa nếu không có parent
- Tên constraint: `fk_<tablename>_<ref>` (ví dụ: `fk_up_user`, `fk_up_perm`)

---

## 2. Java Backend

### Entity

- Plain POJO, **không** dùng JPA annotation
- Dùng Lombok `@Data` (getter + setter + toString + equals)
- Field names: `camelCase` (MyBatis resultMap sẽ map từ `snake_case`)

```java
@Data
public class XxxEntity {
    private Integer id;
    private String fieldName;   // maps DB: field_name
    private Integer isDeleted;
}
```

### MyBatis — 3 files mỗi repository

```
entity/XxxEntity.java              ← POJO
mapper/XxxMapper.java              ← @Mapper interface
resources/mapper/XxxMapper.xml     ← SQL (cùng tên với interface)
repository/XxxRepository.java      ← Wraps mapper, @Repository
```

**`XxxMapper.java`** — chỉ là interface, không có implementation:

```java
@Mapper
public interface XxxMapper {
    List<XxxEntity> findAll();
    XxxEntity findById(@Param("id") int id);
    void insert(XxxEntity entity);
}
```

**`XxxMapper.xml`** — namespace phải trùng với package của interface:

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.example.my_java_app.mapper.XxxMapper">

  <resultMap id="xxxResultMap" type="com.example.my_java_app.entity.XxxEntity">
    <id property="id" column="id"/>
    <result property="fieldName" column="field_name"/>
  </resultMap>

  <select id="findAll" resultMap="xxxResultMap">
    SELECT id, field_name FROM xxx WHERE is_deleted = 0
  </select>

</mapper>
```

**`XxxRepository.java`** — inject mapper, expose business methods:

```java
@Repository
@RequiredArgsConstructor
public class XxxRepository {
    private final XxxMapper xxxMapper;

    public List<XxxEntity> findAll() {
        return xxxMapper.findAll();
    }
}
```

### Service

- `@Service`, inject repository(ies) via `@RequiredArgsConstructor`
- Throw `ForbiddenException` nếu user không có quyền
- Throw `NotFoundException` nếu resource không tồn tại
- Throw `ApiException` cho business logic errors

```java
@Service
@RequiredArgsConstructor
public class XxxService {
    private final XxxRepository xxxRepository;
    private final SystemAdminRepository systemAdminRepository;

    private void requireAdmin(String adminSub) {
        systemAdminRepository.findBySub(adminSub)
            .orElseThrow(() -> new ForbiddenException("Not a system admin"));
    }
}
```

### Controller

- `@RestController`, `@RequestMapping("/api/v1/...")`
- Lấy `cognitoSub` từ request attribute (set bởi JWT filter):

```java
String cognitoSub = (String) request.getAttribute("cognitoSub");
```

- Response thành công (mutation): `{ processStatus: 1, message: ["SUCCESS"] }`
- Response thành công (query): trả thẳng object/list

```java
// Mutation response
return ResponseEntity.ok(Map.of(
    "processStatus", 1,
    "message", List.of("SUCCESS")
));

// Query response
return ResponseEntity.ok(service.getData(cognitoSub));
```

### Permission Check Pattern

Với endpoint cần permission cụ thể, check ở đầu method trước khi xử lý:

```java
if (!permissionService.hasPermission(cognitoSub, "EXPENSE_APPROVE")) {
    throw new ForbiddenException("Missing permission: EXPENSE_APPROVE");
}
```

### Error Handling

`GlobalExceptionHandler` đã handle:
- `NotFoundException` → 404
- `ForbiddenException` → 403
- `ApiException` → 400
- Unhandled exception → 500

---

## 3. BFF

### Cấu trúc folder

```
bff/src/product/common/
  com-001/
    controller.ts   ← xử lý logic
    index.ts        ← export BffConfig object
  scr-001/          ← screen config proxy
    controller.ts
    index.ts
```

### Naming convention

| Prefix | Domain | Ví dụ |
|--------|--------|-------|
| `com-` | Common (auth, session, onboarding) | com-001 → com-007 |
| `emp-` | Employee (expense CRUD) | emp-001 → emp-006 |
| `mgr-` | Manager (approval) | mgr-001 → mgr-004 |
| `fin-` | Finance | fin-001+ |
| `scr-` | Screen config (CMS proxy) | scr-001+ |

### Thêm endpoint mới — 3 bước

**Bước 1:** `bff/src/common/config/bff-endpoints.ts` — thêm constant:

```typescript
export const BFF_ENDPOINTS = {
  // ...existing
  SCR_001: '/scr-001/:screenKey',
} as const;
```

**Bước 2:** Tạo `controller.ts` + `index.ts`:

```typescript
// controller.ts
export const handle = async (req: Request, res: Response) => {
  const tokens = getAuthCookies(req.cookies || {});
  if (!tokens.idToken) return res.status(401).json({ error: 'Unauthorized' });

  const response = await apiClientGet<ResponseType>(
    `/api/v1/xxx`,
    { baseURL: JAVA_API_URL, headers: { Authorization: `Bearer ${tokens.idToken}` } }
  );
  return res.status(200).json(response.data);
};

// index.ts
export const bffXxx: BffConfig = {
  method: 'get',
  path: BFF_ENDPOINTS.XXX,
  handler: handle,
};
```

**Bước 3:** `bff/src/product/common/routes.ts` — register:

```typescript
import { bffXxx } from './xxx';
export const commonRoutes = [...existingRoutes, bffXxx];
```

### buildUISession Pattern

`buildUISession` được gọi trong **tất cả** com-001, com-002, com-003, com-004. Khi thêm field mới vào `UISession`:

1. Thêm `fetchUserXxx()` vào `auth-utils.ts` (always return `[]` on error, không throw)
2. Thêm vào `Promise.all` trong **cả 4** controllers
3. Thêm param vào `buildUISession()` signature
4. Thêm field vào return value của `buildUISession()`

```typescript
// auth-utils.ts — pattern fetchUser*
export const fetchUserXxx = async (idToken: string): Promise<XxxType> => {
  try {
    const response = await apiClientGet<XxxType>('/api/v1/users/me/xxx', {
      baseURL: JAVA_API_URL,
      headers: { Authorization: `Bearer ${idToken}` },
    });
    return response.data;
  } catch (error: any) {
    console.warn('⚠️ Failed to fetch user xxx:', error.message);
    return [];
  }
};
```

### Get Tokens

```typescript
const tokens = getAuthCookies(req.cookies || {});
const { idToken, accessToken, refreshToken } = tokens;
```

---

## 4. Frontend

### UISession Type

Khi BFF thêm field vào session response:
1. Cập nhật `frontend/ducks/auth/types.ts` (UISession interface)
2. Nếu cần helper, thêm vào `frontend/common/context/AuthContext.tsx`

```typescript
// ducks/auth/types.ts
export interface UISession {
  user: { email: string; role: 'EMPLOYEE' | 'MANAGER' | 'FINANCE' };
  budget: number;
  onboardingStatus: 'PENDING' | 'DONE';
  permissions: string[];
  functions: number[];
}
```

### AuthContext — thêm helper

```typescript
// AuthContext.tsx
interface AuthContextType {
  hasPermission: (code: string) => boolean;
  hasFunctionId: (functionId: number) => boolean;
}

const hasPermission = useCallback((code: string): boolean =>
  session?.permissions?.includes(code) ?? false, [session]);

const hasFunctionId = useCallback((functionId: number): boolean =>
  session?.functions?.includes(functionId) ?? false, [session]);
```

### Permission Guard (Page-Level)

Đặt ở component level của page (không phải route level):

```typescript
const { session, isLoading } = useAuth();
const router = useRouter();

useEffect(() => {
  if (!isLoading && session !== null) {
    if (!session.permissions?.includes('EXPENSE_APPROVE')) {
      router.replace('/not-found');
    }
  }
}, [isLoading, session, router]);
```

### RTK Query — thêm API mới

```typescript
// ducks/xxx/xxxApi.ts
export const xxxApi = createApi({
  reducerPath: 'xxxApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api', credentials: 'include' }),
  endpoints: (builder) => ({
    getXxx: builder.query<ResponseType, ArgType>({
      query: (arg) => `/endpoint/${arg}`,
    }),
  }),
});
export const { useGetXxxQuery } = xxxApi;
```

Sau đó register trong `ducks/store.ts`:

```typescript
import { xxxApi } from './xxx/xxxApi';

export const store = configureStore({
  reducer: { [xxxApi.reducerPath]: xxxApi.reducer },
  middleware: (getDefault) => getDefault().concat(xxxApi.middleware),
});
```

### CMS System — Thêm Screen Mới

**Seed data** — thêm vào `TableMaster.sql` / `db_fix.sql`:

```sql
INSERT INTO screen_configs (screen_key, version, config_json, is_active) VALUES
('xxx.screen.key', 1, '{"screen_key":"xxx.screen.key","root":{...}}', 1);
```

**Node types hiện tại** trong `renderNode.tsx`:

| node.type | Mô tả |
|-----------|-------|
| `layout.page` | Container cấp trang, render `parts` |
| `layout.card` | Card container |
| `layout.action-bar` | Row buttons — ẩn khi `activeFormId !== null` |
| `layout.form` | Form — chỉ hiện khi `activeFormId === node.id` |
| `display.field` | Label + value từ Expense theo `data_key` |
| `input.button` | Button — `action` → actionHandlers, `label_key` → `t()` |
| `input.textarea` | Textarea — `data_key` → formValues key |

**`function_id` trên node** — nếu user không có function_id này, node không render.

**`label_key`** — là i18n key thông thường (ví dụ: `manager.btn.accept`) — dùng `t(label_key)` trong renderer.

**`data_key`** trong `display.field` — map sang Expense field qua `DATA_KEY_MAP` trong `renderNode.tsx`. Khi thêm field mới, update map này.

### i18n Keys

Thêm key vào cả 3 file: `locales/en.json`, `locales/vi.json`, `locales/de.json`.

Format key:
- Màn hình + hành động: `manager.btn.accept`, `employee.btn.submit`
- Field label: `expense.detail.field_amount`, `expense.detail.field_vendor_name`
- Thông báo: `common.error.forbidden`

---

## 5. Auth & Security

### JWT Filter (Java)

JWT filter set `cognitoSub` vào `request.setAttribute("cognitoSub", sub)` trước khi vào controller. Controller luôn đọc từ attribute, không từ request body/param.

### Role Check

Role được lưu trong DB (`user_roles` → `roles`), không dùng JWT claim để phân quyền business logic.

### Permission Check

Permission lưu trong `user_permissions` → `permissions`. Dùng `PermissionService.hasPermission()` trong controller hoặc service.

### System Admin

`system_admins` là Cognito pool riêng biệt, tách khỏi bảng `users`. Admin endpoint check `systemAdminRepository.findBySub(adminSub)` trước khi xử lý.

### Token Flow tổng quát

```
Frontend (cookie) → BFF (getAuthCookies) → Bearer idToken → Java Backend
                                                              → JWT decode → cognitoSub
```

---

## 6. Quy tắc document

Khi triển khai feature mới, cập nhật:

1. **`FLOWS.md`** — bảng tổng quan + thêm section flow mới (nếu là flow lớn)
2. **`document/backend/<domain>/<endpoint>.md`** — 1 file per endpoint group
3. **`document/bff/<domain>/<code>.md`** — 1 file per BFF product
4. **`document/frontend/<domain>/<screen>.md`** — 1 file per screen
5. **`document/updateVersion/<date>.md`** — changelog của session

Format file backend/bff/frontend: xem `README.md` trong `document/`.
