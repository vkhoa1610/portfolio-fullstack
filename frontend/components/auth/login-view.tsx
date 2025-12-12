/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable @next/next/no-img-element */

"use client";

import React, { useState } from "react";
import { Hexagon, Eye, EyeOff, ArrowRight } from "lucide-react";
import Link from "next/link";
import { AdInput, AdButton } from "@/common";

export default function LoginView() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="bg-surface-ground flex min-h-screen w-full font-sans text-neutral-900">
      {/* --- LEFT SIDE: BRANDING --- */}
      <div className="bg-primary-900 relative hidden items-center justify-center overflow-hidden lg:flex lg:w-1/2">
        <div className="from-primary-900 via-primary-800 to-secondary-900 absolute inset-0 z-10 bg-gradient-to-tr opacity-90" />
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
          <h2 className="mb-4 text-4xl font-bold tracking-tight">Enterprise Finance</h2>
          <p className="text-primary-100 mx-auto max-w-md text-lg">
            Hệ thống quản lý chi tiêu thông minh, tuân thủ chuẩn kế toán Đức & Châu Âu.
          </p>
        </div>
      </div>

      {/* --- RIGHT SIDE: FORM AREA --- */}
      <div className="flex w-full flex-col justify-center bg-white px-8 sm:px-12 md:px-24 lg:w-1/2">
        {/* Header */}
        <div className="text-primary-600 mb-10 flex items-center gap-2">
          <Hexagon className="h-8 w-8 fill-current" />
          <span className="text-xl font-bold tracking-tight text-neutral-900">ISB Corp.</span>
        </div>

        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-neutral-900">Willkommen zurück</h1>
          <p className="text-neutral-500">Vui lòng đăng nhập để truy cập hệ thống.</p>
        </div>

        {/* Form Container */}
        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          {/* Email Input */}
          <AdInput label="Email công việc" type="email" placeholder="name@company.com" />

          {/* Password Input */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-700">Mật khẩu</label>
              <Link
                href="/auth/forgot-password"
                className="text-primary-600 hover:text-primary-500 text-sm font-medium"
              >
                Quên mật khẩu?
              </Link>
            </div>
            <AdInput
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
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
            endIcon={<ArrowRight className="h-4 w-4" />}
          >
            Đăng nhập
          </AdButton>

          {/* Divider */}
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-neutral-200"></div>
            <span className="mx-4 flex-shrink-0 text-sm text-neutral-400">hoặc tiếp tục với</span>
            <div className="flex-grow border-t border-neutral-200"></div>
          </div>

          {/* SSO Button */}
          <AdButton
            type="button"
            variant="outline"
            fullWidth
            startIcon={
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            }
          >
            Đăng nhập bằng SSO
          </AdButton>
        </form>

        {/* Footer Links */}
        <div className="mt-8 flex justify-center gap-6 border-t border-neutral-100 pt-6 text-xs font-medium text-neutral-400">
          <Link href="/impressum" className="hover:text-primary-600 transition-colors">
            Impressum
          </Link>
          <Link href="/datenschutz" className="hover:text-primary-600 transition-colors">
            Datenschutz
          </Link>
        </div>
      </div>
    </div>
  );
}
