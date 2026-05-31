# GDPR-Compliance.md
> Wiki page — FintechSaaS Expense Platform
> Phạm vi: toàn bộ nghiệp vụ GDPR/DSGVO liên quan đến xử lý dữ liệu nhân viên
> Cập nhật: 2026-05

---

## 1. Bối cảnh & tension cốt lõi

Hệ thống xử lý đồng thời **hai loại dữ liệu có yêu cầu pháp lý đối nghịch nhau:**

| | Dữ liệu cá nhân | Hồ sơ tài chính |
|---|---|---|
| Ví dụ | Tên, email, IBAN, avatar, `user_profiles` | Expense records, receipt images, DATEV export |
| Luật áp dụng | GDPR Art. 17 — Right to Erasure | GoBD §14 — 10 năm bắt buộc lưu trữ |
| Khi có erasure request | **Phải xóa** | **Không được xóa** |
| Giải pháp | Hard delete | Pseudonymization |

> **Nguyên tắc thiết kế:** GDPR "right to erasure" và GoBD "retention obligation" không mâu thuẫn nếu tách rõ hai loại dữ liệu. Giải pháp chuẩn là **pseudonymization** — xóa thông tin định danh, giữ nguyên số liệu tài chính.

---

## 2. Phân loại dữ liệu (Data Classification)

### 2.1. Dữ liệu cá nhân — có thể xóa (GDPR erasable)

| Bảng | Trường cụ thể | Hành động khi erasure |
|------|-------------|----------------------|
| `users` | `email`, `cognito_sub` | Hard delete row |
| `user_profiles` | `first_name`, `last_name`, `avatar_url`, `language_code` | Hard delete row |
| `user_permissions` | toàn bộ | Hard delete rows |
| `user_roles` | toàn bộ | Hard delete rows |
| `user_consents` | toàn bộ | Hard delete rows (sau khi export bản sao) |
| MinIO | Receipt images của user | Delete objects |

### 2.2. Hồ sơ tài chính — bắt buộc giữ (GoBD retained)

| Bảng | Trường cần giữ | Trường pseudonymize |
|------|--------------|---------------------|
| `expenses` | `amount`, `vat_amount`, `expense_type`, `status`, `submitted_at`, `reviewed_at`, `paid_at`, `receipt_date`, `distance_km`, `per_diem_days`, `country_code` | `user_id` → replace bằng token ẩn danh `[DELETED-{hash}]` |
| `policy_evaluation_history` | toàn bộ `result_json`, `input_json` (số liệu) | `entity_id` nếu trỏ về user |
| `expense_reports` | `content` (markdown aggregated) | Tên nhân viên trong nội dung → `[Employee]` |
| `finance_reports` | toàn bộ | Không có PII trực tiếp — giữ nguyên |

> **Lý do giữ receipt images của expense đã PAID:** Receipt là chứng từ kế toán (Buchungsbeleg). GoBD yêu cầu giữ nguyên bản gốc. Tuy nhiên, tên/email trên receipt nếu có thể OCR được cũng cần được che (redact) thay vì xóa file.

---

## 3. Role & trách nhiệm

### 3.1. ADMIN — Data Controller / DPA

ADMIN là người duy nhất có quyền thực thi GDPR request. Trong mô hình nghiệp vụ, ADMIN đóng vai trò **Datenschutzbeauftragter (DPA)** — người chịu trách nhiệm pháp lý về xử lý dữ liệu.

**Quyền và màn hình:**

- `/admin/users` → tab **"Privacy & GDPR"** (tích hợp vào trang hiện tại, không tạo page riêng)
  - Queue erasure requests: danh sách pending / processing / done
  - Data map per user: bảng nào đang lưu data của user này
  - Consent records: version, timestamp, IP lúc đồng ý
  - Retention schedule: khi nào từng record đủ điều kiện xóa (ngày PAID + 10 năm)
  - Nút **"Process erasure"** → trigger workflow xóa/pseudonymize
  - Export data subject report (Art. 15 — Right of Access)

**Thời hạn xử lý:** GDPR Art. 12 quy định phải phản hồi trong **30 ngày** kể từ ngày nhận request. Hệ thống cần hiển thị deadline countdown trong queue.

### 3.2. FINANCE — GoBD Gatekeeper

