# Expense Lifecycle

Detailed business flow of expense creation, approval, and payment in the FintechSaaS platform.
All field names, endpoints, SQL fragments, and constants documented below are quoted from the codebase as-is.

---

## 1. State Machine

The `expenses` table uses a 5-state ENUM defined in [db_fix.sql](../db_fix.sql):

```
DRAFT  →  PENDING_REVIEW  →  APPROVED  →  PAID
                          ↘  REJECTED
```

Each transition updates a specific set of columns via [ExpenseMapper.xml](../backend/src/main/resources/mapper/ExpenseMapper.xml).

### Transition table

| From | To | Trigger | Mapper statement | Columns SET |
|------|------|---------|-----------------|--------------|
| — | `DRAFT` | Employee creates expense | `insert` | `user_sub`, `type`, `title`, `amount`, `currency`, `status='DRAFT'`, type-specific fields, `created_by` |
| `DRAFT` | `PENDING_REVIEW` | Employee submits | `updateStatus` | `status`, `submitted_at`, `updated_at = CURRENT_TIMESTAMP` |
| `PENDING_REVIEW` | `APPROVED` | Manager approves | `updateReview` | `status='APPROVED'`, `reviewed_by`, `reviewed_at`, `rejection_reason = NULL`, `updated_at` |
| `PENDING_REVIEW` | `REJECTED` | Manager rejects | `updateReview` | `status='REJECTED'`, `reviewed_by`, `reviewed_at`, `rejection_reason`, `updated_at` |
| `APPROVED` | `PAID` | Finance marks paid | `markPaid` / `markBatchPaid` | `status='PAID'`, `paid_at = NOW()`, `retention_expires_at = DATE_ADD(CURDATE(), INTERVAL 10 YEAR)` |

### Retention deadline

`retention_expires_at` is **populated atomically together with `paid_at`** in the same SQL statement — no separate Java clock, no backfill needed. The 10-year window enforces **GoBD §14** (German accounting record retention obligation for Buchungsbelege).

### Status guard

Both `markPaid` and `markBatchPaid` include `AND status = 'APPROVED'` in the WHERE clause — accidental double-payment or paying non-approved rows is impossible at the SQL layer.

### Schema reference

Defined in [db_fix.sql](../db_fix.sql):

```sql
status ENUM('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'PAID') DEFAULT 'DRAFT'

submitted_at TIMESTAMP NULL
reviewed_at  TIMESTAMP NULL
reviewed_by  VARCHAR(36) NULL
rejection_reason TEXT
paid_at      TIMESTAMP NULL
retention_expires_at DATE NULL

INDEX idx_exp_user_status (user_sub, status)
INDEX idx_exp_retention (retention_expires_at)
```

`user_sub` is `VARCHAR(80)` and has **no FK to `users`** — this is intentional, to allow GDPR pseudonymization (`user_sub → 'DELETED-<sha256>'`) while preserving the row for GoBD retention. See [GDPR-Compliance.md](../document/wiki/GDPR-Compliance.md).

---

## 2. Receipt Upload Flow (RECEIPT type only)

Receipt images never pass through the backend server. The browser uploads directly to MinIO using a short-lived presigned PUT URL.

### Step-by-step

