import type { Metadata } from "next";
import MfaView from "@/components/auth/mfa-view";

export const metadata: Metadata = {
  title: "MFA Verification | ISB Corp",
};

export default function MfaPage() {
  return (
    // Wrapper căn giữa cho màn hình MFA
    <div className="bg-surface-ground flex min-h-screen w-full items-center justify-center p-4">
      <MfaView />
    </div>
  );
}
