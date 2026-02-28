"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Plus, Camera, Calendar, Car, ChevronRight } from "lucide-react";
import { useGetExpensesQuery } from "@/ducks/expenses";
import type { Expense, ExpenseStatus } from "@/ducks/expenses";

const STATUS_STYLE: Record<ExpenseStatus, string> = {
  DRAFT: "bg-neutral-100 text-neutral-600",
  PENDING_REVIEW: "bg-warning-100 text-warning-700",
  APPROVED: "bg-success-100 text-success-700",
  REJECTED: "bg-error-100 text-error-700",
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
  };

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-900">{t("expense.list.title")}</h2>
        <button
          onClick={() => router.push("/my-expenses/create")}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          {t("expense.list.btn_new")}
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      ) : expenses.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 text-neutral-400">
          <Camera className="mb-2 h-8 w-8" />
          <p className="text-sm">{t("expense.list.empty")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.map((expense) => (
            <ExpenseRow
              key={expense.id}
              expense={expense}
              statusLabel={STATUS_LABEL[expense.status]}
              onClick={() => router.push(`/my-expenses/${expense.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ExpenseRow({ expense, statusLabel, onClick }: { expense: Expense; statusLabel: string; onClick: () => void }) {
  const Icon = TYPE_ICON[expense.type] ?? Camera;
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
        <p className="text-xs text-neutral-500">{expense.createdAt?.slice(0, 10)}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-semibold text-neutral-900">
          {expense.amount != null ? `${expense.amount.toFixed(2)} €` : "—"}
        </span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[expense.status]}`}>
          {statusLabel}
        </span>
        <ChevronRight className="h-4 w-4 text-neutral-400" />
      </div>
    </button>
  );
}
