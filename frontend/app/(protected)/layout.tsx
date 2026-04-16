// app/(protected)/layout.tsx
import React from "react";
import { Breadcrumb } from "@/common";
import Sidebar from "@/components/layout/Sidebar";
import styles from "./layout.module.css";

export default function ProtectedDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-surface-ground">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className={styles.bgBlob1}></div>
        <div className={styles.bgBlob2}></div>
      </div>

      {/* Sidebar — role-based, real navigation */}
      <Sidebar />

      {/* Main content area */}
      <main className="relative z-10 flex flex-1 flex-col overflow-hidden">
        {/* Header / Navbar */}
        <header className={styles.navbar}>
          <Breadcrumb />
          <div className="flex items-center gap-1">
            <button className={styles.navBtn} title="Notifications">
              <span
                className="material-symbols-outlined select-none leading-none"
                style={{ fontSize: 20, fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}
              >
                notifications
              </span>
            </button>
            <button className={styles.navBtn} title="Settings">
              <span
                className="material-symbols-outlined select-none leading-none"
                style={{ fontSize: 20, fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}
              >
                settings
              </span>
            </button>
          </div>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
          <div className={styles.footer}>
            <p className={styles.footerText}>© 2025 FintechSaaS GmbH. ISO 27001 Certified.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
