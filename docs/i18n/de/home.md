# FintechSaaS Expense Platform — Dokumentation

Unternehmensplattform zur Reisekosten- und Belegverwaltung mit
KI-gestützter OCR, DATEV- / SEPA- / XRechnung-Export sowie
DSGVO-konformer Datenverarbeitung.

## Schnellzugriff

- [Systemarchitektur](./architecture.md) — C4-Diagramme, Tech-Stack
- [Beleg-Lebenszyklus](./expense-lifecycle.md) — State Machine, Sequenzdiagramm
- [DSGVO / GDPR](./gdpr-compliance.md) — Datenklassifizierung, Löschworkflow
- [GoBD-Hinweise](./gobd-notes.md) — 10-jährige Aufbewahrung, Unveränderbarkeit
- [API-Referenz](./api-reference.md) — Alle Endpunkte nach Rolle
- [Steuerexport](./tax-export.md) — DATEV CSV, SEPA XML, XRechnung
- [Demo-Anleitung](./demo-guide.md) — One-Click Demo-Login, Testszenarien

## Demo-Benutzer

| Rolle       | Name           | Anmeldung                       |
|-------------|----------------|---------------------------------|
| Mitarbeiter | Anna Müller    | One-Click auf /auth/login       |
| Manager     | Thomas Weber   | One-Click auf /auth/login       |
| Buchhaltung | Sarah Chen     | One-Click auf /auth/login       |
| Admin       | David Kim      | One-Click auf /auth/login       |
