# FintechSaaS — Corporate Expense Management Platform

> A production-grade full-stack expense reimbursement system built for the German Mittelstand,
> implementing real GoBD retention, DSGVO/GDPR data rights, and DATEV/SEPA/XRechnung export.
>
> Architecture, compliance choices, and trade-offs
> documented to support a relocation application to German fintech roles.

---

## What problem this solves

In German companies, expense reimbursement sits at the intersection of three regulatory regimes that pull in opposite directions:

- **DSGVO Art. 17 — Right to erasure.** Employees can demand their personal data be deleted.
- **GoBD §14 (Grundsätze ordnungsmäßiger Buchführung).** Financial records must be retained for **10 years**.
- **§9 / §4 EStG.** Travel reimbursement rates (Kilometerpauschale, per-diem Verpflegungsmehraufwand) follow statutory tables that change yearly.

Most off-the-shelf SaaS treats compliance as a checkbox. This project treats it as **a state machine**:
expenses are pseudonymized (not deleted) when an employee invokes their right to erasure, so the financial record
survives the audit window while their personal identity is severed cryptographically.

That tension — and how the system resolves it — is the most interesting part of the codebase.

---

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js 15 (App Router) · RTK Query · TypeScript | App-router server components + typed cache invalidation |
| BFF | Express + TypeScript | Auth cookie handling, AI orchestration, request shaping |
| Backend | Spring Boot 3 · MyBatis · Java 21 | Mature transactional model, MyBatis for explicit SQL |
| Database | MySQL 8.0 | JSON columns for CMS rules + audit snapshots |
| Auth | Auth0 / Cognito (sub-based, HttpOnly cookies) | Frontend never sees tokens |
| Storage | MinIO (S3-compatible) | Presigned PUT/GET — browser uploads bypass the server |
| AI | Groq API (LLaMA 3.2 Vision + Chat) | Receipt OCR + editorial policy insights |
| Infra | Docker Compose + Nginx | Single-command spin-up of the full system |

---

## Architecture

```
┌────────────┐     ┌────────────┐     ┌──────────────┐     ┌─────────┐
│  Next.js   │────▶│ Express BFF│────▶│ Spring Boot  │────▶│ MySQL 8 │
│   :3000    │     │   :4000    │     │  Java API    │     │  :3306  │
└────────────┘     └────────────┘     │    :8080     │     └─────────┘
                          │           └──────┬───────┘
                          │                  │
                          ▼                  ▼
                   ┌────────────┐     ┌────────────┐
                   │  Groq AI   │     │   MinIO    │
                   │ (LLM+Vis)  │     │ S3-storage │
                   └────────────┘     └────────────┘
```

- **No tokens in the browser.** JWTs live in HttpOnly cookies; the BFF extracts `cognito_sub` and proxies authenticated calls.
- **Direct-to-storage uploads.** The frontend asks the BFF for a presigned PUT URL (15 min TTL), then uploads receipts straight to MinIO — the Java server never touches binary payloads.
- **Granular permissions, not just roles.** `user_permissions` table holds codes like `EXPENSE_APPROVE`, `FINANCE_EXPORT`. The role is a default; the permission is the truth.

---

## What's implemented

### 1. Expense lifecycle (5-state machine)

```
DRAFT → PENDING_REVIEW → APPROVED → PAID
                       ↘ REJECTED
```

Three expense types with type-specific calculation:

- **RECEIPT** — Groq Vision OCR extracts vendor, date, amount, VAT amount/rate, AI flags. Browser uploads directly to MinIO via presigned PUT (15 min TTL); Groq fetches via presigned GET (1 hour TTL). Fallback mock data when Groq is unreachable.
- **PER_DIEM** — country-coded rate table (DE €28, AT €26.40, CH 65 CHF, GB £45, US $55) × inclusive day count. Approximates the BMF Reisekostentabelle.
- **MILEAGE** — €0.30/km Kilometerpauschale per §9 Abs. 1 Nr. 4a EStG, with daily 200 km soft limit and commute deduction threshold under 30 km.

