# BFF — Finance

> Cập nhật: 2026-03-01 (Session 4)

## Endpoints

| Code    | Method | Path       | Chức năng                                         | Trạng thái               |
|---------|--------|------------|---------------------------------------------------|--------------------------|
| fin-001 | GET    | `/fin-001` | Lấy toàn bộ expenses cho Finance role             | ✅ Done (temporary proxy) |
| fin-002 | POST   | `/fin-002` | Đánh dấu batch expenses là PAID                  | ❌ Chưa có               |

## Chi tiết

- [fin-001.md](./fin-001.md) — GET all expenses for Finance
- [fin-002.md](./fin-002.md) — Mark batch as PAID (planned)

## Ghi chú kiến trúc

`fin-001` hiện tại proxy sang endpoint của Manager (`/api/v1/manager/expenses`).
Cần tạo endpoint riêng `GET /api/v1/finance/expenses` ở backend để:
- Trả tất cả expenses (không lọc theo `userSub`)
- Bao gồm cả status `APPROVED` + `PAID`
- Role guard: chỉ FINANCE role được gọi
