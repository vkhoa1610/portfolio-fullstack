# GET /api/v1/expenses/upload-url

## Process Flow

```
BFF gọi từ emp-001 (kèm idToken + filename)
  → Backend validate idToken
  → Tạo presigned PUT URL từ MinIO SDK (TTL: 15 phút)
  → Tạo public fileUrl (đường dẫn final sau khi upload)
  → Trả { uploadUrl, fileUrl }
```

---

## API Endpoint

- **Method**: GET
- **Path**: `/api/v1/expenses/upload-url`
- **Auth**: Bearer idToken

---

## Input (Query Params)

| Field    | Required | Type   | Ghi chú                          |
|----------|----------|--------|----------------------------------|
| filename | ✅       | string | Tên file cần upload              |

---

## Output (Response)

| Field     | Required | Type   | Ghi chú                                      |
|-----------|----------|--------|----------------------------------------------|
| uploadUrl | ✅       | string | Presigned PUT URL (MinIO, TTL 15 phút)       |
| fileUrl   | ✅       | string | Public URL để access file sau khi upload      |

---

## SQL

Không có SQL. Chỉ gọi MinIO SDK để tạo presigned URL.

```
MinIO.presignedPutObject(bucket, objectKey, expiry=900s)
→ uploadUrl

fileUrl = MINIO_PUBLIC_URL + "/" + bucket + "/" + objectKey
```
