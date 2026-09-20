"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import {
  useGetManagerExpenseByIdQuery,
  useApproveExpenseMutation,
  useRejectExpenseMutation,
} from "@/ducks/expenses";
import { useAuth } from "@/common/context/AuthContext";
import { useGetScreenConfigQuery } from "@/ducks/cms/cmsApi";
import PageHeader from "@/components/layout/PageHeader";
import ExpenseDetailBody from "@/components/expenses/detail/ExpenseDetailBody";
import { TYPE_ICON, STATUS_LABEL, STATUS_ICON, fmtAmount } from "@/components/expenses/detail/detail-builders";
import { fmtDateDe } from "@/components/expenses/shared/format";
import styles from "./approval-detail-view.module.css";
import { ScreenConfigSchema } from "@/lib/cms/schema";
import { CmsNode, type RenderContext } from "@/lib/cms/renderNode";

const SCREEN_KEY = "manager.approvals.detail";

/** RTK Query's .unwrap() rejects with a FetchBaseQueryError (has `data`,
 *  the BFF's `{ message: string[] }` body) or a plain SerializedError (has
 *  `message: string`) — normalize both into one string for display. */
function extractErrorMessage(err: unknown): string {
  if (err && typeof err === "object") {
    const data = (err as { data?: unknown }).data;
    if (data && typeof data === "object" && Array.isArray((data as { message?: unknown }).message)) {
      const [first] = (data as { message: unknown[] }).message;
      if (typeof first === "string") return first;
    }
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "Something went wrong. Please try again.";
}

export default function ApprovalDetailView({ id }: { id: number }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { hasFunctionId } = useAuth();

  const { data: expense, isLoading, refetch } = useGetManagerExpenseByIdQuery(id);
  const [approveExpense, { isLoading: isApproving }] = useApproveExpenseMutation();
  const [rejectExpense, { isLoading: isRejecting }] = useRejectExpenseMutation();

  // CMS screen config
  const { data: rawConfig, isLoading: isConfigLoading } = useGetScreenConfigQuery(SCREEN_KEY);

  // Form state: which form panel is active + textarea values
  const [activeFormId, setActiveFormId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState<string | null>(null);

  if (isLoading || isConfigLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className={styles.spinner} />
      </div>
    );
  }

  if (!expense) {
    return <p className="text-center text-neutral-500">{t("manager.approvals.not_found")}</p>;
  }

  const aiFlags: string[] = expense.aiFlags ? JSON.parse(expense.aiFlags) : [];

  // ── Action handlers passed into the render context ──────────────────────────

  const handleApprove = async () => {
    setActionError(null);
    try {
      await approveExpense(id).unwrap();
      router.push(`/manager/approvals?justProcessed=APPROVED:${id}`);
    } catch (err) {
      // 409 = someone else (or another tab) already reviewed this expense —
      // the backend's status guard caught it. Surface it instead of
      // silently failing; refetch so the stale Approve/Reject buttons go
      // away once the manager sees the current status.
      setActionError(extractErrorMessage(err));
      refetch();
    }
  };

  const handleRejectOpen = () => {
    setActiveFormId("reject-form");
  };

  const handleRejectSubmit = async () => {
    const reason = formValues["txt-reason"] ?? "";
    if (!reason.trim()) return;
    setActionError(null);
    try {
      await rejectExpense({ id, rejectionReason: reason }).unwrap();
      router.push(`/manager/approvals?justProcessed=REJECTED:${id}`);
    } catch (err) {
      setActionError(extractErrorMessage(err));
      refetch();
    }
  };

  const actionHandlers: Record<string, () => void> = {
    EXPENSE_ACCEPT:       handleApprove,
    EXPENSE_REJECT:       handleRejectOpen,
    EXPENSE_REJECT_SUBMIT: handleRejectSubmit,
  };

  // ── Parse CMS config (Zod safeParse → fallback to static if invalid) ────────

  const parsed = rawConfig ? ScreenConfigSchema.safeParse(rawConfig) : null;

  const ctx: RenderContext = {
    hasFunctionId,
    expense,
    actionHandlers,
    formValues,
    onFormChange: (nodeId, value) =>
      setFormValues((prev) => ({ ...prev, [nodeId]: value })),
    activeFormId,
    t,
  };

  const typeLabel =
    expense.type === "RECEIPT" ? "Receipt" :
    expense.type === "PER_DIEM" ? "Per Diem" : "Mileage";

  return (
    <div>
      <PageHeader
        title={expense.title ?? `${typeLabel} #${expense.id}`}
        badges={[
          { icon: TYPE_ICON[expense.type], label: typeLabel },
          { icon: STATUS_ICON[expense.status], label: STATUS_LABEL[expense.status] },
        ]}
        backHref="/manager/approvals"
        backLabel={t("common.back", { defaultValue: "Back" })}
        totalLabel="Claim Amount"
        totalValue={fmtAmount(expense.amount, expense.currency)}
      />

      <div className="space-y-4 p-6">
      {/* AI Flags — static, not CMS-driven. Same underlying aiFlags data is
          also surfaced in ExpenseDetailBody's insight panel for RECEIPT
          claims; this banner keeps it visible above the fold before the
          manager scrolls, specifically for the approve/reject decision. */}
      {aiFlags.length > 0 && (
        <div className={styles.aiFlags}>
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning-600" />
          <div>
            <p className={styles.aiFlagsTitle}>{t("manager.approvals.ai_warnings")}</p>
            {aiFlags.map((f, i) => (
              <p key={i} className={styles.aiFlagItem}>{f}</p>
            ))}
          </div>
        </div>
      )}

      {/* Same type-aware body (receipt image / trip dates / distance) the
          employee sees on their own expense detail page — a manager needs
          the same evidence to make an informed decision, not a generic
          4-field summary. */}
      <ExpenseDetailBody expense={expense} />

      {actionError && (
        <div className={styles.actionError}>
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{actionError}</p>
        </div>
      )}

      {/* Once an expense has been decided, there's nothing left to approve
          or reject — showing the action bar again would let a manager
          "re-approve" an already-PAID claim (the backend rejects that with
          409, but the button shouldn't invite it in the first place). */}
      {expense.status === "PENDING_REVIEW" ? (
        parsed?.success ? (
          <CmsNode node={parsed.data.root} ctx={ctx} />
        ) : (
          <StaticFallback
            isApproving={isApproving}
            isRejecting={isRejecting}
            activeFormId={activeFormId}
            formValues={formValues}
            onFormChange={(nodeId, value) =>
              setFormValues((prev) => ({ ...prev, [nodeId]: value }))
            }
            actionHandlers={actionHandlers}
            t={t}
          />
        )
      ) : (
        <ReviewedSummary expense={expense} t={t} />
      )}
      </div>
    </div>
  );
}

// ── Read-only summary shown once an expense has been decided (Approved,
// Rejected, or Paid) — replaces the Approve/Reject action bar. ────────────

function ReviewedSummary({
  expense,
  t,
}: {
  expense: NonNullable<ReturnType<typeof useGetManagerExpenseByIdQuery>["data"]>;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const reviewerName = expense.reviewerName?.trim() || "[Deleted user]";
  const reviewedDate = fmtDateDe(expense.reviewedAt?.slice(0, 10));

  return (
    <div className={styles.reviewedSummary}>
      {expense.status === "REJECTED" ? (
        <>
          <p className={styles.reviewedSummaryTitle}>
            {t("manager.approvals.rejected_by", { name: reviewerName, date: reviewedDate })}
          </p>
          {expense.rejectionReason && (
            <p className={styles.reviewedSummaryDetail}>{expense.rejectionReason}</p>
          )}
        </>
      ) : (
        <>
          <p className={styles.reviewedSummaryTitle}>
            {t("manager.approvals.approved_by", { name: reviewerName, date: reviewedDate })}
          </p>
          {expense.status === "PAID" && expense.paidAt && (
            <p className={styles.reviewedSummaryDetail}>
              {t("manager.approvals.paid_on", { date: fmtDateDe(expense.paidAt.slice(0, 10)) })}
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ── Static fallback when CMS config is unavailable ───────────────────────────

function StaticFallback({
  isApproving,
  isRejecting,
  activeFormId,
  formValues,
  onFormChange,
  actionHandlers,
  t,
}: {
  isApproving: boolean;
  isRejecting: boolean;
  activeFormId: string | null;
  formValues: Record<string, string>;
  onFormChange: (nodeId: string, value: string) => void;
  actionHandlers: Record<string, () => void>;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const reason = formValues["txt-reason"] ?? "";

  return (
    <>
      {activeFormId === "reject-form" ? (
        <div className={`space-y-3 ${styles.rejectPanel}`}>
          <p className={styles.rejectTitle}>{t("manager.rejection_reason")}</p>
          <textarea
            value={reason}
            onChange={(e) => onFormChange("txt-reason", e.target.value)}
            placeholder={t("manager.approvals.reject_placeholder")}
            rows={3}
            className={styles.rejectTextarea}
          />
          <button
            onClick={actionHandlers["EXPENSE_REJECT_SUBMIT"]}
            disabled={isRejecting || !reason.trim()}
            className={styles.btnRejectConfirm}
          >
            {t("manager.btn.confirm_reject")}
          </button>
        </div>
      ) : (
        <div className="flex gap-3">
          <button onClick={actionHandlers["EXPENSE_REJECT"]} className={styles.btnReject}>
            {t("manager.btn.reject")}
          </button>
          <button
            onClick={actionHandlers["EXPENSE_ACCEPT"]}
            disabled={isApproving}
            className={styles.btnApprove}
          >
            {t("manager.btn.accept")}
          </button>
        </div>
      )}
    </>
  );
}
