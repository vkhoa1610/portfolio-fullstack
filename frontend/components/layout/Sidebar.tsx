"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  icon: string;
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
      { label: "nav.my_expenses", href: "/my-expenses", icon: "receipt_long", roles: ["EMPLOYEE", "MANAGER"] },
      { label: "nav.reports",     href: "/reports",     icon: "description",  roles: ["EMPLOYEE", "MANAGER"], soon: true },
    ],
  },
  {
    label: "nav.group_management",
    items: [
      { label: "nav.approvals",       href: "/manager/approvals",       icon: "check_box",     roles: ["MANAGER"], badgeKey: "approvalCount" },
      { label: "nav.ai_report",       href: "/manager/ai-report",       icon: "auto_awesome",  roles: ["MANAGER"] },
      { label: "nav.report_template", href: "/manager/report-template", icon: "file_download", roles: ["MANAGER"] },
      { label: "nav.ai_playground",   href: "/manager/ai-playground",   icon: "memory",        roles: ["MANAGER"] },
    ],
  },
  {
    label: "nav.group_finance",
    items: [
      { label: "nav.overview",        href: "/finance/overview", icon: "dashboard",    roles: ["FINANCE"] },
      { label: "nav.finance_reports", href: "/finance/reports",  icon: "description",  roles: ["FINANCE"] },
      { label: "nav.final_check",     href: "/finance/check",    icon: "fact_check",   roles: ["FINANCE"] },
      { label: "nav.batch_payment",   href: "/finance/payment",  icon: "credit_card",  roles: ["FINANCE"] },
      { label: "nav.tax_export",      href: "/finance/export",   icon: "download",     roles: ["FINANCE"] },
    ],
  },
];

const ADMIN_NAV = [
  { label: "nav.admin_dashboard", href: "/admin",        icon: "dashboard" },
  { label: "nav.user_management", href: "/admin/users",  icon: "group" },
  { label: "nav.import_users",    href: "/admin/import", icon: "upload" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
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

function MIcon({ name, size = 18 }: { name: string; size?: number }) {
  return (
    <span
      className="material-symbols-outlined select-none leading-none shrink-0"
      style={{
        fontSize: size,
        fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24",
      }}
    >
      {name}
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

  const navItemClass = (isActive: boolean, extraCollapsed?: boolean) =>
    `flex items-center gap-3 rounded-full py-2 text-sm font-medium transition-colors
    ${extraCollapsed ?? collapsed ? "justify-center px-2" : "px-3"}
    ${isActive
      ? "bg-indigo-100 text-indigo-800"
      : "text-[#4e4c6a] hover:bg-[#e6e2f8] hover:text-[#4244db]"
    }`;

  return (
    <aside
      className={`relative z-20 hidden flex-col md:flex overflow-hidden transition-[width] duration-300 ease-in-out bg-[#f5f2ff] ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Brand / Logo */}
      <div
        className={`flex h-16 shrink-0 items-center ${
          collapsed ? "justify-center px-0" : "gap-3 px-5"
        }`}
      >
        <div className="h-8 w-8 shrink-0 rounded-xl bg-[#4244db] flex items-center justify-center">
          <span className="text-white text-xs font-bold" style={{ fontFamily: "Manrope, sans-serif" }}>F</span>
        </div>
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1">
              <p
                className="text-sm font-bold text-[#4244db] leading-tight"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                FintechSaaS
              </p>
              <p className="text-[10px] text-[#9592b8] leading-tight">Expense Platform</p>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className="rounded-full p-1 text-[#9592b8] hover:bg-[#e6e2f8] transition-colors"
              title="Collapse sidebar"
            >
              <MIcon name="chevron_left" size={18} />
            </button>
          </>
        )}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="rounded-full p-1 text-[#9592b8] hover:bg-[#e6e2f8] transition-colors"
            title="Expand sidebar"
          >
            <MIcon name="chevron_right" size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2">
        {isAdmin ? (
          <div>
            {!collapsed && (
              <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-[#9592b8]">
                {t("nav.group_admin")}
              </p>
            )}
            <div className="space-y-0.5">
              {ADMIN_NAV.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/admin" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? t(item.label) : undefined}
                    className={navItemClass(isActive)}
                  >
                    <MIcon name={item.icon} size={18} />
                    {!collapsed && (
                      <span className="flex-1 whitespace-nowrap">{t(item.label)}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter((item) => item.roles.includes(role!));
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.label} className={collapsed ? "mb-3" : "mb-3"}>
                {!collapsed && (
                  <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-[#9592b8]">
                    {t(group.label)}
                  </p>
                )}
                {collapsed && <div className="my-2 mx-3 border-t border-[#ddd8f5]" />}
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);

                    if (item.soon) {
                      return (
                        <div
                          key={item.href}
                          title={collapsed ? t(item.label) : undefined}
                          className={`flex cursor-not-allowed items-center gap-3 rounded-full py-2 text-sm font-medium text-[#c0bcdb]
                            ${collapsed ? "justify-center px-2" : "px-3"}`}
                        >
                          <MIcon name={item.icon} size={18} />
                          {!collapsed && (
                            <>
                              <span className="flex-1">{t(item.label)}</span>
                              <span className="rounded-full bg-[#ece8fb] px-1.5 py-0.5 text-[10px] text-[#9592b8]">
                                soon
                              </span>
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
                        className={navItemClass(isActive)}
                      >
                        <MIcon name={item.icon} size={18} />
                        {!collapsed && (
                          <span className="flex-1 whitespace-nowrap">{t(item.label)}</span>
                        )}
                        {!collapsed && item.badgeKey === "approvalCount" && role === "MANAGER" && (
                          <ApprovalBadge />
                        )}
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
      <div className="shrink-0 p-3">
        <div
          className={`rounded-2xl ${
            collapsed ? "flex flex-col items-center gap-2 py-2" : "bg-white/60 backdrop-blur-sm p-3"
          }`}
        >
          {collapsed ? (
            <>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4244db]/10 text-xs font-bold text-[#4244db]">
                {initial}
              </div>
              <button
                onClick={handleLogout}
                className="text-[#9592b8] transition-colors hover:text-red-500"
                title="Logout"
              >
                <MIcon name="logout" size={18} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#4244db]/10 text-sm font-bold text-[#4244db]">
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#2d2b4e]">{session?.user.email}</p>
                <p className="text-xs capitalize text-[#9592b8]">{displayRole}</p>
              </div>
              <button
                onClick={handleLogout}
                className="shrink-0 text-[#9592b8] transition-colors hover:text-red-500"
                title="Logout"
              >
                <MIcon name="logout" size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