FINANCE không xử lý GDPR trực tiếp, nhưng có một bước xác nhận bắt buộc trước khi pseudonymize expense records.

**Màn hình liên quan:**

- `/finance/check` → thêm cột **"Retention status"** cho mỗi expense:
  - `UNDER_RETENTION` — trong 10 năm GoBD, không được xóa
  - `RETENTION_EXPIRED` — đủ điều kiện xóa hoàn toàn
- Khi Admin trigger pseudonymize: Finance nhận notification → **"Confirm GoBD pseudonymization"** → ghi audit log

**Lý do cần Finance confirm:** Tách biệt quyền — Admin có quyền xử lý GDPR nhưng không có quyền tự ý thay đổi hồ sơ tài chính. Finance là người chịu trách nhiệm về tính toàn vẹn của dữ liệu kế toán.

### 3.3. EMPLOYEE — Data Subject

Employee có các quyền GDPR cơ bản được thực hiện qua màn hình:

- `/profile/privacy` — **Privacy Center** (màn hình mới cần tạo)
  - Danh sách data categories đang được lưu (loại, kể từ ngày nào)
  - Nút **"Download my data"** → ZIP export (JSON hoặc CSV) — GDPR Art. 20
  - Nút **"Request deletion"** → tạo ticket gửi ADMIN, trạng thái visible cho employee
  - Lịch sử consent: đã đồng ý policy version nào, lúc nào

---

## 4. Erasure Request Workflow

```
EMPLOYEE                    ADMIN                       FINANCE / SYSTEM
   │                           │                              │
   │  Submit erasure request   │                              │
   │ ─────────────────────────►│                              │
   │  (qua /profile/privacy)   │                              │
   │                           │  Review data map             │
   │                           │  Phân loại: PII vs Financial │
   │                           │                              │
   │                           │  [PII data]                  │
   │                           │  Hard delete:                │
   │                           │  users, user_profiles,       │
   │                           │  user_permissions,           │
   │                           │  MinIO avatars               │
   │                           │                              │
   │                           │  [Financial data]            │
   │                           │  Notify Finance ────────────►│
   │                           │                              │  Confirm GoBD
   │                           │◄─────────────────────────────│  pseudonymize
   │                           │                              │
   │                           │  Pseudonymize expenses:      │
   │                           │  user_id → [DELETED-{hash}]  │
   │                           │  Tên trong report → [Employee]│
   │                           │                              │
   │                           │  Ghi audit log               │
   │                           │  Email xác nhận ────────────►│
   │◄──────────────────────────│  (trong 30 ngày)             │
   │  Confirmation email       │                              │
```

---

## 5. Audit Log cho Personal Data

Mọi hành động liên quan đến GDPR erasure/export phải được ghi vào một bảng riêng biệt — không dùng chung với `policy_evaluation_history`.

> **Quyết định thiết kế:** Consent events (`CONSENT_GIVEN`, `CONSENT_WITHDRAWN`) KHÔNG ghi vào `gdpr_audit_log` — đã có `user_consents` với `ip_address`, `user_agent`, `revoked_at` đủ làm audit trail cho consent. Ghi 2 nơi sẽ gây inconsistency. `gdpr_audit_log` chỉ track erasure và export actions.

**Bảng đề xuất: `gdpr_audit_log`**

```sql
CREATE TABLE gdpr_audit_log (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_type    ENUM(
                  'ERASURE_REQUESTED',        -- employee submit request
                  'ERASURE_PII_DELETED',      -- admin hard delete PII tables
                  'ERASURE_FINANCIAL_PSEUDONYMIZED', -- finance confirm + pseudonymize
                  'ERASURE_COMPLETED',        -- toàn bộ workflow done
                  'DATA_EXPORTED'             -- employee download ZIP (Art. 20)
                ) NOT NULL,
  subject_sub   VARCHAR(64),       -- cognito_sub của người bị xử lý (nullable sau khi xóa)
  subject_token VARCHAR(64) NOT NULL, -- SHA-256(cognito_sub) — giữ lại sau khi sub bị xóa
  actor_sub     VARCHAR(64),       -- admin/finance thực hiện (null nếu system action)
  actor_role    VARCHAR(32),
  details_json  JSON,              -- { tables_affected, rows_deleted, reason, request_id }
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  -- không có FK về users — intentional, vì user có thể đã bị xóa
);
```

