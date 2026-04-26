"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Plus, Camera, Calendar, Car, Sparkles, TrendingDown, TrendingUp, ListFilter, ArrowUpDown } from "lucide-react";
import { useGetExpensesQuery } from "@/ducks/expenses";
import type { Expense, ExpenseStatus } from "@/ducks/expenses";
import styles from "./expense-list-view.module.css";
import PageHeader from "@/components/layout/PageHeader";

const STATUS_CLASS: Record<ExpenseStatus, string> = {
  DRAFT: styles.statusDraft,
  PENDING_REVIEW: styles.statusPendingReview,
  APPROVED: styles.statusApproved,
  REJECTED: styles.statusRejected,
  PAID: styles.statusPaid,
};

const TYPE_ICON = {
  RECEIPT: Camera,
  PER_DIEM: Calendar,
  MILEAGE: Car,
};

function computeStats(expenses: Expense[]) {
  const now = new Date();
  const ym = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const currentMonth = ym(now);
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = ym(lastMonthDate);
  const currentYear = now.getFullYear().toString();

  const sum = (list: Expense[]) =>
    list.reduce((s, e) => s + (e.amount ?? 0), 0);

  const mtdList = expenses.filter((e) => e.createdAt?.startsWith(currentMonth));
  const lastMtdList = expenses.filter((e) =>
    e.createdAt?.startsWith(lastMonth)
  );
  const pendingList = expenses.filter((e) => e.status === "PENDING_REVIEW");
  const paidList = expenses.filter(
    (e) => e.status === "PAID" && e.createdAt?.startsWith(currentYear)
  );

  const mtd = sum(mtdList);
  const lastMtd = sum(lastMtdList);
  const mtdChange =
    lastMtd > 0 ? Math.round(((mtd - lastMtd) / lastMtd) * 100) : null;

  return {
    mtd,
    mtdChange,
    pendingAmount: sum(pendingList),
    pendingCount: pendingList.length,
    reimbursedYTD: sum(paidList),
  };
}

