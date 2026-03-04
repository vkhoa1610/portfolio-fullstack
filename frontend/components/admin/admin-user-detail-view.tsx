"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/common/context/AuthContext";
import {
  useGetUserPermissionsQuery,
  useGetUserFunctionsQuery,
  useGrantPermissionMutation,
  useRevokePermissionMutation,
  useGrantFunctionMutation,
  useRevokeFunctionMutation,
} from "@/ducks/admin/adminApi";
import type { PermissionStatus, FunctionStatus, PermissionState } from "@/ducks/admin/types";

interface Props {
  sub: string;
}

const STATE_BADGE: Record<PermissionState, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  INACTIVE: "bg-amber-100 text-amber-700",
  NEVER_GRANTED: "bg-neutral-100 text-neutral-500",
};

const STATE_LABEL: Record<PermissionState, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  NEVER_GRANTED: "Never granted",
};

export default function AdminUserDetailView({ sub }: Props) {
  const router = useRouter();
  const { isAdmin, isLoading: isAuthLoading, session } = useAuth();

  const { data: permissions = [], isLoading: isPermLoading } = useGetUserPermissionsQuery(sub);
  const { data: functions = [], isLoading: isFuncLoading } = useGetUserFunctionsQuery(sub);

  const [grantPermission, { isLoading: isGrantingPerm }] = useGrantPermissionMutation();
  const [revokePermission, { isLoading: isRevokingPerm }] = useRevokePermissionMutation();
  const [grantFunction, { isLoading: isGrantingFunc }] = useGrantFunctionMutation();
  const [revokeFunction, { isLoading: isRevokingFunc }] = useRevokeFunctionMutation();

  useEffect(() => {
    if (!isAuthLoading && session !== null && !isAdmin) {
      router.replace("/not-found");
    }
  }, [isAuthLoading, session, isAdmin, router]);

  const isPermBusy = isGrantingPerm || isRevokingPerm;
  const isFuncBusy = isGrantingFunc || isRevokingFunc;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <h2 className="text-2xl font-bold text-neutral-900 truncate">{sub}</h2>
      </div>

      {/* Permissions section */}
      <section>
        <h3 className="mb-3 text-lg font-semibold text-neutral-800">Permissions</h3>
        {isPermLoading ? (
          <Spinner />
        ) : permissions.length === 0 ? (
          <Empty label="No permissions defined" />
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">State</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {permissions.map((p) => (
                  <PermissionRow
                    key={p.permissionCode}
                    item={p}
                    disabled={isPermBusy}
                    onGrant={() => grantPermission({ sub, permissionCode: p.permissionCode })}
                    onRevoke={() => revokePermission({ sub, code: p.permissionCode })}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Functions section */}
      <section>
        <h3 className="mb-3 text-lg font-semibold text-neutral-800">UI Functions</h3>
        {isFuncLoading ? (
          <Spinner />
        ) : functions.length === 0 ? (
          <Empty label="No functions defined" />
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Key</th>
                  <th className="px-4 py-3">Module</th>
                  <th className="px-4 py-3">State</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {functions.map((f) => (
                  <FunctionRow
                    key={f.functionKey}
                    item={f}
                    disabled={isFuncBusy}
                    onGrant={() => grantFunction({ sub, functionKey: f.functionKey })}
                    onRevoke={() => revokeFunction({ sub, key: f.functionKey })}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// ── Permission row ──────────────────────────────────────────────────────────

function PermissionRow({
  item,
  disabled,
  onGrant,
  onRevoke,
}: {
  item: PermissionStatus;
  disabled: boolean;
  onGrant: () => void;
  onRevoke: () => void;
}) {
  return (
    <tr className="hover:bg-neutral-50">
      <td className="px-4 py-3 font-mono text-xs font-medium text-neutral-800">
        {item.permissionCode}
      </td>
      <td className="px-4 py-3 text-neutral-600">{item.description}</td>
      <td className="px-4 py-3">
        <StateBadge state={item.state} />
      </td>
      <td className="px-4 py-3 text-right">
        <ActionButton state={item.state} disabled={disabled} onGrant={onGrant} onRevoke={onRevoke} />
      </td>
    </tr>
  );
}

// ── Function row ────────────────────────────────────────────────────────────

function FunctionRow({
  item,
  disabled,
  onGrant,
  onRevoke,
}: {
  item: FunctionStatus;
  disabled: boolean;
  onGrant: () => void;
  onRevoke: () => void;
}) {
  return (
    <tr className="hover:bg-neutral-50">
      <td className="px-4 py-3 font-mono text-xs font-medium text-neutral-800">
        {item.functionKey}
      </td>
      <td className="px-4 py-3 text-neutral-600">{item.module}</td>
      <td className="px-4 py-3">
        <StateBadge state={item.state} />
      </td>
      <td className="px-4 py-3 text-right">
        <ActionButton state={item.state} disabled={disabled} onGrant={onGrant} onRevoke={onRevoke} />
      </td>
    </tr>
  );
}

// ── Shared sub-components ───────────────────────────────────────────────────

function StateBadge({ state }: { state: PermissionState }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATE_BADGE[state]}`}>
      {STATE_LABEL[state]}
    </span>
  );
}

function ActionButton({
  state,
  disabled,
  onGrant,
  onRevoke,
}: {
  state: PermissionState;
  disabled: boolean;
  onGrant: () => void;
  onRevoke: () => void;
}) {
  if (state === "ACTIVE") {
    return (
      <button
        onClick={onRevoke}
        disabled={disabled}
        className="rounded border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        Deactivate
      </button>
    );
  }
  return (
    <button
      onClick={onGrant}
      disabled={disabled}
      className="rounded border border-primary-400 px-3 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 disabled:opacity-50"
    >
      {state === "INACTIVE" ? "Activate" : "Grant"}
    </button>
  );
}

function Spinner() {
  return (
    <div className="flex h-20 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="flex h-20 items-center justify-center rounded-xl border border-dashed border-neutral-300 text-sm text-neutral-400">
      {label}
    </div>
  );
}