> **Lưu ý thiết kế:** `subject_sub` là nullable — bị null sau khi user bị hard delete. `subject_token` là `SHA-256(cognito_sub)` không thể reverse, dùng để liên kết các events trong cùng một erasure workflow sau khi PII đã bị xóa. Không có FK constraint về `users` là intentional. Bảng này **không bao giờ được xóa** — là compliance evidence.

---

## 6. Consent Management

### 6.1. Schema hiện tại — gap analysis

**Schema đang có:**
```sql
-- policies: id, title, slug, version, content, is_current_active, created_at, is_deleted
-- user_consents: id, user_sub, policy_id, ip_address, user_agent, created_at, revoked_at
```

**Đủ dùng cho:**
- Ghi consent given (`created_at`) và withdrawn (`revoked_at`) ✓
- Track IP và user agent khi đồng ý ✓
- Biết user đang active consent version nào ✓

**Gap 1 — `user_consents` thiếu `consent_method`**

GDPR Art. 7 yêu cầu chứng minh được *cách thức* đồng ý. Hiện tại không phân biệt được giữa checkbox click bình thường vs one-click demo login. Cần thêm:

```sql
ALTER TABLE user_consents
  ADD COLUMN consent_method ENUM('explicit_checkbox', 'demo_login', 'api_import') NOT NULL DEFAULT 'explicit_checkbox'
  AFTER user_agent;
```

> **Lý do quan trọng:** Demo login users (Anna Müller, Thomas Weber...) sẽ có `consent_method = 'demo_login'` — phân biệt rõ với real users để không bị audit nhầm.

**Gap 2 — `policies` thiếu `policy_type`**

`slug` hiện tại đang gánh việc phân biệt loại policy. Query "user đã đồng ý AI data processing chưa?" phải filter theo slug string — fragile khi rename. Nên thêm:

```sql
ALTER TABLE policies
  ADD COLUMN policy_type ENUM('TERMS_OF_SERVICE', 'PRIVACY_POLICY', 'AI_DATA_PROCESSING') NOT NULL DEFAULT 'TERMS_OF_SERVICE'
  AFTER slug;
```

Sau đó query consent check cho AI feature trở thành:
```sql
SELECT uc.id FROM user_consents uc
JOIN policies p ON uc.policy_id = p.id
WHERE uc.user_sub = ? AND p.policy_type = 'AI_DATA_PROCESSING'
AND uc.revoked_at IS NULL;
```

**Gap 3 — FK constraint block erasure (critical)**

`user_consents.user_sub` có FK reference đến `users(cognito_sub)`. Khi hard delete user, có 2 tình huống:

| Option | Hành động | Vấn đề |
|--------|-----------|--------|
| `ON DELETE CASCADE` | Xóa luôn consent records | Mất evidence user đã từng đồng ý — vi phạm GDPR chứng minh compliance |
| `ON DELETE RESTRICT` | Block delete | Không xóa được user |
| **Recommended** | Xóa FK constraint, dùng `subject_token` | Giữ consent record nhưng anonymize `user_sub` |

**Giải pháp:** Trước khi hard delete user, chạy:
```sql
-- 1. Anonymize user_sub trong consent records (giữ lại evidence)
UPDATE user_consents
  SET user_sub = CONCAT('DELETED-', SHA2(user_sub, 256))
  WHERE user_sub = ?;

-- 2. Bây giờ mới xóa user (FK không còn reference nữa)
DELETE FROM users WHERE cognito_sub = ?;
```

> Cần drop FK constraint `fk_uc_user` hoặc đổi thành `ON DELETE SET NULL` + cho phép `user_sub` nullable trong `user_consents`.

### 6.2. Khi nào user phải đồng ý

- Lần đầu đăng nhập → Terms of Service + Privacy Policy (`policy_type IN ('TERMS_OF_SERVICE', 'PRIVACY_POLICY')`)
- Khi `is_current_active` policy mới được set → hiển thị re-consent modal lần login tiếp theo
- Khi lần đầu dùng OCR receipt upload → AI Data Processing policy (`policy_type = 'AI_DATA_PROCESSING'`)

### 6.3. Withdrawal of consent

