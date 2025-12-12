"use client";

import { useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import i18n, { initLanguageFromStorage } from "@/lib/i18n";

interface I18nProviderProps {
  children: React.ReactNode;
}

/**
 * I18nProvider that:
 * 1. Renders with German (fallback) during SSR and initial hydration
 * 2. After hydration, loads saved language from localStorage
 * This prevents hydration mismatch
 */
export function I18nProvider({ children }: I18nProviderProps) {
  const [, setHydrated] = useState(false);

  useEffect(() => {
    // After hydration, load saved language preference
    initLanguageFromStorage();
    setHydrated(true);
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
