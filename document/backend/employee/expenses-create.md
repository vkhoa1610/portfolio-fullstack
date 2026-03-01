# POST /api/v1/expenses

## Process Flow

```
BFF gọi từ emp-003 (kèm CreateExpenseRequest + idToken)
  → Backend giải mã idToken → lấy cognito_sub
  → Validate: type phải là RECEIPT | PER_DIEM | MILEAGE
  → Insert vào bảng expenses với status = DRAFT
  → Trả Expense object
```

---

## API Endpoint

- **Method**: POST
- **Path**: `/api/v1/expenses`
- **Auth**: Bearer idToken

---

## Input (Request Body)

| Field           | Required | Type   | Ghi chú                                  |
|-----------------|----------|--------|------------------------------------------|
| type            | ✅       | string | `RECEIPT` \| `PER_DIEM` \| `MILEAGE`   |
| title           | ❌       | string |                                          |
| amount          | ❌       | number | Decimal                                  |
| currency        | ❌       | string | Mặc định: `EUR`                         |
| vendorName      | ❌       | string | RECEIPT                                  |
| receiptDate     | ❌       | date   | RECEIPT                                  |
| vatAmount       | ❌       | number | RECEIPT                                  |
| receiptFileUrl  | ❌       | string | RECEIPT                                  |
| aiExtractedData | ❌       | string | RECEIPT — JSON string                    |
| aiFlags         | ❌       | string | RECEIPT — JSON string                    |
| tripFrom        | ❌       | string | PER_DIEM                                 |
| tripTo          | ❌       | string | PER_DIEM                                 |
| countryCode     | ❌       | string | PER_DIEM                                 |
| perDiemRate     | ❌       | number | PER_DIEM                                 |
| perDiemDays     | ❌       | number | PER_DIEM                                 |
| distanceKm      | ❌       | number | MILEAGE                                  |
| ratePerKm       | ❌       | number | MILEAGE                                  |

---

## Output (Response)

Trả về full `Expense` object (xem [expenses-detail.md](expenses-detail.md)).

---

## SQL

```sql
INSERT INTO expenses (
  user_sub, type, title, amount, currency, status,
  vendor_name, receipt_date, vat_amount, receipt_file_url,
  ai_extracted_data, ai_flags,
  trip_from, trip_to, country_code, per_diem_rate, per_diem_days,
  distance_km, rate_per_km,
  created_at
) VALUES (
  :cognito_sub, :type, :title, :amount, COALESCE(:currency, 'EUR'), 'DRAFT',
  :vendorName, :receiptDate, :vatAmount, :receiptFileUrl,
  :aiExtractedData, :aiFlags,
  :tripFrom, :tripTo, :countryCode, :perDiemRate, :perDiemDays,
  :distanceKm, :ratePerKm,
  NOW()
) RETURNING *;
```
