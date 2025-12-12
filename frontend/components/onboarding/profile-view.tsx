"use client";

import React from "react";
import { UserCog, Globe, ShieldCheck, Info, ArrowRight } from "lucide-react";
import { AdCard, AdButton, AdSelect } from "@/common";

export default function ProfileView() {
  return (
    <AdCard className="w-full max-w-md">
      {/* Header */}
      <div className="px-8 pt-8 pb-2 text-center">
        <div className="bg-primary-50 text-primary-600 ring-primary-50/50 mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full ring-4">
          <UserCog className="h-7 w-7" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-neutral-900">Profil & Einstellungen</h1>
        <p className="text-sm text-neutral-500">Thiết lập thông tin cá nhân và ngôn ngữ.</p>
      </div>

      <div className="space-y-6 px-8 pt-6 pb-8">
        {/* Language Select */}
        <AdSelect label="Ngôn ngữ hiển thị" startIcon={<Globe className="h-4 w-4" />}>
          <option value="de">Deutsch (Deutschland)</option>
          <option value="en">English (International)</option>
          <option value="vi">Tiếng Việt</option>
        </AdSelect>

        {/* Read-only Info Card */}
        <div className="space-y-4 rounded-xl border border-neutral-200 bg-neutral-50 p-5">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-primary-600 h-4 w-4" />
              <span className="text-xs font-bold tracking-wider text-neutral-500 uppercase">
                Hồ sơ hệ thống
              </span>
            </div>
            <span className="bg-success-50 text-success-700 border-success-500/20 rounded border px-2 py-0.5 text-[10px] font-medium">
              Active
            </span>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="mb-1 text-xs font-medium text-neutral-500">Vai trò</p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-neutral-900">Mitarbeiter</span>
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded bg-neutral-200 text-[10px] font-bold text-neutral-600"
                  title="Level 1"
                >
                  L1
                </span>
              </div>
            </div>

            <div className="text-right">
              <p className="mb-1 text-xs font-medium text-neutral-500">Hạn mức / Tháng</p>
              <p className="font-mono text-sm font-bold tracking-tight text-neutral-900">
                5.000,00 €
              </p>
            </div>
          </div>

          <div className="mt-2 flex items-start gap-2">
            <Info className="mt-0.5 h-3 w-3 flex-shrink-0 text-neutral-400" />
            <p className="text-[11px] leading-tight text-neutral-400 italic">
              Các thông tin này được quản lý tập trung bởi bộ phận IT Admin.
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <AdButton
          variant="secondary"
          fullWidth
          endIcon={
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          }
          className="group"
        >
          Lưu & Vào Dashboard
        </AdButton>
      </div>
    </AdCard>
  );
}
