/* eslint-disable @next/next/no-img-element */

"use client";

import React, { useState, FormEvent } from "react";
import { Hexagon, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { AdInput, AdButton, LanguageSwitcher } from "@/common";
import { useAuth } from "@/common/context/AuthContext";
import { useLoginMutation } from "@/ducks/auth/authApi";
import { isMfaRequired, isLoginSuccess } from "@/ducks/auth/types";
import DemoRoleCards from "./DemoRoleCards";

export default function LoginView() {
  const { t } = useTranslation();
  const router = useRouter();
  const { setSession } = useAuth();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // API mutation
  const [login, { isLoading }] = useLoginMutation();

  // ─────────────────────────────────────────────────────────────────
  // Handle Login Submit
  // ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError(t("auth.login.error_required_fields"));
      return;
    }

    try {
      const result = await login({ email, password }).unwrap();

      // Case 1: MFA Required
      if (isMfaRequired(result)) {
        // Pass session and email to MFA page via URL params
        // Note: session is a temporary Cognito token, safe to pass
        const params = new URLSearchParams({
          session: result.session,
          email: email,
        });
        router.push(`/auth/mfa?${params.toString()}`);
        return;
      }

      // Case 2: Login Success (no MFA)
      if (isLoginSuccess(result)) {
        // Store session in AuthContext (in-memory only!)
        setSession(result.session);
        // Redirect to appropriate page
        router.push(result.redirectTo);
        return;
      }
    } catch (err: unknown) {
      console.error("Login error:", err);
      // Safe error handling
      const errorMessage =
        (err as { data?: { message?: string[] } })?.data?.message?.[0] ||
        t("auth.login.error_generic");
      setError(errorMessage);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-surface-ground font-sans text-neutral-900">
      {/* --- LEFT SIDE: BRANDING --- */}
      <div className="relative hidden items-center justify-center overflow-hidden bg-primary-900 lg:flex lg:w-1/2">
        <div className="absolute inset-0 z-10 bg-gradient-to-tr from-primary-900 via-primary-800 to-secondary-900 opacity-90" />
        <img
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80"
          alt="Office"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="relative z-20 px-12 text-center text-white">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md">
              <Hexagon className="h-8 w-8 fill-white/20 text-white" />
            </div>
          </div>
          <h2 className="mb-4 text-4xl font-bold tracking-tight">
            {t("auth.login.branding_title")}
          </h2>
          <p className="mx-auto max-w-md text-lg text-primary-100">
            {t("auth.login.branding_subtitle")}
          </p>
        </div>
      </div>

      {/* --- RIGHT SIDE: FORM AREA --- */}
      <div className="relative flex w-full flex-col justify-center bg-white px-8 sm:px-12 md:px-24 lg:w-1/2">
        {/* Language Switcher - Top Right */}
        <div className="absolute right-6 top-6">
          <LanguageSwitcher />
        </div>

        {/* Header */}
        <div className="mb-10 flex items-center gap-2 text-primary-600">
          <Hexagon className="h-8 w-8 fill-current" />
          <span className="text-xl font-bold tracking-tight text-neutral-900">
            {t("auth.login.company_name")}
          </span>
        </div>

        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold text-neutral-900">{t("auth.login.title")}</h1>
          <p className="text-neutral-500">{t("auth.login.subtitle")}</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Form Container */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Email Input */}
          <AdInput
            label={t("auth.login.email_label")}
            type="email"
            placeholder={t("auth.login.email_placeholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />

          {/* Password Input */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-700">
                {t("auth.login.password_label")}
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                {t("auth.login.forgot_password")}
              </Link>
            </div>
            <AdInput
              type={showPassword ? "text" : "password"}
              placeholder={t("auth.login.password_placeholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              endIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="pointer-events-auto text-neutral-400 transition-colors hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              }
            />
          </div>

          {/* Primary Button */}
          <AdButton
            type="submit"
            variant="primary"
            fullWidth
            disabled={isLoading}
            endIcon={
              isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )
            }
          >
            {isLoading ? t("auth.login.btn_loading") : t("auth.login.btn_submit")}
          </AdButton>

          {/* Divider */}
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-neutral-200"></div>
            <span className="mx-4 flex-shrink-0 text-sm text-neutral-400">
              {t("auth.login.divider_text")}
            </span>
            <div className="flex-grow border-t border-neutral-200"></div>
          </div>

        </form>

        {/* Demo role cards */}
        <DemoRoleCards />

        {/* Footer Links */}
        <div className="mt-8 flex justify-center gap-6 border-t border-neutral-100 pt-6 text-xs font-medium text-neutral-400">
          <Link href="/impressum" className="transition-colors hover:text-primary-600">
            {t("common.footer_links.impressum")}
          </Link>
          <Link href="/datenschutz" className="transition-colors hover:text-primary-600">
            {t("common.footer_links.privacy")}
          </Link>
        </div>
      </div>
    </div>
  );
}
