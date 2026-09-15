# GoBD Notes

**Grundsätze zur ordnungsmäßigen Führung und Aufbewahrung von Büchern** —
German Federal Ministry of Finance guidelines for digital bookkeeping and record retention.
BMF-Schreiben 28/11/2019, updated 03/2024 and 07/2025.

> GoBD is not a law itself — it is the BMF's binding interpretation of how existing laws
> (§147 AO, §257 HGB) apply to digital accounting systems. Non-compliance exposes a company
> to Betriebsprüfung findings and potential tax re-assessments.

---

## 1. Three core obligations

### 1.1. Aufbewahrungspflicht — Mandatory retention (10 years)

Every **Buchungsbeleg** (accounting document) must be retained for a minimum period
from the end of the fiscal year in which it was created.

> **Important — BEG IV update (effective 1 Jan 2025):**
> The Fourth Bürokratieentlastungsgesetz (BEG IV, Oct 2024) reduced the retention
> period for Buchungsbelege (receipts, invoices, cost documents) from **10 to 8 years**
> (§147 Abs. 1 Nr. 4 AO, §257 Abs. 1 Nr. 4 HGB). Handelsbücher, Jahresabschlüsse, and
> Inventare remain at 10 years. Exception: companies under BaFin supervision retain
> Buchungsbelege for 10 years until 2026.

| Record type | Retention period | Legal basis | In this system |
|-------------|-----------------|------------|----------------|
| Receipt images (Buchungsbelege) | **8 years** from year-end | §147 AO / §257 HGB (BEG IV) | MinIO storage |
| Expense records (amount, VAT, dates) | **8 years** from year-end | §147 AO | `expenses` table |
| DATEV CSV exports | **8 years** | §147 AO | Finance downloads locally |
| Handelsbücher, Jahresabschlüsse | **10 years** | §257 HGB | Not in scope |
| `policy_evaluation_history` | **8 years** (audit evidence) | GoBD | DB table |
| `user_profiles`, `users` | Erasable under DSGVO | GDPR Art. 17 | Hard deleted on erasure |

> **Codebase note:** `retention_expires_at = DATE_ADD(CURDATE(), INTERVAL 10 YEAR)` uses
> 10 years intentionally — a conservative retention policy that exceeds the 8-year
> BEG IV minimum. Retaining longer than required is always compliant; deleting earlier
> than required is not. Many German companies keep 10 years across all document types
> to avoid per-document classification overhead.

The 10-year clock starts at **payment date** (`paid_at`), not creation date — because the
fiscal year of the Buchungsbeleg is determined by when it was booked, not when the
expense was submitted.

### 1.2. Unveränderbarkeit — Immutability

Once a Buchungsbeleg is stored, it must not be modified. GoBD §14 requires:

- Original document preserved as-is
- Any correction must be a new document (Stornobuchung), not an edit
- Audit trail of who created/accessed the document

In this system:
- `policy_evaluation_history` is append-only — never UPDATEd after INSERT
- `gdpr_audit_log` is append-only — compliance evidence
- Receipt images in MinIO: versioning + object lock planned (see §4 below)
- `expenses` rows: status transitions are additive field updates, never row replacements

### 1.3. Maschinelle Auswertbarkeit — Machine readability

The Finanzamt (tax authority) has the right to access accounting data during a
**Betriebsprüfung** (tax audit) in a readable, processable format.

Three access levels defined in GoBD:
- **Z1** — Direct access: auditor reads data in the system directly
- **Z2** — Indirect access: company provides reports on request
- **Z3** — Data carrier handover: export file given to auditor

This system supports **Z3** via DATEV CSV export — the format tax authorities and
Steuerberater (tax advisors) expect. See [Tax export](/wiki/tax-export) for column mapping.

---

## 2. How this project implements GoBD

### 2.1. retention_expires_at — computed atomically in SQL

The 10-year retention window is tracked via `expenses.retention_expires_at`:

