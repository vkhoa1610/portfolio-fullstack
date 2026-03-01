"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Camera, Calendar, Car } from "lucide-react";
import { useGetFinanceExpensesQuery } from "@/ducks/expenses";
import { useAuth } from "@/common/context/AuthContext";
import type { Expense, ExpenseStatus, ExpenseType } from "@/ducks/expenses";

// i18n key map for expense types
const TYPE_I18N: Record<ExpenseType, string> = {
  RECEIPT: "finance.overview.type_receipt",
  PER_DIEM: "finance.overview.type_per_diem",
  MILEAGE: "finance.overview.type_mileage",
};

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<ExpenseStatus, string> = {
  DRAFT: "bg-neutral-100 text-neutral-600",
  PENDING_REVIEW: "bg-warning-100 text-warning-700",
  APPROVED: "bg-success-100 text-success-700",
  REJECTED: "bg-error-100 text-error-700",
  PAID: "bg-primary-100 text-primary-700",
};

const TYPE_ICON = { RECEIPT: Camera, PER_DIEM: Calendar, MILEAGE: Car };


const TYPE_COLOR: Record<ExpenseType, string> = {
  RECEIPT: "bg-primary-500",
  PER_DIEM: "bg-secondary-500",
  MILEAGE: "bg-warning-500",
};

// ─────────────────────────────────────────────────────────────────────────────
// Analytics helpers
// ─────────────────────────────────────────────────────────────────────────────

function groupByType(expenses: Expense[]) {
  const map: Partial<Record<ExpenseType, { total: number; count: number }>> = {};
  for (const e of expenses) {
    if (!map[e.type]) map[e.type] = { total: 0, count: 0 };
    map[e.type]!.total += e.amount ?? 0;
    map[e.type]!.count += 1;
  }
  return map;
}

function groupByMonth(expenses: Expense[]) {
  const map: Record<string, number> = {};
  for (const e of expenses) {
    const raw = e.submittedAt ?? e.createdAt;
    if (!raw) continue;
    const month = raw.slice(0, 7); // "YYYY-MM"
    map[month] = (map[month] ?? 0) + (e.amount ?? 0);
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6);
}

// ─────────────────────────────────────────────────────────────────────────────
// Finance Overview View
// ─────────────────────────────────────────────────────────────────────────────