Nếu user revoke AI consent (`revoked_at` được set): backend check trước mỗi lần gọi `POST /expenses/scan` — nếu không có active AI consent thì trả về fallback manual input, không gọi Groq.

> **Không dùng pre-ticked checkboxes** — GDPR Art. 7: consent phải là "freely given, specific, informed and unambiguous indication". Checkbox để trống mặc định. One-click demo login được ghi `consent_method = 'demo_login'` và không được dùng làm real consent evidence.

---

## 7. Data Retention Schedule

| Loại dữ liệu | Retention period | Căn cứ pháp lý | Hành động khi hết hạn |
|-------------|-----------------|---------------|----------------------|
| `user_profiles`, `users` | Đến khi erasure request hoặc tài khoản inactive 3 năm | GDPR Art. 5(1)(e) | Auto-delete job |
| `expenses` (metadata) | 10 năm kể từ ngày PAID | GoBD §14 | Auto-pseudonymize nếu user đã request erasure |
| Receipt images (MinIO) | 10 năm kể từ ngày upload | GoBD — Buchungsbeleg | Giữ nguyên, redact tên nếu cần |
| `policy_evaluation_history` | 10 năm (liên quan đến expense) | GoBD | Pseudonymize `entity_id` |
| `gdpr_audit_log` | Vĩnh viễn | Compliance evidence | Không xóa |
| `user_consents` | Tối thiểu 3 năm sau khi withdraw | GDPR chứng minh compliance | Archive, không hard delete |
| Session / JWT | HttpOnly cookie — expire theo config | GDPR data minimization | Auto-expire |

---

## 8. Màn hình cần tạo mới / chỉnh sửa

### 8.1. Mới: `/profile/privacy` — Privacy Center (EMPLOYEE)

**Vị trí trong navigation:** Settings → Privacy & Data

**Components:**
- **Data inventory card:** danh sách categories (Profile data, Expense history, AI-processed receipts) với ngày bắt đầu lưu
- **Download data button:** `GET /api/v1/user/data-export` → trả về ZIP chứa JSON của tất cả data user
- **Erasure request form:** textarea cho lý do (optional) + submit → tạo row trong queue của Admin
- **Erasure status tracker:** nếu đã có request, hiển thị trạng thái (Pending / Processing / Completed)
- **Consent history table:** policy version, ngày đồng ý, trạng thái (Active / Withdrawn)

### 8.2. Mới: Tab "Privacy & GDPR" trong `/admin/users` (ADMIN)

**Vị trí:** Mở user detail → tab thứ 4 "Privacy & GDPR" (sau Roles, Permissions, Activity)

**Components:**
- **Erasure request queue:** filter by status, deadline countdown (30 ngày)
- **Data map:** accordion per bảng — bao nhiêu rows đang lưu data của user này
- **Action panel:** nút "Process erasure" → mở confirmation modal với checklist
  - [ ] PII data sẽ bị hard delete
  - [ ] Financial records sẽ được pseudonymize
  - [ ] Finance team đã được notify
  - [ ] Audit log sẽ được tạo
- **Consent records:** read-only timeline

### 8.3. Chỉnh sửa: `/finance/check` — thêm Retention status (FINANCE)

**Thay đổi nhỏ:** Thêm 1 cột "Retention" vào bảng expense list:
- Badge `UNDER RETENTION` (amber) — GoBD 10 năm chưa hết
- Badge `EXPIRED` (green) — đủ điều kiện xóa

**Thêm notification panel:** khi có pseudonymize request từ Admin, Finance thấy banner → "Confirm GoBD pseudonymization for [X] expenses" → approve/decline.

---

## 9. API endpoints cần thêm

```
EMPLOYEE
  GET    /api/v1/user/privacy/data-map        Xem data đang lưu
  POST   /api/v1/user/privacy/erasure-request Tạo erasure request
  GET    /api/v1/user/privacy/erasure-status  Trạng thái request hiện tại
  GET    /api/v1/user/data-export             Download ZIP toàn bộ data

ADMIN
  GET    /api/v1/admin/gdpr/requests          Queue erasure requests
  GET    /api/v1/admin/gdpr/data-map/{sub}    Data map của 1 user
  POST   /api/v1/admin/gdpr/process/{id}      Trigger erasure workflow
  GET    /api/v1/admin/gdpr/audit-log         GDPR audit log

FINANCE (notification)
  GET    /api/v1/finance/gdpr/pending         Pending pseudonymize confirmations
  PUT    /api/v1/finance/gdpr/confirm/{id}    Confirm pseudonymize
```

