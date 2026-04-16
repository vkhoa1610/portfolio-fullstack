"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { AlertTriangle, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useGetExpenseByIdQuery, useGetReceiptViewUrlQuery } from "@/ducks/expenses";
import type { ExpenseStatus } from "@/ducks/expenses";
import styles from "./expense-detail-view.module.css";

const STATUS_CLASS: Record<ExpenseStatus, string> = {
  DRAFT: styles.statusDraft,
  PENDING_REVIEW: styles.statusPendingReview,
  APPROVED: styles.statusApproved,
  REJECTED: styles.statusRejected,
  PAID: styles.statusPaid,
};

const STATUS_ICON: Record<ExpenseStatus, React.ElementType> = {
  DRAFT: Clock,
  PENDING_REVIEW: Clock,
  APPROVED: CheckCircle2,
  REJECTED: XCircle,
  PAID: CheckCircle2,
};

function ReceiptImage({ fileUrl }: { fileUrl: string }) {
  const { data, isLoading } = useGetReceiptViewUrlQuery(fileUrl);
  if (isLoading) return <div className={styles.receiptEmpty}>Loading...</div>;
  if (!data?.viewUrl) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={data.viewUrl} alt="Receipt" className={styles.receiptImg} />
  );
}

export default function ExpenseDetailView({ id }: { id: number }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: expense, isLoading } = useGetExpenseByIdQuery(id);

  const STATUS_LABEL: Record<ExpenseStatus, string> = {
    DRAFT: t("expense.detail.status_draft"),
    PENDING_REVIEW: t("expense.detail.status_pending"),
    APPROVED: t("expense.detail.status_approved"),
    REJECTED: t("expense.detail.status_rejected"),
    PAID: "Paid",
  };

  if (isLoading) return <div className="flex h-40 items-center justify-center"><div className={styles.spinner} /></div>;
  if (!expense) return <p className="text-center text-neutral-500">{t("expense.detail.not_found")}</p>;

  const StatusIcon = STATUS_ICON[expense.status];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      {/* Status Banner */}
      <div className={`${styles.statusBanner} ${STATUS_CLASS[expense.status]}`}>
        <StatusIcon className="h-5 w-5 shrink-0" />
        <div>
          <p className={styles.bannerTitle}>{STATUS_LABEL[expense.status]}</p>
          {expense.status === "REJECTED" && expense.rejectionReason && (
            <p className={styles.bannerReason}>{t("expense.detail.label_reason")}: {expense.rejectionReason}</p>
          )}
        </div>
      </div>

      {/* Content */}
      {expense.type === "RECEIPT" ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Left: Preview */}
          <div className={styles.receiptPanel}>
            <p className={styles.receiptLabel}>{t("expense.detail.label_receipt")}</p>
            {expense.receiptFileUrl ? (
              <ReceiptImage fileUrl={expense.receiptFileUrl} />
            ) : (
              <div className={styles.receiptEmpty}>{t("expense.detail.no_image")}</div>
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
          className={styles.btnSubmit}
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
    <div className={`space-y-3 ${styles.fieldsCard}`}>
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
        <div className={styles.aiFlags}>
          <AlertTriangle className="h-4 w-4 shrink-0 text-warning-600" />
          <div>
            <p className={styles.aiFlagsTitle}>{t("expense.detail.ai_flags")}</p>
            {JSON.parse(expense.aiFlags).map((f: string, i: number) => (
              <p key={i} className={styles.aiFlagItem}>{f}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.rowValue}>{value}</span>
    </div>
  );
}
