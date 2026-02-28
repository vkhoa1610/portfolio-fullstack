"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Camera, Calendar, Car, ChevronRight } from "lucide-react";

export default function ExpenseTypeSelector() {
  const { t } = useTranslation();
  const router = useRouter();

  const EXPENSE_TYPES = [
    {
      type: "scan",
      icon: Camera,
      title: t("expense.create.type_receipt_title"),
      subtitle: t("expense.create.type_receipt_sub"),
      color: "text-primary-600",
      bg: "bg-primary-50",
    },
    {
      type: "per-diem",
      icon: Calendar,
      title: t("expense.create.type_perdiem_title"),
      subtitle: t("expense.create.type_perdiem_sub"),
      color: "text-secondary-600",
      bg: "bg-secondary-50",
    },
    {
      type: "mileage",
      icon: Car,
      title: t("expense.create.type_mileage_title"),
      subtitle: t("expense.create.type_mileage_sub"),
      color: "text-success-600",
      bg: "bg-success-50",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-lg space-y-4">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-neutral-900">{t("expense.create.title")}</h2>
        <p className="mt-1 text-sm text-neutral-500">{t("expense.create.subtitle")}</p>
      </div>

      {EXPENSE_TYPES.map(({ type, icon: Icon, title, subtitle, color, bg }) => (
        <button
          key={type}
          onClick={() => router.push(`/my-expenses/create/${type}`)}
          className="flex w-full items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition-all hover:border-primary-300 hover:shadow-md"
        >
          <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${bg}`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-neutral-900">{title}</p>
            <p className="text-xs text-neutral-500">{subtitle}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-neutral-400" />
        </button>
      ))}
    </div>
  );
}
