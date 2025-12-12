/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/anchor-is-valid */

"use client";

import React from "react";
import { ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";
import { AdCard, AdButton } from "@/common";

export default function MfaView() {
  return (
    <AdCard className="w-full max-w-md">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 text-center">
        <div className="bg-secondary-50 text-secondary-600 ring-secondary-50/50 mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full ring-4">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-neutral-900">Bảo mật tài khoản</h1>
        <p className="text-sm text-neutral-500">
          Nhập mã 6 số từ ứng dụng Authenticator (Google/Microsoft).
        </p>
      </div>

      <div className="flex flex-col items-center space-y-8 px-8 pb-8">
        {/* QR Placeholder */}
        <div className="flex h-40 w-40 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50">
          <div className="h-24 w-24 rounded-md bg-neutral-200"></div> {/* Fake QR */}
          <span className="font-mono text-[10px] text-neutral-400">SCAN_ME</span>
        </div>

        {/* OTP Input Group */}
        <div className="w-full">
          <label className="mb-3 block text-center text-xs font-bold tracking-wider text-neutral-500 uppercase">
            Mã xác thực
          </label>
          <div className="flex justify-between gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <input
                key={i}
                type="text"
                maxLength={1}
                className="focus:border-primary-500 focus:ring-primary-500/20 h-14 w-12 rounded-md border border-neutral-300 bg-neutral-50 text-center text-xl font-bold text-neutral-900 transition-all outline-none focus:bg-white focus:ring-2"
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="w-full space-y-4">
          <AdButton variant="secondary" fullWidth endIcon={<ArrowRight className="h-4 w-4" />}>
            Xác nhận
          </AdButton>

          <div className="text-center">
            <Link
              href="#"
              className="text-primary-600 hover:text-primary-500 text-sm font-medium hover:underline"
            >
              Tôi không thể quét mã?
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-neutral-100 bg-neutral-50 px-8 py-4 text-center">
        <span className="text-xs text-neutral-400">© 2025 ISB System Security</span>
      </div>
    </AdCard>
  );
}