export default function FinanceOverviewView() {
  const { t } = useTranslation();
  const { data: expenses = [], isLoading } = useGetFinanceExpensesQuery();
  const { session } = useAuth();

  const budget = session?.budget ?? 0;
  const totalSpend = useMemo(() => expenses.reduce((s, e) => s + (e.amount ?? 0), 0), [expenses]);
  const budgetUsedPct = budget > 0 ? Math.min((totalSpend / budget) * 100, 100) : 0;

  const approvedCount = expenses.filter((e) => e.status === "APPROVED").length;
  const pendingCount = expenses.filter((e) => e.status === "PENDING_REVIEW").length;
  const paidCount = expenses.filter((e) => e.status === "PAID").length;

  const byType = useMemo(() => groupByType(expenses), [expenses]);
  const byMonth = useMemo(() => groupByMonth(expenses), [expenses]);

  const maxMonthTotal = Math.max(...byMonth.map(([, v]) => v), 1);
  const maxTypeTotal = Math.max(
    ...(["RECEIPT", "PER_DIEM", "MILEAGE"] as ExpenseType[]).map(
      (expType) => byType[expType]?.total ?? 0,
    ),
    1,
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-neutral-900">{t("finance.overview.title")}</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label={t("finance.overview.kpi_total")} value={`${totalSpend.toFixed(2)} €`} />
        <KpiCard label={t("finance.overview.kpi_pending")} value={String(pendingCount)} accent="warning" />
        <KpiCard label={t("finance.overview.kpi_approved")} value={String(approvedCount)} accent="success" />
        <KpiCard label={t("finance.overview.kpi_paid")} value={String(paidCount)} accent="primary" />
      </div>

      {/* Budget Utilization */}
      {budget > 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-semibold text-neutral-900">{t("finance.overview.budget_title")}</p>
            <span className="text-sm text-neutral-500">
              {totalSpend.toFixed(0)} € / {budget.toFixed(0)} €
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                budgetUsedPct > 90
                  ? "bg-error-500"
                  : budgetUsedPct > 70
                    ? "bg-warning-500"
                    : "bg-success-500"
              }`}
              style={{ width: `${budgetUsedPct}%` }}
            />
          </div>
          <p className="mt-1 text-right text-xs text-neutral-400">{t("finance.overview.budget_used_pct", { pct: budgetUsedPct.toFixed(1) })}</p>
        </div>
      )}

      {/* Analytics Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Spend by Category */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="mb-4 font-semibold text-neutral-900">{t("finance.overview.chart_by_category")}</p>
          {isLoading ? (
            <Spinner />
          ) : (
            <div className="space-y-3">
              {(["RECEIPT", "PER_DIEM", "MILEAGE"] as ExpenseType[]).map((type) => {
                const data = byType[type] ?? { total: 0, count: 0 };
                const pct = maxTypeTotal > 0 ? (data.total / maxTypeTotal) * 100 : 0;
                return (
                  <div key={type}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-neutral-600">
                        {t(TYPE_I18N[type])}{" "}
                        <span className="text-neutral-400">({data.count})</span>
                      </span>
                      <span className="font-medium text-neutral-800">
                        {data.total.toFixed(2)} €
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${TYPE_COLOR[type]}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Spend by Month */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="mb-4 font-semibold text-neutral-900">{t("finance.overview.chart_by_month")}</p>
          {isLoading ? (
            <Spinner />
          ) : byMonth.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-400">{t("finance.overview.chart_no_data")}</p>
          ) : (
            <div className="flex h-32 items-end gap-2">
              {byMonth.map(([month, total]) => {
                const pct = (total / maxMonthTotal) * 100;
                const label = month.slice(5); // "MM"
                return (
                  <div key={month} className="group flex flex-1 flex-col items-center gap-1">
                    <div className="relative w-full" style={{ height: "7rem" }}>
                      <div className="absolute inset-x-0 bottom-0 overflow-hidden rounded-t bg-neutral-100" style={{ height: "7rem" }}>
                        <div
                          className="absolute inset-x-0 bottom-0 rounded-t bg-primary-500 transition-all duration-500"
                          style={{ height: `${pct}%` }}
                        />
                      </div>
                      {/* Tooltip */}
                      <div className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] text-white group-hover:block">
                        {total.toFixed(0)} €
                      </div>
                    </div>
                    <span className="text-[10px] text-neutral-400">{label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* All Expenses Table */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3">
          <p className="font-semibold text-neutral-900">{t("finance.overview.table_title")}</p>
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner />
          </div>
        ) : expenses.length === 0 ? (
          <p className="p-6 text-center text-sm text-neutral-400">{t("finance.overview.table_empty")}</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-5 py-3 text-left">{t("finance.overview.col_type")}</th>
                <th className="px-5 py-3 text-left">{t("finance.overview.col_title")}</th>
                <th className="px-5 py-3 text-left">{t("finance.overview.col_amount")}</th>
                <th className="px-5 py-3 text-left">{t("finance.overview.col_submitted")}</th>
                <th className="px-5 py-3 text-left">{t("finance.overview.col_status")}</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <ExpenseRow key={expense.id} expense={expense} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "warning" | "success" | "primary";
}) {
  const colorMap = {
    warning: "text-warning-600",
    success: "text-success-600",
    primary: "text-primary-600",
  };
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent ? colorMap[accent] : "text-neutral-900"}`}>
        {value}
      </p>
    </div>
  );
}

function ExpenseRow({ expense }: { expense: Expense }) {
  const Icon = TYPE_ICON[expense.type] ?? Camera;
  return (
    <tr className="border-t border-neutral-100 hover:bg-neutral-50">
      <td className="px-5 py-3">
        <Icon className="h-4 w-4 text-neutral-500" />
      </td>
      <td className="max-w-[180px] truncate px-5 py-3 font-medium text-neutral-900">
        {expense.title || expense.vendorName || "—"}
      </td>
      <td className="px-5 py-3">
        {expense.amount != null ? `${expense.amount.toFixed(2)} €` : "—"}
      </td>
      <td className="px-5 py-3 text-neutral-500">{expense.submittedAt?.slice(0, 10) ?? "—"}</td>
      <td className="px-5 py-3">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[expense.status]}`}
        >
          {expense.status.replace(/_/g, " ")}
        </span>
      </td>
    </tr>
  );
}

function Spinner() {
  return (
    <div className="flex h-16 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
    </div>
  );
}