export default function ExpenseListView() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: expenses = [], isLoading } = useGetExpensesQuery();

  const STATUS_LABEL: Record<ExpenseStatus, string> = {
    DRAFT: t("expense.list.status_draft"),
    PENDING_REVIEW: t("expense.list.status_pending"),
    APPROVED: t("expense.list.status_approved"),
    REJECTED: t("expense.list.status_rejected"),
    PAID: "Paid",
  };

  const stats = computeStats(expenses);

  return (
    <div>
      <PageHeader
        title={t("expense.list.title", { defaultValue: "My Expenses" })}
        subtitle={t("expense.list.subtitle", { defaultValue: "Manage and track all your expense claims in one place." })}
        actions={
          <>
            <button className={styles.btnExport}>Export CSV</button>
            <button onClick={() => router.push("/my-expenses/create")} className={styles.btnNew}>
              <Plus className="h-4 w-4" />
              {t("expense.list.btn_new")}
            </button>
          </>
        }
      />

      <div className={styles.content}>
      {/* ── Bento Grid ── */}
      <div className={styles.bentoGrid}>
        {/* Stats */}
        <div className={styles.statsArea}>
          {/* Total Spent MTD */}
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total Spent (MTD)</span>
            <div>
              <p className={styles.statValue}>
                {stats.mtd.toLocaleString("de-DE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                €
              </p>
              {stats.mtdChange !== null ? (
                stats.mtdChange <= 0 ? (
                  <p className={styles.statTrendDown}>
                    <TrendingDown className="h-3.5 w-3.5" />
                    {Math.abs(stats.mtdChange)}% vs last month
                  </p>
                ) : (
                  <p className={styles.statTrendUp}>
                    <TrendingUp className="h-3.5 w-3.5" />
                    {stats.mtdChange}% vs last month
                  </p>
                )
              ) : (
                <p className={styles.statSub}>Current month</p>
              )}
            </div>
          </div>

          {/* Pending */}
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Pending</span>
            <div>
              <p className={styles.statValue}>
                {stats.pendingAmount.toLocaleString("de-DE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                €
              </p>
              <p className={styles.statSub}>
                {stats.pendingCount}{" "}
                {stats.pendingCount === 1
                  ? "item awaiting approval"
                  : "items awaiting approval"}
              </p>
            </div>
          </div>

          {/* Reimbursed YTD */}
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Reimbursed</span>
            <div>
              <p className={styles.statValue}>
                {stats.reimbursedYTD.toLocaleString("de-DE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                €
              </p>
              <p className={styles.statSub}>YTD Total</p>
            </div>
          </div>
        </div>

        {/* Editorial Insight */}
        <div className={styles.insightArea}>
          <div className={styles.insightCard}>
            <div className={styles.insightAccent} />
            <div className={styles.insightContent}>
              <div className={styles.insightHeader}>
                <div className={styles.insightIconWrapper}>
                  <Sparkles className="h-4 w-4" />
                </div>
                <span className={styles.insightTag}>Editorial Insight</span>
              </div>
              <h3 className={styles.insightTitle}>
                Submit expenses promptly to avoid reimbursement delays.
              </h3>
              <p className={styles.insightBody}>
                Expenses submitted within 3 days of the transaction are approved
                40% faster on average.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Expenses ── */}
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Recent Expenses</h3>
        <div className={styles.tableActions}>
          <button className={styles.tableActionBtn}>
            <ListFilter className="h-5 w-5" />
          </button>
          <button className={styles.tableActionBtn}>
            <ArrowUpDown className="h-5 w-5" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className={styles.spinner} />
        </div>
      ) : expenses.length === 0 ? (
        <div className={styles.emptyState}>
          <Camera className="mb-2 h-8 w-8" />
          <p>{t("expense.list.empty")}</p>
        </div>
      ) : (
        <>
          {/* Table header */}
          <div className={styles.tableHeader}>
            <div className={styles.thCell}>Description</div>
            <div className={`${styles.thCell} ${styles.thCenter}`}>Status</div>
            <div className={`${styles.thCell} ${styles.thCenter}`}>Date</div>
            <div className={`${styles.thCell} ${styles.thRight}`}>Amount</div>
          </div>

          {/* Rows */}
          <div className="flex flex-col gap-3">
            {expenses.map((expense) => (
              <ExpenseRow
                key={expense.id}
                expense={expense}
                statusLabel={STATUS_LABEL[expense.status]}
                statusClass={STATUS_CLASS[expense.status]}
                onClick={() => router.push(`/my-expenses/${expense.id}`)}
              />
            ))}
          </div>
        </>
      )}
      </div>
    </div>
  );
}

function ExpenseRow({
  expense,
  statusLabel,
  statusClass,
  onClick,
}: {
  expense: Expense;
  statusLabel: string;
  statusClass: string;
  onClick: () => void;
}) {
  const Icon = TYPE_ICON[expense.type] ?? Camera;
  const label = expense.title || expense.vendorName || expense.type;
  const sub =
    expense.type === "RECEIPT"
      ? expense.vendorName
        ? `${expense.vendorName} • Receipt`
        : "Receipt"
      : expense.type === "PER_DIEM"
      ? `${expense.tripFrom ?? ""} → ${expense.tripTo ?? ""} • Per Diem`.trim()
      : `${expense.distanceKm ?? ""} km • Mileage`;

  const dateStr = expense.receiptDate ?? expense.createdAt?.slice(0, 10) ?? "—";

  return (
    <button onClick={onClick} className={styles.row}>
      {/* Description */}
      <div className={styles.rowDesc}>
        <div className={styles.rowIconWrapper}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className={`truncate ${styles.rowLabel}`}>{label}</p>
          <p className={styles.rowSub}>{sub}</p>
        </div>
      </div>

      {/* Status */}
      <div className={styles.rowStatusCell}>
        <span className={`${styles.badge} ${statusClass}`}>{statusLabel}</span>
      </div>

      {/* Date */}
      <div className={styles.rowDateCell}>{dateStr}</div>

      {/* Amount */}
      <div className={styles.rowAmountCell}>
        {expense.amount != null
          ? `${expense.amount.toLocaleString("de-DE", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} €`
          : "—"}
      </div>
    </button>
  );
}
