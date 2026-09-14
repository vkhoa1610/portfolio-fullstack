"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useCreateExpenseMutation } from "@/ducks/expenses";
import type { PolicyEvaluationSnapshot } from "@/ducks/expenses";
import { useGetScreenConfigQuery, useGetPolicyInsightMutation } from "@/ducks/cms/cmsApi";
import type { PolicyScreenConfig } from "@/ducks/cms/types";
import type { SeverityCheckItem, SeverityState } from "./policy-compliance";
import styles from "./per-diem-view.module.css";
import PageHeader from "@/components/layout/PageHeader";
import hdrStyles from "@/components/layout/PageHeader.module.css";
import PolicyCompliance from "./policy-compliance";
import PolicyInsight from "./policy-insight";
import ReimbursementCard from "./reimbursement-card";
import DatePicker from "./date-picker";

const PER_DIEM_RATES: Record<string, { rate: number; currencySymbol: string }> = {
  DE: { rate: 28, currencySymbol: "€" },
  AT: { rate: 26.4, currencySymbol: "€" },
  CH: { rate: 65, currencySymbol: "CHF" },
  GB: { rate: 45, currencySymbol: "£" },
  US: { rate: 55, currencySymbol: "$" },
  OTHER: { rate: 48, currencySymbol: "$" },
};

const COUNTRIES = [
  { code: "",      label: "Select location…" },
  { code: "DE",   label: "Germany — Berlin" },
  { code: "AT",   label: "Austria — Vienna" },
  { code: "CH",   label: "Switzerland — Zurich" },
  { code: "GB",   label: "United Kingdom — London" },
  { code: "US",   label: "United States" },
  { code: "OTHER", label: "Other / International" },
];

function calcDays(from: string, to: string): number {
  if (!from || !to) return 0;
  const ms = new Date(to).getTime() - new Date(from).getTime();
  return Math.max(0, Math.round(ms / 86_400_000) + 1);
}

function MIcon({ name, size = 20, fill = false }: { name: string; size?: number; fill?: boolean }) {
  return (
    <span
      className="material-symbols-outlined select-none leading-none shrink-0"
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
      }}
    >
      {name}
    </span>
  );
}

