// app/(protected)/layout.tsx
import React from "react";
import LayoutShell from "@/components/layout/LayoutShell";
import styles from "./layout.module.css";

export default function ProtectedDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-screen w-full overflow-clip bg-surface-ground">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-clip">
        <div className={styles.bgBlob1}></div>
        <div className={styles.bgBlob2}></div>
      </div>

      <LayoutShell>{children}</LayoutShell>
    </div>
  );
}
