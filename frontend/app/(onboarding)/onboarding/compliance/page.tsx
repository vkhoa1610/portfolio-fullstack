import type { Metadata } from "next";
import ComplianceView from "@/components/onboarding/compliance-view";

export const metadata: Metadata = {
  title: "GDPR Consent | ISB Corp",
};

export default function CompliancePage() {
  return <ComplianceView />;
}