### 2. CMS-driven compliance rules

Compliance rules live in `screen_configs` (JSON), not in code. Each rule has:
- 4 severity levels: `error` (blocks save) / `warning` / `info` / `success`
- i18n keys for title and per-state descriptions
- Boolean `blocks_save` independent of severity

At create time, the form evaluates rules against the live input and writes an **immutable snapshot** to `policy_evaluation_history`. The detail view replays the snapshot — not the live rules — so audited expenses keep their original evaluation even after CMS edits.

### 3. GDPR / DSGVO compliance (full 4-phase rollout)

| Phase | Surface | Implementation |
|---|---|---|
| 1 — Foundation | DB + service | Append-only `gdpr_audit_log` keyed by SHA-256 `subject_token` (survives hard delete); `pseudonymizeFinancialData()` and `hardDeletePersonalData()` |
| 2 — Admin tooling | `/admin/users/[sub]` | "Privacy & GDPR" tab with erasure queue, 30-day Art. 12 countdown, data-map accordion, 4-item confirmation modal |
| 3 — Employee self-service | `/profile/privacy` | Data inventory, consent history, ZIP export (Art. 20), erasure request form with explicit acknowledgement |
| 4 — Finance sign-off | `/finance/check` | Retention badge (Under retention / Expired), GoBD post-hoc confirmation flow — separation of duties between Admin (initiates) and Finance (confirms accounting integrity) |

`user_sub` in `expenses` is `VARCHAR(80)` with **no FK** — intentional, so pseudonymization can replace it with `DELETED-<sha256>` while the row stays for GoBD's 10-year retention window. `paid_at` and `retention_expires_at` are populated atomically in the same SQL statement: `retention_expires_at = DATE_ADD(CURDATE(), INTERVAL 10 YEAR)`.

### 4. AI integration (Groq)

Three distinct use cases, each with explicit "AI-assisted" badging:

- **Receipt OCR** — LLaMA Vision returns structured JSON. Strict prompt to avoid hallucination. Silent fallback to mock if Groq is unreachable.
- **Editorial policy insight** — debounced LLM call generating per-expense advice. Shimmer skeleton during loading.
- **Manager AI report** — async job analyzes monthly spend, surfaces anomalies, produces a markdown report.

No personal data leaves the BFF without an active `AI_DATA_PROCESSING` consent.

### 5. Finance & accounting exports

- **DATEV CSV** — Reisekostenabrechnung format with correct Konto mapping (6300 / 6310 / 6320), Gegenkonto 1600, Steuercode VST, Kostenstelle.
- **SEPA XML** — `pain.001.001.03` for bank file import.
- **XRechnung** — simplified EN16931 with 19% VAT category.
- Scheduled batch-pay job (15th and last day of month, 08:00 UTC).

### 6. Role-based portfolio demo

One-click demo login as four seeded users:

| Role | Name | Demonstrates |
|---|---|---|
| EMPLOYEE | Anna Müller | Receipt OCR, per-diem calculator, mileage, privacy center, ZIP export |
| MANAGER | Thomas Weber | Approval queue, reject-with-reason flow, AI report |
| FINANCE | Sarah Chen | Overview dashboard, batch payment, tax export, GoBD sign-off |
| ADMIN | David Kim | User management, permission grants, GDPR erasure processing |

---

## Notable engineering decisions

These are the choices that recruiters tend to ask about in interviews:

