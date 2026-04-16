"use client";

import React from "react";
import { UserCog, Globe, ShieldCheck, Info, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { AdCard, AdButton, AdSelect } from "@/common";
import { LANGUAGE_NAMES, type SupportedLanguage } from "@/lib/i18n";
import { useGetSessionQuery, useSubmitProfileMutation } from "@/ducks/auth";
import styles from "./profile-view.module.css";

export default function ProfileView() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { data: sessionData } = useGetSessionQuery();
  const [submitProfile, { isLoading }] = useSubmitProfileMutation();

  const role = sessionData?.session?.user?.role ?? 'EMPLOYEE';

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = event.target.value as SupportedLanguage;
    i18n.changeLanguage(newLanguage);
  };

  const handleSubmit = async () => {
    await submitProfile({ languageCode: i18n.language }).unwrap();
    router.push('/dashboard');
  };

  return (
    <AdCard className="w-full max-w-md">
      {/* Header */}
      <div className="px-8 pt-8 pb-2 text-center">
        <div className={styles.iconWrapper}>
          <UserCog className="h-7 w-7" />
        </div>
        <h1 className={styles.title}>{t("onboarding.profile.title")}</h1>
        <p className={styles.subtitle}>{t("onboarding.profile.subtitle")}</p>
      </div>

      <div className="space-y-6 px-8 pt-6 pb-8">
        {/* Language Select */}
        <AdSelect
          label={t("onboarding.profile.language_label")}
          startIcon={<Globe className="h-4 w-4" />}
          value={i18n.language}
          onChange={handleLanguageChange}
        >
          {(Object.entries(LANGUAGE_NAMES) as [SupportedLanguage, string][]).map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </AdSelect>

        {/* Read-only Info Card */}
        <div className={`space-y-4 ${styles.infoCard}`}>
          <div className={styles.infoCardHeader}>
            <div className={styles.infoCardHeaderLabel}>
              <ShieldCheck className={`h-4 w-4 ${styles.infoCardIcon}`} />
              <span className={styles.infoCardSectionLabel}>
                {t("onboarding.profile.system_profile")}
              </span>
            </div>
            <span className={styles.statusBadge}>{t("onboarding.profile.status_active")}</span>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className={styles.fieldLabel}>{t("onboarding.profile.role_label")}</p>
              <div className="flex items-center gap-2">
                <span className={styles.fieldValue}>{role}</span>
                <span className={styles.levelBadge} title="Level 1">L1</span>
              </div>
            </div>

            <div className="text-right">
              <p className={styles.fieldLabel}>{t("onboarding.profile.limit_label")}</p>
              <p className={styles.limitValue}>{t("onboarding.profile.limit_value")}</p>
            </div>
          </div>

          <div className="mt-2 flex items-start gap-2">
            <Info className={`mt-0.5 h-3 w-3 flex-shrink-0 ${styles.noteIcon}`} />
            <p className={styles.adminNote}>{t("onboarding.profile.admin_note")}</p>
          </div>
        </div>

        {/* Submit Button */}
        <AdButton
          variant="secondary"
          fullWidth
          disabled={isLoading}
          onClick={handleSubmit}
          endIcon={
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          }
          className="group"
        >
          {t("onboarding.profile.btn_submit")}
        </AdButton>
      </div>
    </AdCard>
  );
}
