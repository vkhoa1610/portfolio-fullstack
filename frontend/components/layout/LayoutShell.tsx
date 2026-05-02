"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import NavBar from "./NavBar";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />
      <main className="relative z-10 flex flex-1 flex-col overflow-hidden">
        <NavBar sidebarCollapsed={collapsed} />
        <div className="flex-1 overflow-y-auto">
          {children}
          <div style={{ marginTop: "2.5rem", padding: "1rem 0", textAlign: "center" }}>
            <p style={{ fontSize: "0.625rem", color: "var(--color-neutral-400)" }}>
              © 2025 FintechSaaS GmbH. ISO 27001 Certified.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
