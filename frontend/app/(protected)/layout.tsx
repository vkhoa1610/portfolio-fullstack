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
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-black/5 bg-white/30 px-6 backdrop-blur-sm">
          <Breadcrumb />
          <div className="flex items-center gap-4">
            <button className="h-8 w-8 rounded-full bg-white/50 p-1.5 text-gray-600 hover:bg-white">
              🔔
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