```
[Browser]                  [BFF]                  [Java API]                [MinIO]
   |                         |                       |                        |
   | GET /emp-001            |                       |                        |
   | ?filename=receipt.jpg   |                       |                        |
   |────────────────────────▶|                       |                        |
   |                         | GET /api/v1/expenses  |                        |
   |                         |   /upload-url         |                        |
   |                         |──────────────────────▶|                        |
   |                         |                       | generateUploadUrl()    |
   |                         |                       |───────────────────────▶|
   |                         |                       |  presigned PUT URL     |
   |                         |                       |◀───────────────────────|
   |                         | { uploadUrl, fileUrl }|                        |
   |                         |◀──────────────────────|                        |
   | { uploadUrl, fileUrl }  |                       |                        |
   |◀────────────────────────|                       |                        |
   |                                                                          |
   | PUT <uploadUrl>  (binary image bytes — direct to MinIO, bypassing server)|
   |─────────────────────────────────────────────────────────────────────────▶|
   |                                                                  201 OK  |
   |◀─────────────────────────────────────────────────────────────────────────|
   |                                                                          |
   | POST /emp-002           |                       |                        |
   | { fileUrl }             |                       |                        |
   |────────────────────────▶|                       |                        |
   |                         | POST /api/v1/expenses |                        |
   |                         |   /scan { fileUrl }   |                        |
   |                         |──────────────────────▶|                        |
   |                         |                       | generateViewUrl()      |
   |                         |                       |   (1-hour presigned GET|
   |                         |                       |   for Groq to fetch)   |
   |                         |                       | groqClient             |
   |                         |                       |   .chatWithVision(...) |
   |                         |                       |◀── OCR result          |
   |                         | ScanResponseDto       |                        |
   |                         |◀──────────────────────|                        |
   | OCR result for review   |                       |                        |
   |◀────────────────────────|                       |                        |
```

### Endpoint reference

| Layer | Path | Method | Purpose |
|-------|------|--------|---------|
| BFF | `/emp-001?filename=<name>` | GET | Obtain presigned PUT URL + final file URL |
| BFF | `/emp-002` | POST | Trigger OCR scan, body `{ fileUrl }` |
| BFF | `/emp-007?fileUrl=<url>` | GET | Obtain presigned GET URL for viewing |
| Java | `/api/v1/expenses/upload-url?filename=<name>` | GET | StorageService presigns PUT |
| Java | `/api/v1/expenses/scan` | POST | ExpenseService.scan() — calls Groq Vision |
| Java | `/api/v1/expenses/view-url?fileUrl=<url>` | GET | StorageService presigns GET (1h TTL) |

### StorageService behavior

[StorageService.java](../backend/src/main/java/com/example/my_java_app/service/StorageService.java):

- **`generateUploadUrl(filename)`** — returns `{ uploadUrl, fileUrl }`. Key format: `UUID + originalExtension`. Presigned PUT duration: **15 minutes**.
- **`generateViewUrl(fileUrl)`** — returns presigned GET URL. Duration: **1 hour**. Extracts key from stored fileUrl.

### Storage of `receipt_file_url`

After successful PUT, the browser keeps `fileUrl` locally and submits it as part of the `CreateExpenseRequestDto` when the user finalizes the expense. It is then persisted into the `receipt_file_url` column (`VARCHAR(500)`) via the standard `insert` statement.

### OCR — Groq Vision

[ExpenseService.scan()](../backend/src/main/java/com/example/my_java_app/service/ExpenseService.java) constructs this prompt:

```
You are a receipt OCR assistant. Extract the following fields from the receipt image.
Respond ONLY with a single valid JSON object — no markdown, no explanation, no extra text.

{
  "vendor": "<store or merchant name>",
  "date": "<date in YYYY-MM-DD format, use today if not visible>",
  "amount": <total amount as decimal number>,
  "vatAmount": <VAT amount as decimal number, 0 if not shown>,
  "vatRate": "<VAT rate string e.g. '19%', 'N/A' if unknown>",
  "flags": ["<optional warnings like high amount, suspicious vendor, etc>"]
}
```

The 1-hour presigned GET URL from `generateViewUrl()` is what the Groq API actually fetches (Groq cannot read MinIO objects directly without a public URL).

**Returned to frontend** (`ScanResponseDto`):
- `vendor` — String
- `date` — String (YYYY-MM-DD, defaults to today if not extractable)
- `amount` — `BigDecimal`
- `vatAmount` — `BigDecimal` (0 if missing)
- `vatRate` — String (`"19%"`, `"7%"`, or `"N/A"`)
- `flags` — `List<String>` (e.g. `["high_amount"]`)

**Fallback** — if Groq is unreachable or returns invalid JSON, `mockScan()` returns:
```java
new ScanResponseDto("REWE GmbH", today, 47.80, 7.63, "19%", List.of())
```
The frontend cannot distinguish between real OCR and the fallback; this is intentional so demos work offline.

