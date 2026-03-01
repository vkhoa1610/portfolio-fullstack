"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Camera, Calendar, Car, CheckCircle, AlertTriangle } from "lucide-react";
import { useGetFinanceExpensesQuery } from "@/ducks/expenses";
import type { Expense } from "@/ducks/expenses";

const TYPE_ICON = { RECEIPT: Camera, PER_DIEM: Calendar, MILEAGE: Car };

// ─────────────────────────────────────────────────────────────────────────────
// Finance Check View
// Accountant reviews manager-approved items before batch payment.
// ─────────────────────────────────────────────────────────────────────────────

export default function FinanceCheckView() {
  const { t } = useTranslation();
  const { data: all = [], isLoading } = useGetFinanceExpensesQuery();

  // Finance check only shows APPROVED items (manager already signed off)
  const approved = all.filter((e) => e.status === "APPROVED");

  // Local mock state: ids that accountant has "released for payment"
  const [released, setReleased] = useState<Set<number>>(new Set());
  const [flagged, setFlagged] = useState<Set<number>>(new Set());

  const handleRelease = (id: number) => {
    setReleased((prev) => new Set(prev).add(id));
    setFlagged((prev) => { const next = new Set(prev); next.delete(id); return next; });
  };

  const handleFlag = (id: number) => {
    setFlagged((prev) => new Set(prev).add(id));
    setReleased((prev) => { const next = new Set(prev); next.delete(id); return next; });
  };

  const pendingCheck = approved.filter((e) => !released.has(e.id) && !flagged.has(e.id));
  const releasedItems = approved.filter((e) => released.has(e.id));
  const flaggedItems = approved.filter((e) => flagged.has(e.id));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">{t("finance.check.title")}</h2>
        <p className="mt-1 text-sm text-neutral-500">
          {t("finance.check.subtitle")}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label={t("finance.check.stat_pending")} value={pendingCheck.length} color="warning" />
        <StatCard label={t("finance.check.stat_released")} value={releasedItems.length} color="success" />
        <StatCard label={t("finance.check.stat_flagged")} value={flaggedItems.length} color="error" />
      </div>

      {/* Pending table */}
      <Section title={t("finance.check.section_pending")} count={pendingCheck.length}>
        {isLoading ? (
          <Spinner />
        ) : pendingCheck.length === 0 ? (
          <Empty message={t("finance.check.empty_pending")} />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-5 py-3 text-left">{t("finance.check.col_type")}</th>
                <th className="px-5 py-3 text-left">{t("finance.check.col_title")}</th>
                <th className="px-5 py-3 text-left">{t("finance.check.col_amount")}</th>
                <th className="px-5 py-3 text-left">{t("finance.check.col_submitted")}</th>
                <th className="px-5 py-3 text-left">{t("finance.check.col_flags")}</th>
                <th className="px-5 py-3 text-left">{t("finance.check.col_actions")}</th>
              </tr>
            </thead>
            <tbody>
              {pendingCheck.map((e) => (
                <CheckRow
                  key={e.id}
                  expense={e}
                  onRelease={() => handleRelease(e.id)}
                  onFlag={() => handleFlag(e.id)}
                  labelClear={t("finance.check.flag_clear")}
                  labelRelease={t("finance.check.btn_release")}
                  labelHold={t("finance.check.btn_hold")}
                />
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* Released */}
      {releasedItems.length > 0 && (
        <Section title={t("finance.check.section_released")} count={releasedItems.length} accent="success">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-5 py-3 text-left">{t("finance.check.col_type")}</th>
                <th className="px-5 py-3 text-left">{t("finance.check.col_title")}</th>
                <th className="px-5 py-3 text-left">{t("finance.check.col_amount")}</th>
                <th className="px-5 py-3 text-left">{t("finance.check.col_actions")}</th>
              </tr>
            </thead>
            <tbody>
              {releasedItems.map((e) => (
                <SummaryRow key={e.id} expense={e} overrideStatus={t("finance.check.status_released")} statusColor="text-success-700" />
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {/* Flagged */}
      {flaggedItems.length > 0 && (
        <Section title={t("finance.check.section_flagged")} count={flaggedItems.length} accent="error">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-5 py-3 text-left">{t("finance.check.col_type")}</th>
                <th className="px-5 py-3 text-left">{t("finance.check.col_title")}</th>
                <th className="px-5 py-3 text-left">{t("finance.check.col_amount")}</th>
                <th className="px-5 py-3 text-right">{t("finance.check.col_actions")}</th>
              </tr>
            </thead>
            <tbody>
              {flaggedItems.map((e) => (
                <SummaryRow
                  key={e.id}
                  expense={e}
                  overrideStatus={t("finance.check.status_on_hold")}
                  statusColor="text-error-600"
                  action={
                    <button
                      onClick={() => handleRelease(e.id)}
                      className="text-xs text-primary-600 hover:underline"
                    >
                      {t("finance.check.btn_release_again")}
                    </button>
                  }
                />
              ))}
            </tbody>
          </table>
        </Section>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    warning: "text-warning-600",
    success: "text-success-600",
    error: "text-error-600",
  };
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${colorMap[color] ?? "text-neutral-900"}`}>{value}</p>
    </div>
  );
}

function Section({
  title,
  count,
  accent,
  children,
}: {
  title: string;
  count: number;
  accent?: "success" | "error";
  children: React.ReactNode;
}) {
  const borderColor = accent === "success" ? "border-success-200" : accent === "error" ? "border-error-200" : "border-neutral-200";
  return (
    <div className={`overflow-hidden rounded-xl border ${borderColor} bg-white shadow-sm`}>
      <div className="border-b border-neutral-100 px-5 py-3">
        <p className="font-semibold text-neutral-900">
          {title}{" "}
          <span className="ml-1 text-sm font-normal text-neutral-400">({count})</span>
        </p>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function CheckRow({
  expense,
  onRelease,
  onFlag,
  labelClear,
  labelRelease,
  labelHold,
}: {
  expense: Expense;
  onRelease: () => void;
  onFlag: () => void;
  labelClear: string;
  labelRelease: string;
  labelHold: string;
}) {
  const Icon = TYPE_ICON[expense.type] ?? Camera;
  const hasFlags = !!expense.aiFlags;

  return (
    <tr className="border-t border-neutral-100 hover:bg-neutral-50">
      <td className="px-5 py-3">
        <Icon className="h-4 w-4 text-neutral-500" />
      </td>
      <td className="max-w-[160px] truncate px-5 py-3 font-medium text-neutral-900">
        {expense.title || expense.vendorName || "—"}
      </td>
      <td className="px-5 py-3">
        {expense.amount != null ? `${expense.amount.toFixed(2)} €` : "—"}
      </td>
      <td className="px-5 py-3 text-neutral-500">{expense.submittedAt?.slice(0, 10) ?? "—"}</td>
      <td className="px-5 py-3">
        {hasFlags ? (
          <span className="flex items-center gap-1 text-xs text-warning-600">
            <AlertTriangle className="h-3 w-3" />
            {expense.aiFlags}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-success-600">
            <CheckCircle className="h-3 w-3" />
            {labelClear}
          </span>
        )}
      </td>
      <td className="px-5 py-3">
        <div className="flex gap-2">
          <button
            onClick={onRelease}
            className="rounded-md bg-success-50 px-2.5 py-1 text-xs font-medium text-success-700 hover:bg-success-100"
          >
            {labelRelease}
          </button>
          <button
            onClick={onFlag}
            className="rounded-md bg-error-50 px-2.5 py-1 text-xs font-medium text-error-700 hover:bg-error-100"
          >
            {labelHold}
          </button>
        </div>
      </td>
    </tr>
  );
}

function SummaryRow({
  expense,
  overrideStatus,
  statusColor,
  action,
}: {
  expense: Expense;
  overrideStatus: string;
  statusColor: string;
  action?: React.ReactNode;
}) {
  const Icon = TYPE_ICON[expense.type] ?? Camera;
  return (
    <tr className="border-t border-neutral-100">
      <td className="px-5 py-3">
        <Icon className="h-4 w-4 text-neutral-400" />
      </td>
      <td className="max-w-[200px] truncate px-5 py-3 text-neutral-700">
        {expense.title || expense.vendorName || "—"}
      </td>
      <td className="px-5 py-3">
        {expense.amount != null ? `${expense.amount.toFixed(2)} €` : "—"}
      </td>
      <td className={`px-5 py-3 text-xs font-medium ${statusColor}`}>
        {action ?? overrideStatus}
      </td>
    </tr>
  );
}

function Spinner() {
  return (
    <div className="flex h-32 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
    </div>
  );
}

function Empty({ message }: { message: string }) {
  return <p className="p-6 text-center text-sm text-neutral-400">{message}</p>;
}
