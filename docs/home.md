# FintechSaaS Expense Platform — Documentation

Corporate expense management built for **German Mittelstand** — AI-powered OCR, four-role workflow, and full German regulatory compliance (DSGVO · GoBD · DATEV · SEPA · XRechnung).

> **For reviewers:** this wiki is where the engineering depth lives.
> Start with [Architecture](/wiki/architecture) or [GDPR / DSGVO](/wiki/gdpr-compliance) depending on what you're evaluating.

---

## Platform overview

<!-- PLACEHOLDER: 60-second overview video showing all 4 roles -->
<!-- Replace with GitHub Releases URL after recording:           -->
<!-- ![Platform overview](https://github.com/{user}/{repo}/releases/download/assets-v1/overview.gif) -->

> 🎬 **Demo video coming soon** — 60-second walkthrough: Employee submits expense → Manager approves → Finance pays + exports → Admin processes GDPR erasure.
> Detailed per-role GIFs are in the [Demo guide](/wiki/demo-guide).

---

## What makes this interesting

German expense reimbursement sits at the intersection of three regulatory regimes that pull in **opposite directions**:

| Law | Obligation | Impact on this system |
|-----|-----------|----------------------|
| **DSGVO Art. 17** | Employee can demand personal data be deleted | Must erase `user_profiles`, `users`, PII |
| **GoBD §14** | Financial records must be retained **10 years** | Cannot delete `expenses` rows |
| **§9 / §4 EStG** | Travel rates follow statutory tables | Per-diem and mileage rates are law, not config |

The system resolves the DSGVO vs GoBD tension through **pseudonymization** — not deletion. When an employee invokes erasure, `expenses.user_sub` is replaced with `DELETED-<sha256>`. The financial record survives the 10-year audit window; the personal identity is cryptographically severed.

That design decision, and the 4-phase GDPR rollout it required, is the most interesting part of the codebase.

---

## System at a glance

```
┌──────────────────────────────────────────────────────┐
│  Next.js 15 + RTK Query          (Frontend :3000)    │
├──────────────────────────────────────────────────────┤
│  Express BFF + TypeScript        (BFF :4000)         │
│  — HttpOnly cookie auth, AI orchestration            │
├──────────────────────────────────────────────────────┤
│  Spring Boot 3 + MyBatis + Java 21  (API :8080)      │
│  — Domain logic, GDPR service, GoBD retention        │
├──────────────────────────────────────────────────────┤
│  MySQL 8.0   MinIO/S3   Groq AI   Auth0              │
└──────────────────────────────────────────────────────┘
```

Full C4 diagram → [Architecture](/wiki/architecture)

---

## Four roles, one expense lifecycle

```
EMPLOYEE          MANAGER           FINANCE           ADMIN
   │                 │                 │                 │
Create expense    Approve /         Final check +     User mgmt +
Upload receipt    Reject +          Batch pay +       GDPR erasure
Per-diem /        AI report         SEPA XML +        processing
Mileage                             DATEV export
Privacy center                      GoBD sign-off
```

Each role has its own dedicated screens — no role sees another's data. One-click demo login for each: [Demo guide →](/wiki/demo-guide)

---

## Quick links by audience

**Tech lead / senior dev**
- [Architecture](/wiki/architecture) — C4 model, container diagram, key decisions
- [Expense lifecycle](/wiki/expense-lifecycle) — state machine, sequence diagrams
- [Auth flow](/wiki/auth-flow) — token isolation, BFF pattern, MFA branch

**Finance / compliance domain**
- [GDPR / DSGVO](/wiki/gdpr-compliance) — 4-phase rollout, pseudonymization, audit trail
- [GoBD notes](/wiki/gobd-notes) — 10-year retention, Unveränderbarkeit, Betriebsprüfung
- [Tax export](/wiki/tax-export) — DATEV CSV, SEPA pain.001, XRechnung EN16931

**Recruiter / hiring manager**
- [Demo guide](/wiki/demo-guide) — one-click login, what to click per role
- [API reference](/wiki/api-reference) — all endpoints by role

---

## Demo users

| Role | Name | One-click login | Demonstrates |
|------|------|----------------|-------------|
| Employee | Anna Müller | `/auth/login` | OCR receipt, per-diem, privacy center, ZIP export |
| Employee (new) | Fresh account | `/auth/login` | Onboarding flow — DSGVO consent capture |
| Manager | Thomas Weber | `/auth/login` | Approval queue, AI monthly report |
| Finance | Sarah Chen | `/auth/login` | Batch pay, SEPA XML, DATEV export, GoBD sign-off |
| Admin | David Kim | `/auth/login` | User management, GDPR erasure processing |

---

## German compliance coverage

| Standard | What's implemented |
|----------|--------------------|
| **DSGVO Art. 7** | Explicit consent — no pre-ticked checkboxes, IP + user-agent logged |
| **DSGVO Art. 12** | 30-day erasure countdown in admin queue |
| **DSGVO Art. 17** | Full erasure workflow — PII hard delete + financial pseudonymization |
| **DSGVO Art. 20** | ZIP data export (portability) from `/profile/privacy` |
| **DSGVO Art. 30** | Append-only `gdpr_audit_log` keyed by SHA-256 subject token |
| **GoBD §14** | `retention_expires_at` computed atomically in SQL on `PAID` transition |
| **§9 Abs. 1 Nr. 4a EStG** | Kilometerpauschale €0.30/km für Dienstreisen (Pkw) — distinct from Pendlerpauschale (commute, not reimbursable) |
| **§9 Abs. 4a EStG** | Verpflegungspauschalen per country (DE €28 full day / €14 An-/Abreisetag, AT €26.40, ...) — simplified: codebase applies full rate per calendar day; Anreisetag/Abreisetag proration is a known TODO |
| **DATEV CSV** | Project-defined account mapping: 6300/6310/6320 per expense type, Gegenkonto 1600, Steuercode VST — not verbatim SKR03 chart numbers (actual accounts depend on client Kontenrahmen) |
| **SEPA pain.001.001.03** | Batch payment XML for direct bank import |
| **XRechnung / EN16931** | Simplified e-invoice, 19% VAT category S |