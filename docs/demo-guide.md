# Demo Guide

How to explore the platform end-to-end using the five seeded demo accounts.

## Before you start

```bash
git clone https://github.com/{user}/{repo}.git
cd {repo}
cp .env.example .env        # no secrets needed — demo uses seeded data
npm run docker:up
# → http://localhost:8080
```

All demo users are **one-click login** on `/auth/login` — no signup, no password needed.

> **Note on `cognito_sub`:** Auth0 issues a `sub` claim in the JWT (`auth0|<hex24>`). The codebase stores and references this as `cognito_sub` — a legacy name from the initial AWS Cognito design. They are the same concept: a stable, unique identifier for the user across sessions.

---

## Demo accounts

| Role | Name | Login | Pre-seeded data |
|------|------|-------|----------------|
| Employee | Anna Müller | One-click | DRAFT + SUBMITTED + PAID expenses, consent records, pending erasure request |
| Employee (new) | Fresh account | One-click | No profile — triggers onboarding flow |
| Manager | Thomas Weber | One-click | Pending approval queue, AI report history |
| Finance | Sarah Chen | One-click | APPROVED expenses ready to pay, legacy GoBD sign-off pending |
| Admin | David Kim | One-click | Full user list, Anna's erasure request in queue |

---

## Recommended demo path

### 1. New Employee — Onboarding & DSGVO consent

