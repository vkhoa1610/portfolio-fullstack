# POST /api/v1/expenses/scan

## Process Flow

```
BFF gọi từ emp-002 (kèm idToken + { fileUrl })
  → Backend validate idToken
  → Mock OCR: bỏ qua fileUrl, trả data cố định (REWE GmbH 47.80€)
  → Trả ScanResponse
```

> **Lưu ý**: Đây là Mock OCR. fileUrl nhận được nhưng không thực sự đọc file.
> Khi implement thật: gọi AWS Textract / Google Vision với fileUrl.

---

## API Endpoint

- **Method**: POST
- **Path**: `/api/v1/expenses/scan`
- **Auth**: Bearer idToken

---

## Input (Request Body)

| Field   | Required | Type   | Ghi chú                      |
|---------|----------|--------|------------------------------|
| fileUrl | ✅       | string | Public URL của file receipt  |

---

## Output (Response)

| Field     | Required | Type     | Ghi chú (Mock values)      |
|-----------|----------|----------|---------------------------|
| vendor    | ✅       | string   | `REWE GmbH`               |
| date      | ✅       | string   | ISO date                  |
| amount    | ✅       | number   | `47.80`                   |
| vatAmount | ✅       | number   | `7.63` (19% VAT)          |
| vatRate   | ✅       | string   | `"19%"`                   |
| flags     | ✅       | string[] | `[]` (rỗng khi mock)      |

---

## SQL

Không có SQL. Pure mock response.
