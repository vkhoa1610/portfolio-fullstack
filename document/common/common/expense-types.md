# Common — Expense Types & Status

## ExpenseType

| Value     | Mô tả                   |
|-----------|-------------------------|
| RECEIPT   | Hóa đơn mua hàng        |
| PER_DIEM  | Phụ cấp công tác/ngày   |
| MILEAGE   | Phụ cấp di chuyển (km)  |

## ExpenseStatus

| Value          | Mô tả                              | Transition                    |
|----------------|------------------------------------|-------------------------------|
| DRAFT          | Nháp, chưa submit                  | → PENDING_REVIEW (submit)     |
| PENDING_REVIEW | Đã submit, chờ manager duyệt       | → APPROVED hoặc REJECTED      |
| APPROVED       | Manager đã duyệt                   | (terminal)                    |
| REJECTED       | Manager đã từ chối                 | (terminal)                    |

## DB Table: expenses

| Column           | Type    | Ghi chú                              |
|------------------|---------|--------------------------------------|
| id               | bigint  | PK auto-increment                    |
| user_sub         | varchar | FK → users.cognito_sub               |
| type             | enum    | RECEIPT / PER_DIEM / MILEAGE         |
| status           | enum    | DRAFT / PENDING_REVIEW / APPROVED / REJECTED |
| title            | varchar | nullable                             |
| amount           | decimal | nullable                             |
| currency         | varchar | default 'EUR'                        |
| vendor_name      | varchar | RECEIPT — nullable                   |
| receipt_date     | date    | RECEIPT — nullable                   |
| vat_amount       | decimal | RECEIPT — nullable                   |
| receipt_file_url | text    | RECEIPT — nullable                   |
| ai_extracted_data| text    | RECEIPT — JSON string, nullable      |
| ai_flags         | text    | RECEIPT — JSON string, nullable      |
| trip_from        | varchar | PER_DIEM — nullable                  |
| trip_to          | varchar | PER_DIEM — nullable                  |
| country_code     | varchar | PER_DIEM — nullable                  |
| per_diem_rate    | decimal | PER_DIEM — nullable                  |
| per_diem_days    | int     | PER_DIEM — nullable                  |
| distance_km      | decimal | MILEAGE — nullable                   |
| rate_per_km      | decimal | MILEAGE — nullable                   |
| submitted_at     | timestamp| nullable                            |
| reviewed_at      | timestamp| nullable                            |
| reviewed_by      | varchar | nullable — cognito_sub của manager   |
| rejection_reason | text    | nullable                             |
| created_at       | timestamp| NOT NULL                            |
