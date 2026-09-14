"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Camera, Calendar, Car, ChevronRight, AlertTriangle } from "lucide-react";
import { useGetManagerQueueQuery } from "@/ducks/expenses";
import type { Expense } from "@/ducks/expenses";
import { useAuth } from "@/common/context/AuthContext";
import styles from "./approvals-view.module.css";

const TYPE_ICON = { RECEIPT: Camera, PER_DIEM: Calendar, MILEAGE: Car };

export default function ApprovalsView() {
  const { t } = useTranslation();
  const router = useRouter();
  const { session, isLoading: isAuthLoading, hasPermission } = useAuth();
  const { data: expenses = [], isLoading } = useGetManagerQueueQuery();

  // Permission check: must have EXPENSE_APPROVE to access this page
  useEffect(() => {
    if (!isAuthLoading && session !== null && !hasPermission("EXPENSE_APPROVE")) {
      router.replace("/not-found");
    }
  }, [isAuthLoading, session, hasPermission, router]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={styles.title}>{t("manager.approvals.title")}</h2>
          <p className={styles.subtitle}>{t("manager.approvals.subtitle")}</p>
        </div>
        <span className={styles.pendingBadge}>
          {t("manager.approvals.pending_count", { count: expenses.length })}
        </span>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className={styles.spinner} />
        </div>
      ) : expenses.length === 0 ? (
        <div className={styles.emptyState}>
          <p>{t("manager.approvals.empty")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.map((expense) => (
            <ApprovalRow
              key={expense.id}
              expense={expense}
              onClick={() => router.push(`/manager/approvals/${expense.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ApprovalRow({ expense, onClick }: { expense: Expense; onClick: () => void }) {
  const Icon = TYPE_ICON[expense.type] ?? Camera;
  const hasFlags = expense.aiFlags && JSON.parse(expense.aiFlags).length > 0;
  const label = expense.title || expense.vendorName || expense.type;

  return (
    <button onClick={onClick} className={styles.row}>
      <div className={styles.rowIconWrapper}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`truncate ${styles.rowLabel}`}>{label}</p>
        <p className={styles.rowDate}>{expense.submittedAt?.slice(0, 10)}</p>
      </div>
      <div className="flex items-center gap-3">
        {hasFlags && <AlertTriangle className="h-4 w-4 text-warning-500" />}
        <span className={styles.rowAmount}>
          {expense.amount != null ? `${expense.amount.toFixed(2)} €` : "—"}
        </span>
        <ChevronRight className="h-4 w-4 text-neutral-400" />
      </div>
    </button>
  );
}
