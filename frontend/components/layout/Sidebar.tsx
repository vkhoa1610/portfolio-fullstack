"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Receipt,
  FileText,
  CheckSquare,
  LayoutDashboard,
  CreditCard,
  Download,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/common/context/AuthContext";
import { useLogoutMutation } from "@/ducks/auth/authApi";
import { useGetManagerQueueQuery } from "@/ducks/expenses";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type UserRole = "EMPLOYEE" | "MANAGER" | "FINANCE";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
  badgeKey?: "approvalCount";
  soon?: boolean; // disable + show "soon" badge (placeholder untuk Flow 4)
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Navigation config — edit here when adding new pages
// ─────────────────────────────────────────────────────────────────────────────

const NAV_GROUPS: NavGroup[] = [
  {
    label: "nav.group_core",
    items: [
      {
        label: "nav.my_expenses",
        href: "/my-expenses",
        icon: Receipt,
        roles: ["EMPLOYEE", "MANAGER"],
      },
      {
        label: "nav.reports",
        href: "/reports",
        icon: FileText,
        roles: ["EMPLOYEE", "MANAGER"],
        soon: true,
      },
    ],
  },
  {
    label: "nav.group_management",
    items: [
      {
        label: "nav.approvals",
        href: "/manager/approvals",
        icon: CheckSquare,
        roles: ["MANAGER"],
        badgeKey: "approvalCount",
      },
    ],
  },
  {
    label: "nav.group_finance",
    items: [
      {
        label: "nav.overview",
        href: "/finance/overview",
        icon: LayoutDashboard,
        roles: ["FINANCE"],
      },
      {
        label: "nav.final_check",
        href: "/finance/check",
        icon: CheckSquare,
        roles: ["FINANCE"],
      },
      {
        label: "nav.batch_payment",
        href: "/finance/payment",
        icon: CreditCard,
        roles: ["FINANCE"],
      },
      {
        label: "nav.tax_export",
        href: "/finance/export",
        icon: Download,
        roles: ["FINANCE"],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ApprovalBadge — separate component to isolate the RTK Query hook per role
// ─────────────────────────────────────────────────────────────────────────────

function ApprovalBadge() {
  const { data: queue = [] } = useGetManagerQueueQuery();
  if (queue.length === 0) return null;
  return (
    <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
      {queue.length}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const { session, clearSession } = useAuth();
  const [logout] = useLogoutMutation();

  const role = session?.user.role as UserRole | undefined;

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } finally {
      clearSession();
      router.push("/auth/login");
    }
  };

  if (!role) return null;

  const initial = (session?.user.email[0] ?? "?").toUpperCase();

  return (
    <aside className="glass-panel relative z-20 hidden w-64 flex-col border-r border-r-surface-border bg-white/50 p-4 backdrop-blur-xl md:flex">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2 px-2">
        <div className="h-8 w-8 rounded-lg bg-primary-600" />
        <span className="font-bold text-gray-800">FintechSaaS</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-4">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) =>
            item.roles.includes(role),
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label}>
              <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t(group.label)}
              </p>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  const Icon = item.icon;

                  if (item.soon) {
                    return (
                      <div
                        key={item.href}
                        className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300"
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1">{t(item.label)}</span>
                        <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-400">
                          soon
                        </span>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-primary-50 text-primary-700"
                          : "text-gray-600 hover:bg-white/60 hover:text-gray-900"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{t(item.label)}</span>
                      {item.badgeKey === "approvalCount" && role === "MANAGER" && (
                        <ApprovalBadge />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="mt-auto border-t border-gray-100 pt-4">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
            {initial}
          </div>
          <div className="min-w-0 flex-1 text-sm">
            <p className="truncate font-medium text-gray-700">
              {session?.user.email}
            </p>
            <p className="text-xs capitalize text-gray-500">
              {role.charAt(0) + role.slice(1).toLowerCase()}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="shrink-0 text-gray-400 transition-colors hover:text-red-500"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
