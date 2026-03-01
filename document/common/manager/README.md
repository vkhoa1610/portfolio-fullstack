# Common — Manager Domain

## Scope

Manager là role có quyền:
- Xem danh sách expenses đang chờ duyệt (PENDING_REVIEW)
- Xem chi tiết expense để review
- Approve hoặc Reject expense

## BFF Endpoints

| Code    | Method | Path               | Chức năng              |
|---------|--------|--------------------|------------------------|
| MGR-001 | GET    | `/mgr-001`         | Pending approval queue |
| MGR-002 | PUT    | `/mgr-002/:id`     | Approve expense        |
| MGR-003 | PUT    | `/mgr-003/:id`     | Reject expense         |
| MGR-004 | GET    | `/mgr-004/:id`     | Expense detail (shared emp-005) |

## Backend APIs

| Method | Path                                   | Chức năng       |
|--------|----------------------------------------|-----------------|
| GET    | `/api/v1/manager/expenses`             | Pending queue   |
| PUT    | `/api/v1/manager/expenses/:id/approve` | Approve         |
| PUT    | `/api/v1/manager/expenses/:id/reject`  | Reject          |
| GET    | `/api/v1/expenses/:id`                 | Detail (shared) |
