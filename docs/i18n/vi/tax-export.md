# Tax Export — DATEV / SEPA / XRechnung

Three export formats for German accounting and banking systems.

## Overview

- **DATEV CSV** — Reisekostenabrechnung format, imports directly into DATEV accounting software.
- **SEPA XML** — `pain.001.001.03` for direct bank file import (SEPA Credit Transfer).
- **XRechnung** — simplified EN16931 invoice for reimbursement documentation.

## DATEV CSV mapping

| Column | Value | Note |
|---|---|---|
| Umsatz | expense amount | Positive decimal |
| Soll/Haben | S | Always debit for expenses |
| WKZ | EUR | Currency code |
| Konto | 6300 / 6310 / 6320 | RECEIPT / PER_DIEM / MILEAGE |
| Gegenkonto | 1600 | Kasse offset |
| Belegdatum | receipt_date | YYYY-MM-DD |
| Belegfeld1 | expense.id | Internal reference |
| Buchungstext | title | Free text |
| Kostenstelle | REISE | Fixed for travel expenses |
| Steuercode | VST | Vorsteuerabzug (input tax) |

## SEPA XML

- Format: `pain.001.001.03` (SEPA Credit Transfer initiation)
- One `<PmtInf>` block per batch, one `<CdtTrfTxInf>` per expense
- Includes MsgId, transaction count, control sum
- Debtor: company IBAN (config); creditor: employee IBAN (from profile)

## XRechnung

- Simplified EN16931 with 19% VAT category (S)
- Invoice lines derived from expense line items
- Buyer/seller party details, invoice reference, payment terms

> 🚧 TODO: Leitweg-ID (required for B2G), ZUGFeRD 2.x hybrid PDF, full EN16931 schema validation.