---

## 3. Expense Creation — three types

All three types share the same `CreateExpenseRequestDto` flow but use different form fields, validation, and amount calculation. The `type` field discriminates which fields are read.

### 3.1 RECEIPT

Form view: [scan-view.tsx](../frontend/components/expenses/scan-view.tsx)

| Field | Source |
|-------|--------|
| `vendorName` | OCR `vendor` (editable) |
| `receiptDate` | OCR `date` (editable, falls back to today) |
| `amount` | OCR `amount` (editable) |
| `vatAmount` | OCR `vatAmount` (editable) |
| `category` | Dropdown from hardcoded `CATEGORIES` array |
| `receiptFileUrl` | URL returned by `/emp-001` after MinIO PUT |
| `aiExtractedData` | Full OCR JSON, serialized |
| `aiFlags` | OCR `flags` array, serialized |

**No client-side total calculation** — the OCR-extracted `amount` is the total. `vatAmount` is the VAT *component* of that total (not added on top). This matches how German receipts itemize VAT.

**German VAT context:**
- Standard rate: 19% (most goods/services)
- Reduced rate: 7% (food, books, accommodation)
- The OCR prompt explicitly asks for the rate as a string so the frontend can display "19%" rather than re-derive it from amount/vatAmount division (which is fragile for rounded receipts).

### 3.2 PER_DIEM

Form view: [per-diem-view.tsx](../frontend/components/expenses/per-diem-view.tsx)

| Field | Source |
|-------|--------|
| `title` | Optional, free text |
| `tripFrom` | Date picker |
| `tripTo` | Date picker |
| `countryCode` | Dropdown — keys of the `PER_DIEM_RATES` map |
| `perDiemRate` | Looked up from `PER_DIEM_RATES[countryCode].rate` |
| `perDiemDays` | Computed: `Math.round((tripTo - tripFrom) / 86_400_000) + 1` (inclusive both endpoints) |
| `amount` | `perDiemRate × perDiemDays` |

**Rate table (frontend constant):**

```typescript
const PER_DIEM_RATES = {
  DE:    { rate: 28,   currencySymbol: "€" },
  AT:    { rate: 26.4, currencySymbol: "€" },
  CH:    { rate: 65,   currencySymbol: "CHF" },
  GB:    { rate: 45,   currencySymbol: "£" },
  US:    { rate: 55,   currencySymbol: "$" },
  OTHER: { rate: 48,   currencySymbol: "$" },
};
```

**German compliance context:** Per diem (Verpflegungsmehraufwand) rates are governed by **§9 Abs. 4a EStG** for travel within Germany and by the **Bundesministerium der Finanzen Reisekostentabelle** for international travel. The codebase rates approximate the BMF table (e.g. DE = 28 € matches the German full-day rate at the time of authoring).

### 3.3 MILEAGE

Form view: [mileage-view.tsx](../frontend/components/expenses/mileage-view.tsx)

| Field | Source |
|-------|--------|
| `title` | Optional, free text |
| `from`, `to` | City names (text inputs, not stored in DB — used for AI insight context only) |
| `receiptDate` | Date picker (re-used `receipt_date` column for trip date) |
| `distanceKm` | Numeric input |
| `ratePerKm` | Constant `RATE_PER_KM = 0.3` |
| `amount` | `distanceKm × 0.3` |

**Frontend constants:**

```typescript
const RATE_PER_KM            = 0.3;   // €/km
const DAILY_LIMIT_KM         = 200;   // blocks save if exceeded
const EFFICIENCY_THRESHOLD_KM = 150;
const COMMUTE_THRESHOLD_KM    = 30;
```

**German compliance context:** €0.30/km is the **Kilometerpauschale** for car travel set by **§9 Abs. 1 Nr. 4a EStG**. The 200 km daily limit is a project-internal policy rule (not legal) used by the compliance evaluation. Trips under 30 km are flagged as *possible_commute* (commute is not reimbursable under EStG).

