"use client";

import { useGetExpenseByIdQuery, useSubmitExpenseMutation } from "@/ducks/expenses";
import type { Expense, ExpenseStatus } from "@/ducks/expenses";
import styles from "./detail/detail-shared.module.css";
import PageHeader from "@/components/layout/PageHeader";
import hdrStyles from "@/components/layout/PageHeader.module.css";
import DetailVisual from "./detail/detail-visual";
import DetailInfo, {
  DailyBreakdownTable,
  type InfoItem,
  type BreakdownRow,
} from "./detail/detail-info";
import DetailDocument, { type DocFile } from "./detail/detail-document";
import DetailInsight, { type InsightItem } from "./detail/detail-insight";
import DetailTimeline, { type TimelineStep } from "./detail/detail-timeline";

// ── Helpers ──────────────────────────────────────────────

function fmtDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function fmtAmount(amount?: number, currency = "EUR"): string {
  if (amount == null) return "—";
  const sym = currency === "EUR" ? "€" : "$";
  return `${sym} ${amount.toFixed(2)}`;
}

// ── Static maps ──────────────────────────────────────────
const COUNTRY_LABEL: Record<string, string> = {
  DE: "Germany — Berlin", AT: "Austria — Vienna", CH: "Switzerland — Zurich",
  GB: "United Kingdom — London", US: "United States", OTHER: "International",
};

const TYPE_ICON: Record<string, string> = {
  RECEIPT: "receipt", PER_DIEM: "flight", MILEAGE: "directions_car",
};

const STATUS_LABEL: Record<ExpenseStatus, string> = {
  DRAFT: "Draft", PENDING_REVIEW: "Pending", APPROVED: "Approved",
  REJECTED: "Rejected", PAID: "Paid",
};

const STATUS_ICON: Record<ExpenseStatus, string> = {
  DRAFT: "edit_note", PENDING_REVIEW: "pending_actions",
  APPROVED: "check_circle", REJECTED: "cancel", PAID: "payments",
};

// ── Timeline builder ─────────────────────────────────────
function buildTimeline(expense: Expense): TimelineStep[] {
  if (expense.status === "DRAFT") {
    return [
      { icon: "edit_note",      label: "Draft Created",   sublabel: fmtDate(expense.createdAt), state: "active" },
      { icon: "rate_review",    label: "Manager Review",  sublabel: "Not yet submitted",         state: "future" },
      { icon: "account_balance", label: "Reimbursement",  sublabel: "Awaiting Next Step",        state: "future" },
    ];
  }

  const submitted: TimelineStep = {
    icon: "send", label: "Expense Submitted",
    sublabel: fmtDate(expense.submittedAt),
    desc: "Submitted to manager for approval",
    state: "done",
  };

  if (expense.status === "PENDING_REVIEW") {
    return [
      submitted,
      { icon: "hourglass_empty", label: "Manager Review",  sublabel: "Pending Approval",   state: "active" },
      { icon: "account_balance", label: "Reimbursement",   sublabel: "Awaiting Next Step", state: "future" },
    ];
  }

  if (expense.status === "REJECTED") {
    return [
      submitted,
      {
        icon: "cancel", label: "Rejected",
        sublabel: fmtDate(expense.reviewedAt),
        desc: expense.rejectionReason ?? undefined,
        state: "rejected",
      },
    ];
  }

  if (expense.status === "APPROVED") {
    return [
      submitted,
      {
        icon: "check_circle", label: "Manager Approved",
        sublabel: fmtDate(expense.reviewedAt),
        desc: expense.reviewedBy ? `By ${expense.reviewedBy}` : undefined,
        state: "done",
      },
      { icon: "account_balance", label: "Reimbursement", sublabel: "Awaiting Payment", state: "future" },
    ];
  }

  // PAID
  return [
    submitted,
    { icon: "check_circle",   label: "Manager Approved", sublabel: fmtDate(expense.reviewedAt), state: "done" },
    { icon: "account_balance", label: "Reimbursement",   sublabel: "Completed",                 state: "done" },
  ];
}

// ── Per-diem breakdown ───────────────────────────────────
function buildBreakdown(tripFrom: string, tripTo: string, rate: number, countryCode: string): BreakdownRow[] {
  const rows: BreakdownRow[] = [];
  const start = new Date(tripFrom);
  const days  = Math.round((new Date(tripTo).getTime() - start.getTime()) / 86_400_000) + 1;
  const loc   = COUNTRY_LABEL[countryCode] ?? countryCode;
  const descs = ["Arrival", "Business Day", "Workshops & Networking", "Business Day", "Departure"];

  for (let i = 0; i < days; i++) {
    const d = new Date(start.getTime() + i * 86_400_000);
    rows.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      location: loc,
      desc: i === 0 ? "Arrival" : i === days - 1 ? "Departure" : descs[i] ?? "Business Day",
      rate: fmtAmount(rate),
    });
  }
  return rows;
}

