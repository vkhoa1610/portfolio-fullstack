"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Camera, Calendar, Car, History, LogOut } from "lucide-react";
import { useAuth } from "@/common/context/AuthContext";
import { useLogoutMutation } from "@/ducks/auth/authApi";
import { useGetExpensesQuery } from "@/ducks/expenses";
import type { ExpenseStatus } from "@/ducks/expenses";
import styles from "./NavBar.module.css";

const RECENT_SEARCHES = ["Q4 Travel", "Frankfurt", "Software License"];

const STATUS_BADGE_CLASS: Record<ExpenseStatus, string> = {
  DRAFT: styles.badgeDraft,
  PENDING_REVIEW: styles.badgePending,
  APPROVED: styles.badgeApproved,
  REJECTED: styles.badgeRejected,
  PAID: styles.badgePaid,
};

const STATUS_LABEL: Record<ExpenseStatus, string> = {
  DRAFT: "Draft",
  PENDING_REVIEW: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PAID: "Paid",
};

const TYPE_ICON = {
  RECEIPT: Camera,
  PER_DIEM: Calendar,
  MILEAGE: Car,
};

function MIcon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <span
      className="material-symbols-outlined select-none leading-none shrink-0"
      style={{ fontSize: size, fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}
    >
      {name}
    </span>
  );
}

export default function NavBar() {
  const { t } = useTranslation();
  const router = useRouter();
  const { session, isAdmin, clearSession } = useAuth();
  const [logout] = useLogoutMutation();
  const { data: expenses = [] } = useGetExpensesQuery();

  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showUser, setShowUser] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUser(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredExpenses = query.trim().length > 0
    ? expenses.filter((e) => {
        const q = query.toLowerCase();
        return (
          (e.title ?? "").toLowerCase().includes(q) ||
          (e.vendorName ?? "").toLowerCase().includes(q) ||
          e.type.toLowerCase().includes(q)
        );
      }).slice(0, 5)
    : [];

  const handleLogout = useCallback(async () => {
    try { await logout().unwrap(); } finally {
      clearSession();
      router.push("/auth/login");
    }
  }, [logout, clearSession, router]);

  const role = session?.user.role;
  const initial = (session?.user.email?.[0] ?? "?").toUpperCase();
  const displayRole = isAdmin ? "Admin" : role ? role.charAt(0) + role.slice(1).toLowerCase() : "";

  return (
    <header className={styles.navbar}>
      {/* Center: Search */}
      <div className={styles.searchWrap} ref={searchRef}>
        <div className={styles.searchBox}>
          <span className={`material-symbols-outlined select-none leading-none ${styles.searchIcon}`}
            style={{ fontSize: 18, fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>
            search
          </span>
          <input
            className={styles.searchInput}
            placeholder={t("nav.search_placeholder", { defaultValue: "Search expenses, reports..." })}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShowSearch(true); }}
            onFocus={() => setShowSearch(true)}
          />
        </div>

        {showSearch && (
          <div className={styles.dropdown}>
            {/* Recent searches — shown when query is empty */}
            {query.trim() === "" && (
              <div className={styles.dropSection}>
                <p className={styles.dropSectionLabel}>Recent Searches</p>
                <div className={styles.recentChips}>
                  {RECENT_SEARCHES.map((s) => (
                    <button
                      key={s}
                      className={styles.recentChip}
                      onClick={() => { setQuery(s); }}
                    >
                      <History className="h-3 w-3" />
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Expense results */}
            {query.trim().length > 0 && (
              <div className={styles.dropSection}>
                <p className={styles.dropSectionLabel}>Expenses</p>
                {filteredExpenses.length === 0 ? (
                  <p className={styles.dropEmpty}>No expenses match &ldquo;{query}&rdquo;</p>
                ) : (
                  filteredExpenses.map((exp) => {
                    const Icon = TYPE_ICON[exp.type] ?? Camera;
                    const label = exp.title || exp.vendorName || exp.type;
                    const sub = exp.vendorName
                      ? `${exp.vendorName} • ${exp.receiptDate ?? exp.createdAt?.slice(0, 10) ?? ""}`
                      : exp.createdAt?.slice(0, 10) ?? "";
                    return (
                      <button
                        key={exp.id}
                        className={styles.resultRow}
                        onClick={() => {
                          setShowSearch(false);
                          setQuery("");
                          router.push(`/my-expenses/${exp.id}`);
                        }}
                      >
                        <div className={styles.resultLeft}>
                          <div className={styles.resultIcon}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className={styles.resultTitle}>{label}</p>
                            <p className={styles.resultSub}>{sub}</p>
                          </div>
                        </div>
                        <span className={`${styles.dropBadge} ${STATUS_BADGE_CLASS[exp.status]}`}>
                          {STATUS_LABEL[exp.status]}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: notification + user */}
      <div className={styles.rightArea}>
        <button className={styles.navBtn} title="Notifications">
          <MIcon name="notifications" size={20} />
        </button>
        <button className={styles.navBtn} title="Settings">
          <MIcon name="settings" size={20} />
        </button>

        {/* User avatar */}
        <div className={styles.avatarBtn} ref={userRef}>
          <button className={styles.avatar} onClick={() => setShowUser((v) => !v)} title={session?.user.email}>
            {initial}
          </button>

          {showUser && (
            <div className={styles.userDropdown}>
              <div className={styles.userInfo}>
                <p className={styles.userEmail}>{session?.user.email}</p>
                <p className={styles.userRole}>{displayRole}</p>
              </div>
              <button className={styles.logoutBtn} onClick={handleLogout}>
                <LogOut className="h-3.5 w-3.5" />
                {t("nav.logout", { defaultValue: "Log out" })}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
