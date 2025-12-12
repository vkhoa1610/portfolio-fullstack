"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Import translation resources
import de from "@/locales/de.json";
import en from "@/locales/en.json";
import vi from "@/locales/vi.json";

// Define supported languages
export const SUPPORTED_LANGUAGES = ["de", "en", "vi"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// Language display names
export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  de: "Deutsch (Deutschland)",
  en: "English (International)",
  vi: "Tiếng Việt",
};

// Initialize i18next WITHOUT language detector to prevent hydration mismatch
// Language will be set manually after hydration
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      de: { translation: de },
      en: { translation: en },
      vi: { translation: vi },
    },

    // ALWAYS use German for initial render (SSR + first client render)
    // This ensures hydration matches
    lng: "de",
    fallbackLng: "de",
    supportedLngs: SUPPORTED_LANGUAGES,

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
    },
  });
}

/**
 * Initialize language from localStorage after hydration
 * Call this in I18nProvider useEffect
 */
export function initLanguageFromStorage() {
  if (typeof window !== "undefined") {
    const savedLang = localStorage.getItem("i18nextLng");
    if (savedLang && SUPPORTED_LANGUAGES.includes(savedLang as SupportedLanguage)) {
      i18n.changeLanguage(savedLang);
    }
  }
}

/**
 * Change language and persist to localStorage
 */
export function changeLanguage(lang: SupportedLanguage) {
  i18n.changeLanguage(lang);
  if (typeof window !== "undefined") {
    localStorage.setItem("i18nextLng", lang);
  }
}

export default i18n;
