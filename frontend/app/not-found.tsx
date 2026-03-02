"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ShieldOff, Home } from "lucide-react";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4">
      <div className="flex flex-col items-center gap-6 text-center">
        {/* Icon */}
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-neutral-100">
          <ShieldOff className="h-12 w-12 text-neutral-400" />
        </div>

        {/* Error code */}
        <p className="text-6xl font-bold text-neutral-200">404</p>

        {/* Message */}
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-neutral-800">
            {t("errors.not_found.title", "Trang không tìm thấy")}
          </h1>
          <p className="text-sm text-neutral-500">
            {t(
              "errors.not_found.description",
              "Bạn không có quyền truy cập trang này hoặc trang không tồn tại."
            )}
          </p>
        </div>

        {/* Back to dashboard */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
        >
          <Home className="h-4 w-4" />
          {t("errors.not_found.back_home", "Về trang chủ")}
        </Link>
      </div>
    </div>
  );
}
