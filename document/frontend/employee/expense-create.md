# Expense Create Screen — `/my-expenses/create`

## Process Flow

```
User chọn loại expense (RECEIPT / PER_DIEM / MILEAGE)
  → Hiển thị form tương ứng

[RECEIPT flow:]
  → User chọn file ảnh
  → Gọi BFF: GET /api/emp-001?filename=xxx → nhận { uploadUrl, fileUrl }
  → PUT file thẳng lên MinIO bằng uploadUrl (không qua BFF)
  → Gọi BFF: POST /api/emp-002 { fileUrl } → nhận ScanResponse (Mock OCR)
  → Pre-fill form từ scan data
  → User chỉnh sửa → Submit

[PER_DIEM / MILEAGE flow:]
  → User nhập form thủ công → Submit

[Submit:]
  → Gọi BFF: POST /api/emp-003 (CreateExpenseRequest) → nhận Expense (DRAFT)
  → Gọi BFF: POST /api/emp-006/:id/submit → đổi sang PENDING_REVIEW
  → Redirect → /my-expenses
```

**Component**: `frontend/components/expenses/expense-type-selector.tsx`, form components
**Hooks**: `useGetUploadUrlMutation`, `useScanReceiptMutation`, `useCreateExpenseMutation`, `useSubmitExpenseMutation`

---

## BFF Calls

### GET /api/emp-001 — Get Upload URL (RECEIPT only)

#### Input gửi lên BFF

| Field    | Required | Type   |
|----------|----------|--------|
| filename | ✅       | string |

#### Output expect từ BFF

| Field     | Required | Type   |
|-----------|----------|--------|
| uploadUrl | ✅       | string |
| fileUrl   | ✅       | string |

---

### POST /api/emp-002 — Scan Receipt (RECEIPT only)

#### Input gửi lên BFF

| Field   | Required | Type   |
|---------|----------|--------|
| fileUrl | ✅       | string |

#### Output expect từ BFF

| Field     | Required | Type     |
|-----------|----------|----------|
| vendor    | ✅       | string   |
| date      | ✅       | string   |
| amount    | ✅       | number   |
| vatAmount | ✅       | number   |
| vatRate   | ✅       | string   |
| flags     | ✅       | string[] |

---

### POST /api/emp-003 — Create Expense

#### Input gửi lên BFF

| Field          | Required | Type   | Ghi chú                                  |
|----------------|----------|--------|------------------------------------------|
| type           | ✅       | string | `RECEIPT` \| `PER_DIEM` \| `MILEAGE`   |
| title          | ❌       | string |                                          |
| amount         | ❌       | number |                                          |
| currency       | ❌       | string |                                          |
| vendorName     | ❌       | string | RECEIPT                                  |
| receiptDate    | ❌       | string | RECEIPT                                  |
| vatAmount      | ❌       | number | RECEIPT                                  |
| receiptFileUrl | ❌       | string | RECEIPT                                  |
| aiExtractedData| ❌       | string | RECEIPT                                  |
| aiFlags        | ❌       | string | RECEIPT                                  |
| tripFrom       | ❌       | string | PER_DIEM                                 |
| tripTo         | ❌       | string | PER_DIEM                                 |
| countryCode    | ❌       | string | PER_DIEM                                 |
| perDiemRate    | ❌       | number | PER_DIEM                                 |
| perDiemDays    | ❌       | number | PER_DIEM                                 |
| distanceKm     | ❌       | number | MILEAGE                                  |
| ratePerKm      | ❌       | number | MILEAGE                                  |

#### Output expect từ BFF

| Field  | Required | Type   |
|--------|----------|--------|
| id     | ✅       | number |
| status | ✅       | string |

---

### POST /api/emp-006/:id — Submit Expense

#### Input gửi lên BFF

| Field | Required | Type   |
|-------|----------|--------|
| id    | ✅       | number |

#### Output expect từ BFF

| Field         | Required | Type     |
|---------------|----------|----------|
| processStatus | ✅       | number   |
| message       | ✅       | string[] |
