"use client";

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Download, FileText, FileCode } from "lucide-react";
import { useGetFinanceExpensesQuery } from "@/ducks/expenses";
import type { Expense } from "@/ducks/expenses";

// ─────────────────────────────────────────────────────────────────────────────
// Generators
// ─────────────────────────────────────────────────────────────────────────────

function generateDatevCsv(expenses: Expense[]): string {
  // DATEV Buchungsstapel CSV (simplified — relevant columns for Reisekostenabrechnung)
  const header = [
    "Umsatz",
    "Soll/Haben",
    "WKZ",
    "Konto",
    "Gegenkonto",
    "Belegdatum",
    "Belegfeld1",
    "Buchungstext",
    "Kostenstelle",
    "Steuercode",
  ].join(";");

  const rows = expenses.map((e) => {
    const amt = (e.amount ?? 0).toFixed(2).replace(".", ",");
    const date = (e.submittedAt ?? e.createdAt ?? "").slice(0, 10).replace(/-/g, "");
    const konto = e.type === "RECEIPT" ? "6300" : e.type === "MILEAGE" ? "6320" : "6310";
    const text = (e.title || e.vendorName || `Expense-${e.id}`).replace(/;/g, " ");
    return [amt, "S", "EUR", konto, "1600", date, `EXP${e.id}`, text, "REISE", "VST"].join(";");
  });

  return [header, ...rows].join("\r\n");
}