export default function PerDiemView() {
  const { t } = useTranslation();
  const router = useRouter();
  const [createExpense, { isLoading }] = useCreateExpenseMutation();

  const [form, setForm] = useState({ title: "", tripFrom: "", tripTo: "", countryCode: "" });

  const rateConfig = PER_DIEM_RATES[form.countryCode];
  const rate = rateConfig?.rate ?? 0;
  const currencySymbol = rateConfig?.currencySymbol ?? "€";
  const days     = calcDays(form.tripFrom, form.tripTo);
  const total    = (rate * days).toFixed(2);

  const locationOk = !!form.countryCode;
  const durationOk = days > 0;
  const readyToSubmit = locationOk && durationOk;

  // ── CMS ────────────────────────────────────────────────────────────────────
  const { data: rawConfig } = useGetScreenConfigQuery("expense.create.per_diem");
  const config = rawConfig as PolicyScreenConfig | undefined;

  // ── AI Insight ─────────────────────────────────────────────────────────────
  const [getInsight] = useGetPolicyInsightMutation();
  const [aiText, setAiText] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!readyToSubmit) return;
    setAiLoading(true);
    setAiText(null);
    const timer = setTimeout(async () => {
      try {
        const country = COUNTRIES.find((c) => c.code === form.countryCode)?.label ?? form.countryCode;
        const res = await getInsight({
          type: "PER_DIEM",
          context: { country, rate, days, from: form.tripFrom, to: form.tripTo },
        }).unwrap();
        setAiText(res.insight || null);
      } catch {
        setAiText(null);
      } finally {
        setAiLoading(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.countryCode, form.tripFrom, form.tripTo]);

  function evalCondition(key: string): SeverityState {
    const hasDates = !!form.tripFrom && !!form.tripTo;
    switch (key) {
      case "location_selected":   return locationOk ? "triggered" : "pending";
      case "duration_valid":      return !hasDates ? "pending" : durationOk ? "triggered" : "pending";
      case "meal_deduction_required":
        if (!hasDates) return "pending";
        return days > 3 ? "triggered" : "ok";
      case "proration":           return !hasDates ? "pending" : "triggered";
      default:                    return "pending";
    }
  }

  const severityItems: SeverityCheckItem[] = (config?.compliance ?? []).map((rule) => {
    const state = evalCondition(rule.condition);
    const desc = t(
      state === "pending"   ? rule.pending_desc_key  :
      state === "ok"        ? rule.ok_desc_key        :
      rule.triggered_desc_key
    );
    return { id: rule.id, icon: rule.icon, title: t(rule.title_key), desc, severity: rule.severity, state, blocksSave: rule.blocks_save };
  });

  // Always show first insight (static text always visible); condition only gates AI call
  const activeInsight = config?.insight[0];

  const handleSave = async () => {
    if (!readyToSubmit) return;

    const policyEvaluationSnapshot: PolicyEvaluationSnapshot | undefined = config
      ? {
          screenKey: "expense.create.per_diem",
          items: (config.compliance ?? []).map((rule) => {
            const state = evalCondition(rule.condition);
            const resolvedDescKey =
              state === "pending"
                ? rule.pending_desc_key
                : state === "ok"
                ? rule.ok_desc_key
                : rule.triggered_desc_key;

            return {
              id: rule.id,
              severity: rule.severity,
              state,
              titleKey: rule.title_key,
              pendingDescKey: rule.pending_desc_key,
              okDescKey: rule.ok_desc_key,
              triggeredDescKey: rule.triggered_desc_key,
              resolvedTitle: t(rule.title_key),
              resolvedDesc: t(resolvedDescKey),
              blocksSave: rule.blocks_save,
            };
          }),
          inputSnapshot: {
            title: form.title,
            tripFrom: form.tripFrom,
            tripTo: form.tripTo,
            countryCode: form.countryCode,
            perDiemRate: rate,
            perDiemDays: days,
            totalAmount: Number(total),
          },
        }
      : undefined;

    await createExpense({
      type: "PER_DIEM",
      title: form.title || `Per Diem ${form.tripFrom} – ${form.tripTo}`,
      amount: parseFloat(total),
      tripFrom: form.tripFrom,
      tripTo: form.tripTo,
      countryCode: form.countryCode,
      perDiemRate: rate,
      perDiemDays: days,
      policyEvaluationSnapshot,
    }).unwrap();
    router.push("/my-expenses");
  };

  return (
    <div>
      <PageHeader
        title={t("expense.per_diem.title", { defaultValue: "Request Per Diem" })}
        subtitle={t("expense.per_diem.subtitle", {
          defaultValue: "Enter your travel duration and destination to calculate automated daily allowances.",
        })}
        backLabel={t("expense.per_diem.back", { defaultValue: "New Expense" })}
        backHref="/my-expenses/create"
        actions={
          <button
            className={hdrStyles.btnSolid}
            onClick={handleSave}
            disabled={isLoading || !readyToSubmit}
          >
            {isLoading
              ? t("expense.per_diem.saving", { defaultValue: "Saving…" })
              : t("expense.per_diem.btn_save", { defaultValue: "Save" })}
          </button>
        }
      />

      <div className={styles.page}>
      <div className={styles.grid}>
        {/* Left column */}
        <div className={styles.leftCol}>
          <div className={styles.formCard}>
            <div className={styles.fieldGroup}>
              <label htmlFor="pd-title" className={styles.fieldLabel}>
                {t("expense.per_diem.label_title", { defaultValue: "Expense Title" })}
              </label>
              <input
                id="pd-title"
                type="text"
                placeholder={t("expense.per_diem.placeholder_title", { defaultValue: "e.g., Q4 Sales Summit" })}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={styles.fieldInput}
              />
            </div>

            <div className={styles.dateRow}>
              <div className={styles.fieldGroup}>
                <label htmlFor="pd-from" className={styles.fieldLabel}>
                  {t("expense.per_diem.label_from", { defaultValue: "From Date" })}
                </label>
                <DatePicker
                  id="pd-from"
                  value={form.tripFrom}
                  onChange={(v) => setForm({ ...form, tripFrom: v })}
                  placeholder={t("expense.per_diem.placeholder_from", { defaultValue: "Select start date" })}
                  maxDate={form.tripTo || undefined}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label htmlFor="pd-to" className={styles.fieldLabel}>
                  {t("expense.per_diem.label_to", { defaultValue: "To Date" })}
                </label>
                <DatePicker
                  id="pd-to"
                  value={form.tripTo}
                  onChange={(v) => setForm({ ...form, tripTo: v })}
                  placeholder={t("expense.per_diem.placeholder_to", { defaultValue: "Select end date" })}
                  minDate={form.tripFrom || undefined}
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="pd-country" className={styles.fieldLabel}>
                {t("expense.per_diem.label_country", { defaultValue: "Country & Region" })}
              </label>
              <div className={styles.inputWithIcon}>
                <span className={styles.inputIconLeft}><MIcon name="public" size={18} /></span>
                <select
                  id="pd-country"
                  value={form.countryCode}
                  onChange={(e) => setForm({ ...form, countryCode: e.target.value })}
                  className={`${styles.fieldSelect} ${styles.fieldSelectPadLeft}`}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code} disabled={c.code === ""}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <span className={styles.inputIconRight}><MIcon name="expand_more" size={18} /></span>
              </div>
            </div>
          </div>

          <ReimbursementCard
            title={t("expense.per_diem.reimbursement_title", { defaultValue: "Estimated Total" })}
            rows={[
              { label: t("expense.per_diem.rate_label", { defaultValue: "Rate / Day" }), value: form.countryCode ? `${currencySymbol} ${rate.toFixed(2)}` : "—" },
              { label: t("expense.per_diem.days_label", { defaultValue: "Total Days" }), value: days > 0 ? `${days} Days` : "—" },
            ]}
            totalLabel={t("expense.per_diem.total_label", { defaultValue: "Estimated Total" })}
            totalValue={days > 0 && form.countryCode ? `${currencySymbol} ${total}` : "—"}
          />
        </div>

        {/* Right column */}
        <div className={styles.rightCol}>
          {config ? (
            <PolicyCompliance mode="severity" items={severityItems} />
          ) : (
            <PolicyCompliance
              mode="checklist"
              items={[
                {
                  ok: locationOk,
                  pending: !locationOk,
                  title: t("expense.per_diem.policy_location_title", { defaultValue: "Location within tier" }),
                  desc: locationOk
                    ? t("expense.per_diem.policy_location_ok", { defaultValue: `${COUNTRIES.find((c) => c.code === form.countryCode)?.label} is within the allowed per diem tier.` })
                    : t("expense.per_diem.policy_location_pending", { defaultValue: "Select a destination to verify location tier." }),
                },
                {
                  ok: durationOk,
                  pending: !durationOk,
                  title: t("expense.per_diem.policy_duration_title", { defaultValue: "Duration match" }),
                  desc: durationOk
                    ? t("expense.per_diem.policy_duration_ok", { defaultValue: "Travel dates match the requested per diem period." })
                    : t("expense.per_diem.policy_duration_pending", { defaultValue: "Enter travel dates to verify duration." }),
                },
              ]}
              readyToSubmit={readyToSubmit}
            />
          )}

          {activeInsight ? (
            <PolicyInsight
              linkLabel={activeInsight.link_label_key ? t(activeInsight.link_label_key) : ""}
              aiText={aiText ?? undefined}
              aiLoading={aiLoading}
            >
              {t(activeInsight.text_key)}
            </PolicyInsight>
          ) : !config ? (
            <PolicyInsight
              linkLabel={t("expense.per_diem.insight_link", { defaultValue: "View full travel policy" })}
              aiText={aiText ?? undefined}
              aiLoading={aiLoading}
            >
              {t("expense.per_diem.insight_text", { defaultValue: "Your per diem for the final day is automatically prorated at 75% because your return flight departs before 6:00 PM local time. This aligns with Section 4.2 of the Global Travel Policy." })}
            </PolicyInsight>
          ) : null}
        </div>
      </div>
      </div>
    </div>
  );
}
