"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/common/context/AuthContext";

export default function DashboardPage() {
  const router = useRouter();
  const { session, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!session) return;

    switch (session.user.role) {
      case "MANAGER":
        router.replace("/manager/approvals");
        break;
      case "FINANCE":
        router.replace("/finance/overview");
        break;
      case "EMPLOYEE":
      default:
        router.replace("/my-expenses");
        break;
    }
  }, [session, isLoading, router]);

  return null;
}
