"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Plus, Camera, Calendar, Car, ChevronRight } from "lucide-react";
import { useGetExpensesQuery } from "@/ducks/expenses";
import type { Expense, ExpenseStatus } from "@/ducks/expenses";
import styles from "./expense-list-view.module.css";

const STATUS_CLASS: Record<ExpenseStatus, string> = {
  DRAFT: styles.statusDraft,
  PENDING_REVIEW: styles.statusPendingReview,
  APPROVED: styles.statusApproved,
  REJECTED: styles.statusRejected,
  PAID: styles.statusPaid,
};

const TYPE_ICON = {
  RECEIPT: Camera,
  PER_DIEM: Calendar,
  MILEAGE: Car,
};

export default function ExpenseListView() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: expenses = [], isLoading } = useGetExpensesQuery();

  const STATUS_LABEL: Record<ExpenseStatus, string> = {
    DRAFT: t("expense.list.status_draft"),
    PENDING_REVIEW: t("expense.list.status_pending"),
    APPROVED: t("expense.list.status_approved"),
    REJECTED: t("expense.list.status_rejected"),
    PAID: "Paid",
  };

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h2 className={styles.title}>{t("expense.list.title")}</h2>
        <button
          onClick={() => router.push("/my-expenses/create")}
          className={styles.btnNew}
        >
          <Plus className="h-4 w-4" />
          {t("expense.list.btn_new")}
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className={styles.spinner} />
        </div>
      ) : expenses.length === 0 ? (
        <div className={styles.emptyState}>
          <Camera className="mb-2 h-8 w-8" />
          <p>{t("expense.list.empty")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.map((expense) => (
            <ExpenseRow
              key={expense.id}
              expense={expense}
              statusLabel={STATUS_LABEL[expense.status]}
              statusClass={STATUS_CLASS[expense.status]}
              onClick={() => router.push(`/my-expenses/${expense.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ExpenseRow({
  expense,
  statusLabel,
  statusClass,
  onClick,
}: {
  expense: Expense;
  statusLabel: string;
  statusClass: string;
  onClick: () => void;
}) {
  const Icon = TYPE_ICON[expense.type] ?? Camera;
  const label = expense.title || expense.vendorName || expense.type;

  return (
    <button onClick={onClick} className={styles.row}>
      <div className={styles.rowIconWrapper}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`truncate ${styles.rowLabel}`}>{label}</p>
        <p className={styles.rowDate}>{expense.createdAt?.slice(0, 10)}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className={styles.rowAmount}>
          {expense.amount != null ? `${expense.amount.toFixed(2)} €` : "—"}
        </span>
        <span className={`${styles.badge} ${statusClass}`}>{statusLabel}</span>
        <ChevronRight className="h-4 w-4 text-neutral-400" />
      </div>
    </button>
  );
}
