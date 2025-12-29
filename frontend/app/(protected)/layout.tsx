// app/(protected)/layout.tsx
import React from "react";

export default function ProtectedDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-surface-ground">
      {/* 1. BACKGROUND DECORATION (Giữ nguyên từ Onboarding nhưng fix vị trí) */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="bg-primary-50/40 absolute left-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full blur-[120px]"></div>
        <div className="bg-secondary-50/40 absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full blur-[120px]"></div>
      </div>

      {/* 2. SIDEBAR (Giả lập - Bạn sẽ tách thành Component riêng sau) */}
      <aside className="glass-panel relative z-20 hidden w-64 flex-col border-r border-r-surface-border bg-white/50 p-4 backdrop-blur-xl md:flex">
        <div className="mb-8 flex items-center gap-2 px-2">
          <div className="h-8 w-8 rounded-lg bg-primary-600"></div>
          <span className="font-bold text-gray-800">FintechSaaS</span>
        </div>

        {/* Navigation Mockup */}
        <nav className="flex-1 space-y-1">
          <div className="px-2 py-2 text-xs font-semibold uppercase text-gray-400">Core</div>
          <NavItem active>My Expenses</NavItem>
          <NavItem>Reports</NavItem>

          <div className="mt-6 px-2 py-2 text-xs font-semibold uppercase text-gray-400">
            Management
          </div>
          <NavItem>
            Approvals{" "}
            <span className="ml-auto rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] text-red-600">
              3
            </span>
          </NavItem>
          <NavItem>Finance Overview</NavItem>
        </nav>

        <div className="mt-auto border-t pt-4">
          <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-8 rounded-full bg-gray-200"></div>
            <div className="text-sm">
              <p className="font-medium text-gray-700">Nguyen Van A</p>
              <p className="text-xs text-gray-500">Employee</p>
            </div>
          </div>
        </div>
      </aside>

      {/* 3. MAIN CONTENT AREA */}
      <main className="relative z-10 flex flex-1 flex-col overflow-hidden">
        {/* Header (Mobile menu + Breadcrumbs) */}
        <header className="flex h-16 items-center justify-between border-b border-black/5 bg-white/30 px-6 backdrop-blur-sm">
          <h1 className="text-lg font-semibold text-gray-800">Dashboard</h1>
          <div className="flex items-center gap-4">
            {/* Bell Icon Mockup */}
            <button className="h-8 w-8 rounded-full bg-white/50 p-1.5 text-gray-600 hover:bg-white">
              🔔
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>

          {/* Footer nhỏ bên trong Dashboard */}
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

// Component phụ cho Nav Item (Demo)
function NavItem({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <div
      className={`flex cursor-pointer items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "bg-primary-50 text-primary-700"
          : "text-gray-600 hover:bg-white/60 hover:text-gray-900"
      }`}
    >
      {children}
    </div>
  );
}
