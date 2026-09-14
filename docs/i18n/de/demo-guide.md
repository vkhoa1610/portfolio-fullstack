# Demo Guide

How to explore the platform end-to-end using the four seeded demo users.

## Overview

- All 4 demo users are one-click on `/auth/login`
- Each demonstrates a distinct role's workflow
- Data is pre-seeded via `db_fix.sql` — includes DRAFT/APPROVED/PAID expenses and one legacy pseudonymization for the Finance sign-off banner

## Recommended demo path

### 1. Employee (Anna Müller)

- Login → land on `/my-expenses`
- Explore the bento grid: MTD stats, AI Editorial Insight card
- Create a receipt: `/my-expenses/create` → RECEIPT → upload image → OCR autofills → save → submit
- Try Per Diem and Mileage forms — note the compliance rule severity badges
- Open `/profile/privacy` — see data inventory, download ZIP, submit erasure request

### 2. Manager (Thomas Weber)

- Login → `/manager/approvals` shows PENDING_REVIEW queue
- Click a row → detail with AI flags + policy snapshot
- Approve or reject with reason
- `/manager/ai-report` — AI-generated monthly analysis

### 3. Finance (Sarah Chen)

- Login → `/finance/overview` — KPI cards, monthly trend, breakdown by type
- `/finance/check` — retention badges on paid rows, GoBD sign-off banner (from seeded legacy pseudonymization)
- `/finance/payment` — batch pay + SEPA XML download
- `/finance/export` — DATEV / SEPA / XRechnung downloads

### 4. Admin (David Kim)

- Login → `/admin/users`
- Click Anna Müller → Privacy & GDPR tab
- If Anna has submitted an erasure request: click "Process erasure" → tick checklist → confirm
- Watch audit timeline populate with 3 new events

## Cross-role E2E

The most interesting demo is running the GDPR erasure chain across all 4 roles:

1. Anna submits erasure at `/profile/privacy`
2. David processes it at `/admin/users/{sub}` Privacy & GDPR tab
3. Sarah confirms GoBD at `/finance/check` banner
4. Audit log now has 5 linked events (`subject_token = SHA256(cognito_sub)`)

> Full walkthrough with screenshots coming soon.
