import React from "react";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="bg-surface-ground relative min-h-screen w-full overflow-hidden">
      {/* Background Decoration (Atom có thể tách sau) */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="bg-primary-50/50 absolute top-[20%] -left-[10%] h-[50%] w-[50%] rounded-full opacity-60 blur-3xl"></div>
        <div className="bg-secondary-50/50 absolute -right-[10%] -bottom-[10%] h-[50%] w-[50%] rounded-full opacity-60 blur-3xl"></div>
      </div>

      {/* MAIN CONTENT CONTAINER
        - items-center: Căn giữa theo chiều ngang (X)
        - pt-fixed-top: Padding top cố định 177px (để Y không nhảy) - Đã config trong tailwind.config.ts
      */}
      <div className="relative z-10 flex min-h-screen w-full flex-col items-center p-4 pt-[177px]">
        {children}

        {/* Footer chung cho Onboarding (nếu cần) */}
        <div className="mt-8 text-center">
          <p className="text-xs font-medium text-neutral-400">Sicherheitsstandard ISO 27001</p>
        </div>
      </div>
    </main>
  );
}
