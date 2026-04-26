"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/common/context/AuthContext";
import { useDemoLoginMutation } from "@/ducks/auth/authApi";

type Role = "EMPLOYEE" | "MANAGER" | "FINANCE" | "ADMIN";

const ROLES: {
  role: Role;
  label: string;
  icon: string;
  desc: string;
  color: string;
  bg: string;
}[] = [
  {
    role: "EMPLOYEE",
    label: "Employee",
    icon: "receipt_long",
    desc: "Submit & track expense claims",
    color: "#4244db",
    bg: "rgba(66,68,219,0.08)",
  },
  {
    role: "MANAGER",
    label: "Manager",
    icon: "check_box",
    desc: "Approve expenses, view AI reports",
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.08)",
  },
  {
    role: "FINANCE",
    label: "Finance",
    icon: "account_balance",
    desc: "Batch payments & tax export",
    color: "#0891b2",
    bg: "rgba(8,145,178,0.08)",
  },
  {
    role: "ADMIN",
    label: "Admin",
    icon: "admin_panel_settings",
    desc: "User management & system config",
    color: "#059669",
    bg: "rgba(5,150,105,0.08)",
  },
];

export default function DemoRoleCards() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [demoLogin] = useDemoLoginMutation();
  const [loadingRole, setLoadingRole] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDemo = async (role: Role) => {
    setLoadingRole(role);
    setError(null);
    try {
      const result = await demoLogin(role).unwrap();
      setSession(result.session);
      router.push(result.redirectTo);
    } catch {
      setError("Demo account unavailable. Please try again later.");
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <span
          className="material-symbols-outlined select-none leading-none"
          style={{ fontSize: 16, color: "#4244db", fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
        >
          bolt
        </span>
        <span className="text-sm font-semibold text-neutral-700">Try a Demo Role</span>
        <span className="ml-auto rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-600">
          No sign up needed
        </span>
      </div>

      {/* Role grid */}
      <div className="grid grid-cols-2 gap-2">
        {ROLES.map(({ role, label, icon, desc, color, bg }) => {
          const isLoading = loadingRole === role;
          const isDisabled = loadingRole !== null;

          return (
            <button
              key={role}
              onClick={() => handleDemo(role)}
              disabled={isDisabled}
              className="group flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 text-left transition-all hover:border-neutral-300 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {/* Icon */}
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
                style={{ background: bg }}
              >
                {isLoading ? (
                  <svg
                    className="h-4 w-4 animate-spin"
                    style={{ color }}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                ) : (
                  <span
                    className="material-symbols-outlined select-none leading-none"
                    style={{
                      fontSize: 18,
                      color,
                      fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24",
                    }}
                  >
                    {icon}
                  </span>
                )}
              </div>

              {/* Text */}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-neutral-900 leading-tight">{label}</p>
                <p className="text-xs text-neutral-500 leading-tight mt-0.5 truncate">{desc}</p>
              </div>

              {/* Arrow */}
              {!isLoading && (
                <span
                  className="material-symbols-outlined ml-auto flex-shrink-0 leading-none opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ fontSize: 16, color: "#a1a1aa", fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}
                >
                  arrow_forward
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <p className="mt-2 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