The `from` and `to` city fields are intentionally not persisted to the `expenses` table — they are only sent as context for the AI policy insight call. Trip detail is summarized in the auto-generated `title` when one isn't provided: `"Mileage <from> → <to>"`.

---

## 4. Policy Compliance Evaluation

At create time, the form evaluates a set of CMS-driven rules and saves an **immutable snapshot** of the result alongside the expense. The snapshot is what the detail view reads back later — not the live rules.

### CMS source

Rules live in the `screen_configs` table, keyed by `screen_key`:

| screen_key | Used by |
|---|---|
| `expense.create.receipt` | scan-view |
| `expense.create.per_diem` | per-diem-view |
| `expense.create.mileage` | mileage-view |
| `manager.approvals.detail` | manager approval detail view |

Each row contains a JSON `compliance` array. Each item has:

```json
{
  "id": "currency_mismatch",
  "icon": "currency_exchange",
  "title_key": "expense.policy.receipt.currency_mismatch.title",
  "pending_desc_key":   "expense.policy.receipt.currency_mismatch.pending",
  "ok_desc_key":        "expense.policy.receipt.currency_mismatch.ok",
  "triggered_desc_key": "expense.policy.receipt.currency_mismatch.triggered",
  "severity": "error",
  "blocks_save": true,
  "condition": "currency_mismatch"
}
```

### Severity → behavior

| Severity | Save blocked? | Visual |
|---|---|---|
| `error` | yes (if `blocks_save: true`) | red icon, blocks Submit button |
| `warning` | no | amber icon |
| `info` | no | blue icon |
| `success` | no | green icon |

Severity and `blocks_save` are independent — an `error`-severity rule with `blocks_save: false` is just a strong visual warning that still allows saving.

### Snapshot persistence

[ExpenseService.savePolicySnapshotIfPresent()](../backend/src/main/java/com/example/my_java_app/service/ExpenseService.java) writes one row to `policy_evaluation_history` per expense create:

```sql
INSERT INTO policy_evaluation_history (
  domain,        -- 'EXPENSE'
  entity_type,   -- 'EXPENSE'
  entity_id,     -- expense.id
  event_type,    -- 'CREATE'
  screen_key,    -- 'expense.create.receipt' | '...per_diem' | '...mileage'
  screen_version,-- active version from screen_configs (nullable)
  result_json,   -- JSON array of PolicyEvaluationItemDto (severity, state, resolvedTitle, resolvedDesc, ...)
  input_json,    -- form snapshot (vendor, amount, dates, etc.) — used to reproduce evaluation context
  created_by     -- employee's cognito_sub
);
```

### Why immutable

The snapshot is **never updated** after the `CREATE` event. The detail view ([expense-detail-view.tsx](../frontend/components/expenses/expense-detail-view.tsx)) reads via `findCreatePolicySnapshot()` which selects the latest row for a given `entity_id` and `event_type='CREATE'`.

This matters because:

1. **Resolved i18n text is stored alongside the keys.** If a translation file changes or a rule's `triggered_desc_key` is renamed in CMS, the detail view of a *historical* expense still shows the exact text the employee saw at create time.
2. **Screen version is captured.** When `screen_configs` is updated (new severity threshold, new rule), older expenses keep displaying their original evaluation — no retroactive re-classification.
3. **Compliance evidence.** Auditors can trace what rules were active and what they evaluated to, on the day a specific expense was approved.

If serialization fails the failure is logged as a warning and the expense itself still saves — the snapshot is best-effort, not part of the expense transaction's success criterion. The same `policy_evaluation_history.created_by` is set to NULL during GDPR erasure (see [GDPR-Compliance.md §3.2](../document/wiki/GDPR-Compliance.md)).

---

## 5. Manager Approval Flow

### Queue retrieval

**Frontend**: [approvals-view.tsx](../frontend/components/manager/approvals-view.tsx) calls `useGetManagerQueueQuery()`.

