"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { CheckSquare, Square, AlertTriangle } from "lucide-react";
import { useGetExpenseByIdQuery, useSubmitExpenseMutation } from "@/ducks/expenses";
import { useAuth } from "@/common/context/AuthContext";

export default function ExpenseReviewView({ id }: { id: number }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { session } = useAuth();
  const { data: expense, isLoading } = useGetExpenseByIdQuery(id);
  const [submitExpense, { isLoading: isSubmitting }] = useSubmitExpenseMutation();
  const [confirmed, setConfirmed] = useState(false);

  if (isLoading) return <div className="flex h-40 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>;
  if (!expense) return <p className="text-center text-neutral-500">{t("expense.review.not_found")}</p>;

  const budget = session?.budget ?? 0;
  const amount = expense.amount ?? 0;
  const remaining = budget - amount;
  const overBudget = remaining < 0;

  const handleSubmit = async () => {
    await submitExpense(id).unwrap();
    router.push("/my-expenses");
  };

  return (
    <div className="mx-auto w-full max-w-lg space-y-4">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-neutral-900">{t("expense.review.title")}</h2>
        <p className="mt-1 text-sm text-neutral-500">{t("expense.review.subtitle")}</p>
      </div>

      {/* Summary card */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-3">
        <Row label={t("expense.detail.field_type")} value={expense.type} />
        <Row label={t("expense.detail.field_amount")} value={`${amount.toFixed(2)} €`} />
        {expense.vendorName && <Row label={t("expense.detail.field_vendor")} value={expense.vendorName} />}
        {expense.receiptDate && <Row label={t("expense.detail.field_date")} value={expense.receiptDate} />}
        {expense.countryCode && <Row label={t("expense.detail.field_country")} value={expense.countryCode} />}
        {expense.distanceKm != null && <Row label={t("expense.detail.field_distance")} value={`${expense.distanceKm} km`} />}
      </div>

      {/* Budget check */}
      <div className={`rounded-xl border p-4 ${overBudget ? "border-error-200 bg-error-50" : "border-success-200 bg-success-50"}`}>
        <div className="flex items-center gap-2">
          {overBudget && <AlertTriangle className="h-4 w-4 text-error-600" />}
          <p className={`text-sm font-semibold ${overBudget ? "text-error-700" : "text-success-700"}`}>
            {overBudget ? t("expense.review.budget_over") : t("expense.review.budget_ok")}
          </p>
        </div>
        <p className="text-sm text-neutral-600 mt-1">
          {t("expense.review.remaining_budget")}: <span className={`font-bold ${overBudget ? "text-error-600" : "text-success-600"}`}>{remaining.toFixed(2)} €</span>
        </p>
      </div>

      {/* Confirm checkbox */}
      <button
        onClick={() => setConfirmed(!confirmed)}
        className="flex items-center gap-3 text-sm text-neutral-700"
      >
        {confirmed ? <CheckSquare className="h-5 w-5 text-primary-600" /> : <Square className="h-5 w-5 text-neutral-400" />}
        {t("expense.review.confirm_check")}
      </button>

      <button
        onClick={handleSubmit}
        disabled={!confirmed || isSubmitting}
        className="w-full rounded-lg bg-primary-600 py-3 font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
      >
        {isSubmitting ? t("expense.review.submitting") : t("expense.review.btn_submit")}
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-neutral-100 pb-2 last:border-0 last:pb-0">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="text-sm font-medium text-neutral-900">{value}</span>
    </div>
  );
}