function generateXRechnung(expenses: Expense[]): string {
  const now = new Date();
  const total = expenses.reduce((s, e) => s + (e.amount ?? 0), 0).toFixed(2);
  const vatTotal = expenses.reduce((s, e) => s + (e.vatAmount ?? 0), 0).toFixed(2);
  const invoiceId = `INV-${now.toISOString().slice(0, 10).replace(/-/g, "")}-001`;

  const lines = expenses
    .map((e, i) => {
      const amt = (e.amount ?? 0).toFixed(2);
      const name = (e.title || e.vendorName || `Expense ${e.id}`).replace(/[<>&'"]/g, "");
      return `  <cac:InvoiceLine>
    <cbc:ID>${i + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="EA">1</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="EUR">${amt}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>${name}</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>19</cbc:Percent>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price><cbc:PriceAmount currencyID="EUR">${amt}</cbc:PriceAmount></cac:Price>
  </cac:InvoiceLine>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- XRechnung EN16931 (mock — simplified for portfolio) -->
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:xoev-de:kosit:standard:xrechnung_2.0</cbc:CustomizationID>
  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
  <cbc:ID>${invoiceId}</cbc:ID>
  <cbc:IssueDate>${now.toISOString().slice(0, 10)}</cbc:IssueDate>
  <cbc:DueDate>${new Date(now.getTime() + 30 * 86400000).toISOString().slice(0, 10)}</cbc:DueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty>
    <cac:Party><cac:PartyName><cbc:Name>FintechSaaS GmbH</cbc:Name></cac:PartyName></cac:Party>
  </cac:AccountingSupplierParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="EUR">${vatTotal}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxAmount currencyID="EUR">${vatTotal}</cbc:TaxAmount>
      <cac:TaxCategory><cbc:ID>S</cbc:ID><cbc:Percent>19</cbc:Percent></cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:TaxExclusiveAmount currencyID="EUR">${(parseFloat(total) - parseFloat(vatTotal)).toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="EUR">${total}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="EUR">${total}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
${lines}
</Invoice>`;
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
// Period filter helpers
// ─────────────────────────────────────────────────────────────────────────────

type Period = "current_month" | "last_month" | "current_quarter" | "all";

function filterByPeriod(expenses: Expense[], period: Period): Expense[] {
  const now = new Date();
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

  const inRange = (dateStr: string | undefined, from: Date, to: Date) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d >= from && d <= to;
  };

  if (period === "all") return expenses;

  if (period === "current_month") {
    const from = startOf(now);
    return expenses.filter((e) => inRange(e.submittedAt ?? e.createdAt, from, now));
  }

  if (period === "last_month") {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    return expenses.filter((e) => inRange(e.submittedAt ?? e.createdAt, from, to));
  }

  if (period === "current_quarter") {
    const q = Math.floor(now.getMonth() / 3);
    const from = new Date(now.getFullYear(), q * 3, 1);
    return expenses.filter((e) => inRange(e.submittedAt ?? e.createdAt, from, now));
  }

  return expenses;
}

const PERIOD_I18N_KEYS: Record<Period, string> = {
  current_month: "finance.export.period_current_month",
  last_month: "finance.export.period_last_month",
  current_quarter: "finance.export.period_current_quarter",
  all: "finance.export.period_all",
};

// ─────────────────────────────────────────────────────────────────────────────
// Export View
// ─────────────────────────────────────────────────────────────────────────────

export default function ExportView() {
  const { t } = useTranslation();
  const { data: all = [], isLoading } = useGetFinanceExpensesQuery();
  const [period, setPeriod] = useState<Period>("current_month");

  const filtered = useMemo(() => filterByPeriod(all, period), [all, period]);

  const totalAmount = filtered.reduce((s, e) => s + (e.amount ?? 0), 0);
  const vatAmount = filtered.reduce((s, e) => s + (e.vatAmount ?? 0), 0);

  const handleDatevExport = () => {
    const csv = generateDatevCsv(filtered);
    const date = new Date().toISOString().slice(0, 7).replace(/-/g, "");
    downloadBlob(csv, `datev-${period}-${date}.csv`, "text/csv;charset=utf-8;");
  };

  const handleXRechnungExport = () => {
    const xml = generateXRechnung(filtered);
    const date = new Date().toISOString().slice(0, 7).replace(/-/g, "");
    downloadBlob(xml, `xrechnung-${period}-${date}.xml`, "application/xml");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">{t("finance.export.title")}</h2>
        <p className="mt-1 text-sm text-neutral-500">
          {t("finance.export.subtitle")}
        </p>
      </div>

      {/* Period selector + summary */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-neutral-500">{t("finance.export.period_label")}</p>
            <div className="flex gap-1 rounded-lg bg-neutral-100 p-1">
              {(Object.keys(PERIOD_I18N_KEYS) as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    period === p
                      ? "bg-white text-neutral-900 shadow-sm"
                      : "text-neutral-500 hover:text-neutral-700"
                  }`}
                >
                  {t(PERIOD_I18N_KEYS[p])}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary row */}
        <div className="mt-4 flex flex-wrap gap-6 border-t border-neutral-100 pt-4">
          <SumItem label={t("finance.export.sum_expenses")} value={String(filtered.length)} />
          <SumItem label={t("finance.export.sum_gross")} value={`${totalAmount.toFixed(2)} €`} />
          <SumItem label={t("finance.export.sum_vat")} value={`${vatAmount.toFixed(2)} €`} />
          <SumItem
            label={t("finance.export.sum_net")}
            value={`${(totalAmount - vatAmount).toFixed(2)} €`}
            bold
          />
        </div>
      </div>

      {/* Export cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <ExportCard
          icon={<FileText className="h-6 w-6 text-primary-600" />}
          title={t("finance.export.datev_title")}
          description={t("finance.export.datev_desc")}
          badge="DATEV"
          badgeColor="bg-blue-100 text-blue-700"
          meta={[
            { label: t("finance.export.meta_format"), value: "CSV (semicolon-delimited)" },
            { label: t("finance.export.meta_encoding"), value: "UTF-8" },
            { label: t("finance.export.meta_records"), value: String(filtered.length) },
          ]}
          exportLabel={t("finance.export.btn_export")}
          onExport={handleDatevExport}
          disabled={isLoading || filtered.length === 0}
        />
        <ExportCard
          icon={<FileCode className="h-6 w-6 text-success-600" />}
          title={t("finance.export.xrechnung_title")}
          description={t("finance.export.xrechnung_desc")}
          badge="EN16931"
          badgeColor="bg-success-100 text-success-700"
          meta={[
            { label: t("finance.export.meta_format"), value: "UBL 2.1 XML" },
            { label: t("finance.export.meta_standard"), value: "XRechnung 2.0" },
            { label: t("finance.export.meta_records"), value: String(filtered.length) },
          ]}
          exportLabel={t("finance.export.btn_export")}
          onExport={handleXRechnungExport}
          disabled={isLoading || filtered.length === 0}
        />
      </div>

      {/* Preview table */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-100 px-5 py-3">
          <p className="font-semibold text-neutral-900">
            {t("finance.export.preview_title")} — {t(PERIOD_I18N_KEYS[period])}{" "}
            <span className="ml-1 text-sm font-normal text-neutral-400">
              ({filtered.length} records)
            </span>
          </p>
        </div>
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-center text-sm text-neutral-400">
            {t("finance.export.preview_empty")}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-5 py-3 text-left">{t("finance.export.col_id")}</th>
                <th className="px-5 py-3 text-left">{t("finance.export.col_type")}</th>
                <th className="px-5 py-3 text-left">{t("finance.export.col_desc")}</th>
                <th className="px-5 py-3 text-left">{t("finance.export.col_date")}</th>
                <th className="px-5 py-3 text-right">{t("finance.export.col_amount")}</th>
                <th className="px-5 py-3 text-right">{t("finance.export.col_vat")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-t border-neutral-100">
                  <td className="px-5 py-3 font-mono text-xs text-neutral-400">EXP{e.id}</td>
                  <td className="px-5 py-3 text-xs uppercase text-neutral-500">
                    {e.type.replace("_", " ")}
                  </td>
                  <td className="max-w-[200px] truncate px-5 py-3 text-neutral-700">
                    {e.title || e.vendorName || "—"}
                  </td>
                  <td className="px-5 py-3 text-neutral-500">
                    {(e.submittedAt ?? e.createdAt)?.slice(0, 10) ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-neutral-900">
                    {e.amount != null ? `${e.amount.toFixed(2)} €` : "—"}
                  </td>
                  <td className="px-5 py-3 text-right text-neutral-500">
                    {e.vatAmount != null ? `${e.vatAmount.toFixed(2)} €` : "—"}
                  </td>
                </tr>
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

function SumItem({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div>
      <p className="text-xs text-neutral-500">{label}</p>
      <p className={`text-sm ${bold ? "font-bold text-neutral-900" : "text-neutral-700"}`}>
        {value}
      </p>
    </div>
  );
}

function ExportCard({
  icon,
  title,
  description,
  badge,
  badgeColor,
  meta,
  exportLabel,
  onExport,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
  meta: { label: string; value: string }[];
  exportLabel: string;
  onExport: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <p className="font-semibold text-neutral-900">{title}</p>
            <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeColor}`}>
              {badge}
            </span>
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs text-neutral-500">{description}</p>
      <div className="mt-4 space-y-1 border-t border-neutral-100 pt-3">
        {meta.map((m) => (
          <div key={m.label} className="flex justify-between text-xs">
            <span className="text-neutral-500">{m.label}</span>
            <span className="font-medium text-neutral-700">{m.value}</span>
          </div>
        ))}
      </div>
      <button
        onClick={onExport}
        disabled={disabled}
        className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Download className="h-4 w-4" />
        {exportLabel}
      </button>
    </div>
  );
}
