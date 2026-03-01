# Common — Error Response Format

## Cấu trúc lỗi chuẩn

Mọi error response đều dùng format:

```json
{
  "processStatus": 0,
  "message": ["Error description here"]
}
```

| Field         | Required | Type     | Ghi chú                  |
|---------------|----------|----------|--------------------------|
| processStatus | ✅       | number   | `0` = ERROR, `1` = SUCCESS |
| message       | ✅       | string[] | Mảng mô tả lỗi           |

## HTTP Status Codes

| Code | Ý nghĩa                            |
|------|------------------------------------|
| 400  | Bad request / validation error     |
| 401  | Unauthenticated (no/invalid token) |
| 403  | Unauthorized (wrong role)          |
| 404  | Resource not found                 |
| 500  | Internal server error              |

## ProcessStatus Enum (BFF)

```typescript
enum ProcessStatus {
  SUCCESS = 1,
  ERROR = 0,
}
```