```sql
-- markBatchPaid in ExpenseMapper.xml
UPDATE expenses
SET status               = 'PAID',
    paid_at              = NOW(),
    retention_expires_at = DATE_ADD(CURDATE(), INTERVAL 10 YEAR)
WHERE id IN (...)
  AND status = 'APPROVED'
```

**Three design decisions in this one statement:**

1. **`DATE_ADD(CURDATE(), INTERVAL 10 YEAR)` in SQL, not Java** — eliminates JVM/DB
   clock drift. If Java computed the date and passed it as a parameter, a timezone
   misconfiguration or clock skew between app server and DB server could produce a
   wrong retention date. SQL computes it at commit time on the DB server itself.

2. **Atomic with `paid_at`** — both fields are SET in the same UPDATE. There is no
   window where `paid_at` exists but `retention_expires_at` is NULL — which would
   mean GoBD retention status is unknown for that expense.

3. **`AND status = 'APPROVED'` guard** — idempotent. Double-pay attempts match 0 rows;
   retention_expires_at is never accidentally overwritten on already-PAID rows.

### 2.2. GDPR erasure — pseudonymization, not deletion

When an employee invokes their DSGVO Art. 17 right to erasure, expense rows cannot be
deleted because of GoBD. The resolution is **pseudonymization**:

```
Before erasure:
  expenses.user_sub = "auth0|69db9135b65ad959bd52d81e"

After pseudonymization:
  expenses.user_sub = "DELETED-a3f8c2d1e4b7..."  ← SHA-256 hash, non-reversible
```

The financial numbers (`amount`, `vat_amount`, `paid_at`, etc.) are preserved intact.
The personal identity is cryptographically severed. The row survives the 10-year window
as required by GoBD, while DSGVO erasure is satisfied for the PII fields.

Full erasure workflow → [GDPR / DSGVO](/wiki/gdpr-compliance)

### 2.3. Finance GoBD sign-off — separation of duties

After Admin pseudonymizes an employee's expense records, Finance must explicitly confirm
the action was GoBD-compliant before the workflow closes:

```
Admin:   pseudonymizeFinancialData()  → ERASURE_FINANCIAL_PSEUDONYMIZED event
Finance: confirmFinanceGobd()         → FINANCE_GOBD_CONFIRMED event
```

This is the **Vier-Augen-Prinzip** applied to accounting record modification —
no single person can alter financial records without a second party's sign-off.
Finance is accountable for the integrity of the accounting data, not Admin.

### 2.4. Retention badge in /finance/check

`/finance/check` surfaces the retention status of each PAID expense:

| Badge | Condition | Meaning |
|-------|-----------|---------|
| 🟡 **UNDER RETENTION** | `retention_expires_at > TODAY` | GoBD window active — must not delete |
| 🟢 **EXPIRED** | `retention_expires_at <= TODAY` | Eligible for full deletion |
| — (dash) | `retention_expires_at IS NULL` | Not yet PAID — no retention started |

Finance can identify expenses approaching or past their retention window without
leaving the payment workflow.

---

## 3. Buchungsbeleg — what counts as an accounting document

GoBD defines a Buchungsbeleg as any document that is the basis for a Buchungssatz
(accounting entry). In this system:

| Document | GoBD Buchungsbeleg? | Stored where |
|----------|--------------------|-----------  |
| Receipt image (photo of Kassenbon) | ✅ Yes | MinIO object storage |
| Expense record (amount, VAT, date) | ✅ Yes | `expenses` table |
| DATEV CSV export | ✅ Yes (if used as booking basis) | Finance downloads locally |
| Per-diem calculation | ✅ Yes | `expenses` table (perDiemDays × rate) |
| Mileage record | ✅ Yes | `expenses` table (distanceKm × rate) |
| AI-extracted OCR data | ⚠️ Supporting only | `expenses.ai_extracted_data` JSON |
| Policy evaluation snapshot | ⚠️ Audit trail only | `policy_evaluation_history` |

> **Receipt image note:** GoBD requires the receipt to be stored in its **original form**.
> If the original is paper, the scan must faithfully reproduce it (no cropping, no
> brightness adjustment that obscures content). The OCR-extracted data is a derivative —
> the image is the Beleg, not the extracted JSON.

