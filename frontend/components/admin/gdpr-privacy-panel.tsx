"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronRight, Clock, ShieldCheck, FileText } from "lucide-react";
import {
  useGetGdprRequestsQuery,
  useGetGdprDataMapQuery,
  useGetGdprAuditLogQuery,
} from "@/ducks/admin/adminApi";
import type {
  GdprErasureRequest,
  GdprRequestStatus,
  GdprTableClassification,
  GdprDataMapTable,
  GdprAuditEntry,
} from "@/ducks/admin/types";
import GdprConfirmModal from "./gdpr-confirm-modal";

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

export default function GdprPrivacyPanel({ sub }: { sub: string }) {
  const { data: requests = [] } = useGetGdprRequestsQuery();
  const { data: dataMap, isLoading: isMapLoading } = useGetGdprDataMapQuery(sub);
  const { data: auditEntries = [] } = useGetGdprAuditLogQuery({ subjectSub: sub, limit: 50 });

  const activeRequest = useMemo<GdprErasureRequest | undefined>(
    () => requests.find((r) => r.subjectSub === sub && r.status !== "COMPLETED"),
    [requests, sub]
  );

  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* ── Erasure request status ── */}
      <Section title="Erasure request" icon={<ShieldCheck className="h-4 w-4" />}>
        {activeRequest ? (
          <RequestCard request={activeRequest} onProcess={() => setConfirmOpen(true)} />
        ) : (
          <Empty label="No active erasure request for this user" />
        )}
      </Section>

      {/* ── Data map ── */}
      <Section title="Data map" icon={<FileText className="h-4 w-4" />}>
        {isMapLoading ? (
          <Spinner />
        ) : !dataMap || dataMap.tables.length === 0 ? (
          <Empty label="No data inventory available" />
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            {dataMap.tables.map((t, idx) => (
              <DataMapRow key={t.name} table={t} isLast={idx === dataMap.tables.length - 1} />
            ))}
          </div>
        )}
      </Section>

      {/* ── Audit timeline ── */}
      <Section title="Audit timeline" icon={<Clock className="h-4 w-4" />}>
        {auditEntries.length === 0 ? (
          <Empty label="No audit events recorded yet" />
        ) : (
          <ul className="space-y-2">
            {auditEntries.map((entry) => (
              <AuditRow key={entry.id} entry={entry} />
            ))}
          </ul>
        )}
      </Section>

      {/* ── Confirm modal ── */}
      {activeRequest && (
        <GdprConfirmModal
          open={confirmOpen}
          request={activeRequest}
          dataMap={dataMap}
          onClose={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
}

// ── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-neutral-800">
        <span className="text-primary-600">{icon}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}

// ── Request card ─────────────────────────────────────────────────────────────

function RequestCard({ request, onProcess }: { request: GdprErasureRequest; onProcess: () => void }) {
  const overdue = request.daysRemaining < 0;
  const urgent  = !overdue && request.daysRemaining <= 7;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[request.status]}`}>
              {request.status}
            </span>
            <span className="text-xs text-neutral-500">
              Requested {request.requestedAt?.slice(0, 10) ?? "—"}
            </span>
          </div>
          <p className="mt-3 text-sm text-neutral-700">
            {request.reason || <span className="italic text-neutral-400">No reason provided</span>}
          </p>
          <div className={`mt-3 inline-flex items-center gap-1.5 text-xs font-semibold ${overdue ? "text-red-600" : urgent ? "text-amber-600" : "text-neutral-500"}`}>
            {(overdue || urgent) && <AlertTriangle className="h-3.5 w-3.5" />}
            {overdue
              ? `Overdue by ${Math.abs(request.daysRemaining)} day(s) — GDPR Art. 12 breach`
              : `${request.daysRemaining} day(s) remaining (deadline ${request.deadlineAt})`}
          </div>
        </div>
        {request.status === "PENDING" && (
          <button
            onClick={onProcess}
            className="rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
          >
            Process erasure
          </button>
        )}
      </div>
    </div>
  );
}

// ── Data map row (collapsible) ───────────────────────────────────────────────

function DataMapRow({ table, isLast }: { table: GdprDataMapTable; isLast: boolean }) {
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

// ── Audit row ────────────────────────────────────────────────────────────────

function AuditRow({ entry }: { entry: GdprAuditEntry }) {
  return (
    <li className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3">
      <div className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary-500" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono font-bold text-neutral-800">{entry.eventType}</span>
          <span className="text-neutral-400">·</span>
          <span className="text-neutral-500">{entry.createdAt?.slice(0, 19).replace("T", " ")}</span>
        </div>
        {entry.actorSub && (
          <p className="mt-0.5 text-xs text-neutral-500">
            actor: {entry.actorRole} ({entry.actorSub.slice(0, 14)}…)
          </p>
        )}
        {entry.detailsJson && entry.detailsJson !== "{}" && (
          <pre className="mt-1 max-h-32 overflow-y-auto rounded bg-neutral-50 p-2 text-[10px] text-neutral-600">
            {entry.detailsJson}
          </pre>
        )}
      </div>
    </li>
  );
}

// ── Shared ───────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex h-16 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="flex h-16 items-center justify-center rounded-xl border border-dashed border-neutral-300 text-sm text-neutral-400">
      {label}
    </div>
  );
}