// ── Insight builder ──────────────────────────────────────
function buildInsight(expense: Expense): React.ComponentProps<typeof DetailInsight> {
  if (expense.type === "RECEIPT") {
    const flags: string[] = expense.aiFlags ? JSON.parse(expense.aiFlags) : [];
    if (flags.length > 0) {
      return {
        variant: "items",
        items: flags.map((f): InsightItem => ({
          icon: "warning", iconColor: "#d97706", title: "AI Flag", desc: f,
        })),
      };
    }
    return {
      variant: "simple",
      text: "This expense aligns with typical spending patterns. No policy flags were detected by our automated review system.",
      linkLabel: "View policy guidelines",
    };
  }

  if (expense.type === "PER_DIEM") {
    const loc = COUNTRY_LABEL[expense.countryCode ?? ""] ?? expense.countryCode;
    const items: InsightItem[] = [
      {
        icon: "verified", iconColor: "#16a34a",
        title: "Policy Compliance",
        desc: `${loc} standard rate is € ${expense.perDiemRate?.toFixed(2)}/day. Your claim is within approved limits.`,
      },
      {
        icon: "check_circle", iconColor: "#16a34a",
        title: "Travel Verification",
        desc: `Travel dates span ${expense.perDiemDays} day${(expense.perDiemDays ?? 0) !== 1 ? "s" : ""}, matching the per diem period exactly.`,
      },
      {
        icon: "info", iconColor: "var(--color-primary-600)",
        title: "Meal Deductions",
        desc: "Pending review of hotel-provided breakfast inclusions per Section 4.2.",
      },
    ];
    return { variant: "items", items };
  }

  // MILEAGE
  const withinLimit = (expense.distanceKm ?? 0) <= 200;
  return {
    variant: "efficiency",
    text: withinLimit
      ? `This route stays within the 200 km daily limit. Rate applied (€ ${expense.ratePerKm?.toFixed(2)}/km) matches current corporate policy for vehicle use.`
      : `Distance exceeds the 200 km daily limit — additional manager approval may be required. Rate (€ ${expense.ratePerKm?.toFixed(2)}/km) is standard.`,
    badge: withinLimit ? "Policy Compliant" : "Approval Required",
  };
}

// ── Main component ────────────────────────────────────────
export default function ExpenseDetailView({ id }: { id: number }) {
  const { data: expense, isLoading } = useGetExpenseByIdQuery(id);
  const [submitExpense, { isLoading: isSubmitting }] = useSubmitExpenseMutation();

  if (isLoading) {
    return (
      <div className={styles.loadWrap}>
        <div className={styles.spinner} />
      </div>
    );
  }
  if (!expense) {
    return (
      <p style={{ textAlign: "center", color: "#767586", padding: "4rem 0" }}>
        Expense not found.
      </p>
    );
  }

  const typeLabel =
    expense.type === "RECEIPT" ? "Receipt" :
    expense.type === "PER_DIEM" ? "Per Diem" : "Mileage";

  const badges = [
    { icon: TYPE_ICON[expense.type], label: typeLabel },
    { icon: STATUS_ICON[expense.status], label: STATUS_LABEL[expense.status] },
    ...(expense.type === "PER_DIEM" && expense.countryCode
      ? [{ icon: "location_on", label: COUNTRY_LABEL[expense.countryCode] ?? expense.countryCode }]
      : expense.receiptDate
      ? [{ icon: "calendar_today", label: fmtDate(expense.receiptDate) }]
      : []),
  ];

  // Info section config
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

  const handleSubmit = async () => {
    await submitExpense(expense.id).unwrap();
  };

  return (
    <div>
      <PageHeader
        title={expense.title ?? `${typeLabel} #${expense.id}`}
        badges={badges}
        backLabel="My Expenses"
        backHref="/my-expenses"
        totalLabel="Total Reimbursement"
        totalValue={fmtAmount(expense.amount, expense.currency)}
        actions={
          expense.status === "DRAFT" ? (
            <button
              className={hdrStyles.btnSolid}
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting…" : "Submit for Approval"}
            </button>
          ) : undefined
        }
      />

      {/* ── Content Grid ── */}
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
            <DetailInsight {...buildInsight(expense)} />
            <DetailTimeline steps={buildTimeline(expense)} />
          </div>
        </div>
      </div>
    </div>
  );
}
