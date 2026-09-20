"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useGetManagerQueueQuery } from "@/ducks/expenses";
import { useAuth } from "@/common/context/AuthContext";
import PageHeader from "@/components/layout/PageHeader";
import ExpenseListRow from "@/components/expenses/shared/ExpenseListRow";
import rowStyles from "@/components/expenses/shared/ExpenseListRow.module.css";
import styles from "./approvals-view.module.css";

type TabStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "ALL";
const TABS: TabStatus[] = ["PENDING_REVIEW", "APPROVED", "REJECTED", "ALL"];
const TAB_LABEL_KEY: Record<TabStatus, string> = {
  PENDING_REVIEW: "manager.approvals.tab_pending",
  APPROVED: "manager.approvals.tab_approved",
  REJECTED: "manager.approvals.tab_rejected",
  ALL: "manager.approvals.tab_all",
};
const EMPTY_KEY: Record<TabStatus, string> = {
  PENDING_REVIEW: "manager.approvals.empty",
  APPROVED: "manager.approvals.empty_approved",
  REJECTED: "manager.approvals.empty_rejected",
  ALL: "manager.approvals.empty_all",
};

function isTabStatus(value: string | null): value is TabStatus {
  return !!value && (TABS as string[]).includes(value);
}

export default function ApprovalsView() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, isLoading: isAuthLoading, hasPermission } = useAuth();

  const activeTab: TabStatus = isTabStatus(searchParams.get("status"))
    ? (searchParams.get("status") as TabStatus)
    : "PENDING_REVIEW";

  // Sidebar/header badge always counts Pending, regardless of which tab is
  // open — it shares the RTK Query cache entry with the Pending tab itself
  // (same arg → same cache key), so this costs nothing extra when Pending
  // is already the active tab.
  const { data: pendingForBadge = [] } = useGetManagerQueueQuery({ status: "PENDING_REVIEW" });
  const { data: expenses = [], isLoading } = useGetManagerQueueQuery({ status: activeTab });

  // Post-approve/reject notice: approval-detail-view redirects back here
  // with ?justProcessed=APPROVED:17 (or REJECTED:17) instead of a toast
  // library — this codebase doesn't have one — so it survives the
  // navigation and gives the manager a way to jump straight to where the
  // expense they just decided on now lives.
  const justProcessed = searchParams.get("justProcessed");
  const [justProcessedAction, justProcessedId] = justProcessed?.split(":") ?? [];
  const noticeTab: TabStatus = justProcessedAction === "REJECTED" ? "REJECTED" : "APPROVED";

  const dismissNotice = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("justProcessed");
    router.replace(`/manager/approvals?${params.toString()}`);
  };

  const viewInTab = (tab: TabStatus) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("justProcessed");
    params.set("status", tab);
    router.replace(`/manager/approvals?${params.toString()}`);
  };

  // Permission check: must have EXPENSE_APPROVE to access this page
  useEffect(() => {
    if (!isAuthLoading && session !== null && !hasPermission("EXPENSE_APPROVE")) {
      router.replace("/not-found");
    }
  }, [isAuthLoading, session, hasPermission, router]);

  return (
    <div>
      <PageHeader
        title={t("manager.approvals.title")}
        subtitle={t("manager.approvals.subtitle")}
        badges={[
          { icon: "hourglass_empty", label: t("manager.approvals.pending_count", { count: pendingForBadge.length }) },
        ]}
      />

      <div className="space-y-4 p-6">
        {justProcessed && (
          <div className={styles.notice}>
            <p>
              {t(
                justProcessedAction === "REJECTED"
                  ? "manager.approvals.toast_rejected"
                  : "manager.approvals.toast_approved",
                { id: justProcessedId }
              )}
            </p>
            <div className={styles.noticeActions}>
              <button onClick={() => viewInTab(noticeTab)} className={styles.noticeLink}>
                {t(`manager.approvals.view_in_${noticeTab === "REJECTED" ? "rejected" : "approved"}`)}
              </button>
              <button onClick={dismissNotice} className={styles.noticeDismiss} aria-label={t("manager.btn.dismiss", { defaultValue: "Dismiss" })}>
                ×
              </button>
            </div>
          </div>
        )}

        <div className={styles.tabs}>
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => viewInTab(tab)}
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
            >
              {t(TAB_LABEL_KEY[tab])}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <div className={styles.spinner} />
          </div>
        ) : expenses.length === 0 ? (
          <div className={styles.emptyState}>
            <p>{t(EMPTY_KEY[activeTab])}</p>
          </div>
        ) : (
          <>
            {/* Table header — Pending is sorted oldest-submitted-first
                (SLA: the longer a claim waits, the closer to the top);
                history tabs sort most-recently-reviewed first. */}
            <div className={rowStyles.tableHeaderManager}>
              <div className={rowStyles.thCell}>{t("manager.approvals.th_employee")}</div>
              <div className={rowStyles.thCell}>{t("manager.approvals.th_description")}</div>
              <div className={rowStyles.thCell}>{t("manager.approvals.th_type")}</div>
              <div className={`${rowStyles.thCell} ${rowStyles.thCenter}`}>{t("manager.approvals.th_expense_date")}</div>
              <div className={`${rowStyles.thCell} ${rowStyles.thCenter}`}>
                {t(activeTab === "PENDING_REVIEW" ? "manager.approvals.th_submitted" : "manager.approvals.th_reviewed")}
              </div>
              <div className={`${rowStyles.thCell} ${rowStyles.thCenter}`}>{t("manager.approvals.th_flags")}</div>
              <div className={`${rowStyles.thCell} ${rowStyles.thRight}`}>{t("manager.approvals.th_amount")}</div>
            </div>

            <div className="space-y-2">
              {expenses.map((expense) => (
                <ExpenseListRow
                  key={expense.id}
                  expense={expense}
                  variant="manager"
                  onClick={() => router.push(`/manager/approvals/${expense.id}`)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
