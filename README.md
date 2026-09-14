# FintechSaaS — Corporate Expense Management Platform

> Production-grade full-stack expense reimbursement built for the German Mittelstand.
> Real **GoBD** 10-year retention, **DSGVO/GDPR** data rights, and **DATEV / SEPA / XRechnung** exports.
> Every design decision is documented — this repo is my relocation application to German fintech.

**📚 Live technical docs** → [**vkhoa1610.github.io/portfolio-fullstack**](https://vkhoa1610.github.io/portfolio-fullstack/) — 14 wiki pages (EN / DE / VI), architecture C4, GDPR erasure workflow, API reference, tax export formats.

---

## Why this project

German expense reimbursement sits at the intersection of three regulatory regimes that pull in **opposite directions**:

- **DSGVO Art. 17** — employees can demand their personal data be deleted.
- **GoBD §14** — financial records must be retained for **10 years**.
- **§9 / §4 EStG** — travel reimbursement rates (Kilometerpauschale, Verpflegungsmehraufwand) follow statutory tables.

Off-the-shelf SaaS treats compliance as a checkbox. This project treats it as a **state machine**: expenses are *pseudonymized* (not deleted) when an employee invokes erasure — the financial record survives the audit window, the personal identity is cryptographically severed.

That tension, and how the system resolves it, is the most interesting part of the codebase.

---

## Tech stack

| Layer | Tech | Why |
|---|---|---|
| Frontend | Next.js 15 · RTK Query · TS · CSS Modules | Server components + typed cache invalidation |
| BFF | Express + TS | Auth cookie handling, AI orchestration, request shaping |
| Backend | Spring Boot 3 · MyBatis · Java 21 | Explicit SQL — reviewable pseudonymization queries |
| DB | MySQL 8.0 | JSON columns for CMS rules + audit snapshots |
| Auth | Auth0 (sub-based, HttpOnly cookies) | Frontend never sees tokens |
| Storage | MinIO S3-compatible | Presigned PUT/GET — direct browser upload |
| AI | Groq (LLaMA 3.2 Vision + Chat) | Receipt OCR + policy insight + report generation |
| Infra | Docker Compose + Nginx | Single-command spin-up |
| Docs | Docusaurus + Mermaid + i18n | Static site auto-deployed to GitHub Pages |

---

## Architecture

```
┌────────────┐     ┌────────────┐     ┌──────────────┐     ┌─────────┐
│  Next.js   │────▶│ Express BFF│────▶│ Spring Boot  │────▶│ MySQL 8 │
│   :3000    │     │   :4000    │     │  Java API    │     │  :3306  │
└────────────┘     └────────────┘     │    :8080     │     └─────────┘
                          │           └──────┬───────┘
                          ▼                  ▼
                   ┌────────────┐     ┌────────────┐
                   │  Groq AI   │     │   MinIO    │
                   └────────────┘     └────────────┘
```

- **No tokens in the browser** — JWTs in HttpOnly cookies; BFF extracts `cognito_sub` and proxies.
- **Direct-to-storage uploads** — frontend gets a presigned PUT (15 min), uploads straight to MinIO. Java never touches binary payloads.
- **Permissions, not just roles** — `user_permissions` table holds granular codes (`EXPENSE_APPROVE`, `FINANCE_EXPORT`). Role is a default; permission is truth.

Full C4 model → [wiki / Architecture](https://vkhoa1610.github.io/portfolio-fullstack/architecture).

---

## What's implemented

### Expense lifecycle
5-state machine (`DRAFT → PENDING_REVIEW → APPROVED → PAID`, `→ REJECTED`) across three types:

- **RECEIPT** — Groq Vision OCR (vendor, date, amount, VAT). Silent fallback if Groq unreachable.
- **PER_DIEM** — country rate table (DE €28 / AT €26.40 / CH 65 CHF / GB £45 / US $55) × inclusive days.
- **MILEAGE** — €0.30/km per §9 Abs. 1 Nr. 4a EStG, 200 km daily soft limit, commute deduction under 30 km.

### CMS-driven compliance rules
Rules live in `screen_configs` (JSON), 4 severity levels, `blocks_save` decoupled from severity. On submit, an **immutable snapshot** (with resolved i18n text) is written to `policy_evaluation_history` — historical expenses render exactly what the employee saw, even after CMS edits.

### GDPR / DSGVO — 4-phase rollout
| Phase | Surface | Highlight |
|---|---|---|
| 1 — Foundation | DB + service | Append-only `gdpr_audit_log` keyed by SHA-256 `subject_token` (survives hard delete) |
| 2 — Admin | `/admin/users/[sub]` | Erasure queue with 30-day Art. 12 countdown, data-map, 4-item confirmation modal |
| 3 — Employee | `/profile/privacy` | Data inventory, consent history, ZIP export (Art. 20), erasure request |
| 4 — Finance | `/finance/check` | Retention badge, GoBD post-hoc confirmation — separation of duties |

`expenses.user_sub` is `VARCHAR(80)` **no FK** — intentional, so pseudonymize can replace with `DELETED-<sha256>` while the row survives 10 years. `retention_expires_at = DATE_ADD(CURDATE(), INTERVAL 10 YEAR)` — computed in SQL, not Java, to eliminate clock drift.

Full flow → [wiki / GDPR compliance](https://vkhoa1610.github.io/portfolio-fullstack/gdpr-compliance).

### AI (Groq)
- **Receipt OCR** — strict prompt against hallucination, silent mock fallback.
- **Editorial policy insight** — debounced LLM per expense, shimmer skeleton during load.
- **Manager AI report** — async job, monthly spend analysis + anomaly detection, markdown output.

Gated by active `AI_DATA_PROCESSING` consent — no personal data leaves the BFF without it.

### Finance exports
- **DATEV CSV** — Reisekostenabrechnung, Konto 6300/6310/6320, Gegenkonto 1600, Steuercode VST, Kostenstelle.
- **SEPA XML** — `pain.001.001.03`.
- **XRechnung** — simplified EN16931 (19% VAT).
- Scheduled batch-pay — 15th + last day of month, 08:00 UTC.

### Role-based demo
| Role | Name | Demonstrates |
|---|---|---|
| EMPLOYEE | Anna Müller | Receipt OCR, per-diem, mileage, privacy center, ZIP export |
| EMPLOYEE (new) | fresh account | Onboarding flow — DSGVO consent capture, profile setup |
| MANAGER | Thomas Weber | Approval queue, reject-with-reason, AI report |
| FINANCE | Sarah Chen | Overview dashboard, batch pay, tax export, GoBD sign-off |
| ADMIN | David Kim | User management, permissions, GDPR erasure processing |

---

## Notable engineering decisions

Interview-relevant choices:

- **MyBatis over JPA** — pseudonymization SQL stays reviewable; no cascade surprises on the FK-less `user_sub`.
- **Direct-to-storage presigned PUT** — Java never streams binary. Lower memory, no proxy bottleneck.
- **Subject token as GDPR event key** — SHA-256 of `cognito_sub`. After hard delete the subject sub is null, but the token still ties the erasure chain together end-to-end.
- **Compliance snapshot stores resolved i18n text** — historical expenses render as-shown at submit time. Audit defensibility.
- **`retention_expires_at` computed in SQL** — same UPDATE as `paid_at`, no clock drift, no backfill migration.
- **Idempotency at the SQL layer** — `markPaid` includes `AND status = 'APPROVED'` in WHERE. Double-pay impossible at data layer.

---

## Run it

**Prereqs**: Docker Desktop. Optional: Node 20+ (hot reload), Java 21 (backend dev).

```bash
npm run docker:up
# Frontend at http://localhost:8080 — click any demo-login button
npm run docker:down
```

Hot reload for one service:
```bash
npm run dev:frontend   # Next.js :3000
npm run dev:bff        # Express :4000
npm run dev:backend    # Spring Boot :8080
```

Database:
```bash
npm run db:reseed      # DROP + CREATE + apply db_fix.sql
npm run db:wipe        # remove mysql container + volume
```

Wiki (Docusaurus):
```bash
npm run wiki:dev              # EN dev server
npm run wiki:dev:de            # DE dev server
npm run wiki:dev:vi            # VI dev server
npm run wiki:build && wiki:serve  # multi-locale production preview
```

---

## Documentation

All technical docs live in [`docs/`](docs/) — served as a static Docusaurus site at [**vkhoa1610.github.io/portfolio-fullstack**](https://vkhoa1610.github.io/portfolio-fullstack/). Auto-deployed via GitHub Actions on every push to `main`.

Structure:
```
docs/
├── home.md                 → Landing + demo user table
├── demo-guide.md           → Test scenarios per role
├── architecture.md         → C4 model (Context → Container → Component)
├── expense-lifecycle.md    → State machine, sequence diagrams
├── onboarding.md           → DSGVO consent capture flow
├── auth-flow.md            → Auth0 BFF pattern, MFA branch
├── finance-workflows.md    → Check → Payment → Export
├── ai-report.md            → CompletableFuture async pattern
├── admin-management.md     → Users, permissions, functions
├── cms-policy-rules.md     → screen_configs versioning
├── gdpr-compliance.md      → 4-phase rollout, pseudonymization
├── gobd-notes.md           → 10-year retention, MinIO WORM
├── api-reference.md        → All endpoints by role
├── tax-export.md           → DATEV / SEPA / XRechnung
└── i18n/{de,vi}/           → Translations (source of truth)
```

Translations are synced into Docusaurus at build time via [`scripts/wiki-sync.js`](scripts/wiki-sync.js).

---

## What's still work-in-progress

Honest scope list:

- [ ] **Tests** — currently manual flow testing. Need RTK Query MSW handlers + JUnit + Cypress for the GDPR happy path.
- [ ] **CSV bulk import** — endpoint exists; per-row error reporting is minimal.
- [ ] **DE / VI translations** — infrastructure ready, only `home.md` fully translated. Rest is EN placeholder, translate on demand.
- [ ] **Manager team scoping** — approval queue is global; needs `team_id` on users + join in `findPendingForManager`.
- [ ] **Observability** — structured logging in place, OpenTelemetry / Prometheus not yet wired.
- [ ] **ZUGFeRD hybrid PDF + Leitweg-ID** — XRechnung is the simplified variant; production B2G needs full EN16931.
- [ ] **Real Cognito** — currently Auth0; production switch is config-only.

---

## Project structure

```
.
├── frontend/                Next.js 15 — App Router, RTK Query, CSS Modules
├── bff/                     Express + TS — auth proxy, AI orchestration, route catalog
├── backend/                 Spring Boot 3 + MyBatis + Java 21 — domain logic
├── docs/                    Public technical docs (Docusaurus source)
│   └── i18n/{de,vi}/        Translations
├── wiki/                    Docusaurus site config (auto-deploys to gh-pages)
├── scripts/wiki-sync.js     docs/i18n → wiki/i18n build-time sync
├── db_fix.sql               Full destroy + recreate schema + seed
├── docker-compose.yml       All services
└── .github/workflows/
    └── wiki-deploy.yml      Auto-build Docusaurus + deploy to Pages
```

---

## CI/CD

GitHub Actions in [`.github/workflows/`](.github/workflows/):

- **wiki-deploy.yml** — auto-syncs `docs/i18n/` → `wiki/i18n/` → builds Docusaurus (3 locales) → deploys to `gh-pages` on push to `main` (paths: `docs/**`, `wiki/**`, `scripts/wiki-sync.js`).
- **frontend / backend / bff** — lint, type-check, build per service.

---

## License

[MIT](LICENSE)

---

## Contact

Open to roles in **German fintech / regulated SaaS** (Berlin / Munich / remote-EU).
Reach out via GitHub Issues or the email in my profile.
