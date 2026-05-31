"use client";

import { useState } from "react";
import {
  Shield, Download, AlertTriangle, ChevronDown, ChevronRight,
  Check, FileText, Clock,
} from "lucide-react";
import {
  useGetMyDataMapQuery,
  useGetMyConsentsQuery,
  useGetMyErasureStatusQuery,
  useSubmitErasureRequestMutation,
} from "@/ducks/privacy/privacyApi";
import type {
  PrivacyDataMapTable, PrivacyErasureStatus, UserConsentItem,
  GdprTableClassification, GdprRequestStatus,
} from "@/ducks/privacy/types";

const STATUS_STYLE: Record<GdprRequestStatus, string> = {
  PENDING:    "bg-amber-100 text-amber-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  COMPLETED:  "bg-green-100 text-green-700",
};

const CLASS_STYLE: Record<GdprTableClassification, string> = {
  PII_HARD_DELETE:        "bg-red-50 text-red-700 border-red-200",
  FINANCIAL_PSEUDONYMIZE: "bg-amber-50 text-amber-700 border-amber-200",
  AUDIT_NULLIFY:          "bg-blue-50 text-blue-700 border-blue-200",
};

const CLASS_LABEL: Record<GdprTableClassification, string> = {
  PII_HARD_DELETE:        "Hard delete",
  FINANCIAL_PSEUDONYMIZE: "Pseudonymize",
  AUDIT_NULLIFY:          "Nullify",
};

export default function PrivacyCenterView() {
  const { data: dataMap, isLoading: isMapLoading } = useGetMyDataMapQuery();
  const { data: consents = [] } = useGetMyConsentsQuery();
  const { data: erasure } = useGetMyErasureStatusQuery();

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">
      {/* ── Header ── */}
      <header className="flex items-start gap-4">
        <div className="rounded-2xl bg-primary-100 p-3 text-primary-600">
          <Shield className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-neutral-900">Privacy &amp; Data</h1>
          <p className="mt-1 text-sm text-neutral-500">
            See what we store about you, download a copy, or request deletion.
            We respond to all GDPR requests within 30 days.
          </p>
        </div>
      </header>

      {/* ── Active erasure status (if any) ── */}
      {erasure && erasure.status !== "COMPLETED" && <ErasureStatusBanner erasure={erasure} />}

      {/* ── Data inventory + Download ── */}
      <Section title="My data" icon={<FileText className="h-4 w-4" />}>
        <p className="mb-3 text-xs text-neutral-500">
          A breakdown of what we currently store. You can download a machine-readable copy at any time (GDPR Art. 20).
        </p>
        {isMapLoading ? (
          <Spinner />
        ) : !dataMap ? (
          <Empty label="Could not load data inventory" />
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            {dataMap.tables.map((t, idx) => (
              <DataInventoryRow key={t.name} table={t} isLast={idx === dataMap.tables.length - 1} />
            ))}
          </div>
        )}
        <div className="mt-4">
          <DownloadButton />
        </div>
      </Section>

      {/* ── Consent history ── */}
      <Section title="Consent history" icon={<Check className="h-4 w-4" />}>
        {consents.length === 0 ? (
          <Empty label="No consent records yet" />
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Policy</th>
                  <th className="px-4 py-3">Version</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {consents.map((c) => <ConsentRow key={c.id} item={c} />)}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ── Request deletion form ── */}
      {!erasure || erasure.status === "COMPLETED" ? (
        <Section title="Request deletion" icon={<AlertTriangle className="h-4 w-4" />}>
          <ErasureRequestForm />
        </Section>
      ) : null}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-neutral-800">
        <span className="text-primary-600">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function ErasureStatusBanner({ erasure }: { erasure: PrivacyErasureStatus }) {
  const overdue = erasure.daysRemaining < 0;
  const urgent  = !overdue && erasure.daysRemaining <= 7;
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex items-start gap-4">
        <Clock className="h-5 w-5 flex-shrink-0 text-primary-600" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[erasure.status]}`}>
              {erasure.status}
            </span>
            <span className="text-xs text-neutral-500">
              Requested {erasure.requestedAt?.slice(0, 10) ?? "—"}
            </span>
          </div>
          <p className="mt-2 text-sm text-neutral-700">
            Your deletion request is being processed — we&apos;ll confirm completion within 30 days per{" "}
            <a
              href="https://gdpr-info.eu/art-12-gdpr/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary-600 underline-offset-2 hover:underline"
            >
              GDPR Art. 12
            </a>
            . The deletion form is hidden until your current request is resolved (one active request at a time).
          </p>
          <p className={`mt-2 text-xs font-semibold ${overdue ? "text-red-600" : urgent ? "text-amber-600" : "text-neutral-500"}`}>
            {overdue
              ? `Overdue by ${Math.abs(erasure.daysRemaining)} day(s) — our compliance team has been alerted.`
              : `${erasure.daysRemaining} day(s) remaining (deadline ${erasure.deadlineAt}).`}
          </p>
          {erasure.reason && (
            <p className="mt-2 rounded-lg bg-neutral-50 px-3 py-2 text-xs italic text-neutral-600">
              &ldquo;{erasure.reason}&rdquo;
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function DataInventoryRow({ table, isLast }: { table: PrivacyDataMapTable; isLast: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={isLast ? "" : "border-b border-neutral-100"}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 hover:bg-neutral-50"
      >
        {open ? <ChevronDown className="h-4 w-4 text-neutral-400" /> : <ChevronRight className="h-4 w-4 text-neutral-400" />}
        <span className="flex-1 text-left font-mono text-sm font-medium text-neutral-800">{table.name}</span>
        <span className="text-xs font-semibold text-neutral-600">{table.rowCount} rows</span>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${CLASS_STYLE[table.classification]}`}>
          {CLASS_LABEL[table.classification]}
        </span>
      </button>
      {open && (
        <div className="border-t border-neutral-100 bg-neutral-50 px-12 py-2 text-xs text-neutral-600">
          {table.note}
        </div>
      )}
    </div>
  );
}

