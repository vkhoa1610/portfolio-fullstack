"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useTranslation } from "react-i18next";
import { useAuth } from "@/common/context/AuthContext";

import { useGetManagerQueueQuery } from "@/ducks/expenses";
import styles from "./Sidebar.module.css";

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
  return <span className={styles.approvalBadge}>{queue.length}</span>;
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

export default function Sidebar({
  collapsed,
  onCollapse,
}: {
  collapsed: boolean;
  onCollapse: (v: boolean) => void;
}) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { session, isAdmin } = useAuth();

  const role = session?.user.role as UserRole | undefined;

  if (!role && !isAdmin) return null;

  return (
    <aside
      className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : styles.sidebarExpanded}`}
    >
      {/* Brand / Logo */}
      <div className={`${styles.brand} ${collapsed ? styles.brandCollapsed : styles.brandExpanded}`}>
        {!collapsed && (
          <>
            <div className={styles.brandLogo}>
              <span className={styles.brandLogoText}>F</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className={styles.brandName}>FintechSaaS</p>
              <p className={styles.brandTagline}>Expense Platform</p>
            </div>
            <button
              onClick={() => onCollapse(true)}
              className={styles.collapseBtn}
              title="Collapse sidebar"
            >
              <MIcon name="chevron_left" size={18} />
            </button>
          </>
        )}
        {collapsed && (
          <button
            onClick={() => onCollapse(false)}
            className={styles.collapseBtn}
            title="Expand sidebar"
          >
            <MIcon name="chevron_right" size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2 flex flex-col">
        {isAdmin ? (
          <div>
            {!collapsed && (
              <p className={styles.groupLabel}>{t("nav.group_admin")}</p>
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
                    className={`${styles.navItem} ${isActive ? styles.navItemActive : ""} ${collapsed ? styles.navItemCollapsed : ""}`}
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
              <div key={group.label} className="mb-3">
                {!collapsed && (
                  <p className={styles.groupLabel}>{t(group.label)}</p>
                )}
                {collapsed && <div className={styles.groupDivider} />}
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);

                    if (item.soon) {
                      return (
                        <div
                          key={item.href}
                          title={collapsed ? t(item.label) : undefined}
                          className={`${styles.navItemDisabled} ${collapsed ? styles.navItemDisabledCollapsed : ""}`}
                        >
                          <MIcon name={item.icon} size={18} />
                          {!collapsed && (
                            <>
                              <span className="flex-1">{t(item.label)}</span>
                              <span className={styles.soonBadge}>soon</span>
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
                        className={`${styles.navItem} ${isActive ? styles.navItemActive : ""} ${collapsed ? styles.navItemCollapsed : ""}`}
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

        {/* Bottom-pinned: Documentation + Settings — visible to all roles */}
        <div className="mt-auto pt-2 border-t border-[var(--color-sidebar-border,rgba(0,0,0,0.06))]">
          <Link
            href="/wiki"
            title={collapsed ? "Documentation" : undefined}
            className={`${styles.navItem} ${pathname.startsWith("/wiki") ? styles.navItemActive : ""} ${collapsed ? styles.navItemCollapsed : ""}`}
          >
            <MIcon name="menu_book" size={18} />
            {!collapsed && <span className="flex-1 whitespace-nowrap">Documentation</span>}
          </Link>
          <Link
            href="/settings"
            title={collapsed ? t("nav.settings") : undefined}
            className={`${styles.navItem} ${pathname === "/settings" ? styles.navItemActive : ""} ${collapsed ? styles.navItemCollapsed : ""}`}
          >
            <MIcon name="settings" size={18} />
            {!collapsed && <span className="flex-1 whitespace-nowrap">{t("nav.settings")}</span>}
          </Link>
        </div>
      </nav>

    </aside>
  );
}
