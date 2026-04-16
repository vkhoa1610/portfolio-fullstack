"use client";

import React, { useState } from "react";
import { Lock, Shield, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { AdCard, AdButton, AdCheckbox, LanguageSwitcher } from "@/common";
import { useSubmitConsentMutation } from "@/ducks/auth";
import styles from "./compliance-view.module.css";

export default function ComplianceView() {
  const { t } = useTranslation();
  const router = useRouter();
  const [checked1, setChecked1] = useState(false);
  const [checked2, setChecked2] = useState(false);
  const canProceed = checked1 && checked2;
  const [submitConsent, { isLoading }] = useSubmitConsentMutation();

  const handleContinue = async () => {
    await submitConsent({ policyIds: [1, 2] }).unwrap();
    router.push('/onboarding/profile');
  };

  return (
    <AdCard className="relative flex max-h-[90vh] w-full max-w-[500px] flex-col">
      {/* Language Switcher - Top Right */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>

      {/* Header */}
      <div className="flex-shrink-0 px-8 pt-8 pb-4">
        <div className="mb-4 flex items-center gap-3">
          <div className={styles.iconWrapper}>
            <Lock className="h-5 w-5" />
          </div>
          <h1 className={styles.title}>{t("onboarding.compliance.title")}</h1>
        </div>
        <p className={styles.subtitle}>{t("onboarding.compliance.subtitle")}</p>
      </div>

      {/* Scrollable Text Area */}
      <div className="flex-grow overflow-hidden px-8">
        <div className={styles.scrollArea}>
          <h3 className={styles.sectionTitle}>{t("onboarding.compliance.section1_title")}</h3>
          <p className="mb-3">{t("onboarding.compliance.section1_content")}</p>

          <h3 className={styles.sectionTitle}>{t("onboarding.compliance.section2_title")}</h3>
          <p className="mb-3">{t("onboarding.compliance.section2_content")}</p>

          <h3 className={styles.sectionTitle}>{t("onboarding.compliance.section3_title")}</h3>
          <p className="mb-3">{t("onboarding.compliance.section3_content")}</p>

          <h3 className={styles.sectionTitle}>{t("onboarding.compliance.section4_title")}</h3>
          <p>{t("onboarding.compliance.section4_content")}</p>
        </div>
      </div>

      {/* Checkbox Section */}
      <div className={`z-20 flex-shrink-0 space-y-4 px-8 py-6 ${styles.checkboxSection}`}>
        <AdCheckbox
          label={t("onboarding.compliance.checkbox_gdpr")}
          checked={checked1}
          onChange={(e) => setChecked1(e.target.checked)}
        />

        <AdCheckbox
          label={t("onboarding.compliance.checkbox_terms")}
          checked={checked2}
          onChange={(e) => setChecked2(e.target.checked)}
        />

        {/* Logic Button */}
        <AdButton
          disabled={!canProceed || isLoading}
          onClick={handleContinue}
          variant="secondary"
          fullWidth
          endIcon={<ArrowRight className="h-4 w-4" />}
          className="mt-2"
        >
          {t("onboarding.compliance.btn_continue")}
        </AdButton>
      </div>

      {/* Compliance Footer */}
      <div className={`flex-shrink-0 px-8 py-3 ${styles.footer}`}>
        <Shield className={`h-3.5 w-3.5 ${styles.footerIcon}`} />
        <span className={styles.footerText}>{t("onboarding.compliance.footer_badge")}</span>
      </div>
    </AdCard>
  );
}