function ConsentRow({ item }: { item: UserConsentItem }) {
  return (
    <tr className="hover:bg-neutral-50">
      <td className="px-4 py-3">
        <div className="font-medium text-neutral-800">{item.policyTitle}</div>
        <div className="font-mono text-[10px] text-neutral-400">{item.policyType}</div>
      </td>
      <td className="px-4 py-3 text-xs text-neutral-600">v{item.policyVersion}</td>
      <td className="px-4 py-3 text-xs text-neutral-600">{item.createdAt?.slice(0, 10) ?? "—"}</td>
      <td className="px-4 py-3 text-xs text-neutral-600">{item.consentMethod}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${item.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-500"}`}>
          {item.status}
        </span>
      </td>
    </tr>
  );
}

function DownloadButton() {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setDownloading(true);
    setError(null);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BFF_URL || "/api";
      const res = await fetch(`${baseUrl}/emp-012`, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `my-data-export-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={downloading}
        className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-50"
      >
        <Download className="h-4 w-4" />
        {downloading ? "Preparing ZIP…" : "Download my data (.zip)"}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function ErasureRequestForm() {
  const [reason, setReason] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [submit, { isLoading, error, isSuccess }] = useSubmitErasureRequestMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submit({ reason }).unwrap();
      setReason("");
      setAcknowledged(false);
    } catch {
      /* error surfaced via `error` */
    }
  };

  if (isSuccess) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
        <strong>Request submitted.</strong> Our compliance team will process it within 30 days.
        Refresh to see the live status banner above.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex items-start gap-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <div>
          <strong>This action is irreversible.</strong> Personal data (name, email, avatar) will be hard-deleted.
          Financial records will be retained 10 years (GoBD §14) but anonymized.
        </div>
      </div>

      <label className="block">
        <span className="text-xs font-medium text-neutral-700">Reason (optional)</span>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Let us know why — helps our records, not required."
          rows={3}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
        />
      </label>

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-neutral-200 px-3 py-2.5">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(e) => setAcknowledged(e.target.checked)}
          className="mt-0.5 h-4 w-4 cursor-pointer accent-primary-600"
        />
        <span className="text-xs text-neutral-700">
          I understand my account will be deactivated and personal data deleted within 30 days.
        </span>
      </label>

      {error && (
        <p className="text-xs text-red-600">
          {"data" in error && (error as { data?: { message?: string } }).data?.message
            ? (error as { data?: { message?: string } }).data!.message
            : "Failed to submit request. You may already have an active request."}
        </p>
      )}

      <button
        type="submit"
        disabled={!acknowledged || isLoading}
        className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
      >
        <AlertTriangle className="h-4 w-4" />
        {isLoading ? "Submitting…" : "Submit erasure request"}
      </button>
    </form>
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
