# Admin CSV Import APIs

> Bulk import users hoặc permissions qua file CSV.
> Không dùng thư viện ngoài — parse thuần Java BufferedReader (BOM-safe).

---

## POST /api/v1/admin/import/users

### Process Flow

```
Admin upload file CSV (multipart/form-data)
  → CsvImportController.importUsers()
  → requireAdmin(): kiểm tra system_admins
  → CsvImportService.importUsers(file, adminSub)
      Đọc CSV → mỗi row: Email, Role, Budget
      Validate email (format + tồn tại trong users)
      Validate role (EMPLOYEE/MANAGER/FINANCE)
      UPSERT user_roles, user_profiles
  → Trả ImportResultDto
```

### API Endpoint

- **Method**: POST
- **Path**: `/api/v1/admin/import/users`
- **Content-Type**: `multipart/form-data`
- **Auth**: Bearer idToken — chỉ system_admins
- **Controller**: `CsvImportController.java`
- **Service**: `CsvImportService.java`

### Input

| Field | Required | Type | Ghi chú |
|-------|----------|------|---------|
| file | ✅ | MultipartFile | File .csv — header row bắt buộc |

### CSV Format

```csv
Email,Role,Budget
vanb@gmail.com,EMPLOYEE,1500.00
vkhoajap1610@gmail.com,MANAGER,0
```

| Column | Required | Ghi chú |
|--------|----------|---------|
| Email | ✅ | Phải tồn tại trong bảng users |
| Role | ✅ | EMPLOYEE / MANAGER / FINANCE |
| Budget | ❌ | Decimal, mặc định 0 nếu trống |

### Output

```json
{
  "successCount": 2,
  "failCount": 1,
  "errors": [
    { "row": "3", "message": "Email not found: unknown@gmail.com" }
  ]
}
```

---

## POST /api/v1/admin/import/permissions

### Process Flow

```
Admin upload file CSV (multipart/form-data)
  → requireAdmin()
  → CsvImportService.importPermissions(file, adminSub)
      Đọc CSV → mỗi row: User Email, Permission Code, Action
      Validate email + permission code
      Action=GRANT  → UPSERT user_permissions (is_active=1)
      Action=REVOKE → UPDATE SET is_active=0
  → Trả ImportResultDto
```

### API Endpoint

- **Method**: POST
- **Path**: `/api/v1/admin/import/permissions`
- **Content-Type**: `multipart/form-data`
- **Auth**: Bearer idToken — chỉ system_admins

### CSV Format

```csv
User Email,Permission Code,Action
vanb@gmail.com,EXPENSE_APPROVE,GRANT
vkhoajap1610@gmail.com,FINANCE_VIEW,REVOKE
```

| Column | Required | Ghi chú |
|--------|----------|---------|
| User Email | ✅ | Phải tồn tại trong users |
| Permission Code | ✅ | Phải tồn tại trong bảng permissions |
| Action | ✅ | GRANT / REVOKE |

### Output

Giống `importUsers` — xem trên.

---

## GET /api/v1/admin/import/template/users

### API Endpoint

- **Method**: GET
- **Path**: `/api/v1/admin/import/template/users`
- **Auth**: Bearer idToken — chỉ system_admins

### Output

File `users_template.csv` download:

```
Content-Disposition: attachment; filename="users_template.csv"
Content-Type: text/csv
```

```csv
Email,Role,Budget
```

---

## GET /api/v1/admin/import/template/permissions

### API Endpoint

- **Method**: GET
- **Path**: `/api/v1/admin/import/template/permissions`
- **Auth**: Bearer idToken — chỉ system_admins

### Output

File `permissions_template.csv` download:

```csv
User Email,Permission Code,Action
```

---

## Ghi chú kỹ thuật

- CSV parse thuần Java `BufferedReader` + `split(",", -1)` — không dùng EasyExcel/Apache POI
- BOM-safe: strip `\uFEFF` ở byte đầu nếu có (Excel UTF-8 with BOM)
- Mỗi row độc lập — lỗi 1 row không dừng toàn bộ file
- `ImportResultDto`: `{ successCount, failCount, errors: [{row, message}] }`
