"use client";

import { useState } from "react";
import { X, AlertTriangle, Check } from "lucide-react";
import { useProcessGdprRequestMutation } from "@/ducks/admin/adminApi";
import type { GdprErasureRequest, GdprDataMap } from "@/ducks/admin/types";

interface Props {
  open: boolean;
  request: GdprErasureRequest;
  dataMap: GdprDataMap | undefined;
  onClose: () => void;
}

const CHECKLIST = [
  { key: "pii",       label: "PII tables (users, user_profiles, user_roles) will be hard-deleted" },
  { key: "financial", label: "Expenses + user_consents will be pseudonymized (user_sub → DELETED-<sha256>)" },
  { key: "audit",     label: "policy_evaluation_history.created_by will be set to NULL" },
  { key: "log",       label: "An immutable record will be written to gdpr_audit_log" },
];

export default function GdprConfirmModal({ open, request, dataMap, onClose }: Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [process, { isLoading, error }] = useProcessGdprRequestMutation();

  if (!open) return null;
  const allChecked = CHECKLIST.every((c) => checked[c.key]);

  const handleConfirm = async () => {
    if (!request.subjectSub) return;
    try {
      await process({ id: request.requestId, sub: request.subjectSub }).unwrap();
      onClose();
      setChecked({});
    } catch {
      // RTK Query error surface — left in `error` for display below
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-neutral-100 p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-red-100 p-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">Confirm GDPR erasure</h2>
              <p className="mt-1 text-xs text-neutral-500">
                This action is irreversible. Review each item before continuing.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 p-5">
          {dataMap && (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs">
              <p className="font-semibold text-neutral-700">
                Subject: <span className="font-mono">{request.subjectSub}</span>
              </p>
              <p className="mt-1 text-neutral-500">
                Will touch {dataMap.tables.reduce((s, t) => s + t.rowCount, 0)} row(s) across {dataMap.tables.filter((t) => t.rowCount > 0).length} table(s)
              </p>
            </div>
          )}

          <ul className="space-y-2">
            {CHECKLIST.map((c) => (
              <li key={c.key}>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-neutral-200 px-3 py-2.5 hover:bg-neutral-50">
                  <input
                    type="checkbox"
                    checked={!!checked[c.key]}
                    onChange={(e) => setChecked((prev) => ({ ...prev, [c.key]: e.target.checked }))}
                    className="mt-0.5 h-4 w-4 cursor-pointer accent-primary-600"
                  />
                  <span className="text-xs text-neutral-700">{c.label}</span>
                </label>
              </li>
            ))}
          </ul>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              Failed to process erasure. Check backend logs.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-neutral-100 px-5 py-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!allChecked || isLoading || !request.subjectSub}
            className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" />
            {isLoading ? "Processing…" : "Confirm erasure"}
          </button>
        </div>
      </div>
    </div>
  );
}
