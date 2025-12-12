import type { Metadata } from "next";
import ProfileView from "@/components/onboarding/profile-view";

export const metadata: Metadata = {
  title: "Profile Setup | ISB Corp",
};

export default function ProfilePage() {
  return <ProfileView />;
}