---

## 10. Checklist triển khai (theo priority)

### Phase 1 — Foundation ✅ DONE (7 files mới, 5 schema changes)
- [x] Tạo bảng `gdpr_audit_log` — no FK, subject_token SHA-256, append-only
- [x] `GdprService.java` — 4 methods: `recordErasureRequest`, `pseudonymizeFinancialData`, `hardDeletePersonalData`, `recordDataExport`. @Transactional, idempotent.
- [x] `GdprAuditLogEntity` + `GdprAuditLogMapper` + `GdprAuditLogRepository`
- [x] `GdprMapper.java` + XML — cross-cutting SQL cho pseudonymize + hard delete
- [x] `retention_expires_at DATE` + index trên `expenses`
- [x] `consent_method` ENUM trên `user_consents`
- [x] `policy_type` ENUM trên `policies` + seed AI Data Processing policy
- [x] Drop FK `user_consents → users` (Gap 3 từ schema review)
- [x] Drop FK `expenses → users` (Claude Code tự suy luận — đúng)

**Phase 1 follow-up ✅ DONE (5 files)**
- [x] `paid_at TIMESTAMP NULL` thêm vào `expenses` — không còn hack qua `updated_at`
- [x] `markPaid` + `markBatchPaid` SET `paid_at = NOW()` + `retention_expires_at = DATE_ADD(CURDATE(), INTERVAL 10 YEAR)` atomically trong cùng 1 UPDATE
- [x] `ExpenseEntity` thêm `paidAt` + `retentionExpiresAt`
- [x] `ExpenseMapper.xml` ResultMap + 2 query cập nhật, bỏ hack `updated_at`
- [x] `FinanceService` dọn sạch `DateTimeFormatter` + `now()` helper thừa
- [x] Comment trong `db_fix.sql` document rõ populate rule + backfill statement cho production migration thật

> Semantic rõ: `paid_at` = khi nào thanh toán, `retention_expires_at` = khi nào được phép xóa. Hai field độc lập, không gánh nhau.

### Phase 2 — Admin tooling ✅ DONE (11 files mới + 2 schema updates)

**Backend**
- [x] `GdprController.java` — 4 endpoints `/api/v1/admin/gdpr/*`, `requireAdmin` per method
- [x] `GdprErasureRequestDto` / `GdprDataMapDto` / `GdprAuditLogEntryDto` — response shapes
- [x] `GdprMapper.java + XML` — thêm 6 count queries cho data-map (profiles, roles, consents, policy_eval, expenses, users)
- [x] `GdprAuditLogMapper` — thêm `findById`, `findAllErasureRequests`, `findRecent`, `existsLaterEvent`
- [x] `GdprService` — fix bug: `ERASURE_COMPLETED` giữ `subject_sub` thay vì null; `subjectTokenFor()` expose public
- [x] BFF: 4 endpoints mới `adm-018` → `adm-021`

**Frontend**
- [x] `adminApi.ts` — 4 endpoints + 3 cache tags + invalidation chain sau `process`
- [x] `types.ts` — 5 types mới (`GdprErasureRequest`, `GdprDataMap`, `GdprAuditEntry`, ...)
- [x] `admin-user-detail-view.tsx` — refactor thành 3 tabs: Permissions / UI Functions / **Privacy & GDPR**
- [x] `gdpr-privacy-panel.tsx` — 3 sections: erasure status + countdown, data map accordion, audit timeline
- [x] `gdpr-confirm-modal.tsx` — 4-item checklist, confirm button disable đến khi tick hết

**Schema**
- [x] `TableMaster.sql` cập nhật Phase 1 + Phase 2 changes
- [x] `db_fix.sql` seed 1 demo `ERASURE_REQUESTED` cho Anna Müller

**Demo flow hoạt động:** Admin → Anna Müller → tab Privacy & GDPR → Process erasure → modal checklist → Confirm → audit timeline 3 events → data map shows 0 rows PII

---

