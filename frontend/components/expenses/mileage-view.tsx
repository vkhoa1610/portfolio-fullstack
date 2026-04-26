"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useCreateExpenseMutation } from "@/ducks/expenses";
import styles from "./mileage-view.module.css";
import PageHeader from "@/components/layout/PageHeader";
import hdrStyles from "@/components/layout/PageHeader.module.css";
import PolicyCompliance from "./policy-compliance";
import PolicyInsight from "./policy-insight";
import ReimbursementCard from "./reimbursement-card";
import DatePicker from "./date-picker";

const RATE_PER_KM = 0.3;
const DAILY_LIMIT_KM = 200;

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
  const limitPct   = Math.min((distance / DAILY_LIMIT_KM) * 100, 100);
  const withinLimit = distance > 0 && distance <= DAILY_LIMIT_KM;
  const canSave    = distance > 0 && !!form.tripDate;

  const handleSave = async () => {
    if (!canSave) return;
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
      {/* ── Main grid ── */}
      <div className={styles.grid}>
        {/* ── Left column ── */}
        <div className={styles.leftCol}>
          {/* Form card */}
          <div className={styles.formCard}>
            {/* Trip title */}
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

            {/* From / To */}
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

            {/* Date / Distance */}
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
          <PolicyCompliance
            mode="checklist"
            items={[
              {
                ok: !!(form.from && form.to),
                pending: !(form.from && form.to),
                title: t("expense.mileage.policy_route_title", { defaultValue: "Route details" }),
                desc:
                  form.from && form.to
                    ? t("expense.mileage.policy_route_ok", { defaultValue: `Route from ${form.from} to ${form.to} is confirmed.`, from: form.from, to: form.to })
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
                    ? t("expense.mileage.policy_distance_ok", { defaultValue: `${distance.toFixed(1)} km is within the standard 200 km daily limit.`, distance: distance.toFixed(1) })
                    : t("expense.mileage.policy_distance_over", { defaultValue: `${distance.toFixed(1)} km exceeds the 200 km limit — additional approval required.`, distance: distance.toFixed(1) }),
              },
            ]}
            readyToSubmit={canSave && withinLimit}
          />

          <PolicyInsight linkLabel={t("expense.mileage.insight_link", { defaultValue: "View mileage policy" })}>
            {t("expense.mileage.insight_text", { defaultValue: "Trips under 50km typically don't require supporting receipts. For distances over 100km, attach a route screenshot or GPS log to speed up approval." })}
          </PolicyInsight>
        </div>
      </div>
      </div>
    </div>
  );
}
