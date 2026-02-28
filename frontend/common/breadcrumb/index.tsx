"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";

// Map URL segment → i18n key
const SEGMENT_KEYS: Record<string, string> = {
  dashboard: "nav.dashboard",
  "my-expenses": "nav.my_expenses",
  create: "nav.create",
  scan: "nav.scan",
  "per-diem": "nav.per_diem",
  mileage: "nav.mileage",
  review: "nav.review",
  approvals: "nav.approvals",
  finance: "nav.finance",
  overview: "nav.overview",
};

// Routing-only segments — not shown in breadcrumb
const SKIP_SEGMENTS = new Set(["manager"]);

function isId(segment: string): boolean {
  // UUID or numeric id
  return /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(segment) || /^\d+$/.test(segment);
}

export function Breadcrumb() {
  const { t } = useTranslation();
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];
  let path = "";

  for (const segment of segments) {
    path += `/${segment}`;
    if (SKIP_SEGMENTS.has(segment)) continue;
    if (isId(segment)) {
      crumbs.push({ label: t("nav.detail"), href: path });
    } else if (SEGMENT_KEYS[segment]) {
      crumbs.push({ label: t(SEGMENT_KEYS[segment]), href: path });
    }
  }

  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="breadcrumb" className="flex items-center gap-1 text-sm">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={crumb.href} className="flex items-center gap-1">
            {i > 0 && (
              <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
            )}
            {isLast ? (
              <span className="font-semibold text-gray-800">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="text-gray-500 transition-colors hover:text-primary-600"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
