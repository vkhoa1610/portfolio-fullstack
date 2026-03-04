"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Search } from "lucide-react";
import { useAuth } from "@/common/context/AuthContext";
import { useGetAdminUsersQuery } from "@/ducks/admin/adminApi";
import type { AdminUser } from "@/ducks/admin/types";

const ROLE_BADGE: Record<string, string> = {
  EMPLOYEE: "bg-blue-100 text-blue-700",
  MANAGER: "bg-purple-100 text-purple-700",
  FINANCE: "bg-green-100 text-green-700",
};

export default function AdminUsersListView() {
  const router = useRouter();
  const { isAdmin, isLoading: isAuthLoading, session } = useAuth();
  const { data: users = [], isLoading } = useGetAdminUsersQuery();
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isAuthLoading && session !== null && !isAdmin) {
      router.replace("/not-found");
    }
  }, [isAuthLoading, session, isAdmin, router]);

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.role ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">User Management</h2>
          <p className="text-sm text-neutral-500">Manage roles and permissions for all users</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          placeholder="Search by email or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-neutral-200 py-2 pl-9 pr-4 text-sm outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400"
        />
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-neutral-300 text-sm text-neutral-400">
          No users found
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((user) => (
            <UserRow
              key={user.cognitoSub}
              user={user}
              onClick={() => router.push(`/admin/users/${user.cognitoSub}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function UserRow({ user, onClick }: { user: AdminUser; onClick: () => void }) {
  const badgeCls = user.role ? (ROLE_BADGE[user.role] ?? "bg-neutral-100 text-neutral-600") : "bg-neutral-100 text-neutral-400";

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition-all hover:border-primary-300 hover:shadow-md"
    >
      <div className="flex-1 min-w-0">
        <p className="truncate font-medium text-neutral-900">{user.email}</p>
        <p className="text-xs text-neutral-500">
          Status: {user.onboardingStatus ?? "—"} · Budget:{" "}
          {user.budget != null ? `${user.budget.toFixed(2)} €` : "—"}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeCls}`}>
          {user.role ?? "No role"}
        </span>
        <ChevronRight className="h-4 w-4 text-neutral-400" />
      </div>
    </button>
  );
}
