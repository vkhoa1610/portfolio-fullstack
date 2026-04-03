"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Receipt,
  FileText,
  CheckSquare,
  LayoutDashboard,
  CreditCard,
  Download,
  LogOut,
  Users,
  Sparkles,
  Upload,
  FileDown,
  Cpu,
  ChevronLeft,
  ChevronRight,
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
  soon?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Navigation config
// ─────────────────────────────────────────────────────────────────────────────

const NAV_GROUPS: NavGroup[] = [
  {
    label: "nav.group_core",
    items: [
      { label: "nav.my_expenses", href: "/my-expenses", icon: Receipt, roles: ["EMPLOYEE", "MANAGER"] },
      { label: "nav.reports",     href: "/reports",     icon: FileText, roles: ["EMPLOYEE", "MANAGER"], soon: true },
    ],
  },
  {
    label: "nav.group_management",
    items: [
      { label: "nav.approvals",        href: "/manager/approvals",       icon: CheckSquare, roles: ["MANAGER"], badgeKey: "approvalCount" },
      { label: "nav.ai_report",        href: "/manager/ai-report",        icon: Sparkles,    roles: ["MANAGER"] },
      { label: "nav.report_template",  href: "/manager/report-template",  icon: FileDown,    roles: ["MANAGER"] },
      { label: "nav.ai_playground",    href: "/manager/ai-playground",    icon: Cpu,         roles: ["MANAGER"] },
    ],
  },
  {
    label: "nav.group_finance",
    items: [
      { label: "nav.overview",        href: "/finance/overview", icon: LayoutDashboard, roles: ["FINANCE"] },
      { label: "nav.finance_reports", href: "/finance/reports",  icon: FileText,        roles: ["FINANCE"] },
      { label: "nav.final_check",   href: "/finance/check",    icon: CheckSquare,     roles: ["FINANCE"] },
      { label: "nav.batch_payment", href: "/finance/payment",  icon: CreditCard,      roles: ["FINANCE"] },
      { label: "nav.tax_export",    href: "/finance/export",   icon: Download,        roles: ["FINANCE"] },
    ],
  },
];

const ADMIN_NAV = [
  { label: "nav.admin_dashboard", href: "/admin",        icon: LayoutDashboard },
  { label: "nav.user_management", href: "/admin/users",  icon: Users },
  { label: "nav.import_users",    href: "/admin/import", icon: Upload },
];

// ─────────────────────────────────────────────────────────────────────────────
// ApprovalBadge
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
  const { session, isAdmin, clearSession } = useAuth();
  const [logout] = useLogoutMutation();
  const [collapsed, setCollapsed] = useState(false);

  const role = session?.user.role as UserRole | undefined;

  const handleLogout = async () => {
    try { await logout().unwrap(); } finally {
      clearSession();
      router.push("/auth/login");
    }
  };

  if (!role && !isAdmin) return null;

  const initial = (session?.user.email[0] ?? "?").toUpperCase();
  const displayRole = isAdmin ? "Admin" : role ? role.charAt(0) + role.slice(1).toLowerCase() : "";

  return (
    <aside
      className={`glass-panel relative z-20 hidden flex-col border-r border-r-surface-border bg-white/50 backdrop-blur-xl md:flex
        overflow-hidden transition-[width] duration-300 ease-in-out
        ${collapsed ? "w-16" : "w-64"}`}
    >
      {/* Header row: logo + toggle */}
      <div className={`flex h-14 shrink-0 items-center border-b border-neutral-100 ${collapsed ? "justify-center px-0" : "justify-between px-4"}`}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 shrink-0 rounded-lg bg-primary-600" />
            <span className="font-bold text-gray-800">FintechSaaS</span>
          </div>
        )}
        {collapsed && <div className="h-7 w-7 shrink-0 rounded-lg bg-primary-600" />}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className={`rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors ${collapsed ? "absolute right-1 top-3" : ""}`}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed
            ? <ChevronRight className="h-4 w-4" />
            : <ChevronLeft className="h-4 w-4" />
          }
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3">
        {isAdmin ? (
          // ── Admin nav ──────────────────────────────────────────
          <div className={collapsed ? "" : "px-2"}>
            {!collapsed && (
              <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                {t("nav.group_admin")}
              </p>
            )}
            <div className="space-y-0.5">
              {ADMIN_NAV.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? t(item.label) : undefined}
                    className={`flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors
                      ${collapsed ? "justify-center px-0 mx-1" : "px-3"}
                      ${isActive ? "bg-primary-50 text-primary-700" : "text-gray-600 hover:bg-white/60 hover:text-gray-900"}`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="flex-1 whitespace-nowrap">{t(item.label)}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          // ── Role-based nav ─────────────────────────────────────
          NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter((item) => item.roles.includes(role!));
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.label} className={collapsed ? "mb-2" : "mb-4 px-2"}>
                {!collapsed && (
                  <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    {t(group.label)}
                  </p>
                )}
                {collapsed && <div className="mx-2 my-1 border-t border-neutral-100" />}
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = item.icon;

                    if (item.soon) {
                      return (
                        <div
                          key={item.href}
                          title={collapsed ? t(item.label) : undefined}
                          className={`flex cursor-not-allowed items-center gap-3 rounded-lg py-2.5 text-sm font-medium text-gray-300
                            ${collapsed ? "justify-center px-0 mx-1" : "px-3"}`}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {!collapsed && (
                            <>
                              <span className="flex-1">{t(item.label)}</span>
                              <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-400">soon</span>
                            </>
                          )}
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={collapsed ? t(item.label) : undefined}
                        className={`flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors
                          ${collapsed ? "justify-center px-0 mx-1" : "px-3"}
                          ${isActive ? "bg-primary-50 text-primary-700" : "text-gray-600 hover:bg-white/60 hover:text-gray-900"}`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="flex-1">{t(item.label)}</span>}
                        {!collapsed && item.badgeKey === "approvalCount" && role === "MANAGER" && <ApprovalBadge />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </nav>

      {/* User footer */}
      <div className="mt-auto shrink-0 border-t border-gray-100 p-3">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
              {initial}
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-400 transition-colors hover:text-red-500"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
              {initial}
            </div>
            <div className="min-w-0 flex-1 text-sm">
              <p className="truncate font-medium text-gray-700">{session?.user.email}</p>
              <p className="text-xs capitalize text-gray-500">{displayRole}</p>
            </div>
            <button
              onClick={handleLogout}
              className="shrink-0 text-gray-400 transition-colors hover:text-red-500"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
