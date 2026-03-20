# BFF — Finance

> Cập nhật: 2026-03-20

## Endpoints

| Code    | Method | Path                  | Chức năng                              | Trạng thái |
|---------|--------|-----------------------|----------------------------------------|------------|
| fin-001 | GET    | `/fin-001`            | Lấy toàn bộ expenses (APPROVED + PAID) | ✅ Done     |
| fin-002 | PUT    | `/fin-002/:id/pay`    | Mark single expense là PAID            | ✅ Done     |
| fin-003 | PUT    | `/fin-003/batch-pay`  | Mark batch expenses là PAID            | ✅ Done     |

## Chi tiết

- [fin-001.md](./fin-001.md) — GET all expenses for Finance
- [fin-002.md](./fin-002.md) — PUT single pay
- [fin-003.md](./fin-003.md) — PUT batch pay
