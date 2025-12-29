/* eslint-disable jsx-a11y/anchor-is-valid */

"use client";

import React, { useState, useEffect, useRef, FormEvent, KeyboardEvent } from "react";
import { ShieldCheck, ArrowRight, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { AdCard, AdButton, LanguageSwitcher } from "@/common";
import { useAuth } from "@/common/context/AuthContext";
import { useVerifyMfaMutation } from "@/ducks/auth/authApi";

// Number of OTP digits
const OTP_LENGTH = 6;

export default function MfaView() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useAuth();

  // Get session and email from URL params (passed from login page)
  const cognitoSession = searchParams.get("session") || "";
  const email = searchParams.get("email") || "";

  // OTP input state
  const [otpValues, setOtpValues] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // API mutation
  const [verifyMfa, { isLoading }] = useVerifyMfaMutation();

  // Redirect if no session (direct access without login)
  useEffect(() => {
    if (!cognitoSession || !email) {
      router.replace("/auth/login");
    }
  }, [cognitoSession, email, router]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // ─────────────────────────────────────────────────────────────────
  // OTP Input Handlers
  // ─────────────────────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otpValues];
    newOtp[index] = value;
    setOtpValues(newOtp);
    setError(null);

    // Auto-focus next input
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (value && index === OTP_LENGTH - 1 && newOtp.every((v) => v !== "")) {
      handleSubmit(undefined, newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace - move to previous input
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);

    if (pasted.length === OTP_LENGTH) {
      const newOtp = pasted.split("");
      setOtpValues(newOtp);
      inputRefs.current[OTP_LENGTH - 1]?.focus();

      // Auto-submit
      handleSubmit(undefined, pasted);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // Handle MFA Submit
  // ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e?: FormEvent, otpOverride?: string) => {
    e?.preventDefault();

    const otp = otpOverride || otpValues.join("");

    if (otp.length !== OTP_LENGTH) {
      setError(t("auth.mfa.error_incomplete"));
      return;
    }

    try {
      const result = await verifyMfa({
        otp,
        session: cognitoSession,
        email,
      }).unwrap();

      if (result.authenticated) {
        // Store session in AuthContext (in-memory only!)
        setSession(result.session);
        // Redirect to appropriate page
        router.push(result.redirectTo);
      }
    } catch (err: unknown) {
      console.error("MFA verification error:", err);
      const errorMessage =
        (err as { data?: { message?: string[] } })?.data?.message?.[0] ||
        t("auth.mfa.error_invalid");
      setError(errorMessage);

      // Clear OTP on error
      setOtpValues(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    }
  };

  // Don't render if no session (will redirect)
  if (!cognitoSession || !email) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 p-4">
      <AdCard className="relative w-full max-w-md">
        {/* Language Switcher - Top Right */}
        <div className="absolute right-4 top-4 z-10">
          <LanguageSwitcher />
        </div>

        {/* Header */}
        <div className="px-8 pb-6 pt-8 text-center">
          <div className="ring-secondary-50/50 mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-secondary-50 text-secondary-600 ring-4">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-neutral-900">{t("auth.mfa.title")}</h1>
          <p className="text-sm text-neutral-500">{t("auth.mfa.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-8 px-8 pb-8">
          {/* Error Message */}
          {error && (
            <div className="w-full rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm text-red-600">
              {error}
            </div>
          )}

          {/* OTP Input Group */}
          <div className="w-full">
            <label className="mb-3 block text-center text-xs font-bold uppercase tracking-wider text-neutral-500">
              {t("auth.mfa.otp_label")}
            </label>
            <div className="flex justify-between gap-2">
              {otpValues.map((value, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={value}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  disabled={isLoading}
                  className="focus:ring-primary-500/20 h-14 w-12 rounded-md border border-neutral-300 bg-neutral-50 text-center text-xl font-bold text-neutral-900 outline-none transition-all focus:border-primary-500 focus:bg-white focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
                  autoComplete="one-time-code"
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="w-full space-y-4">
            <AdButton
              type="submit"
              variant="secondary"
              fullWidth
              disabled={isLoading || otpValues.some((v) => !v)}
              endIcon={
                isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )
              }
            >
              {isLoading ? t("auth.mfa.btn_loading") : t("auth.mfa.btn_submit")}
            </AdButton>

            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => router.push("/auth/login")}
                className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-500 hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("auth.mfa.back_to_login")}
              </button>

              <span className="text-neutral-300">|</span>

              <Link
                href="#"
                className="text-sm font-medium text-primary-600 hover:text-primary-500 hover:underline"
              >
                {t("auth.mfa.help_link")}
              </Link>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-neutral-100 bg-neutral-50 px-8 py-4 text-center">
          <span className="text-xs text-neutral-400">{t("auth.mfa.footer")}</span>
        </div>
      </AdCard>
    </div>
  );
}
