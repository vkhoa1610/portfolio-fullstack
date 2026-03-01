"use client";

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Camera, Calendar, Car, Download, CheckSquare, Square, CreditCard } from "lucide-react";
import { useGetFinanceExpensesQuery, useMarkAsPaidMutation } from "@/ducks/expenses";
import type { Expense } from "@/ducks/expenses";

const TYPE_ICON = { RECEIPT: Camera, PER_DIEM: Calendar, MILEAGE: Car };

// ─────────────────────────────────────────────────────────────────────────────
// SEPA XML generator (mock — pain.001.001.03 simplified)
// ─────────────────────────────────────────────────────────────────────────────

function generateSepaXml(expenses: Expense[]): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const msgId = `MSG-${dateStr.replace(/-/g, "")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
  const total = expenses.reduce((s, e) => s + (e.amount ?? 0), 0).toFixed(2);

  const txns = expenses
    .map((e, i) => {
      const amt = (e.amount ?? 0).toFixed(2);
      const name = (e.title || e.vendorName || `Expense-${e.id}`).replace(/[<>&'"]/g, "");
      return `      <CdtTrfTxInf>
        <PmtId><EndToEndId>EXP-${e.id}-${String(i + 1).padStart(3, "0")}</EndToEndId></PmtId>
        <Amt><InstdAmt Ccy="EUR">${amt}</InstdAmt></Amt>
        <Cdtr><Nm>${name}</Nm></Cdtr>
        <CdtrAcct><Id><IBAN>DE89370400440532013000</IBAN></Id></CdtrAcct>
        <RmtInf><Ustrd>Expense reimbursement ${e.id} — ${dateStr}</Ustrd></RmtInf>
      </CdtTrfTxInf>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${msgId}</MsgId>
      <CreDtTm>${now.toISOString().slice(0, 19)}</CreDtTm>
      <NbOfTxs>${expenses.length}</NbOfTxs>
      <CtrlSum>${total}</CtrlSum>
      <InitgPty><Nm>FintechSaaS GmbH</Nm></InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>BATCH-${dateStr.replace(/-/g, "")}</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <NbOfTxs>${expenses.length}</NbOfTxs>
      <CtrlSum>${total}</CtrlSum>
      <PmtTpInf>
        <SvcLvl><Cd>SEPA</Cd></SvcLvl>
        <LclInstrm><Cd>CORE</Cd></LclInstrm>
      </PmtTpInf>
      <ReqdExctnDt>${new Date(now.getTime() + 86400000).toISOString().slice(0, 10)}</ReqdExctnDt>
      <Dbtr><Nm>FintechSaaS GmbH</Nm></Dbtr>
      <DbtrAcct><Id><IBAN>DE89370400440532013000</IBAN></Id></DbtrAcct>
      <DbtrAgt><FinInstnId><BIC>COBADEFFXXX</BIC></FinInstnId></DbtrAgt>
