"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, Upload, FileText, Settings, Layout } from "lucide-react";
import { useAuth } from "@/common/context/AuthContext";

export default function AdminDashboardView() {
  const router = useRouter();
  const { isAdmin, isLoading, session } = useAuth();

  useEffect(() => {
    if (!isLoading && session !== null && !isAdmin) {
      router.replace("/not-found");
    }
  }, [isLoading, session, isAdmin, router]);

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">Admin Dashboard</h2>
        <p className="text-sm text-neutral-500">System administration panel</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          icon={<Users className="h-6 w-6" />}
          title="User Management"
          description="View and manage user roles and budgets"
          onClick={() => router.push("/admin/users")}
        />
        <DashboardCard
          icon={<Upload className="h-6 w-6" />}
          title="Import Users"
          description="Bulk import users via CSV file"
          onClick={() => router.push("/admin/import?tab=users")}
        />
        <DashboardCard
          icon={<FileText className="h-6 w-6" />}
          title="Import Permissions"
          description="Bulk assign permissions via CSV file"
          onClick={() => router.push("/admin/import?tab=permissions")}
        />
        <DashboardCard
          icon={<Layout className="h-6 w-6" />}
          title="CMS Management"
          description="Configure screen layouts and content"
          disabled
        />
        <DashboardCard
          icon={<Settings className="h-6 w-6" />}
          title="Screen Configs"
          description="Manage screen configuration settings"
          disabled
        />
      </div>
    </div>
  );
}

interface DashboardCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
  disabled?: boolean;
}

function DashboardCard({ icon, title, description, onClick, disabled }: DashboardCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-start gap-4 rounded-xl border p-5 text-left transition-all ${
        disabled
          ? "cursor-not-allowed border-neutral-200 bg-neutral-50 opacity-50"
          : "border-neutral-200 bg-white shadow-sm hover:border-primary-300 hover:shadow-md"
      }`}
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-neutral-900">{title}</p>
        <p className="mt-0.5 text-sm text-neutral-500">{description}</p>
        {disabled && (
          <span className="mt-1 inline-block rounded bg-neutral-200 px-2 py-0.5 text-xs text-neutral-500">
            Coming soon
          </span>
        )}
      </div>
    </button>
  );
}
