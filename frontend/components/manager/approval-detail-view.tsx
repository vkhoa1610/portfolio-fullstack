"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { useGetManagerExpenseByIdQuery, useApproveExpenseMutation, useRejectExpenseMutation } from "@/ducks/expenses";

export default function ApprovalDetailView({ id }: { id: number }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: expense, isLoading } = useGetManagerExpenseByIdQuery(id);
  const [approveExpense, { isLoading: isApproving }] = useApproveExpenseMutation();
  const [rejectExpense, { isLoading: isRejecting }] = useRejectExpenseMutation();

  const [showRejectForm, setShowRejectForm] = useState(false);
  const [reason, setReason] = useState("");

  if (isLoading) return <div className="flex h-40 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>;
  if (!expense) return <p className="text-center text-neutral-500">{t("manager.approvals.not_found")}</p>;

  const aiFlags: string[] = expense.aiFlags ? JSON.parse(expense.aiFlags) : [];

  const handleApprove = async () => {
    await approveExpense(id).unwrap();
    router.push("/manager/approvals");
  };

  const handleReject = async () => {
    if (!reason.trim()) return;
    await rejectExpense({ id, rejectionReason: reason }).unwrap();
    router.push("/manager/approvals");
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <div className="mb-2">
        <h2 className="text-xl font-bold text-neutral-900">{t("manager.approvals.detail_title")}</h2>
        <p className="text-sm text-neutral-500">{t("manager.approvals.detail_subtitle")}</p>
      </div>

      {/* AI Flags */}
      {aiFlags.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-warning-200 bg-warning-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-warning-600" />
          <div>
            <p className="font-semibold text-warning-700">{t("manager.approvals.ai_warnings")}</p>
            {aiFlags.map((f, i) => <p key={i} className="text-sm text-warning-600">{f}</p>)}
          </div>
        </div>
      )}

      {/* Expense Details */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-3">
        <Row label={t("expense.detail.field_type")} value={expense.type} />
        <Row label={t("expense.detail.field_amount")} value={expense.amount != null ? `${expense.amount.toFixed(2)} €` : "—"} />
        {expense.vendorName && <Row label={t("expense.detail.field_vendor")} value={expense.vendorName} />}
        {expense.receiptDate && <Row label={t("expense.detail.field_date")} value={expense.receiptDate} />}
        {expense.vatAmount != null && <Row label={t("expense.detail.field_vat")} value={`${expense.vatAmount.toFixed(2)} €`} />}
        {expense.tripFrom && <Row label={t("expense.detail.field_from")} value={expense.tripFrom} />}
        {expense.tripTo && <Row label={t("expense.detail.field_to")} value={expense.tripTo} />}
        {expense.countryCode && <Row label={t("expense.detail.field_country")} value={expense.countryCode} />}
        {expense.perDiemDays != null && <Row label={t("expense.detail.field_days")} value={String(expense.perDiemDays)} />}
        {expense.distanceKm != null && <Row label={t("expense.detail.field_distance")} value={`${expense.distanceKm} km`} />}
        <Row label={t("manager.approvals.field_submitted")} value={expense.submittedAt?.slice(0, 10) ?? "—"} />
      </div>

      {/* Rejection form */}
      {showRejectForm && (
        <div className="rounded-xl border border-error-200 bg-error-50 p-4 space-y-3">
          <p className="font-semibold text-error-700">{t("manager.approvals.reject_title")}</p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("manager.approvals.reject_placeholder")}
            rows={3}
            className="w-full rounded-lg border border-error-300 px-3 py-2 text-sm focus:outline-none"
          />
          <div className="flex gap-3">
            <button onClick={() => setShowRejectForm(false)} className="flex-1 rounded-lg border border-neutral-300 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
              {t("manager.approvals.btn_cancel")}
            </button>
            <button onClick={handleReject} disabled={isRejecting || !reason.trim()} className="flex-1 rounded-lg bg-error-600 py-2 text-sm font-semibold text-white hover:bg-error-700 disabled:opacity-60">
              {isRejecting ? t("manager.approvals.rejecting") : t("manager.approvals.btn_reject")}
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!showRejectForm && (
        <div className="flex gap-3">
          <button
            onClick={() => setShowRejectForm(true)}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-error-300 py-3 text-sm font-semibold text-error-600 hover:bg-error-50"
          >
            <XCircle className="h-4 w-4" />
            {t("manager.approvals.btn_reject")}
          </button>
          <button
            onClick={handleApprove}
            disabled={isApproving}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-success-600 py-3 text-sm font-semibold text-white hover:bg-success-700 disabled:opacity-60"
          >
            <CheckCircle2 className="h-4 w-4" />
            {isApproving ? t("manager.approvals.approving") : t("manager.approvals.btn_approve")}
          </button>
        </div>
      )}
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
