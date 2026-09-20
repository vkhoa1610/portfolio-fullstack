// Canonical de-DE formatting for expense LIST rows — shared between
// /my-expenses and /manager/approvals so both render the same amount
// (comma decimal, € suffix) and date style. The employee list previously
// used `.toLocaleString("de-DE", ...)` (from its stat cards) while the
// manager list used `.toFixed(2)` (dot decimal, no locale) — a real
// inconsistency for two screens showing the same underlying data.
//
// Scoped to list rows only. The expense detail pages
// (components/expenses/detail/detail-builders.ts) use a different
// (English-style) format that wasn't part of this fix — unifying that too
// is a separate, larger visual change out of scope here.

export function fmtAmountDe(amount?: number, currency = "EUR"): string {
  if (amount == null) return "—";
  const formatted = amount.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return currency === "EUR" ? `${formatted} €` : `${formatted} ${currency}`;
}

export function fmtDateDe(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit", month: "short", year: "numeric",
  });
}
