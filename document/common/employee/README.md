# Common — Employee Domain

## Scope

Employee là role có quyền:
- Tạo và submit expense (RECEIPT, PER_DIEM, MILEAGE)
- Xem danh sách và chi tiết expense của chính mình
- Upload file ảnh receipt lên MinIO

## BFF Endpoints

| Code    | Method | Path                  | Chức năng         |
|---------|--------|-----------------------|-------------------|
| EMP-001 | GET    | `/emp-001`            | Get upload URL    |
| EMP-002 | POST   | `/emp-002`            | Scan receipt (OCR)|
| EMP-003 | POST   | `/emp-003`            | Create expense    |
| EMP-004 | GET    | `/emp-004`            | List own expenses |
| EMP-005 | GET    | `/emp-005/:id`        | Expense detail    |
| EMP-006 | POST   | `/emp-006/:id`        | Submit expense    |

## Backend APIs

| Method | Path                              | Chức năng         |
|--------|-----------------------------------|-------------------|
| GET    | `/api/v1/expenses/upload-url`     | Presigned URL     |
| POST   | `/api/v1/expenses/scan`           | Mock OCR          |
| POST   | `/api/v1/expenses`                | Create DRAFT      |
| GET    | `/api/v1/expenses`                | List own          |
| GET    | `/api/v1/expenses/:id`            | Detail            |
| POST   | `/api/v1/expenses/:id/submit`     | Submit            |