<!-- PLACEHOLDER: GIF of onboarding flow (consent → profile setup → dashboard) -->
<!-- ![Onboarding flow](https://github.com/{user}/{repo}/releases/download/assets-v1/demo-onboarding.gif) -->

Login as **New Employee** (fresh account button):

1. Redirected to `/onboarding/compliance` — two required checkboxes (GDPR + ToS)
   - Checkboxes are **unchecked by default** — DSGVO Art. 7 compliance
   - Continue button is disabled until both are ticked
2. Tick both → Continue → `/onboarding/profile`
   - Read-only: Role (EMPLOYEE), Tier (L1), Monthly limit (€5,000) — provisioned by Admin
   - Editable: Display language (EN / DE / VI)
3. Save & Go to Dashboard → `/my-expenses`

**What to point out:** IP address and user-agent are captured server-side by the BFF (not JavaScript) — DSGVO-compliant evidence. Two `user_consents` rows written, one per policy.

---

### 2. Employee (Anna Müller) — Expense creation & privacy

<!-- PLACEHOLDER: GIF of receipt OCR flow -->
<!-- ![OCR receipt scan](https://github.com/{user}/{repo}/releases/download/assets-v1/demo-ocr.gif) -->

Login as **Anna Müller**:

**Receipt expense with OCR:**
1. `/my-expenses/create` → select **RECEIPT**
2. Upload a receipt image → Groq Vision OCR autofills vendor, date, amount, VAT
3. Note the compliance rule panel — severity badges (error/warning/info)
4. Save (DRAFT) → Submit (→ PENDING_REVIEW)

**Per Diem:**
1. `/my-expenses/create` → **PER DIEM**
2. Select country (DE = €28/day full rate) and date range
3. Amount auto-calculates: `rate × inclusive days`

**Mileage:**
1. `/my-expenses/create` → **MILEAGE**
2. Enter distance → amount = `km × €0.30` (Kilometerpauschale §9 Abs. 1 Nr. 4a EStG)
3. Trips under 30 km → `possible_commute` warning badge

**Privacy Center:**
1. Settings → Security → **Privacy & Data** → `/profile/privacy`
2. Data inventory: 6 tables holding Anna's data
3. Consent history: ToS + Privacy Policy + AI Data Processing
4. Download ZIP → receives `my-data-export-YYYY-MM-DD.zip` (DSGVO Art. 20)
5. Submit erasure request → banner appears with 30-day countdown (Art. 12)

---

### 3. Manager (Thomas Weber) — Approval & AI report

<!-- PLACEHOLDER: GIF of approval flow -->
<!-- ![Approval flow](https://github.com/{user}/{repo}/releases/download/assets-v1/demo-approval.gif) -->

Login as **Thomas Weber**:

1. `/manager/approvals` — queue shows Anna's submitted expense
2. Click a row → detail view with:
   - Policy snapshot (exactly what Anna saw when she submitted — immutable)
   - AI-extracted flags from OCR
3. **Approve** → status transitions to APPROVED
   - Or **Reject** → modal requires a reason → status → REJECTED
4. `/manager/ai-report` → generate monthly analysis
   - Groq LLM synthesizes aggregated expense data
   - Sections: Executive Summary, Breakdown by Category, Anomalies, Recommendations
   - Async job — status polling every 2s until DONE

---

### 4. Finance (Sarah Chen) — Payment & tax export

<!-- PLACEHOLDER: GIF of batch pay + SEPA download -->
<!-- ![Finance batch pay](https://github.com/{user}/{repo}/releases/download/assets-v1/demo-finance.gif) -->

Login as **Sarah Chen**:

**Overview dashboard** (`/finance/overview`):
- KPI cards: Total Spend, Pending, Approved, Paid
- Monthly trend chart (6 months), Breakdown by expense type

**Final check** (`/finance/check`):
- Retention badges on paid rows:
  - 🟡 **UNDER RETENTION** — GoBD 10-year window still active
  - 🟢 **EXPIRED** — eligible for deletion
- GoBD confirmation banner: *"1 pseudonymization awaiting GoBD sign-off"*
  - Click **Review & confirm** → modal shows pseudonymized expense details
  - Click **Confirm GoBD** → writes `FINANCE_GOBD_CONFIRMED` to audit log

**Batch payment** (`/finance/payment`):
1. Select APPROVED expenses → **Download SEPA XML** (pain.001.001.03)
2. Import into bank (out-of-band)
3. **Mark Paid** → `paid_at = NOW()`, `retention_expires_at = CURDATE() + 10 years`
   - Guard: `AND status = 'APPROVED'` in WHERE — double-pay impossible

**Tax export** (`/finance/export`):
- **DATEV CSV** — Reisekostenabrechnung format, per-type account mapping
- **SEPA XML** — same pain.001 format as batch payment
- **XRechnung** — simplified EN16931, 19% VAT

---

### 5. Admin (David Kim) — User management & GDPR erasure

<!-- PLACEHOLDER: GIF of GDPR erasure processing -->
<!-- ![GDPR erasure](https://github.com/{user}/{repo}/releases/download/assets-v1/demo-gdpr.gif) -->

Login as **David Kim**:

**User management** (`/admin/users`):
- List all users with role, status, budget
- Click any user → 3-tab detail: Permissions / UI Functions / Privacy & GDPR
- Grant/revoke granular permissions (e.g. `EXPENSE_APPROVE` without MANAGER role)

**GDPR erasure processing** (Anna Müller → Privacy & GDPR tab):
1. Erasure request queue — Anna's request with countdown (30 days per Art. 12)
2. Data map accordion — which tables hold Anna's data and how many rows
3. Click **Process erasure** → 4-item confirmation modal:
   - [ ] PII will be hard deleted
   - [ ] Financial records will be pseudonymized
   - [ ] Finance team will be notified
   - [ ] Audit log will be created
4. Tick all → Confirm → backend runs 2-phase erasure:
   - `pseudonymizeFinancialData()` — `expenses.user_sub → DELETED-<sha256>`
   - `hardDeletePersonalData()` — DELETE from `users`, `user_profiles`, `user_roles`
5. Audit timeline shows 3 new events: `PSEUDONYMIZED → PII_DELETED → COMPLETED`

---

## Cross-role E2E — GDPR erasure chain

The most complete demo: run all 4 roles in sequence to produce a full 5-event audit trail.

```
Step 1 — Anna (/profile/privacy)
  → Submit erasure request
  → Audit: ERASURE_REQUESTED

Step 2 — David (/admin/users → Anna → Privacy & GDPR)
  → Process erasure
  → Audit: ERASURE_FINANCIAL_PSEUDONYMIZED
  → Audit: ERASURE_PII_DELETED
  → Audit: ERASURE_COMPLETED

Step 3 — Sarah (/finance/check → GoBD banner)
  → Confirm GoBD pseudonymization
  → Audit: FINANCE_GOBD_CONFIRMED

Step 4 — David (/admin/users → Anna → Privacy & GDPR)
  → Audit timeline shows all 5 events
  → All linked by subject_token = SHA-256(cognito_sub)
  → subject_token persists even after cognito_sub is deleted
```

**Why this matters:** 5 events, 3 actors (Employee → Admin → Finance), linked by a single SHA-256 token. This is the Vier-Augen-Prinzip in action — no single role can complete the erasure chain unilaterally.

---

## Reset demo data

To re-run the full onboarding or erasure flow from scratch:

```bash
npm run db:reseed     # DROP + recreate + apply db_fix.sql
# → all demo accounts restored to initial seed state
```

To reset only one user's onboarding (without wiping all data):

```bash
# MYSQL_ROOT_PASSWORD is set in your .env (default for local dev: see .env.example)
docker exec -it mysql mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" mydb -e \
  "DELETE FROM user_profiles WHERE user_sub='auth0|<sub>';"
# → next login returns onboardingStatus=PENDING → triggers onboarding flow
```

> In production, never `DELETE FROM user_consents` — those are legal evidence under DSGVO.
> Use `revoked_at` timestamps instead. The command above applies to local/demo databases only.