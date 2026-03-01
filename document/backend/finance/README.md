# Backend — Finance

> Cập nhật: 2026-03-01 (Session 4)
> ⚠️ **Chưa implement** — Backend chưa có Finance endpoints riêng.

## Endpoints cần implement

| Method | Path                                  | Chức năng                             | Priority |
|--------|---------------------------------------|---------------------------------------|----------|
| GET    | `/api/v1/finance/expenses`            | Lấy tất cả expenses (không lọc user) | 🔴 High  |
| POST   | `/api/v1/finance/expenses/mark-paid`  | Cập nhật status APPROVED → PAID      | 🔴 High  |

---

## GET /api/v1/finance/expenses

**Role guard**: chỉ FINANCE role.

**Khác với Manager endpoint**:
- Manager (`/api/v1/manager/expenses`): lọc `status = PENDING_REVIEW`, chỉ expenses của team
- Finance: trả **tất cả** expenses (tất cả status, tất cả users)

**Response**: `List<ExpenseResponseDto>` — cùng DTO với manager endpoint.

---

## POST /api/v1/finance/expenses/mark-paid

**Role guard**: chỉ FINANCE role.

**Request Body**:
```json
{ "ids": [1, 2, 3] }
```

**SQL cần thực hiện**:
```sql
UPDATE expenses
SET status = 'PAID', updated_at = NOW(), updated_by = :financeSub
WHERE id IN (:ids)
  AND status = 'APPROVED'
```

**Response**:
```json
{ "success": true, "paidIds": [1, 2, 3] }
```

---

## DB Changes cần thiết

`TableMaster.sql` + `db_fix.sql` — thêm `PAID` vào ENUM `expense_status`:

```sql
status ENUM('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'PAID') NOT NULL DEFAULT 'DRAFT'
```

---

## Hiện trạng tạm thời

`FIN-001` (BFF) đang proxy sang `/api/v1/manager/expenses` — chỉ trả PENDING_REVIEW expenses.

Khi Backend implement `GET /api/v1/finance/expenses`, cập nhật:
- `bff/src/product/finance/fin-001/controller.ts` → đổi target URL
- `bff/src/common/config/bff-endpoints.ts` → thêm `FIN_002`
- `bff/src/product/finance/routes.ts` → đăng ký `bffFin002`
