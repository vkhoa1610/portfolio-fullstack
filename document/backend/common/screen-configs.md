# Screen Config APIs — /api/v1/screen-configs

## GET /api/v1/screen-configs/{screenKey}

### Process Flow

```
BFF (scr-001) gọi với idToken
  → Backend giải mã idToken (bất kỳ authenticated user)
  → Query DB: screen_configs WHERE screen_key = :key AND is_active = 1
  → Trả config_json string (raw JSON)
  → BFF parse string → JSON object → trả frontend
```

### API Endpoint

- **Method**: GET
- **Path**: `/api/v1/screen-configs/{screenKey}`
- **Auth**: Bearer idToken

### Input (Path Params)

| Field | Required | Type | Ghi chú |
|-------|----------|------|---------|
| screenKey | ✅ | string | Ví dụ: `manager.approvals.detail` |

### Output (Response)

Raw config JSON string (Content-Type: application/json). BFF sẽ parse thành object trước khi trả frontend.

Cấu trúc JSON:

```json
{
  "screen_key": "manager.approvals.detail",
  "root": {
    "id": "root",
    "type": "layout.page",
    "parts": [...]
  }
}
```

### SQL

```sql
SELECT config_json
FROM screen_configs
WHERE screen_key = #{screenKey}
  AND is_active = 1
LIMIT 1;
```

---

## POST /api/v1/admin/screen-configs/{screenKey}/patch

### Process Flow

```
Admin POST với CSV body
  → Backend kiểm tra cognitoSub trong system_admins
  → Lấy active config → parse JSON → DFS tìm node theo id
  → Set nested property theo dot-path
  → Tạo version mới (MAX version + 1)
  → INSERT new version + deactivate old versions
  → Trả success
```

### API Endpoint

- **Method**: POST
- **Path**: `/api/v1/admin/screen-configs/{screenKey}/patch`
- **Auth**: Bearer idToken — chỉ system_admins

### Input

**Path param:** `screenKey`

**Body:** CSV text (Content-Type: text/plain)

```csv
# nodeId,propertyPath,newValue
btn-accept,label_key,manager.btn.approve_now
btn-reject,variant,warning
```

| Column | Mô tả |
|--------|-------|
| nodeId | `id` của CMS node cần update |
| propertyPath | Dot-separated path (ví dụ: `label_key`, `data.style`) |
| newValue | Giá trị mới (string) |

Dòng bắt đầu bằng `#` là comment, bị bỏ qua.

### Output

| Field | Required | Type |
|-------|----------|------|
| processStatus | ✅ | number |
| message | ✅ | string[] |

### SQL

```sql
-- Lấy active config
SELECT config_json, version
FROM screen_configs
WHERE screen_key = #{screenKey} AND is_active = 1;

-- Insert version mới
INSERT INTO screen_configs (screen_key, version, config_json, is_active)
VALUES (#{screenKey}, #{version}, #{configJson}, 1);

-- Deactivate version cũ
UPDATE screen_configs
SET is_active = 0
WHERE screen_key = #{screenKey} AND version != #{newVersion};
```
