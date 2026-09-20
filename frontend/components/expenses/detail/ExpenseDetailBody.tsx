"use client";

import type { Expense } from "@/ducks/expenses";
import styles from "./detail-shared.module.css";
import DetailVisual from "./detail-visual";
import DetailInfo, { DailyBreakdownTable, type InfoItem, type BreakdownRow } from "./detail-info";
import DetailDocument, { type DocFile } from "./detail-document";
import DetailInsight from "./detail-insight";
import DetailTimeline from "./detail-timeline";
import {
  fmtDate,
  fmtAmount,
  COUNTRY_LABEL,
  buildTimeline,
  buildBreakdown,
  buildInsight,
  buildInsightFromPolicySnapshot,
} from "./detail-builders";

/**
 * Type-aware expense detail body (RECEIPT / PER_DIEM / MILEAGE) — the receipt
 * image or trip/distance visual, the info fields, the daily breakdown table
 * for per-diem, the AI insight panel, and the status timeline.
 *
 * Shared between the employee's own expense detail page and the manager's
 * approval detail page, so a manager reviewing a claim sees exactly the same
 * evidence (receipt scan, trip dates, distance) the employee submitted,
 * instead of a generic 4-field summary. Each caller supplies its own
 * PageHeader and action bar (Submit for employee, Accept/Reject for manager)
 * around this component.
 */
export default function ExpenseDetailBody({ expense }: { expense: Expense }) {
  const infoTitle = expense.type === "RECEIPT" ? "Transaction Details" : "Trip Details";
  const infoIcon  = expense.type === "RECEIPT" ? "receipt_long" : "info";

  const infoItems: InfoItem[] =
    expense.type === "RECEIPT" ? [
      { label: "Merchant",  value: expense.vendorName ?? "—" },
      { label: "Date",      value: fmtDate(expense.receiptDate) },
      { label: "Category",  value: "Business Expense" },
      { label: "Currency",  value: expense.currency ?? "EUR" },
      { label: "Amount",    value: fmtAmount(expense.amount, expense.currency), boxed: true },
      { label: "VAT",       value: expense.vatAmount != null ? fmtAmount(expense.vatAmount, expense.currency) : "—" },
    ] : expense.type === "PER_DIEM" ? [
      { label: "Start Date",  value: fmtDate(expense.tripFrom), boxed: true },
      { label: "End Date",    value: fmtDate(expense.tripTo),   boxed: true },
      { label: "Duration",    value: expense.perDiemDays != null ? `${expense.perDiemDays} Days` : "—", boxed: true },
      { label: "Daily Rate",  value: expense.perDiemRate != null ? fmtAmount(expense.perDiemRate) : "—", boxed: true },
    ] : [
      {
        label: "Distance",
        value: expense.distanceKm != null ? `${expense.distanceKm.toFixed(1)} km` : "—",
        badge: expense.ratePerKm != null ? `@ € ${expense.ratePerKm.toFixed(2)}/km` : undefined,
      },
      { label: "Date of Travel", value: fmtDate(expense.receiptDate) },
      { label: "Rate / km",      value: expense.ratePerKm != null ? `€ ${expense.ratePerKm.toFixed(2)}` : "—", boxed: true },
      { label: "Total",          value: fmtAmount(expense.amount, expense.currency), boxed: true },
    ];

  const infoColumns = expense.type === "PER_DIEM" ? 4 : 2;

  const breakdownRows: BreakdownRow[] =
    expense.type === "PER_DIEM" && expense.tripFrom && expense.tripTo && expense.perDiemRate
      ? buildBreakdown(expense.tripFrom, expense.tripTo, expense.perDiemRate, expense.countryCode ?? "OTHER")
      : [];

  const docs: DocFile[] =
    expense.type === "RECEIPT" && expense.receiptFileUrl
      ? [{ name: "Receipt Scan", meta: "Uploaded · Auto-scanned", icon: "picture_as_pdf", color: "primary" }]
      : [];

  const snapshotInsight =
    expense.policyEvaluationSnapshot?.items && expense.policyEvaluationSnapshot.items.length > 0
      ? buildInsightFromPolicySnapshot(expense.policyEvaluationSnapshot.items)
      : null;

  return (
    <div className={styles.page}>
      <div className={styles.grid}>
        {/* Left column */}
        <div className={styles.leftCol}>
          <DetailVisual
            type={expense.type}
            receiptFileUrl={expense.receiptFileUrl}
            countryCode={expense.countryCode}
            title={expense.title}
            distanceKm={expense.distanceKm}
            tripDate={expense.receiptDate}
          />

          <DetailInfo
            title={infoTitle}
            icon={infoIcon}
            items={infoItems}
            columns={infoColumns as 2 | 4}
          >
            {breakdownRows.length > 0 && (
              <>
                <h3 className={styles.cardTitle} style={{ marginBottom: "1rem" }}>
                  <span
                    className="material-symbols-outlined select-none leading-none"
                    style={{
                      fontSize: 20,
                      color: "var(--color-primary-600)",
                      fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                    }}
                  >
                    calendar_month
                  </span>
                  Daily Breakdown
                </h3>
                <DailyBreakdownTable rows={breakdownRows} />
              </>
            )}
          </DetailInfo>

          {docs.length > 0 && <DetailDocument files={docs} />}
        </div>

        {/* Right column */}
        <div className={styles.rightCol}>
          <DetailInsight {...(snapshotInsight ?? buildInsight(expense))} />
          <DetailTimeline steps={buildTimeline(expense)} />
        </div>
      </div>
    </div>
  );
}

// Re-exported so callers building their own PageHeader badges/title can
// reuse the same labels/maps this body uses internally.
export { TYPE_ICON, STATUS_LABEL, STATUS_ICON, COUNTRY_LABEL, fmtDate, fmtAmount } from "./detail-builders";
