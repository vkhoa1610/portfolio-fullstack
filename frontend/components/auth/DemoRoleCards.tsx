"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/common/context/AuthContext";
import { useDemoLoginMutation } from "@/ducks/auth/authApi";

// Slot = a demo login button on the login page. Multiple slots can share a role
// (EMPLOYEE has two: Anna and a fresh account for onboarding walkthrough).
type Slot = "EMPLOYEE" | "MANAGER" | "FINANCE" | "ADMIN" | "NEW_EMPLOYEE";

type Card = {
  slot: Slot;
  label: string;
  icon: string;
  desc: string;
  color: string;
  bg: string;
  /** When set, clicking the card opens a dropdown of these slot options
   *  instead of logging in directly. */
  options?: { slot: Slot; label: string; desc: string }[];
};

const CARDS: Card[] = [
  {
    slot: "EMPLOYEE",
    label: "Employee",
    icon: "receipt_long",
    desc: "Submit & track expense claims",
    color: "#4244db",
    bg: "rgba(66,68,219,0.08)",
    options: [
      { slot: "EMPLOYEE",     label: "Anna Müller",  desc: "Existing employee with data" },
      { slot: "NEW_EMPLOYEE", label: "New Employee", desc: "Fresh account — walks through onboarding" },
    ],
  },
  {
    slot: "MANAGER",
    label: "Manager",
    icon: "check_box",
    desc: "Approve expenses, view AI reports",
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.08)",
  },
  {
    slot: "FINANCE",
    label: "Finance",
    icon: "account_balance",
    desc: "Batch payments & tax export",
    color: "#0891b2",
    bg: "rgba(8,145,178,0.08)",
  },
  {
    slot: "ADMIN",
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
  const [loadingSlot, setLoadingSlot] = useState<Slot | null>(null);
  const [openSlot, setOpenSlot] = useState<Slot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const openContainerRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click / Esc
  useEffect(() => {
    if (!openSlot) return;

    const onDown = (e: MouseEvent) => {
      if (openContainerRef.current && !openContainerRef.current.contains(e.target as Node)) {
        setOpenSlot(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenSlot(null);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openSlot]);

  const handleDemo = async (slot: Slot) => {
    setLoadingSlot(slot);
    setError(null);
    setOpenSlot(null);
    try {
      const result = await demoLogin(slot).unwrap();
      setSession(result.session);
      router.push(result.redirectTo);
    } catch {
      setError("Demo account unavailable. Please try again later.");
    } finally {
      setLoadingSlot(null);
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
        {CARDS.map(({ slot, label, icon, desc, color, bg, options }) => {
          const hasDropdown = !!options;
          const isLoading   = loadingSlot === slot || (options?.some(o => o.slot === loadingSlot) ?? false);
          const isDisabled  = loadingSlot !== null;
          const isOpen      = openSlot === slot;

          return (
            <div
              key={slot}
              className="relative"
              ref={isOpen ? openContainerRef : undefined}
            >
              <button
                onClick={() => (hasDropdown ? setOpenSlot(isOpen ? null : slot) : handleDemo(slot))}
                disabled={isDisabled}
                aria-haspopup={hasDropdown || undefined}
                aria-expanded={hasDropdown ? isOpen : undefined}
                className="group flex w-full items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 text-left transition-all hover:border-neutral-300 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
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

                {/* Arrow (chevron for dropdown, forward for direct) */}
                {!isLoading && (
                  <span
                    className="material-symbols-outlined ml-auto flex-shrink-0 leading-none transition-opacity"
                    style={{
                      fontSize: 16,
                      color: "#a1a1aa",
                      fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24",
                      opacity: hasDropdown ? 1 : 0,
                    }}
                  >
                    {hasDropdown ? (isOpen ? "expand_less" : "expand_more") : "arrow_forward"}
                  </span>
                )}
              </button>

              {/* Dropdown */}
              {hasDropdown && isOpen && (
                <div
                  role="menu"
                  className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg"
                >
                  {options!.map((opt) => {
                    const optLoading = loadingSlot === opt.slot;
                    return (
                      <button
                        key={opt.slot}
                        role="menuitem"
                        onClick={() => handleDemo(opt.slot)}
                        disabled={isDisabled}
                        className="flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span
                          className="material-symbols-outlined mt-0.5 select-none leading-none"
                          style={{
                            fontSize: 16,
                            color,
                            fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24",
                          }}
                        >
                          {optLoading ? "progress_activity" : "person"}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-neutral-900 leading-tight">{opt.label}</span>
                          <span className="mt-0.5 block text-xs text-neutral-500 leading-tight">{opt.desc}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
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
