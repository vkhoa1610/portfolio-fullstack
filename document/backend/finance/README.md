# Backend — Finance

> Cập nhật: 2026-03-26 (Session 8)

## Endpoints

| Method | Path | Chức năng | Trạng thái |
|--------|------|-----------|------------|
| GET    | `/api/v1/finance/expenses` | Tất cả APPROVED + PAID expenses | ✅ Done |
| PUT    | `/api/v1/finance/expenses/{id}/pay` | Mark single expense PAID | ✅ Done |
| PUT    | `/api/v1/finance/expenses/batch-pay` | Bulk mark PAID | ✅ Done |
| POST   | `/api/v1/finance/reports` | Tạo finance report | ✅ Done |
| GET    | `/api/v1/finance/reports` | List tất cả finance reports | ✅ Done |

## Chi tiết

- [finance-payment.md](./finance-payment.md) — expense payment endpoints
- [finance-reports.md](./finance-reports.md) — finance report CRUD
