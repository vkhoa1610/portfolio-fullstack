# Finance Payment APIs

## Endpoints

| Method | Path | Chức năng |
|--------|------|-----------|
| GET | `/api/v1/finance/expenses` | Lấy tất cả expenses (APPROVED + PAID) |
| PUT | `/api/v1/finance/expenses/{id}/pay` | Mark single expense là PAID |
| PUT | `/api/v1/finance/expenses/batch-pay` | Mark nhiều expenses là PAID |

**Auth**: Require role `FINANCE` hoặc permission `FINANCE_VIEW`

---

## GET /api/v1/finance/expenses

### Process Flow

```
Finance user → GET /api/v1/finance/expenses
    → requireFinanceView()  (check FINANCE_VIEW permission)
    → ExpenseMapper.findAllApprovedAndPaid()
    → SELECT * WHERE status IN ('APPROVED', 'PAID')
    → List<ExpenseEntity>
```

### Output

Danh sách expense bao gồm cả `APPROVED` (chưa thanh toán) và `PAID` (đã thanh toán).

---

## PUT /api/v1/finance/expenses/{id}/pay

### Process Flow

```
Finance user → PUT /api/v1/finance/expenses/{id}/pay
    → requireFinanceView()
    → FinanceService.pay(id)
        → markPaid(id, LocalDateTime.now())
        → UPDATE expenses SET status='PAID', updated_at=? WHERE id=? AND status='APPROVED'
    → 200 OK
```

### SQL

```sql
UPDATE expenses
SET status = 'PAID',
    updated_at = #{paidAt}
WHERE id = #{id}
  AND status = 'APPROVED'
```

---

## PUT /api/v1/finance/expenses/batch-pay

### Input

```json
{ "ids": [1, 2, 3] }
```

### Process Flow

```
Finance user → PUT /api/v1/finance/expenses/batch-pay
    → requireFinanceView()
    → FinanceService.batchPay(ids)
        → markBatchPaid(ids, LocalDateTime.now())
        → UPDATE expenses SET status='PAID' WHERE id IN (...)
    → { "paid": N }
```

### SQL

```sql
UPDATE expenses
SET status = 'PAID',
    updated_at = #{paidAt}
WHERE id IN
<foreach item="id" collection="ids" open="(" separator="," close=")">
    #{id}
</foreach>
  AND status = 'APPROVED'
```

---

## Scheduled Batch Pay

```java
@Scheduled(cron = "0 0 8 * * ?")   // Mỗi ngày 8:00 SA
public void scheduledBatchPay() {
    int day = LocalDate.now().getDayOfMonth();
    int lastDay = LocalDate.now().lengthOfMonth();
    if (day == 15 || day == lastDay) {
        List<Long> ids = expenseMapper.findAllApproved()
                                     .stream().map(ExpenseEntity::getId)
                                     .collect(toList());
        expenseMapper.markBatchPaid(ids, LocalDateTime.now());
    }
}
```

Chạy tự động vào **ngày 15** và **ngày cuối tháng** — mark tất cả expenses APPROVED → PAID.
