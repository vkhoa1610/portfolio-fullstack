"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useCreateExpenseMutation } from "@/ducks/expenses";
import type { PolicyEvaluationSnapshot } from "@/ducks/expenses";
import { useGetScreenConfigQuery, useGetPolicyInsightMutation } from "@/ducks/cms/cmsApi";
import type { PolicyScreenConfig } from "@/ducks/cms/types";
import type { SeverityCheckItem, SeverityState } from "./policy-compliance";
import styles from "./mileage-view.module.css";
import PageHeader from "@/components/layout/PageHeader";
import hdrStyles from "@/components/layout/PageHeader.module.css";
import PolicyCompliance from "./policy-compliance";
import PolicyInsight from "./policy-insight";
import ReimbursementCard from "./reimbursement-card";
import DatePicker from "./date-picker";

const RATE_PER_KM = 0.3;
const DAILY_LIMIT_KM = 200;
const EFFICIENCY_THRESHOLD_KM = 150;
const COMMUTE_THRESHOLD_KM = 30;

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

export default function MileageView() {
  const { t } = useTranslation();
  const router = useRouter();
  const [createExpense, { isLoading }] = useCreateExpenseMutation();

  const [form, setForm] = useState({ title: "", from: "", to: "", tripDate: "", distanceKm: "" });

  const distance   = parseFloat(form.distanceKm) || 0;
  const total      = (distance * RATE_PER_KM).toFixed(2);
  const withinLimit = distance > 0 && distance <= DAILY_LIMIT_KM;
  const canSave    = distance > 0 && !!form.tripDate;

  // ── CMS ────────────────────────────────────────────────────────────────────
  const { data: rawConfig } = useGetScreenConfigQuery("expense.create.mileage");
  const config = rawConfig as PolicyScreenConfig | undefined;

  function evalCondition(key: string): SeverityState {
    switch (key) {
      case "distance_over_limit":
        if (distance === 0) return "pending";
        return distance > DAILY_LIMIT_KM ? "triggered" : "ok";
      case "possible_commute":
        if (distance === 0) return "pending";
        return distance < COMMUTE_THRESHOLD_KM ? "triggered" : "ok";
      case "has_distance":
        return distance > 0 ? "triggered" : "pending";
      case "distance_over_efficiency":
        if (distance === 0) return "pending";
        return distance > EFFICIENCY_THRESHOLD_KM ? "triggered" : "ok";
      default:
        return "pending";
    }
  }

  function evalInsightCondition(key: string): boolean {
    switch (key) {
      case "has_distance": return distance > 0;
      case "always":       return true;
      default:             return false;
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

  const activeInsight = config?.insight.find((ins) => evalInsightCondition(ins.condition));

  // ── AI Insight ─────────────────────────────────────────────────────────────
  const [getInsight] = useGetPolicyInsightMutation();
  const [aiText, setAiText] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!canSave) return;
    setAiLoading(true);
    setAiText(null);
    const timer = setTimeout(async () => {
      try {
        const res = await getInsight({
          type: "MILEAGE",
          context: { from: form.from, to: form.to, distance, rate: RATE_PER_KM, total },
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
  }, [form.distanceKm, form.tripDate]);

  const handleSave = async () => {
    if (!canSave) return;

    const policyEvaluationSnapshot: PolicyEvaluationSnapshot | undefined = config
      ? {
          screenKey: "expense.create.mileage",
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
            from: form.from,
            to: form.to,
            tripDate: form.tripDate,
            distanceKm: distance,
            ratePerKm: RATE_PER_KM,
            totalAmount: Number(total),
          },
        }
      : undefined;

    await createExpense({
      type: "MILEAGE",
      title: form.title || `Mileage ${form.from} → ${form.to}`,
      amount: parseFloat(total),
      distanceKm: distance,
      ratePerKm: RATE_PER_KM,
      receiptDate: form.tripDate,
      policyEvaluationSnapshot,
    }).unwrap();
    router.push("/my-expenses");
  };

  return (
    <div>
      <PageHeader
        title={t("expense.mileage.title", { defaultValue: "Request Mileage" })}
        subtitle={t("expense.mileage.subtitle", {
          defaultValue: "Record your travel distance for reimbursement following standard regional rates.",
        })}
        backLabel={t("expense.mileage.back", { defaultValue: "New Expense" })}
        backHref="/my-expenses/create"
        actions={
          <button
            className={hdrStyles.btnSolid}
            onClick={handleSave}
            disabled={isLoading || !canSave}
          >
            {isLoading
              ? t("expense.mileage.saving", { defaultValue: "Saving…" })
              : t("expense.mileage.btn_save", { defaultValue: "Save" })}
          </button>
        }
      />

      <div className={styles.page}>
      <div className={styles.grid}>
        {/* ── Left column ── */}
        <div className={styles.leftCol}>
          <div className={styles.formCard}>
            <div className={styles.fieldGroup}>
              <label htmlFor="ml-title" className={styles.fieldLabel}>
                {t("expense.mileage.label_title", { defaultValue: "Trip Title (Optional)" })}
              </label>
              <input
                id="ml-title"
                type="text"
                placeholder={t("expense.mileage.placeholder_title", { defaultValue: "e.g. Q3 Client Visit — Berlin" })}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={styles.fieldInput}
              />
            </div>

            <div className={styles.twoCol}>
              <div className={styles.fieldGroup}>
                <label htmlFor="ml-from" className={styles.fieldLabel}>
                  {t("expense.mileage.label_from", { defaultValue: "From" })}
                </label>
                <div className={styles.inputWithIcon}>
                  <span className={styles.inputIconLeft}><MIcon name="location_on" size={18} /></span>
                  <input
                    id="ml-from"
                    type="text"
                    placeholder={t("expense.mileage.placeholder_from", { defaultValue: "Departure City" })}
                    value={form.from}
                    onChange={(e) => setForm({ ...form, from: e.target.value })}
                    className={`${styles.fieldInput} ${styles.fieldInputPadLeft}`}
                  />
                </div>
              </div>
              <div className={styles.fieldGroup}>
                <label htmlFor="ml-to" className={styles.fieldLabel}>
                  {t("expense.mileage.label_to", { defaultValue: "To" })}
                </label>
                <div className={styles.inputWithIcon}>
                  <span className={`${styles.inputIconLeft} ${styles.inputIconFlag}`}>
                    <MIcon name="flag" size={18} />
                  </span>
                  <input
                    id="ml-to"
                    type="text"
                    placeholder={t("expense.mileage.placeholder_to", { defaultValue: "Destination City" })}
                    value={form.to}
                    onChange={(e) => setForm({ ...form, to: e.target.value })}
                    className={`${styles.fieldInput} ${styles.fieldInputPadLeft}`}
                  />
                </div>
              </div>
            </div>

            <div className={styles.twoCol}>
              <div className={styles.fieldGroup}>
                <label htmlFor="ml-date" className={styles.fieldLabel}>
                  {t("expense.mileage.label_date", { defaultValue: "Date of Travel" })}
                </label>
                <DatePicker
                  id="ml-date"
                  value={form.tripDate}
                  onChange={(v) => setForm({ ...form, tripDate: v })}
                  placeholder={t("expense.mileage.placeholder_date", { defaultValue: "Select travel date" })}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label htmlFor="ml-distance" className={styles.fieldLabel}>
                  {t("expense.mileage.label_distance", { defaultValue: "Distance (km)" })}
                </label>
                <div className={styles.inputWithIcon}>
                  <span className={styles.inputIconLeft}><MIcon name="route" size={18} /></span>
                  <input
                    id="ml-distance"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="0.00"
                    value={form.distanceKm}
                    onChange={(e) => setForm({ ...form, distanceKm: e.target.value })}
                    className={`${styles.fieldInput} ${styles.fieldInputPadLeft}`}
                  />
                </div>
              </div>
            </div>
          </div>

          <ReimbursementCard
            title={t("expense.mileage.reimbursement_title", { defaultValue: "Estimated Reimbursement" })}
            rows={[
              { label: t("expense.mileage.rate_label", { defaultValue: "Rate / km" }), value: `${RATE_PER_KM.toFixed(2)} €` },
              { label: t("expense.mileage.distance_label", { defaultValue: "Distance" }), value: distance > 0 ? `${distance.toFixed(1)} km` : "—" },
            ]}
            totalLabel={t("expense.mileage.total_label", { defaultValue: "Total Payout" })}
            totalValue={distance > 0 ? `${total} €` : "—"}
          />
        </div>

        {/* ── Right column ── */}
        <div className={styles.rightCol}>
          {config ? (
            <PolicyCompliance mode="severity" items={severityItems} />
          ) : (
            <PolicyCompliance
              mode="checklist"
              items={[
                {
                  ok: !!(form.from && form.to),
                  pending: !(form.from && form.to),
                  title: t("expense.mileage.policy_route_title", { defaultValue: "Route details" }),
                  desc:
                    form.from && form.to
                      ? t("expense.mileage.policy_route_ok", { defaultValue: `Route from ${form.from} to ${form.to} is confirmed.` })
                      : t("expense.mileage.policy_route_pending", { defaultValue: "Enter departure and destination to verify your route." }),
                },
                {
                  ok: !!form.tripDate,
                  pending: !form.tripDate,
                  title: t("expense.mileage.policy_date_title", { defaultValue: "Date of travel" }),
                  desc: form.tripDate
                    ? t("expense.mileage.policy_date_ok", { defaultValue: "Travel date is recorded and within the current period." })
                    : t("expense.mileage.policy_date_pending", { defaultValue: "Select a travel date to proceed." }),
                },
                {
                  ok: withinLimit,
                  pending: !withinLimit && distance === 0,
                  title: t("expense.mileage.policy_distance_title", { defaultValue: "Distance within limit" }),
                  desc:
                    distance === 0
                      ? t("expense.mileage.policy_distance_pending", { defaultValue: "Enter your travel distance to verify the 200 km daily limit." })
                      : withinLimit
                      ? t("expense.mileage.policy_distance_ok", { defaultValue: `${distance.toFixed(1)} km is within the standard 200 km daily limit.` })
                      : t("expense.mileage.policy_distance_over", { defaultValue: `${distance.toFixed(1)} km exceeds the 200 km limit — additional approval required.` }),
                },
              ]}
              readyToSubmit={canSave && withinLimit}
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
              linkLabel={t("expense.mileage.insight_link", { defaultValue: "View mileage policy" })}
              aiText={aiText ?? undefined}
              aiLoading={aiLoading}
            >
              {t("expense.mileage.insight_text", { defaultValue: "Trips under 50km typically don't require supporting receipts. For distances over 100km, attach a route screenshot or GPS log to speed up approval." })}
            </PolicyInsight>
          ) : null}
        </div>
      </div>
      </div>
    </div>
  );
}
