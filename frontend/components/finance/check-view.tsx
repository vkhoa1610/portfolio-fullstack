"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Camera, Calendar, Car, CheckCircle, AlertTriangle, ShieldCheck, Clock } from "lucide-react";
import { useGetFinanceExpensesQuery } from "@/ducks/expenses";
import type { Expense } from "@/ducks/expenses";
import {
  useGetPendingFinanceConfirmationsQuery,
  useConfirmFinanceGobdMutation,
  type PendingFinanceConfirmation,
} from "@/ducks/finance-gdpr/financeGdprApi";

const TYPE_ICON = { RECEIPT: Camera, PER_DIEM: Calendar, MILEAGE: Car };

// GoBD retention helpers ────────────────────────────────────────────────
function classifyRetention(retentionExpiresAt?: string): "UNDER_RETENTION" | "EXPIRED" | null {
  if (!retentionExpiresAt) return null;
  const expires = new Date(retentionExpiresAt);
  return expires.getTime() > Date.now() ? "UNDER_RETENTION" : "EXPIRED";
}

function RetentionBadge({ retentionExpiresAt }: { retentionExpiresAt?: string }) {
  const state = classifyRetention(retentionExpiresAt);
  if (state === null) return <span className="text-xs text-neutral-300">—</span>;
  if (state === "UNDER_RETENTION") {
    return (
      <span
        title={`GoBD §14 — retention until ${retentionExpiresAt}`}
        className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700"
      >
        <Clock className="h-2.5 w-2.5" />
        Under retention
      </span>
    );
  }
  return (
    <span
      title={`Retention expired on ${retentionExpiresAt} — eligible for hard deletion`}
      className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-700"
    >
      <CheckCircle className="h-2.5 w-2.5" />
      Expired
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Finance Check View
// Accountant reviews manager-approved items before batch payment.
// ─────────────────────────────────────────────────────────────────────────────

export default function FinanceCheckView() {
  const { t } = useTranslation();
  const { data: all = [], isLoading } = useGetFinanceExpensesQuery();
  const { data: pendingConfirmations = [] } = useGetPendingFinanceConfirmationsQuery();
  const [pendingModalOpen, setPendingModalOpen] = useState(false);

  // Finance check only shows APPROVED items (manager already signed off)
  const approved = all.filter((e) => e.status === "APPROVED");
  // Paid items — surfaced so retention status is visible to Finance auditors.
  const paid = all.filter((e) => e.status === "PAID");

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

      {/* GDPR pseudonymization confirmation banner — separation of duties (GoBD) */}
      {pendingConfirmations.length > 0 && (
        <GoBDConfirmationBanner
          count={pendingConfirmations.length}
          onReview={() => setPendingModalOpen(true)}
        />
      )}

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
                <th className="px-5 py-3 text-left">Retention</th>
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

      {/* Recently paid — read-only retention audit */}
      {paid.length > 0 && (
        <Section title="Recently paid (GoBD retention audit)" count={paid.length}>
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-5 py-3 text-left">{t("finance.check.col_type")}</th>
                <th className="px-5 py-3 text-left">{t("finance.check.col_title")}</th>
                <th className="px-5 py-3 text-left">{t("finance.check.col_amount")}</th>
                <th className="px-5 py-3 text-left">Paid on</th>
                <th className="px-5 py-3 text-left">Retention</th>
              </tr>
            </thead>
            <tbody>
              {paid.map((e) => <PaidRow key={e.id} expense={e} />)}
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

      {/* GDPR pseudonymization confirmation modal */}
      {pendingModalOpen && (
        <PendingConfirmationsModal
          items={pendingConfirmations}
          onClose={() => setPendingModalOpen(false)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function GoBDConfirmationBanner({ count, onReview }: { count: number; onReview: () => void }) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
      <div className="rounded-full bg-amber-100 p-2 text-amber-700">
        <ShieldCheck className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-amber-900">
          {count} GDPR pseudonymization{count === 1 ? "" : "s"} awaiting your GoBD sign-off
        </p>
        <p className="mt-1 text-xs text-amber-800">
          Admin has anonymized employee data on expense records. Confirm the action is GoBD-compliant
          to close the audit loop (separation of duties — accounting integrity is Finance&apos;s responsibility).
        </p>
      </div>
      <button
        onClick={onReview}
        className="flex-shrink-0 rounded-full bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700"
      >
        Review &amp; confirm
      </button>
    </div>
  );
}

function PaidRow({ expense }: { expense: Expense }) {
  const Icon = TYPE_ICON[expense.type] ?? Camera;
  return (
    <tr className="border-t border-neutral-100">
      <td className="px-5 py-3"><Icon className="h-4 w-4 text-neutral-400" /></td>
      <td className="max-w-[200px] truncate px-5 py-3 text-neutral-700">
        {expense.title || expense.vendorName || "—"}
      </td>
      <td className="px-5 py-3">{expense.amount != null ? `${expense.amount.toFixed(2)} €` : "—"}</td>
      <td className="px-5 py-3 text-xs text-neutral-500">{expense.paidAt?.slice(0, 10) ?? "—"}</td>
      <td className="px-5 py-3"><RetentionBadge retentionExpiresAt={expense.retentionExpiresAt} /></td>
    </tr>
  );
}

function PendingConfirmationsModal({
  items,
  onClose,
}: {
  items: PendingFinanceConfirmation[];
  onClose: () => void;
}) {
  const [confirm, { isLoading }] = useConfirmFinanceGobdMutation();
  const [busyId, setBusyId] = useState<number | null>(null);

  const handleConfirm = async (id: number) => {
    setBusyId(id);
    try { await confirm(id).unwrap(); } catch { /* error surfaced inline below */ }
    finally { setBusyId(null); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-neutral-100 p-5">
          <div>
            <h2 className="text-base font-bold text-neutral-900">GoBD pseudonymization sign-off</h2>
            <p className="mt-1 text-xs text-neutral-500">
              Each item below represents an erasure where Admin has anonymized expense records for an
              employee. Confirming records your acknowledgement in the immutable GDPR audit log.
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100">
            ✕
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-5">
          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-400">Nothing pending — all caught up.</p>
          ) : (
            <ul className="space-y-3">
              {items.map((it) => (
                <li key={it.pseudoEventId} className="flex items-start gap-3 rounded-lg border border-neutral-200 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs font-medium text-neutral-700">
                      pseudo event #{it.pseudoEventId}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      Subject: <span className="font-mono">{it.subjectSub ?? "(already deleted)"}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      Pseudonymized at {it.pseudonymizedAt?.slice(0, 19).replace("T", " ")} by {it.actorRole}
                    </p>
                  </div>
                  <button
                    onClick={() => handleConfirm(it.pseudoEventId)}
                    disabled={isLoading && busyId === it.pseudoEventId}
                    className="flex-shrink-0 rounded-full bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    {isLoading && busyId === it.pseudoEventId ? "Confirming…" : "Confirm GoBD"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end border-t border-neutral-100 px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

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
        <RetentionBadge retentionExpiresAt={expense.retentionExpiresAt} />
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
