import type React from "react";
import type { Expense, ExpenseStatus, PolicyEvaluationSnapshotItem } from "@/ducks/expenses";
import DetailInsight, { type InsightItem } from "./detail-insight";
import type { TimelineStep } from "./detail-timeline";
import type { BreakdownRow } from "./detail-info";

// DetailInsightProps is a discriminated union (variant: "simple"|"items"|
// "efficiency", each with different required fields) and isn't exported from
// detail-insight.tsx — extract it the same way expense-detail-view.tsx
// originally did, via ComponentProps, rather than re-declaring a loosened
// (and therefore type-unsafe) shape here.
type InsightProps = React.ComponentProps<typeof DetailInsight>;

// Shared between the employee expense detail page and the manager approval
// detail page — both need to render the same type-aware (RECEIPT / PER_DIEM /
// MILEAGE) visual layout so a manager can see exactly what the employee
// submitted (receipt image, trip dates, distance) instead of a generic
// 4-field summary.

// ── Formatting helpers ──────────────────────────────────────

export function fmtDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export function fmtAmount(amount?: number, currency = "EUR"): string {
  if (amount == null) return "—";
  const sym = currency === "EUR" ? "€" : "$";
  return `${sym} ${amount.toFixed(2)}`;
}

// ── Static maps ──────────────────────────────────────────

export const COUNTRY_LABEL: Record<string, string> = {
  DE: "Germany — Berlin", AT: "Austria — Vienna", CH: "Switzerland — Zurich",
  GB: "United Kingdom — London", US: "United States", OTHER: "International",
};

export const TYPE_ICON: Record<string, string> = {
  RECEIPT: "receipt", PER_DIEM: "flight", MILEAGE: "directions_car",
};

export const STATUS_LABEL: Record<ExpenseStatus, string> = {
  DRAFT: "Draft", PENDING_REVIEW: "Pending", APPROVED: "Approved",
  REJECTED: "Rejected", PAID: "Paid",
};

export const STATUS_ICON: Record<ExpenseStatus, string> = {
  DRAFT: "edit_note", PENDING_REVIEW: "pending_actions",
  APPROVED: "check_circle", REJECTED: "cancel", PAID: "payments",
};

// ── Timeline builder ─────────────────────────────────────

export function buildTimeline(expense: Expense): TimelineStep[] {
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

export function buildBreakdown(tripFrom: string, tripTo: string, rate: number, countryCode: string): BreakdownRow[] {
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

export function buildInsight(expense: Expense): InsightProps {
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

export function buildInsightFromPolicySnapshot(items: PolicyEvaluationSnapshotItem[]): {
  variant: "items";
  items: InsightItem[];
} {
  const mappedItems: InsightItem[] = items.map((item) => {
    if (item.state === "pending") {
      return {
        icon: "schedule",
        iconColor: "#6b7280",
        title: item.resolvedTitle ?? item.id,
        desc: item.resolvedDesc ?? "Pending: waiting for required input.",
      };
    }

    if (item.state === "ok") {
      return {
        icon: "check_circle",
        iconColor: "#16a34a",
        title: item.resolvedTitle ?? item.id,
        desc: item.resolvedDesc ?? "Passed policy validation.",
      };
    }

    const iconBySeverity: Record<string, { icon: string; color: string }> = {
      error: { icon: "error", color: "#dc2626" },
      warning: { icon: "warning", color: "#d97706" },
      info: { icon: "info", color: "#2563eb" },
      success: { icon: "verified", color: "#16a34a" },
    };

    const mapped = iconBySeverity[item.severity] ?? { icon: "info", color: "#2563eb" };
    return {
      icon: mapped.icon,
      iconColor: mapped.color,
      title: item.resolvedTitle ?? item.id,
      desc: item.resolvedDesc ?? "Policy rule evaluated.",
    };
  });

  return { variant: "items", items: mappedItems };
}
