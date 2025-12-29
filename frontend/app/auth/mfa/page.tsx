import type { Metadata } from "next";
import { Suspense } from "react";
import MfaView from "@/components/auth/mfa-view";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "MFA Verification | ISB Corp",
};

export default function MfaPage() {
  return (
    // Wrapper căn giữa cho màn hình MFA
    <div className="flex min-h-screen w-full items-center justify-center bg-surface-ground p-4">
      <Suspense
        fallback={
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            <p className="text-sm text-neutral-500">Loading verification...</p>
          </div>
        }
      >
        <MfaView />
      </Suspense>
    </div>
  );
}
