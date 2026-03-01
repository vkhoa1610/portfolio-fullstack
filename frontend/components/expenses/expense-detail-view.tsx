"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { AlertTriangle, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useGetExpenseByIdQuery } from "@/ducks/expenses";
import type { ExpenseStatus } from "@/ducks/expenses";

export default function ExpenseDetailView({ id }: { id: number }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: expense, isLoading } = useGetExpenseByIdQuery(id);

  const STATUS_CONFIG: Record<ExpenseStatus, { icon: React.ElementType; color: string; label: string }> = {
    DRAFT: { icon: Clock, color: "text-neutral-500 bg-neutral-50 border-neutral-200", label: t("expense.detail.status_draft") },
    PENDING_REVIEW: { icon: Clock, color: "text-warning-600 bg-warning-50 border-warning-200", label: t("expense.detail.status_pending") },
    APPROVED: { icon: CheckCircle2, color: "text-success-600 bg-success-50 border-success-200", label: t("expense.detail.status_approved") },
    REJECTED: { icon: XCircle, color: "text-error-600 bg-error-50 border-error-200", label: t("expense.detail.status_rejected") },
    PAID: { icon: CheckCircle2, color: "text-primary-600 bg-primary-50 border-primary-200", label: "Paid" },
  };

  if (isLoading) return <div className="flex h-40 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>;
  if (!expense) return <p className="text-center text-neutral-500">{t("expense.detail.not_found")}</p>;

  const statusCfg = STATUS_CONFIG[expense.status];
  const StatusIcon = statusCfg.icon;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      {/* Status Banner */}
      <div className={`flex items-center gap-3 rounded-xl border p-4 ${statusCfg.color}`}>
        <StatusIcon className="h-5 w-5" />
        <div>
          <p className="font-semibold">{statusCfg.label}</p>
          {expense.status === "REJECTED" && expense.rejectionReason && (
            <p className="text-sm">{t("expense.detail.label_reason")}: {expense.rejectionReason}</p>
          )}
        </div>
      </div>

      {/* Content */}
      {expense.type === "RECEIPT" ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Left: Preview */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="mb-2 text-xs font-semibold uppercase text-neutral-400">{t("expense.detail.label_receipt")}</p>
            {expense.receiptFileUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={expense.receiptFileUrl} alt="Receipt" className="max-h-80 w-full rounded-lg object-contain" />
            ) : (
              <div className="flex h-40 items-center justify-center text-neutral-400 text-sm">{t("expense.detail.no_image")}</div>
            )}
          </div>
          {/* Right: Details */}
          <ExpenseFields expense={expense} t={t} />
        </div>
      ) : (
        <ExpenseFields expense={expense} t={t} />
      )}

      {/* Actions */}
      {expense.status === "DRAFT" && (
        <button
          onClick={() => router.push(`/my-expenses/${id}/review`)}
          className="w-full rounded-lg bg-primary-600 py-3 font-semibold text-white hover:bg-primary-700"
        >
          {t("expense.detail.btn_submit")}
        </button>
      )}
    </div>
  );
}

function ExpenseFields({ expense, t }: { expense: ReturnType<typeof useGetExpenseByIdQuery>["data"]; t: (key: string) => string }) {
  if (!expense) return null;
  return (
    <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-6">
      <Row label={t("expense.detail.field_type")} value={expense.type} />
      <Row label={t("expense.detail.field_amount")} value={expense.amount != null ? `${expense.amount.toFixed(2)} €` : "—"} />
      <Row label={t("expense.detail.field_currency")} value={expense.currency} />
      {expense.vendorName && <Row label={t("expense.detail.field_vendor")} value={expense.vendorName} />}
      {expense.receiptDate && <Row label={t("expense.detail.field_date")} value={expense.receiptDate} />}
      {expense.vatAmount != null && <Row label={t("expense.detail.field_vat")} value={`${expense.vatAmount.toFixed(2)} €`} />}
      {expense.tripFrom && <Row label={t("expense.detail.field_from")} value={expense.tripFrom} />}
      {expense.tripTo && <Row label={t("expense.detail.field_to")} value={expense.tripTo} />}
      {expense.countryCode && <Row label={t("expense.detail.field_country")} value={expense.countryCode} />}
      {expense.perDiemDays != null && <Row label={t("expense.detail.field_days")} value={String(expense.perDiemDays)} />}
      {expense.distanceKm != null && <Row label={t("expense.detail.field_distance")} value={`${expense.distanceKm} km`} />}
      {expense.ratePerKm != null && <Row label={t("expense.detail.field_rate_km")} value={`${expense.ratePerKm} €`} />}
      {expense.aiFlags && JSON.parse(expense.aiFlags).length > 0 && (
        <div className="flex items-start gap-2 rounded-lg bg-warning-50 p-3">
          <AlertTriangle className="h-4 w-4 text-warning-600" />
          <div>
            <p className="text-xs font-semibold text-warning-700">{t("expense.detail.ai_flags")}</p>
            {JSON.parse(expense.aiFlags).map((f: string, i: number) => (
              <p key={i} className="text-xs text-warning-600">{f}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-100 pb-2 last:border-0 last:pb-0">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="text-sm font-medium text-neutral-900">{value}</span>
    </div>
  );
}