---

## 4. MinIO storage — WORM compliance (planned)

GoBD's Unveränderbarkeit requirement for receipt images means the storage layer must
prevent modification after upload. Current state vs target:

| Feature | Current state | Target (production) |
|---------|--------------|---------------------|
| Object versioning | Not configured | Enable S3 versioning |
| Object lock (WORM) | Not configured | Enable with Compliance mode |
| Retention period | Not enforced at storage layer | Lock objects for 10 years |
| Deletion prevention | Not enforced | Object lock prevents delete until expiry |

**Why not implemented yet:** Docker Compose MinIO is a local dev instance. Object lock
configuration requires MinIO to start with `--console-address` and lock enabled at
bucket creation — a deployment concern, not a code concern. In production on AWS S3 or
MinIO production cluster, enabling S3 Object Lock with Compliance mode and a
3,653-day (10 years) retention satisfies GoBD Unveränderbarkeit for receipts.

> **Note on GoBD receipt redaction:** If an employee's name/email is visible on a
> receipt and GoBD requires keeping the image while DSGVO requires removing the PII,
> the correct approach is **redaction** (black-out the identifying region), not deletion.
> The financial content of the Beleg is preserved; the PII is masked. This is a
> post-processing step not yet implemented — documented as a known TODO.

---

## 5. Verfahrensdokumentation — process documentation

GoBD §14 also requires a **Verfahrensdokumentation** (process description) explaining
how the digital accounting system works, who has access, and how data integrity is
maintained. This wiki serves that purpose for the portfolio context.

Required elements and where they are documented:

| GoBD requirement | Covered by |
|-----------------|-----------|
| System description | [Architecture](/wiki/architecture) — C4 model, container diagram |
| Data flow | [Expense lifecycle](/wiki/expense-lifecycle) — state machine, sequence diagrams |
| Access control | [Admin & management](/wiki/admin-management) — roles, permissions |
| Retention periods | This document, §2 and §3 |
| GDPR intersection | [GDPR / DSGVO](/wiki/gdpr-compliance) |
| Audit trail | `gdpr_audit_log` table, `policy_evaluation_history` table |
| Export formats | [Tax export](/wiki/tax-export) — DATEV, SEPA, XRechnung |

---

## 6. Legal basis

| Law | Scope | Retention period |
|-----|-------|-----------------|
| **§147 AO** (Abgabenordnung) | Buchungsbelege, Rechnungen, Kostenbelege | **8 years** (since 1 Jan 2025, BEG IV) |
| **§147 AO** (Abgabenordnung) | Bücher, Aufzeichnungen, Jahresabschlüsse | **10 years** |
| **§257 HGB** (Handelsgesetzbuch) | Buchungsbelege (Kaufleute) | **8 years** (since 1 Jan 2025, BEG IV) |
| **§257 HGB** (Handelsgesetzbuch) | Handelsbücher, Inventare, Bilanzen | **10 years** |
| **GoBD** (BMF-Schreiben 28/11/2019) | Digital implementation of §147 AO / §257 HGB | — |
| **§9 Abs. 4a EStG** | Per-diem rates (Verpflegungsmehraufwand) | — |
| **§9 Abs. 1 Nr. 4a EStG** | Kilometerpauschale für Dienstreisen | — |

> GoBD was last updated **July 2025** with clarifications on E-Rechnung (XRechnung/ZUGFeRD)
> handling — structured invoice data (XML) may now substitute for image-based storage
> where the XML is the original document. This affects XRechnung export: if XRechnung
> is the **original invoice**, it must be retained in XML form, not just as a PDF render.

---

## Related

- [GDPR / DSGVO](/wiki/gdpr-compliance) — how DSGVO erasure interacts with GoBD retention
- [Finance workflows](/wiki/finance-workflows) — `markPaid` SQL, retention badge, batch pay
- [Tax export](/wiki/tax-export) — DATEV CSV column mapping, XRechnung structure
- [Architecture](/wiki/architecture) — where MinIO fits in the storage layer