**✅ Verify results:**

**1. Thứ tự code trong `hardDeletePersonalData()`**
```
Line 98-100: deleteUserProfile → deleteUserRoles → deleteUser
Line 106:    writeAudit("ERASURE_PII_DELETED")
Line 110:    writeAudit("ERASURE_COMPLETED")
```
DELETE chạy trước audit write trong code order — nhưng không thành vấn đề vì toàn bộ method là `@Transactional`. 3 DELETE + 2 INSERT audit chạy trong cùng 1 transaction, observer bên ngoài không thấy gì cho đến khi COMMIT. Nếu bất kỳ statement nào fail → rollback hết, không có scenario "user đã bị xóa nhưng thiếu audit log". Thứ tự hiện tại **ổn, không cần đổi**.

**2. Thứ tự 2-phase erasure trong controller**
`pseudonymizeFinancialData()` → `hardDeletePersonalData()` — đúng spec. ✅

---

**⚠️ Known edge case — silent details_json loss (acceptable)**

`writeAudit()` có try-catch swallow ObjectMapper errors (line 132–135):
```java
try {
    entity.setDetailsJson(objectMapper.writeValueAsString(...));
} catch (Exception ex) {
    log.warn("Failed to serialize GDPR audit details...");
    entity.setDetailsJson("{}");  // mất nội dung, nhưng INSERT vẫn chạy
}
```

Hệ quả: nếu serialize fail → `details_json = "{}"` nhưng transaction vẫn commit → DELETEs persist. `event_type` + `subject_token` + `timestamp` vẫn được ghi → không vi phạm GDPR Art. 30 (recording obligation). Chỉ mất `details` (bảng nào bị xóa, bao nhiêu rows) — acceptable cho portfolio scope, production thật nên escalate thành error thay vì warn.

### Phase 3 — Employee self-service ✅ DONE (11 files mới + seed data)

**Backend**
- [x] `UserPrivacyController.java` — 5 endpoints `/api/v1/user/privacy/*` + `/data-export`, auth từ `JwtAuthFilter`
- [x] `DataExportService.java` — ZIP gồm `manifest.json` + `profile.json` + `expenses.json` + `consents.json` + `gdpr_audit_log.json`. Tự ghi `DATA_EXPORTED` audit.
- [x] `UserConsentEntity` + `UserConsentMapper` + `UserConsentRepository` — JOIN với `policies` table
- [x] `UserConsentDto` + `CreateErasureRequestDto`
- [x] Logic: reject duplicate active request (1 active request tại 1 thời điểm — GDPR best practice)

**BFF**
- [x] 5 endpoints `emp-008` → `emp-012`. ZIP endpoint dùng `axios responseType: 'stream'` + `pipe(res)` — không buffer file trong RAM ✓

**Frontend**
- [x] `/profile/privacy` route + `PrivacyCenterView` — 4 sections: status banner, data inventory, consent history, erasure form
- [x] `privacyApi.ts` — RTK Query slice riêng. Download dùng `fetch + blob` (bypass RTK — đúng với binary stream)
- [x] `store.ts` — register `privacyApi` reducer + middleware
- [x] `SettingsView.tsx` — thêm link card "Privacy & Data" trong Security tab

**Schema / seed**
- [x] 3 consent rows cho Anna (ToS + Privacy Policy + AI Data Processing) — demo consent history

**Demo flow:** Settings → Security → Privacy & Data → `/profile/privacy` → banner PENDING + data inventory 6 bảng + consent history 3 dòng + download ZIP → admin audit log thêm `DATA_EXPORTED`

---

**✅ Verify: BFF stream pattern đúng**
`emp-012` dùng `pipe(res)` thay vì buffer — quan trọng vì ZIP export của user có thể lớn nếu nhiều expenses. Buffer trong RAM của BFF sẽ tạo memory spike, stream giải quyết sạch.

**✅ Verify: Banner text — 3 elements đầy đủ**
1. *"deletion request is being processed"* — confirm action nhận
2. *"within 30 days per GDPR Art. 12"* — link gdpr-info.eu (German-hosted, reference chuẩn ngành). **Art. 12** đúng chỗ: governing response deadline, không phải Art. 17 (right to erasure — là quyền của user, không phải obligation của controller)
3. *"form is hidden until your current request is resolved (one active request at a time)"* — explicit UX, không phải bug

