// app/(protected)/layout.tsx
import React from "react";
import { Breadcrumb } from "@/common";
import Sidebar from "@/components/layout/Sidebar";

export default function ProtectedDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-surface-ground">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="bg-primary-50/40 absolute left-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full blur-[120px]"></div>
        <div className="bg-secondary-50/40 absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full blur-[120px]"></div>
      </div>

      {/* Sidebar — role-based, real navigation */}
      <Sidebar />

      {/* Main content area */}
      <main className="relative z-10 flex flex-1 flex-col overflow-hidden">
        {/* Header / Navbar */}
        <header className="flex h-16 shrink-0 items-center justify-between bg-[#fcf8ff] px-6 shadow-[0_1px_0_0_#ece8fb]">
          <Breadcrumb />
          <div className="flex items-center gap-1">
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#9592b8] hover:bg-[#ece8fb] transition-colors"
              title="Notifications"
            >
              <span
                className="material-symbols-outlined select-none leading-none"
                style={{ fontSize: 20, fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}
              >
                notifications
              </span>
            </button>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#9592b8] hover:bg-[#ece8fb] transition-colors"
              title="Settings"
            >
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
          <div className="mt-10 py-4 text-center">
            <p className="text-[10px] text-neutral-400">
              © 2025 FintechSaaS GmbH. ISO 27001 Certified.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