**BFF → Java**: `GET /api/v1/manager/expenses` → [ManagerController.getPending()](../backend/src/main/java/com/example/my_java_app/controller/ManagerController.java) → `managerService.getPending()` → `expenseRepository.findPendingForManager()`.

**SQL** (from [ExpenseMapper.xml](../backend/src/main/resources/mapper/ExpenseMapper.xml)):

```sql
SELECT * FROM expenses
WHERE status = 'PENDING_REVIEW'
  AND is_deleted = 0
ORDER BY submitted_at ASC
```

The queue is **global** (not filtered by manager team membership). Permissions are enforced at the action level, not the read level — any user with `EXPENSE_APPROVE` or `EXPENSE_REJECT` permission can see the queue.

### Approve action

**Endpoint**: `PUT /api/v1/manager/expenses/{id}/approve`

[ManagerController.approve()](../backend/src/main/java/com/example/my_java_app/controller/ManagerController.java):

```java
String managerSub = (String) request.getAttribute("cognitoSub");
if (!permissionService.hasPermission(managerSub, "EXPENSE_APPROVE")) {
  throw new ForbiddenException("Missing permission: EXPENSE_APPROVE");
}
managerService.approve(id, managerSub);
```

[ManagerService.approve()](../backend/src/main/java/com/example/my_java_app/service/ManagerService.java) calls `expenseRepository.updateReview(id, "APPROVED", managerSub, now, null)` which runs the `updateReview` SQL.

**Columns set on approve:**

| Column | Value |
|---|---|
| `status` | `'APPROVED'` |
| `reviewed_by` | manager's cognito_sub |
| `reviewed_at` | `LocalDateTime.now()` formatted as `yyyy-MM-dd'T'HH:mm:ss` |
| `rejection_reason` | `NULL` (explicitly cleared) |
| `updated_at` | `CURRENT_TIMESTAMP` (auto) |

**AI insight on approve** — no AI generation is triggered server-side when approving. The only AI surface in the approval flow is:

- The pre-existing `ai_flags` (set at create time by Groq Vision OCR) is rendered as a static warning chip in [approval-detail-view.tsx](../frontend/components/manager/approval-detail-view.tsx).
- The policy_evaluation_history snapshot from create time is replayed as the "Editorial Insight" section.

No `groqClient` calls happen during approval.

### Reject action

**Endpoint**: `PUT /api/v1/manager/expenses/{id}/reject`
**Body**: `{ "rejectionReason": "<text>" }` (`ReviewExpenseRequestDto`)

The reason is required — the frontend reject modal validates `reason.trim()` before enabling the submit button. A blank or whitespace-only reason cannot be submitted through the UI.

**Columns set on reject:**

| Column | Value |
|---|---|
| `status` | `'REJECTED'` |
| `reviewed_by` | manager's cognito_sub |
| `reviewed_at` | timestamp |
| `rejection_reason` | the text from the modal |
| `updated_at` | `CURRENT_TIMESTAMP` (auto) |

After a reject, the expense is terminal — there is no transition back to `DRAFT`. If the employee wants to fix and resubmit, they create a new expense. This is by design (audit trail clarity), not a limitation.

### Permission model

`EXPENSE_APPROVE` and `EXPENSE_REJECT` are **separate granular permissions** (`user_permissions` table). They are not bundled with the MANAGER role automatically — they are granted explicitly. This allows splitting duties (e.g. a senior employee can approve but not reject).

Both permissions check happens server-side via `permissionService.hasPermission(sub, code)`. Client-side `hasPermission()` checks in the frontend are UX gating only — the backend remains the source of truth.

---

## Cross-references

- Finance batch payment (APPROVED → PAID transition): [BUSINESS.md §4.3.4](../document/BUSINESS.md)
- GDPR pseudonymization affecting `user_sub` and `policy_evaluation_history.created_by`: [GDPR-Compliance.md](../document/wiki/GDPR-Compliance.md)
- DATEV / SEPA / XRechnung export format: [BUSINESS.md §4.3.5](../document/BUSINESS.md)