Overdue text: *"Overdue by X day(s) — our compliance team has been alerted."* — regulated software pattern: user biết có người chịu trách nhiệm, không cần biết implementation detail.

### Phase 4 — Finance integration ✅ DONE (8 files mới + 2 schema updates)

**Backend**
- [x] `FinanceGdprController.java` — 2 endpoints `/api/v1/finance/gdpr/*`, `FINANCE_VIEW` permission check
- [x] `GdprService.confirmFinanceGobd()` — ghi `FINANCE_GOBD_CONFIRMED` vào audit log
- [x] `GdprAuditLogMapper` — `findPendingFinanceConfirmations()` dùng `NOT EXISTS` để tìm pseudo events chưa confirmed — idempotency guard
- [x] `ExpenseResponseDto` — thêm `paidAt` + `retentionExpiresAt` cho FE render badge
- [x] `gdpr_audit_log.event_type` ENUM thêm `FINANCE_GOBD_CONFIRMED`

**BFF**
- [x] `fin-006` (GET pending) + `fin-007` (PUT confirm)

**Frontend**
- [x] `financeGdprApi.ts` — RTK slice, register vào store
- [x] `check-view.tsx` — 4 sub-components: `RetentionBadge`, `GoBDConfirmationBanner`, `PaidRow`, `PendingConfirmationsModal`

**RetentionBadge logic:**
```
null (chưa PAID)              → dash —
retentionExpiresAt > today    → 🟡 UNDER RETENTION, tooltip "GoBD §14 — until YYYY-MM-DD"
retentionExpiresAt <= today   → 🟢 EXPIRED, tooltip "eligible for hard deletion"
```

**GoBDConfirmationBanner:** explicit separation of duties text — *"accounting integrity is Finance's responsibility"*. Chỉ hiện khi `pendingConfirmations.length > 0`.

**Demo seed:**
- Anna's DB Bahn ticket (paid 2026-04-15) → amber badge, retention until 2036-04-15
- Legacy office supplies (paid 2014-03-20) → green badge, expired 2024-03-20
- Pre-processed erasure → banner hiện ngay count = 1

---

**✅ Điểm đáng chú ý: `NOT EXISTS` idempotency guard**
`findPendingFinanceConfirmations()` query tìm `ERASURE_FINANCIAL_PSEUDONYMIZED` events mà `NOT EXISTS` một `FINANCE_GOBD_CONFIRMED` event cùng `subject_token`. Nghĩa là: confirm 2 lần không tạo duplicate confirmation, không throw error — chỉ trả về empty list. Đây là pattern đúng cho audit-trail system: append-only log + idempotent read.

---

## GDPR Feature — End-to-end summary ✅ COMPLETE

**Cross-phase audit trail cho 1 erasure request:**
```
ERASURE_REQUESTED          ← Phase 3: Anna submit từ /profile/privacy
ERASURE_FINANCIAL_PSEUDONYMIZED  ← Phase 2: Admin process → pseudonymize expenses
ERASURE_PII_DELETED        ← Phase 2: hard delete users/profiles/roles
ERASURE_COMPLETED          ← Phase 2: workflow done
FINANCE_GOBD_CONFIRMED     ← Phase 4: Sarah Chen sign-off trong /finance/check
```

5 events, 3 actors (Employee → Admin → Finance), 4 phases, 1 subject_token liên kết xuyên suốt.

**Tổng files tạo mới:** ~37 files (backend + BFF + frontend) + 6 schema changes
**Tổng phases:** 4 — Foundation → Admin → Employee → Finance
**German compliance covered:** GDPR Art. 12 (30-day response), Art. 17 (erasure), Art. 20 (portability/ZIP export), Art. 30 (audit log), GoBD §14 (10-year retention)

---

## 11. Liên kết với các trang Wiki khác

- [Architecture.md] — C4 diagram có Auth0/Cognito là external system xử lý identity
- [GoBD-Notes.md] — Chi tiết về 10-year retention và MinIO WORM storage
- [API-Reference.md] — Full endpoint list bao gồm GDPR endpoints
- [Tax-Export.md] — DATEV export không chứa PII trực tiếp (chỉ Kostenstelle, Konto)