- **MyBatis over JPA.** Explicit SQL keeps the GDPR pseudonymization queries reviewable. JPA's cascade behavior was a liability for a `user_sub` column that intentionally has no FK.
- **Direct-to-storage upload via presigned URL.** The Java service never streams binary data. Lower memory pressure, no proxy bottleneck.
- **Subject token, not subject sub, links GDPR events.** SHA-256 of the original `cognito_sub`. After hard delete, the subject sub is null but the token still ties the erasure chain together (REQUESTED → PSEUDONYMIZED → PII_DELETED → COMPLETED → FINANCE_GOBD_CONFIRMED).
- **Compliance snapshot stored *with* resolved i18n text.** If a translation file or rule changes, historical expenses still render exactly what the employee saw at submission time. Critical for audit defensibility.
- **`retention_expires_at` populated in SQL, not Java.** `DATE_ADD(CURDATE(), INTERVAL 10 YEAR)` in the same UPDATE that sets `paid_at`. Eliminates Java/DB clock drift and removes the need for a backfill migration.
- **Idempotency guards at the SQL level.** `markPaid` includes `AND status = 'APPROVED'` in the WHERE clause; accidental double-pay is impossible at the data layer.
- **Severity and `blocks_save` decoupled.** An `error`-severity rule can be advisory (`blocks_save: false`) — useful for soft-launching new policies.

---

## Run it

### Prerequisites

- Docker Desktop
- Node.js 20+ (optional — for local dev with hot reload)
- Java 21 (optional — for local backend dev)

### One-command start

```bash
npm run docker:up
# Frontend at http://localhost:8080
# Click any of the demo-login buttons on the login screen.

npm run docker:down
```

### Individual services (hot reload)

```bash
npm run dev:frontend   # Next.js on :3000
npm run dev:bff        # Express on :4000
npm run dev:backend    # Spring Boot on :8080
```

### Database seed

```bash
docker exec -i mysql mysql -uroot -p12345678 mydb < db_fix.sql
```

Includes 4 demo users, expense seed data (DRAFT / APPROVED / PAID across categories), policy CMS rules, and the GDPR audit chain needed to demo the Finance GoBD sign-off.

---

## What's still work-in-progress

Honest scope list:

- [ ] **Tests** — currently relying on manual flow testing. Need RTK Query MSW handlers + JUnit + Cypress for the GDPR happy-path.
- [ ] **CSV bulk import** — endpoint exists, but error reporting on row-level failures is minimal.
- [ ] **i18n coverage** — EN/DE/VI exist, but DE translations of the GDPR-specific strings need a native-speaker review.
- [ ] **Manager team scoping** — approval queue is currently global. A real deployment needs `team_id` on users and a join in `findPendingForManager`.
- [ ] **Observability** — structured logging is in place; OpenTelemetry / Prometheus exporters not yet wired.
- [ ] **ZUGFeRD hybrid PDF + Leitweg-ID** — XRechnung export is the simplified variant; production B2G needs the full EN16931 with attached PDF.
- [ ] **Real Cognito** — currently runs against LocalStack Cognito for offline demos. The production switch is config-only.

---

## Project structure

```
.
├── frontend/          Next.js 15 — App Router, RTK Query, CSS Modules
├── bff/               Express + TS — auth proxy, AI orchestration, route catalog (adm-*, emp-*, fin-*, mgr-*)
├── backend/           Spring Boot 3 + MyBatis + Java 21 — domain logic, MyBatis XMLs in src/main/resources/mapper
├── docs/              Public technical docs (expense lifecycle, etc.)
├── db_fix.sql         Destroy + recreate dev schema + seed data
├── docker-compose.yml Full stack
└── .github/workflows/ CI per service
```

Public docs:
- [docs/expense-lifecycle.md](docs/expense-lifecycle.md) — 5-state machine, receipt upload flow, three expense types, policy snapshot, manager approval

---

## CI/CD

GitHub Actions per service in [.github/workflows/](.github/workflows/):

- **Frontend** — lint + type-check on PR; Docker build + push to GHCR on `main`.
- **Backend** — Maven build + Spring tests on PR to `backend/**`.
- **BFF** — TypeScript build on PR to `bff/**`.

---

## License

[MIT](LICENSE)

---

## Contact

Open to roles in German fintech / regulated SaaS. Reach out via GitHub Issues
or the email in my GitHub profile.
