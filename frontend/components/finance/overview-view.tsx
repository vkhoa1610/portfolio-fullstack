"use client";

import { Camera, Calendar, Car } from "lucide-react";
import { useGetManagerQueueQuery } from "@/ducks/expenses";
import type { Expense, ExpenseStatus } from "@/ducks/expenses";

const STATUS_BADGE: Record<ExpenseStatus, string> = {
  DRAFT: "bg-neutral-100 text-neutral-600",
  PENDING_REVIEW: "bg-warning-100 text-warning-700",
  APPROVED: "bg-success-100 text-success-700",
  REJECTED: "bg-error-100 text-error-700",
};

const TYPE_ICON = { RECEIPT: Camera, PER_DIEM: Calendar, MILEAGE: Car };

export default function FinanceOverviewView() {
  // Finance sees the pending queue (can be extended to "all expenses" endpoint later)
  const { data: expenses = [], isLoading } = useGetManagerQueueQuery();

  const totalAmount = expenses.reduce((sum, e) => sum + (e.amount ?? 0), 0);
  const approvedCount = expenses.filter((e) => e.status === "APPROVED").length;
  const pendingCount = expenses.filter((e) => e.status === "PENDING_REVIEW").length;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-neutral-900">Finance Overview</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Total Submitted" value={`${totalAmount.toFixed(2)} €`} />
        <KpiCard label="Pending Review" value={String(pendingCount)} accent="warning" />
        <KpiCard label="Approved" value={String(approvedCount)} accent="success" />
        <KpiCard label="Total Items" value={String(expenses.length)} />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-neutral-100 px-5 py-3 flex items-center justify-between">
          <p className="font-semibold text-neutral-900">All Expenses</p>
          <button className="text-sm text-primary-600 hover:underline">Export CSV</button>
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          </div>
        ) : expenses.length === 0 ? (
          <p className="p-6 text-center text-sm text-neutral-400">No expenses found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-5 py-3 text-left">Type</th>
                <th className="px-5 py-3 text-left">Title</th>
                <th className="px-5 py-3 text-left">Amount</th>
                <th className="px-5 py-3 text-left">Submitted</th>
                <th className="px-5 py-3 text-left">Status</th>
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

function KpiCard({ label, value, accent }: { label: string; value: string; accent?: "warning" | "success" }) {
  const colorMap = { warning: "text-warning-600", success: "text-success-600" };
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent ? colorMap[accent] : "text-neutral-900"}`}>{value}</p>
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
      <td className="px-5 py-3 font-medium text-neutral-900 max-w-[180px] truncate">
        {expense.title || expense.vendorName || "—"}
      </td>
      <td className="px-5 py-3">{expense.amount != null ? `${expense.amount.toFixed(2)} €` : "—"}</td>
      <td className="px-5 py-3 text-neutral-500">{expense.submittedAt?.slice(0, 10) ?? "—"}</td>
      <td className="px-5 py-3">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[expense.status]}`}>
          {expense.status.replace("_", " ")}
        </span>
      </td>
    </tr>
  );
}
