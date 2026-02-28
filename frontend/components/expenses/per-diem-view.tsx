"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useCreateExpenseMutation } from "@/ducks/expenses";

// Deutschen Verpflegungspauschalen 2024 (vereinfacht)
const PER_DIEM_RATES: Record<string, number> = {
  DE: 28,
  AT: 26.4,
  CH: 35,
  OTHER: 48,
};

const COUNTRIES = [
  { code: "DE", label: "Deutschland" },
  { code: "AT", label: "Österreich" },
  { code: "CH", label: "Schweiz" },
  { code: "OTHER", label: "Anderes Land (Ausland)" },
];

function calcDays(from: string, to: string): number {
  if (!from || !to) return 0;
  const ms = new Date(to).getTime() - new Date(from).getTime();
  return Math.max(0, Math.round(ms / 86_400_000) + 1);
}

export default function PerDiemView() {
  const { t } = useTranslation();
  const router = useRouter();
  const [createExpense, { isLoading }] = useCreateExpenseMutation();

  const [form, setForm] = useState({ title: "", tripFrom: "", tripTo: "", countryCode: "DE" });

  const rate = PER_DIEM_RATES[form.countryCode] ?? 28;
  const days = calcDays(form.tripFrom, form.tripTo);
  const total = (rate * days).toFixed(2);

  const handleSave = async () => {
    if (!form.tripFrom || !form.tripTo || days <= 0) return;
    await createExpense({
      type: "PER_DIEM",
      title: form.title || `Per Diem ${form.tripFrom} – ${form.tripTo}`,
      amount: parseFloat(total),
      tripFrom: form.tripFrom,
      tripTo: form.tripTo,
      countryCode: form.countryCode,
      perDiemRate: rate,
      perDiemDays: days,
    }).unwrap();
    router.push("/my-expenses");
  };

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-neutral-900">{t("expense.per_diem.title")}</h2>
        <p className="mt-1 text-sm text-neutral-500">{t("expense.per_diem.subtitle")}</p>
      </div>

      <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6">
        <div>
          <label htmlFor="perdiem-title" className="mb-1 block text-xs font-medium text-neutral-600">{t("expense.per_diem.label_title")}</label>
          <input
            id="perdiem-title"
            type="text"
            placeholder="e.g. Berlin conference"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="perdiem-from" className="mb-1 block text-xs font-medium text-neutral-600">{t("expense.per_diem.label_from")}</label>
            <input id="perdiem-from" type="date" value={form.tripFrom} onChange={(e) => setForm({ ...form, tripFrom: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none" />
          </div>
          <div>
            <label htmlFor="perdiem-to" className="mb-1 block text-xs font-medium text-neutral-600">{t("expense.per_diem.label_to")}</label>
            <input id="perdiem-to" type="date" value={form.tripTo} onChange={(e) => setForm({ ...form, tripTo: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none" />
          </div>
        </div>

        <div>
          <label htmlFor="perdiem-country" className="mb-1 block text-xs font-medium text-neutral-600">{t("expense.per_diem.label_country")}</label>
          <select id="perdiem-country" value={form.countryCode} onChange={(e) => setForm({ ...form, countryCode: e.target.value })}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none">
            {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        </div>

        {/* Auto-calculation summary */}
        <div className="rounded-lg bg-neutral-50 p-4 text-sm">
          <div className="flex justify-between text-neutral-600">
            <span>{t("expense.per_diem.rate_label")}</span>
            <span>{rate.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between text-neutral-600">
            <span>{t("expense.per_diem.days_label")}</span>
            <span>{days}</span>
          </div>
          <div className="mt-2 flex justify-between border-t pt-2 font-bold text-neutral-900">
            <span>{t("expense.per_diem.total_label")}</span>
            <span>{total} €</span>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isLoading || days <= 0}
          className="w-full rounded-lg bg-primary-600 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
        >
          {isLoading ? t("expense.per_diem.saving") : t("expense.per_diem.btn_save")}
        </button>
      </div>
    </div>
  );
}
