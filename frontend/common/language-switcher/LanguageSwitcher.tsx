"use client";

import React, { useState, useRef, useEffect } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { SUPPORTED_LANGUAGES, type SupportedLanguage, changeLanguage } from "@/lib/i18n";

// Short language codes for display
const LANGUAGE_SHORT: Record<SupportedLanguage, string> = {
  de: "DE",
  en: "EN",
  vi: "VI",
};

const LANGUAGE_FLAGS: Record<SupportedLanguage, string> = {
  de: "🇩🇪",
  en: "🇬🇧",
  vi: "🇻🇳",
};

export interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = (i18n.language?.substring(0, 2) || "de") as SupportedLanguage;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageChange = (lang: SupportedLanguage) => {
    changeLanguage(lang); // Use the helper that also persists to localStorage
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={twMerge("relative", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "flex items-center gap-1.5 px-2.5 py-1.5",
          "rounded-lg border border-transparent",
          "text-sm font-medium text-neutral-600",
          "transition-all duration-200",
          "hover:bg-neutral-100 hover:text-neutral-900",
          "focus:ring-primary-500/20 focus:ring-2 focus:outline-none",
          isOpen && "bg-neutral-100 text-neutral-900"
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Globe className="h-4 w-4" />
        <span>{LANGUAGE_SHORT[currentLang]}</span>
        <ChevronDown
          className={clsx("h-3.5 w-3.5 transition-transform duration-200", isOpen && "rotate-180")}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={clsx(
            "absolute top-full right-0 z-50 mt-1",
            "min-w-[140px] rounded-lg",
            "border border-neutral-200 bg-white shadow-lg",
            "overflow-hidden py-1",
            "animate-in fade-in-0 zoom-in-95 duration-150"
          )}
          role="listbox"
          aria-label="Select language"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => handleLanguageChange(lang)}
              className={clsx(
                "flex w-full items-center justify-between gap-3 px-3 py-2",
                "text-left text-sm transition-colors",
                lang === currentLang
                  ? "bg-primary-50 text-primary-700 font-medium"
                  : "text-neutral-700 hover:bg-neutral-50"
              )}
              role="option"
              aria-selected={lang === currentLang}
            >
              <span className="flex items-center gap-2">
                <span>{LANGUAGE_FLAGS[lang]}</span>
                <span>{LANGUAGE_SHORT[lang]}</span>
              </span>
              {lang === currentLang && <Check className="text-primary-600 h-4 w-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
