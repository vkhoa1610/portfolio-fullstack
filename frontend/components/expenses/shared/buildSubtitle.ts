import type { Expense } from "@/ducks/expenses";
import { fmtAmountDe } from "./format";

// Country-name-only labels for the per-diem subtitle (deliberately shorter
// than detail-builders.ts's COUNTRY_LABEL, which includes a city — the list
// row has no room for "Austria — Vienna", just "Austria").
const COUNTRY_NAME: Record<string, string> = {
  DE: "Germany",
  AT: "Austria",
  CH: "Switzerland",
  FR: "France",
  NL: "Netherlands",
  GB: "United Kingdom",
  US: "United States",
};

/** Second line of an ExpenseListRow, one line per type. Shared by both the
 *  employee and manager variants so the two lists stay consistent. The Type
 *  badge/icon already conveys RECEIPT/PER_DIEM/MILEAGE, so this deliberately
 *  never repeats the type label or the title — it surfaces the ONE extra
 *  number a reviewer actually needs (VAT, day count, rate). */
export function buildSubtitle(expense: Expense): string {
  if (expense.type === "RECEIPT") {
    return expense.vatAmount != null ? `MwSt ${fmtAmountDe(expense.vatAmount, expense.currency)}` : "";
  }

  if (expense.type === "PER_DIEM") {
    const country = COUNTRY_NAME[expense.countryCode ?? ""] ?? expense.countryCode ?? "";
    if (expense.perDiemDays == null) return country;
    const dayWord = expense.perDiemDays === 1 ? "Tag" : "Tage";
    return `${country} · ${expense.perDiemDays} ${dayWord}`;
  }

  // MILEAGE
  const distance = expense.distanceKm != null ? `${expense.distanceKm} km` : "";
  const rate = expense.ratePerKm != null ? `${fmtAmountDe(expense.ratePerKm, expense.currency)}/km` : "";
  return [distance, rate].filter(Boolean).join(" · ");
}
