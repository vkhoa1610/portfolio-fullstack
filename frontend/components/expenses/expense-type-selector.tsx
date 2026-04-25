"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import styles from "./expense-type-selector.module.css";

function MIcon({ name, size = 24, fill = false }: { name: string; size?: number; fill?: boolean }) {
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

export default function ExpenseTypeSelector() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.headline}>
          {t("expense.create.headline_prefix", { defaultValue: "How would you like to " })}
          <span className={styles.headlineAccent}>
            {t("expense.create.headline_accent", { defaultValue: "file today?" })}
          </span>
        </h1>
        <p className={styles.subheadline}>
          {t("expense.create.subtitle", {
            defaultValue:
              "Select the expense category below. Our AI editor will automatically categorize and format your entry for faster approval.",
          })}
        </p>
      </div>

      {/* Grid */}
      <div className={styles.grid}>
        {/* Receipt card — primary */}
        <button
          className={styles.receiptCard}
          onClick={() => router.push("/my-expenses/create/scan")}
        >
          <div className={styles.receiptContent}>
            <div className={styles.receiptIconWrap}>
              <MIcon name="receipt" size={32} fill />
            </div>
            <h2 className={styles.receiptTitle}>
              {t("expense.create.type_receipt_title", { defaultValue: "Receipt" })}
            </h2>
            <p className={styles.receiptDesc}>
              {t("expense.create.type_receipt_sub", {
                defaultValue:
                  "Upload a photo or PDF of your commercial receipt. AI will extract date, merchant, and total automatically.",
              })}
            </p>
          </div>

          <div className={styles.receiptFooter}>
            <div className={styles.uploadBtn}>
              <MIcon name="cloud_upload" size={18} />
              {t("expense.create.upload_receipt", { defaultValue: "Upload Receipt" })}
            </div>
            <span className={styles.uploadFormats}>
              {t("expense.create.supported_formats", { defaultValue: "Supports PNG, PDF, JPG" })}
            </span>
          </div>

          {/* Decorative bg shape */}
          <div className={styles.receiptBgDeco} aria-hidden />
        </button>

        {/* Right column */}
        <div className={styles.rightCol}>
          {/* AI Tip */}
          <div className={styles.aiTipCard}>
            <div className={styles.aiTipHeader}>
              <MIcon name="auto_awesome" size={20} />
              <span className={styles.aiTipLabel}>
                {t("expense.create.ai_tip_label", { defaultValue: "Intelligent Tip" })}
              </span>
            </div>
            <p className={styles.aiTipText}>
              {t("expense.create.ai_tip_text", {
                defaultValue:
                  '"Last month, 84% of your travel expenses were Per Diem based. This could save you up to 15 minutes in data entry."',
              })}
            </p>
            <div className={styles.aiTipFooter}>
              <div className={styles.avatarStack}>
                <div className={styles.avatar} />
                <div className={styles.avatar} />
                <div className={styles.avatar} />
              </div>
              <button className={styles.insightsLink}>
                {t("expense.create.view_insights", { defaultValue: "View Report Insights" })}
              </button>
            </div>
          </div>

          {/* Secondary options */}
          <div className={styles.secondaryGrid}>
            <button
              className={styles.secondaryCard}
              onClick={() => router.push("/my-expenses/create/per-diem")}
            >
              <div className={styles.secondaryIconWrap}>
                <MIcon name="calendar_today" size={22} />
              </div>
              <h3 className={styles.secondaryTitle}>
                {t("expense.create.type_perdiem_title", { defaultValue: "Per Diem" })}
              </h3>
              <p className={styles.secondaryDesc}>
                {t("expense.create.type_perdiem_sub", {
                  defaultValue: "Auto-calculated daily rates based on local laws and travel duration.",
                })}
              </p>
            </button>

            <button
              className={styles.secondaryCard}
              onClick={() => router.push("/my-expenses/create/mileage")}
            >
              <div className={styles.secondaryIconWrap}>
                <MIcon name="distance" size={22} />
              </div>
              <h3 className={styles.secondaryTitle}>
                {t("expense.create.type_mileage_title", { defaultValue: "Mileage" })}
              </h3>
              <p className={styles.secondaryDesc}>
                {t("expense.create.type_mileage_sub", {
                  defaultValue: "Precise distance x company rate calculation. Supports GPS tracking.",
                })}
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
