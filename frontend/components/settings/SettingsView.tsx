"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import PageHeader from "@/components/layout/PageHeader";
import { useTheme } from "@/common/context";
import {
  useGetProfileDetailQuery,
  useUpdateProfileMutation,
  useLazyGetAvatarUploadUrlQuery,
} from "@/ducks/auth/authApi";
import styles from "./settings-view.module.css";

type Tab = "all" | "profile" | "notifications" | "security";
type Theme = "light" | "dark" | "system";

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: "all",           icon: "manage_accounts",      label: "All Settings" },
  { id: "profile",       icon: "person",               label: "Profile" },
  { id: "notifications", icon: "notifications_active", label: "Notifications" },
  { id: "security",      icon: "security",             label: "Security" },
];

const THEME_OPTIONS: { value: Theme; icon: string; label: string; bg: string }[] = [
  { value: "light",  icon: "light_mode",      label: "Light",  bg: styles.themeBgLight },
  { value: "dark",   icon: "dark_mode",       label: "Dark",   bg: styles.themeBgDark },
  { value: "system", icon: "desktop_windows", label: "System", bg: styles.themeBgSystem },
];

function MIcon({ name, size = 20, fill = false }: { name: string; size?: number; fill?: boolean }) {
  return (
    <span
      className="material-symbols-outlined select-none leading-none shrink-0"
      style={{ fontSize: size, fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24` }}
    >
      {name}
    </span>
  );
}

export default function SettingsView() {
  const { t, i18n } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { theme: currentTheme, setTheme: applyTheme } = useTheme();
  const [pendingTheme, setPendingTheme] = useState<Theme>(currentTheme);

  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Form state — mirrors saved profile, editable before Save
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    language: i18n.language?.slice(0, 2) ?? "en",
    avatarUrl: null as string | null,
  });

  // Load real profile data
  const { data: profile } = useGetProfileDetailQuery();
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();
  const [fetchAvatarUploadUrl] = useLazyGetAvatarUploadUrlQuery();

  // Hydrate form when profile loads
  useEffect(() => {
    if (profile) {
      setForm((prev) => ({
        ...prev,
        firstName: profile.firstName ?? "",
        lastName: profile.lastName ?? "",
        language: profile.languageCode ?? prev.language,
        avatarUrl: profile.avatarUrl ?? null,
      }));
    }
  }, [profile]);

  const isAll = activeTab === "all";

  const handleAvatarClick = () => {
    if (!avatarUploading) fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setAvatarUploading(true);
    try {
      const { data: urls } = await fetchAvatarUploadUrl(file.name);
      if (!urls) return;

      await fetch(urls.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      setForm((prev) => ({ ...prev, avatarUrl: urls.fileUrl }));
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSave = async () => {
    await updateProfile({
      firstName: form.firstName,
      lastName: form.lastName,
      avatarUrl: form.avatarUrl,
      languageCode: form.language,
    });

    i18n.changeLanguage(form.language);
    if (pendingTheme !== "system") applyTheme(pendingTheme as "light" | "dark");

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const initial = (form.firstName?.[0] ?? form.lastName?.[0] ?? "?").toUpperCase();

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Manage your preferences and account security."
        backLabel={t("nav.dashboard", { defaultValue: "Dashboard" })}
        backHref="/dashboard"
      />

      <div className={styles.content}>
        <div className={styles.grid}>

          {/* ── Left nav ── */}
          <aside>
            <nav className={styles.navList}>
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  className={`${styles.navTab} ${activeTab === tab.id ? styles.navTabActive : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <MIcon name={tab.icon} size={20} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* ── Right content ── */}
          <div className={styles.contentCol}>

            {/* General Preferences — only in "All Settings" */}
            {isAll && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>General Preferences</h2>
                <div className={styles.sectionBody}>

                  {/* Language */}
                  <div className={`${styles.settingRow} ${styles.settingRowBorder}`}>
                    <div className={styles.settingMeta}>
                      <label htmlFor="settings-lang" className={styles.fieldLabel}>Language</label>
                      <span className={styles.fieldDesc}>Select your preferred interface language.</span>
                    </div>
                    <div className={styles.selectWrap}>
                      <select
                        id="settings-lang"
                        className={styles.fieldSelect}
                        value={form.language}
                        onChange={(e) => setForm((prev) => ({ ...prev, language: e.target.value }))}
                      >
                        <option value="en">English (US)</option>
                        <option value="vi">Vietnamese</option>
                        <option value="de">German</option>
                      </select>
                      <MIcon name="expand_more" size={18} />
                    </div>
                  </div>

                  {/* Theme */}
                  <div className={styles.settingRow}>
                    <div className={styles.settingMeta}>
                      <span className={styles.fieldLabel}>Theme</span>
                      <span className={styles.fieldDesc}>Customize the visual appearance.</span>
                    </div>
                    <div className={styles.themeGrid}>
                      {THEME_OPTIONS.map((t) => (
                        <label
                          key={t.value}
                          className={`${styles.themeOption} ${t.bg} ${pendingTheme === t.value ? styles.themeOptionActive : ""} ${t.value === "system" ? styles.themeOptionDisabled : ""}`}
                        >
                          <input
                            type="radio"
                            name="theme"
                            value={t.value}
                            checked={pendingTheme === t.value}
                            onChange={() => { if (t.value !== "system") setPendingTheme(t.value); }}
                            disabled={t.value === "system"}
                            className={styles.srOnly}
                          />
                          <MIcon name={t.icon} size={24} fill={pendingTheme === t.value} />
                          <span className={styles.themeLabel}>{t.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                </div>
              </section>
            )}

            {/* Profile Information */}
            {(isAll || activeTab === "profile") && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Profile Information</h2>
                <div className={styles.sectionBody}>

                  <div className={styles.avatarRow}>
                    <div className={styles.avatarWrap}>
                      <div className={styles.avatarCircle} onClick={handleAvatarClick}>
                        {form.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={form.avatarUrl} alt="Avatar" className={styles.avatarImg} />
                        ) : (
                          <span className={styles.avatarFallback}>{initial}</span>
                        )}
                        {avatarUploading ? (
                          <div className={styles.avatarUploading}>
                            <MIcon name="hourglass_empty" size={18} />
                          </div>
                        ) : (
                          <div className={styles.avatarOverlay}>
                            <MIcon name="photo_camera" size={20} />
                          </div>
                        )}
                      </div>
                      <button
                        className={`${styles.changeAvatarBtn} ${avatarUploading ? styles.changeAvatarBtnDisabled : ""}`}
                        onClick={handleAvatarClick}
                        disabled={avatarUploading}
                      >
                        {avatarUploading ? "Uploading…" : "Change Avatar"}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className={styles.srOnly}
                        onChange={handleAvatarChange}
                        aria-label="Upload avatar"
                      />
                    </div>
                  </div>

                  <div className={styles.fieldsGrid}>
                    <div className={styles.fieldGroup}>
                      <label htmlFor="settings-firstname" className={styles.fieldLabel}>First Name</label>
                      <input
                        id="settings-firstname"
                        type="text"
                        className={styles.fieldInput}
                        value={form.firstName}
                        onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label htmlFor="settings-lastname" className={styles.fieldLabel}>Last Name</label>
                      <input
                        id="settings-lastname"
                        type="text"
                        className={styles.fieldInput}
                        value={form.lastName}
                        onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className={styles.passwordRow}>
                    <button className={styles.passwordBtn}>
                      <MIcon name="key" size={18} />
                      Update Password
                    </button>
                  </div>

                </div>
              </section>
            )}

            {/* Notifications */}
            {(isAll || activeTab === "notifications") && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Notifications</h2>
                <div className={styles.notifList}>
                  {([
                    {
                      key: "email" as const,
                      title: "Email Alerts",
                      desc: "Receive weekly summaries and important updates.",
                      checked: notifEmail,
                      toggle: () => setNotifEmail((v) => !v),
                    },
                    {
                      key: "push" as const,
                      title: "Push Notifications",
                      desc: "Real-time alerts for large transactions.",
                      checked: notifPush,
                      toggle: () => setNotifPush((v) => !v),
                    },
                  ]).map((item) => (
                    <div key={item.key} className={styles.notifRow}>
                      <div>
                        <p className={styles.notifTitle}>{item.title}</p>
                        <p className={styles.notifDesc}>{item.desc}</p>
                      </div>
                      <label className={styles.toggleWrap} aria-label={item.title}>
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={item.toggle}
                          className={styles.srOnly}
                        />
                        <div className={`${styles.toggleTrack} ${item.checked ? styles.toggleTrackOn : ""}`}>
                          <div className={`${styles.toggleThumb} ${item.checked ? styles.toggleThumbOn : ""}`} />
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Security */}
            {activeTab === "security" && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Security</h2>
                <p className={styles.fieldDesc}>Two-factor authentication and security settings coming soon.</p>
              </section>
            )}

            {/* Save */}
            <div className={styles.saveRow}>
              {showSuccess && (
                <span className={styles.successToast}>
                  <MIcon name="check_circle" size={16} fill />
                  Settings saved successfully.
                </span>
              )}
              <button
                className={styles.saveBtn}
                onClick={handleSave}
                disabled={isSaving || avatarUploading}
              >
                {isSaving ? "Saving…" : "Save Changes"}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
