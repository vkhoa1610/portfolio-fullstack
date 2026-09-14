# GoBD Notes

**Grundsätze zur ordnungsmäßigen Führung und Aufbewahrung von Büchern** —
German compliance requirements for digital bookkeeping.

## Overview

- **10-year mandatory retention** for financial records (§14 GoBD, §257 HGB, §147 AO)
- **Immutability** requirement for receipts (Buchungsbelege) after creation
- **MinIO storage strategy** for WORM (write-once-read-many) compliance

## How this project implements GoBD

- `expenses.retention_expires_at` is populated atomically together with `paid_at` (in a single SQL UPDATE) — no clock drift, no backfill needed.
- The GDPR erasure workflow **pseudonymizes** expenses instead of deleting them, so the row survives the 10-year window while personal identity is severed cryptographically.
- Receipt images live in MinIO with retention policy (planned: enable versioning + object lock).

> 🚧 Full content coming soon — MinIO WORM policy, DATEV Prüfsummen, Buchungsperiode mapping.
