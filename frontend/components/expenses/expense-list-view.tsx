"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Plus, Camera, Sparkles, TrendingDown, TrendingUp, ListFilter, ArrowUpDown } from "lucide-react";
import { useGetExpensesQuery } from "@/ducks/expenses";
import type { Expense, ExpenseStatus } from "@/ducks/expenses";
import { useGetPolicyInsightMutation } from "@/ducks/cms/cmsApi";
import styles from "./expense-list-view.module.css";
import rowStyles from "./shared/ExpenseListRow.module.css";
import PageHeader from "@/components/layout/PageHeader";
import ExpenseListRow from "./shared/ExpenseListRow";

const STATUS_CLASS: Record<ExpenseStatus, string> = {
  DRAFT: rowStyles.statusDraft,
  PENDING_REVIEW: rowStyles.statusPendingReview,
  APPROVED: rowStyles.statusApproved,
  REJECTED: rowStyles.statusRejected,
  PAID: rowStyles.statusPaid,
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
  const lastMtdList = expenses.filter((e) => e.createdAt?.startsWith(lastMonth));
  const pendingList = expenses.filter((e) => e.status === "PENDING_REVIEW");
  const paidList = expenses.filter(
    (e) => e.status === "PAID" && e.createdAt?.startsWith(currentYear)
  );

  const mtd = sum(mtdList);
  const lastMtd = sum(lastMtdList);
  const mtdChange =
    lastMtd > 0 ? Math.round(((mtd - lastMtd) / lastMtd) * 100) : null;

  const byCategory: Record<string, number> = {};
  for (const e of expenses) {
    byCategory[e.type] = (byCategory[e.type] ?? 0) + (e.amount ?? 0);
  }
  const topCategory =
    Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";

  return {
    mtd,
    lastMtd,
    mtdChange,
    pendingAmount: sum(pendingList),
    pendingCount: pendingList.length,
    reimbursedYTD: sum(paidList),
    rejectedCount: expenses.filter((e) => e.status === "REJECTED").length,
    topCategory,
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

  // ── AI Insight ──────────────────────────────────────────
  const [getInsight] = useGetPolicyInsightMutation();
  const [aiTitle, setAiTitle] = useState<string | null>(null);
  const [aiBody, setAiBody] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (expenses.length === 0) return;
    setAiLoading(true);
    setAiTitle(null);
    setAiBody(null);
    const timer = setTimeout(async () => {
      try {
        const res = await getInsight({
          type: "EXPENSE_SUMMARY",
          context: {
            mtd: stats.mtd,
            lastMtd: stats.lastMtd,
            mtdChange: stats.mtdChange,
            pendingCount: stats.pendingCount,
            pendingAmount: stats.pendingAmount,
            reimbursedYTD: stats.reimbursedYTD,
            rejectedCount: stats.rejectedCount,
            topCategory: stats.topCategory,
          },
        }).unwrap();
        const lines = (res.insight ?? "").trim().split("\n").filter(Boolean);
        setAiTitle(lines[0] ?? null);
        setAiBody(lines.slice(1).join(" ") || null);
      } catch {
        // fall through to static fallback text
      } finally {
        setAiLoading(false);
      }
    }, 800);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses.length, stats.pendingCount]);

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
                {(aiLoading || aiTitle) && (
                  <span className={styles.aiPill}>AI</span>
                )}
              </div>
              {aiLoading ? (
                <div className={styles.insightSkeleton}>
                  <div className={styles.insightSkeletonLine} />
                  <div className={`${styles.insightSkeletonLine} ${styles.insightSkeletonLineShort}`} />
                  <div className={`${styles.insightSkeletonLine} ${styles.insightSkeletonLineMid}`} />
                </div>
              ) : (
                <>
                  <h3 className={styles.insightTitle}>
                    {aiTitle ?? "Submit expenses promptly to avoid reimbursement delays."}
                  </h3>
                  <p className={styles.insightBody}>
                    {aiBody ?? "Expenses submitted within 3 days of the transaction are approved 40% faster on average."}
                  </p>
                </>
              )}
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
          <div className={rowStyles.tableHeaderEmployee}>
            <div className={rowStyles.thCell}>Description</div>
            <div className={`${rowStyles.thCell} ${rowStyles.thCenter}`}>Status</div>
            <div className={`${rowStyles.thCell} ${rowStyles.thCenter}`}>Date</div>
            <div className={`${rowStyles.thCell} ${rowStyles.thRight}`}>Amount</div>
          </div>

          {/* Rows */}
          <div className="flex flex-col gap-3">
            {expenses.map((expense) => (
              <ExpenseListRow
                key={expense.id}
                expense={expense}
                variant="employee"
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

