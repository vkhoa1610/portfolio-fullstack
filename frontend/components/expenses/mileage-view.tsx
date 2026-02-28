"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useCreateExpenseMutation } from "@/ducks/expenses";

const RATE_PER_KM = 0.30; // Kilometerpauschale 2024

export default function MileageView() {
  const { t } = useTranslation();
  const router = useRouter();
  const [createExpense, { isLoading }] = useCreateExpenseMutation();

  const [form, setForm] = useState({
    title: "",
    distanceKm: "",
    tripDate: "",
    from: "",
    to: "",
  });

  const distance = parseFloat(form.distanceKm) || 0;
  const total = (distance * RATE_PER_KM).toFixed(2);

  const handleSave = async () => {
    if (distance <= 0 || !form.tripDate) return;
    await createExpense({
      type: "MILEAGE",
      title: form.title || `Mileage ${form.from} → ${form.to}`,
      amount: parseFloat(total),
      distanceKm: distance,
      ratePerKm: RATE_PER_KM,
      receiptDate: form.tripDate,
    }).unwrap();
    router.push("/my-expenses");
  };

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-neutral-900">{t("expense.mileage.title")}</h2>
        <p className="mt-1 text-sm text-neutral-500">{t("expense.mileage.subtitle")}</p>
      </div>

      <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6">
        <div>
          <label htmlFor="mileage-title" className="mb-1 block text-xs font-medium text-neutral-600">{t("expense.mileage.label_title")}</label>
          <input id="mileage-title" type="text" placeholder="e.g. Client visit" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="mileage-from" className="mb-1 block text-xs font-medium text-neutral-600">{t("expense.mileage.label_from")}</label>
            <input id="mileage-from" type="text" placeholder="Berlin" value={form.from}
              onChange={(e) => setForm({ ...form, from: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none" />
          </div>
          <div>
            <label htmlFor="mileage-to" className="mb-1 block text-xs font-medium text-neutral-600">{t("expense.mileage.label_to")}</label>
            <input id="mileage-to" type="text" placeholder="München" value={form.to}
              onChange={(e) => setForm({ ...form, to: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="mileage-date" className="mb-1 block text-xs font-medium text-neutral-600">{t("expense.mileage.label_date")}</label>
            <input id="mileage-date" type="date" value={form.tripDate}
              onChange={(e) => setForm({ ...form, tripDate: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none" />
          </div>
          <div>
            <label htmlFor="mileage-distance" className="mb-1 block text-xs font-medium text-neutral-600">{t("expense.mileage.label_distance")}</label>
            <input id="mileage-distance" type="number" min="0" step="0.1" placeholder="0" value={form.distanceKm}
              onChange={(e) => setForm({ ...form, distanceKm: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none" />
          </div>
        </div>

        {/* Auto-calculation */}
        <div className="rounded-lg bg-neutral-50 p-4 text-sm">
          <div className="flex justify-between text-neutral-600">
            <span>{t("expense.mileage.rate_label")}</span>
            <span>{RATE_PER_KM.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between text-neutral-600">
            <span>{t("expense.mileage.distance_label")}</span>
            <span>{distance.toFixed(1)} km</span>
          </div>
          <div className="mt-2 flex justify-between border-t pt-2 font-bold text-neutral-900">
            <span>{t("expense.mileage.total_label")}</span>
            <span>{total} €</span>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isLoading || distance <= 0 || !form.tripDate}
          className="w-full rounded-lg bg-primary-600 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
        >
          {isLoading ? t("expense.mileage.saving") : t("expense.mileage.btn_save")}
        </button>
      </div>
    </div>
  );
}
