"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Camera, Calendar, Car, ChevronRight, AlertTriangle } from "lucide-react";
import { useGetManagerQueueQuery } from "@/ducks/expenses";
import type { Expense } from "@/ducks/expenses";

const TYPE_ICON = { RECEIPT: Camera, PER_DIEM: Calendar, MILEAGE: Car };

export default function ApprovalsView() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: expenses = [], isLoading } = useGetManagerQueueQuery();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">{t("manager.approvals.title")}</h2>
          <p className="text-sm text-neutral-500">{t("manager.approvals.subtitle")}</p>
        </div>
        <span className="rounded-full bg-warning-100 px-3 py-1 text-sm font-semibold text-warning-700">
          {t("manager.approvals.pending_count", { count: expenses.length })}
        </span>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      ) : expenses.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 text-neutral-400">
          <p className="text-sm">{t("manager.approvals.empty")}</p>
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
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition-all hover:border-primary-300 hover:shadow-md"
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-neutral-100">
        <Icon className="h-5 w-5 text-neutral-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate font-medium text-neutral-900">{label}</p>
        <p className="text-xs text-neutral-500">{expense.submittedAt?.slice(0, 10)}</p>
      </div>
      <div className="flex items-center gap-3">
        {hasFlags && <AlertTriangle className="h-4 w-4 text-warning-500" />}
        <span className="font-semibold text-neutral-900">
          {expense.amount != null ? `${expense.amount.toFixed(2)} €` : "—"}
        </span>
        <ChevronRight className="h-4 w-4 text-neutral-400" />
      </div>
    </button>
  );
}
