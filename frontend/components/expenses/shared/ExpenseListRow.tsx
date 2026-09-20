"use client";

import { useTranslation } from "react-i18next";
import { Camera, Calendar, Car, AlertTriangle, Copy } from "lucide-react";
import type { Expense } from "@/ducks/expenses";
import { fmtAmountDe, fmtDateDe } from "./format";
import { buildSubtitle } from "./buildSubtitle";
import styles from "./ExpenseListRow.module.css";

const TYPE_ICON = { RECEIPT: Camera, PER_DIEM: Calendar, MILEAGE: Car };
const TYPE_LABEL: Record<Expense["type"], string> = {
  RECEIPT: "Receipt", PER_DIEM: "Per Diem", MILEAGE: "Mileage",
};

// Manager variant only — used in the history tabs (Approved/Rejected/Paid)
// where the Flags cell shows a status pill instead of duplicate/AI flags.
const STATUS_LABEL_KEY: Record<Expense["status"], string> = {
  DRAFT: "expense.list.status_draft",
  PENDING_REVIEW: "expense.list.status_pending",
  APPROVED: "expense.list.status_approved",
  REJECTED: "expense.list.status_rejected",
  PAID: "expense.list.status_paid",
};
const STATUS_BADGE_CLASS: Record<Expense["status"], string> = {
  DRAFT: "statusDraft",
  PENDING_REVIEW: "statusPendingReview",
  APPROVED: "statusApproved",
  REJECTED: "statusRejected",
  PAID: "statusPaid",
};

/** The date the expense itself is dated to (receipt date, or trip start for
 *  per-diem) — distinct from submittedAt, which is when it was *filed*.
 *  Conflating the two was the root cause of the manager queue showing
 *  today's date for a receipt from months ago. */
function expenseDate(expense: Expense): string | undefined {
  if (expense.type === "PER_DIEM") return expense.tripFrom;
  return expense.receiptDate ?? expense.createdAt?.slice(0, 10);
}

export interface ExpenseListRowProps {
  expense: Expense;
  onClick: () => void;
  variant: "employee" | "manager";
  /** employee variant only */
  statusLabel?: string;
  statusClass?: string;
}

export default function ExpenseListRow({
  expense, onClick, variant, statusLabel, statusClass,
}: ExpenseListRowProps) {
  const { t } = useTranslation();
  const Icon = TYPE_ICON[expense.type] ?? Camera;
  const label = expense.title || expense.vendorName || expense.type;
  const sub = buildSubtitle(expense);
  const hasAiFlags = !!expense.aiFlags && JSON.parse(expense.aiFlags).length > 0;

  // Backend-computed: duplicateOfId is only ever set on the manager queue
  // response. Escalate to a red flag when the original is already
  // APPROVED/PAID — that's a real double-payment risk, not just clutter.
  const isDuplicate = expense.duplicateOfId != null;
  const isSevereDuplicate =
    isDuplicate && (expense.duplicateOfStatus === "APPROVED" || expense.duplicateOfStatus === "PAID");

  const description = (
    <div className={styles.rowDesc}>
      <div className={styles.rowIconWrapper}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className={`truncate ${styles.rowLabel}`}>{label}</p>
        <p className={styles.rowSub}>{sub}</p>
      </div>
    </div>
  );

  if (variant === "manager") {
    const rawName = expense.submitterName?.trim();
    const submitterName = rawName || "[Deleted user]";
    const initial = rawName ? rawName[0].toUpperCase() : "?";
    const isPending = expense.status === "PENDING_REVIEW";
    // History tabs show when the expense was decided, not when it was
    // submitted — that's the whole point of the second date column there.
    const secondDate = isPending ? expense.submittedAt : expense.reviewedAt ?? expense.submittedAt;

    return (
      <button
        onClick={onClick}
        className={`${styles.rowManager} ${
          isSevereDuplicate ? styles.rowDuplicateSevere : isDuplicate ? styles.rowDuplicate : ""
        }`}
      >
        <div className={styles.employeeCell}>
          <div className={`${styles.avatar} ${!rawName ? styles.avatarDeleted : ""}`}>{initial}</div>
          <span className={`${styles.employeeName} ${!rawName ? styles.employeeNameDeleted : ""}`}>
            {submitterName}
          </span>
        </div>

        {description}

        <span className={styles.typeBadge}>{TYPE_LABEL[expense.type]}</span>

        <div className={styles.rowDateCell}>{fmtDateDe(expenseDate(expense))}</div>

        <div className={styles.rowDateCell}>{fmtDateDe(secondDate?.slice(0, 10))}</div>

        <div className={styles.flagsCell}>
          {isPending ? (
            <>
              {isDuplicate && (
                <span
                  title={t("manager.approvals.duplicate_tooltip", {
                    id: expense.duplicateOfId,
                    status: expense.duplicateOfStatus,
                  })}
                >
                  <Copy className={`h-4 w-4 ${isSevereDuplicate ? "text-error-600" : "text-warning-600"}`} />
                </span>
              )}
              {hasAiFlags && (
                <span title="AI policy flag on this receipt">
                  <AlertTriangle className="h-4 w-4 text-warning-500" />
                </span>
              )}
            </>
          ) : (
            <span className={`${styles.badge} ${styles[STATUS_BADGE_CLASS[expense.status]]}`}>
              {t(STATUS_LABEL_KEY[expense.status])}
            </span>
          )}
        </div>

        <div className={styles.rowAmountCell}>{fmtAmountDe(expense.amount, expense.currency)}</div>
      </button>
    );
  }

  // employee variant
  return (
    <button onClick={onClick} className={styles.rowEmployee}>
      {description}

      <div className={styles.rowStatusCell}>
        <span className={`${styles.badge} ${statusClass}`}>{statusLabel}</span>
      </div>

      <div className={styles.rowDateCell}>{fmtDateDe(expenseDate(expense))}</div>

      <div className={styles.rowAmountCell}>{fmtAmountDe(expense.amount, expense.currency)}</div>
    </button>
  );
}

export { TYPE_ICON as EXPENSE_TYPE_ICON, TYPE_LABEL as EXPENSE_TYPE_LABEL };
