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
import { ScreenConfigSchema } from "@/lib/cms/schema";
import { CmsNode, type RenderContext } from "@/lib/cms/renderNode";

const SCREEN_KEY = "manager.approvals.detail";

export default function ApprovalDetailView({ id }: { id: number }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { hasFunctionId } = useAuth();

  const { data: expense, isLoading } = useGetManagerExpenseByIdQuery(id);
  const [approveExpense, { isLoading: isApproving }] = useApproveExpenseMutation();
  const [rejectExpense, { isLoading: isRejecting }] = useRejectExpenseMutation();

  // CMS screen config
  const { data: rawConfig, isLoading: isConfigLoading } = useGetScreenConfigQuery(SCREEN_KEY);

  // Form state: which form panel is active + textarea values
  const [activeFormId, setActiveFormId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  if (isLoading || isConfigLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  if (!expense) {
    return <p className="text-center text-neutral-500">{t("manager.approvals.not_found")}</p>;
  }

  const aiFlags: string[] = expense.aiFlags ? JSON.parse(expense.aiFlags) : [];

  // ── Action handlers passed into the render context ──────────────────────────

  const handleApprove = async () => {
    await approveExpense(id).unwrap();
    router.push("/manager/approvals");
  };

  const handleRejectOpen = () => {
    setActiveFormId("reject-form");
  };

  const handleRejectSubmit = async () => {
    const reason = formValues["txt-reason"] ?? "";
    if (!reason.trim()) return;
    await rejectExpense({ id, rejectionReason: reason }).unwrap();
    router.push("/manager/approvals");
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

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      {/* Static header — always shown */}
      <div className="mb-2">
        <h2 className="text-xl font-bold text-neutral-900">
          {t("manager.approvals.detail_title")}
        </h2>
        <p className="text-sm text-neutral-500">
          {t("manager.approvals.detail_subtitle")}
        </p>
      </div>

      {/* AI Flags — static, not CMS-driven */}
      {aiFlags.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-warning-200 bg-warning-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-warning-600" />
          <div>
            <p className="font-semibold text-warning-700">
              {t("manager.approvals.ai_warnings")}
            </p>
            {aiFlags.map((f, i) => (
              <p key={i} className="text-sm text-warning-600">{f}</p>
            ))}
          </div>
        </div>
      )}

      {/* CMS-driven section: expense info + action bar + reject form */}
      {parsed?.success ? (
        <CmsNode node={parsed.data.root} ctx={ctx} />
      ) : (
        // Fallback: static layout when CMS config unavailable or invalid
        <StaticFallback
          expense={expense}
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
      )}
    </div>
  );
}

// ── Static fallback when CMS config is unavailable ───────────────────────────

function StaticFallback({
  expense,
  isApproving,
  isRejecting,
  activeFormId,
  formValues,
  onFormChange,
  actionHandlers,
  t,
}: {
  expense: NonNullable<ReturnType<typeof useGetManagerExpenseByIdQuery>["data"]>;
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
      <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-3">
        <Row label={t("expense.detail.field_type")} value={expense.type} />
        <Row
          label={t("expense.detail.field_amount")}
          value={expense.amount != null ? `${expense.amount.toFixed(2)} €` : "—"}
        />
        {expense.vendorName && (
          <Row label={t("expense.detail.field_vendor")} value={expense.vendorName} />
        )}
        <Row
          label={t("expense.detail.field_submitted_at")}
          value={expense.submittedAt?.slice(0, 10) ?? "—"}
        />
      </div>

      {activeFormId === "reject-form" ? (
        <div className="rounded-xl border border-error-200 bg-error-50 p-4 space-y-3">
          <p className="font-semibold text-error-700">{t("manager.rejection_reason")}</p>
          <textarea
            value={reason}
            onChange={(e) => onFormChange("txt-reason", e.target.value)}
            placeholder={t("manager.approvals.reject_placeholder")}
            rows={3}
            className="w-full rounded-lg border border-error-300 px-3 py-2 text-sm focus:outline-none"
          />
          <button
            onClick={actionHandlers["EXPENSE_REJECT_SUBMIT"]}
            disabled={isRejecting || !reason.trim()}
            className="w-full rounded-lg bg-error-600 py-2 text-sm font-semibold text-white hover:bg-error-700 disabled:opacity-60"
          >
            {t("manager.btn.confirm_reject")}
          </button>
        </div>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={actionHandlers["EXPENSE_REJECT"]}
            className="flex-1 rounded-lg border border-error-300 py-3 text-sm font-semibold text-error-600 hover:bg-error-50"
          >
            {t("manager.btn.reject")}
          </button>
          <button
            onClick={actionHandlers["EXPENSE_ACCEPT"]}
            disabled={isApproving}
            className="flex-1 rounded-lg bg-success-600 py-3 text-sm font-semibold text-white hover:bg-success-700 disabled:opacity-60"
          >
            {t("manager.btn.accept")}
          </button>
        </div>
      )}
    </>
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
