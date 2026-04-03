# BFF — Finance

> Cập nhật: 2026-03-26 (Session 8)

## Endpoints

| Code    | Method | Path                  | Chức năng                              | Trạng thái |
|---------|--------|-----------------------|----------------------------------------|------------|
| fin-001 | GET    | `/fin-001`            | Lấy toàn bộ expenses (APPROVED + PAID) | ✅ Done     |
| fin-002 | PUT    | `/fin-002/:id/pay`    | Mark single expense là PAID            | ✅ Done     |
| fin-003 | PUT    | `/fin-003/batch-pay`  | Mark batch expenses là PAID            | ✅ Done     |
| fin-004 | POST   | `/fin-004/reports`    | Tạo finance report (DRAFT/SUBMIT)      | ✅ Done     |
| fin-005 | GET    | `/fin-005/reports`    | List tất cả finance reports            | ✅ Done     |

## Chi tiết

- [fin-001.md](./fin-001.md) — GET all expenses for Finance
- [fin-002.md](./fin-002.md) — PUT single pay
- [fin-003.md](./fin-003.md) — PUT batch pay
- [fin-004.md](./fin-004.md) — POST create finance report
- [fin-005.md](./fin-005.md) — GET list finance reports