${txns}
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`;
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────────────────────
// Batch Payment View
// ─────────────────────────────────────────────────────────────────────────────

export default function PaymentView() {
  const { t } = useTranslation();
  const { data: all = [], isLoading } = useGetFinanceExpensesQuery();
  const [markAsPaid, { isLoading: isPaying }] = useMarkAsPaidMutation();

  // Only APPROVED expenses are eligible for payment
  const eligible = useMemo(() => all.filter((e) => e.status === "APPROVED"), [all]);

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [paidIds, setPaidIds] = useState<Set<number>>(new Set());
  const [paidSuccess, setPaidSuccess] = useState(false);

  const unpaid = eligible.filter((e) => !paidIds.has(e.id));
  const allSelected = unpaid.length > 0 && selected.size === unpaid.length;

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(unpaid.map((e) => e.id)));
  };

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const selectedExpenses = unpaid.filter((e) => selected.has(e.id));
  const selectedTotal = selectedExpenses.reduce((s, e) => s + (e.amount ?? 0), 0);

  const handleDownloadSepa = () => {
    if (selectedExpenses.length === 0) return;
    const xml = generateSepaXml(selectedExpenses);
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    downloadBlob(xml, `sepa-batch-${date}.xml`, "application/xml");
  };

  const handleMarkPaid = async () => {
    if (selectedExpenses.length === 0) return;
    const ids = selectedExpenses.map((e) => e.id);
    try {
      await markAsPaid({ ids }).unwrap();
    } catch {
      // Mock: backend endpoint not yet implemented — update locally
    } finally {
      setPaidIds((prev) => new Set([...prev, ...ids]));
      setSelected(new Set());
      setPaidSuccess(true);
      setTimeout(() => setPaidSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">{t("finance.payment.title")}</h2>
        <p className="mt-1 text-sm text-neutral-500">
          {t("finance.payment.subtitle")}
        </p>
      </div>

      {/* Action bar */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-primary-200 bg-primary-50 px-5 py-3">
          <p className="text-sm font-medium text-primary-800">
            {t("finance.payment.selected_summary", { count: selected.size })} &mdash;{" "}
            <span className="font-bold">{selectedTotal.toFixed(2)} €</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadSepa}
              className="flex items-center gap-2 rounded-lg border border-primary-300 bg-white px-3 py-1.5 text-sm font-medium text-primary-700 hover:bg-primary-50"
            >
              <Download className="h-4 w-4" />
              {t("finance.payment.btn_sepa")}
            </button>
            <button
              onClick={handleMarkPaid}
              disabled={isPaying}
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              <CreditCard className="h-4 w-4" />
              {t("finance.payment.btn_mark_paid")}
            </button>
          </div>
        </div>
      )}

      {paidSuccess && (
        <div className="rounded-xl border border-success-200 bg-success-50 px-5 py-3 text-sm font-medium text-success-700">
          {t("finance.payment.success_msg")}
        </div>
      )}

      {/* Expense table */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3">
          <p className="font-semibold text-neutral-900">
            {t("finance.payment.table_title")}{" "}
            <span className="ml-1 text-sm font-normal text-neutral-400">({unpaid.length})</span>
          </p>
          {paidIds.size > 0 && (
            <span className="text-xs text-success-600">{t("finance.payment.paid_this_session", { count: paidIds.size })}</span>
          )}
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          </div>
        ) : unpaid.length === 0 ? (
          <p className="p-6 text-center text-sm text-neutral-400">
            {eligible.length === 0
              ? t("finance.payment.empty_no_approved")
              : t("finance.payment.empty_all_paid")}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-5 py-3 text-left">
                  <button onClick={toggleAll}>
                    {allSelected ? (
                      <CheckSquare className="h-4 w-4 text-primary-600" />
                    ) : (
                      <Square className="h-4 w-4 text-neutral-400" />
                    )}
                  </button>
                </th>
                <th className="px-5 py-3 text-left">{t("finance.payment.col_type")}</th>
                <th className="px-5 py-3 text-left">{t("finance.payment.col_title")}</th>
                <th className="px-5 py-3 text-left">{t("finance.payment.col_amount")}</th>
                <th className="px-5 py-3 text-left">{t("finance.payment.col_submitted")}</th>
              </tr>
            </thead>
            <tbody>
              {unpaid.map((e) => (
                <PaymentRow
                  key={e.id}
                  expense={e}
                  checked={selected.has(e.id)}
                  onToggle={() => toggle(e.id)}
                />
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-neutral-200 bg-neutral-50">
                <td colSpan={3} className="px-5 py-3 text-right text-sm font-semibold text-neutral-700">
                  {t("finance.payment.total_eligible")}
                </td>
                <td className="px-5 py-3 text-sm font-bold text-neutral-900">
                  {eligible.reduce((s, e) => s + (e.amount ?? 0), 0).toFixed(2)} €
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}

function PaymentRow({
  expense,
  checked,
  onToggle,
}: {
  expense: Expense;
  checked: boolean;
  onToggle: () => void;
}) {
  const Icon = TYPE_ICON[expense.type] ?? Camera;
  return (
    <tr
      className={`cursor-pointer border-t border-neutral-100 transition-colors ${checked ? "bg-primary-50/40" : "hover:bg-neutral-50"}`}
      onClick={onToggle}
    >
      <td className="px-5 py-3">
        {checked ? (
          <CheckSquare className="h-4 w-4 text-primary-600" />
        ) : (
          <Square className="h-4 w-4 text-neutral-300" />
        )}
      </td>
      <td className="px-5 py-3">
        <Icon className="h-4 w-4 text-neutral-500" />
      </td>
      <td className="max-w-[200px] truncate px-5 py-3 font-medium text-neutral-900">
        {expense.title || expense.vendorName || "—"}
      </td>
      <td className="px-5 py-3 font-semibold text-neutral-800">
        {expense.amount != null ? `${expense.amount.toFixed(2)} €` : "—"}
      </td>
      <td className="px-5 py-3 text-neutral-500">{expense.submittedAt?.slice(0, 10) ?? "—"}</td>
    </tr>
  );
}
