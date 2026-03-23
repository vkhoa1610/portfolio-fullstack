"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  Filter,
  Search,
  Plus,
  X,
  Camera,
  Calendar,
  Car,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useGetFinanceExpensesQuery } from "@/ducks/expenses";
import type { Expense, ExpenseStatus } from "@/ducks/expenses";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_META: Record<ExpenseStatus, { label: string; dot: string; bg: string; text: string; phase: string }> = {
  DRAFT:          { label: "Draft",          dot: "bg-neutral-400",  bg: "bg-neutral-100",  text: "text-neutral-600",  phase: "creation" },
  PENDING_REVIEW: { label: "Pending Review", dot: "bg-warning-500",  bg: "bg-warning-100",  text: "text-warning-700",  phase: "review" },
  APPROVED:       { label: "Approved",       dot: "bg-success-500",  bg: "bg-success-100",  text: "text-success-700",  phase: "final" },
  REJECTED:       { label: "Rejected",       dot: "bg-error-500",    bg: "bg-error-100",    text: "text-error-700",    phase: "final" },
  PAID:           { label: "Paid",           dot: "bg-primary-500",  bg: "bg-primary-100",  text: "text-primary-700",  phase: "final" },
};

const PHASES = [
  { id: "creation", label: "CREATION",         statuses: ["DRAFT"] as ExpenseStatus[] },
  { id: "review",   label: "REVIEW / APPROVAL", statuses: ["PENDING_REVIEW"] as ExpenseStatus[] },
  { id: "final",    label: "FINAL",             statuses: ["APPROVED", "REJECTED", "PAID"] as ExpenseStatus[] },
];

const TYPE_ICON = { RECEIPT: Camera, PER_DIEM: Calendar, MILEAGE: Car };

const SUBMITTERS = ["Minh T.", "Hoa N.", "Long P.", "An D.", "Thu V.", "Duc M."];
const PAGE_SIZE = 8;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function isOverdue(e: Expense): boolean {
  const raw = e.submittedAt ?? e.createdAt;
  if (!raw) return false;
  const ageMs = Date.now() - new Date(raw).getTime();
  const ageDays = ageMs / 86_400_000;
  return ageDays > 10 && (e.status === "PENDING_REVIEW" || e.status === "DRAFT");
}

function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" });
}

function getSubmitter(id: number): string {
  return SUBMITTERS[id % SUBMITTERS.length];
}

// ─────────────────────────────────────────────────────────────────────────────
// FilterSidebar
// ─────────────────────────────────────────────────────────────────────────────

interface FiltersState {
  needsAction: boolean;
  overdue: boolean;
  statuses: Set<ExpenseStatus>;
}

function FilterSidebar({
  filters,
  onChange,
  counts,
  totalActive,
}: {
  filters: FiltersState;
  onChange: (f: FiltersState) => void;
  counts: Partial<Record<ExpenseStatus | "needsAction" | "overdue", number>>;
  totalActive: number;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [openPhases, setOpenPhases] = useState<Set<string>>(new Set(["creation", "review", "final"]));

  const togglePhase = (id: string) =>
    setOpenPhases((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleStatus = (s: ExpenseStatus) => {
    const next = new Set(filters.statuses);
    next.has(s) ? next.delete(s) : next.add(s);
    onChange({ ...filters, statuses: next });
  };

  const clearAll = () => onChange({ needsAction: false, overdue: false, statuses: new Set() });

  // ── Collapsed state ──────────────────────────────────────────────────────
  if (collapsed) {
    return (
      <div className="flex w-11 shrink-0 flex-col items-center border-r border-neutral-200 bg-neutral-50 py-3 gap-2">
        <button
          onClick={() => setCollapsed(false)}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-primary-300 bg-primary-50 text-primary-600 hover:bg-primary-100"
          title="Expand filters"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
        {/* Filter category icons */}
        {[
          { title: "Quick filters", active: filters.needsAction || filters.overdue, icon: <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1 2.5h11M3 6.5h7M5 10.5h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
          { title: "Status",        active: filters.statuses.size > 0,              icon: <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.2" fill="none"/><path d="M4 6.5l2 2 3.5-3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
        ].map((item, i) => (
          <div
            key={i}
            title={item.title}
            onClick={() => setCollapsed(false)}
            className={`relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border transition-colors ${
              item.active
                ? "border-warning-300 bg-warning-50 text-warning-600"
                : "border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-100"
            }`}
          >
            {item.icon}
            {item.active && (
              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full border border-white bg-primary-500" />
            )}
          </div>
        ))}
        {totalActive > 0 && (
          <button
            onClick={clearAll}
            title="Clear all"
            className="mt-auto flex h-6 w-6 items-center justify-center rounded text-neutral-400 hover:text-error-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }

  // ── Expanded state ───────────────────────────────────────────────────────
  return (
    <div className="flex w-56 shrink-0 flex-col border-r border-neutral-200 bg-neutral-50 overflow-hidden">
      {/* Header */}
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-neutral-200 px-3">
        <Filter className="h-3.5 w-3.5 text-neutral-500" />
        <span className="flex-1 text-sm font-medium text-neutral-800">Filters</span>
        {totalActive > 0 && (
          <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-medium text-primary-600">
            {totalActive} active
          </span>
        )}
        <button
          onClick={() => setCollapsed(true)}
          className="flex h-6 w-6 items-center justify-center rounded border border-neutral-200 bg-white text-neutral-400 hover:text-neutral-700"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">

        {/* Quick filters */}
        <p className="px-2 pb-1 pt-2 text-[9px] font-semibold uppercase tracking-wider text-neutral-400">
          Quick Filters
        </p>
        {[
          { key: "needsAction" as const, label: "Needs my action", count: counts.needsAction ?? 0, urgent: true },
          { key: "overdue" as const,     label: "Overdue",          count: counts.overdue ?? 0,     urgent: true },
        ].map((item) => (
          <label
            key={item.key}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-white"
          >
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded accent-primary-600"
              checked={filters[item.key]}
              onChange={() => onChange({ ...filters, [item.key]: !filters[item.key] })}
            />
            <span className={`flex-1 text-xs ${item.urgent && filters[item.key] ? "font-semibold text-warning-700" : "text-neutral-700"}`}>
              {item.label}
            </span>
            {item.count > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${item.urgent ? "bg-warning-100 text-warning-700" : "bg-neutral-100 text-neutral-500"}`}>
                {item.count}
              </span>
            )}
          </label>
        ))}

        {/* Separator */}
        <div className="my-2 h-px bg-neutral-200" />

        {/* Status phases */}
        {PHASES.map((phase) => (
          <div key={phase.id}>
            <button
              onClick={() => togglePhase(phase.id)}
              className="flex w-full items-center justify-between px-2 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-neutral-400 hover:text-neutral-600"
            >
              <span>{phase.label}</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${openPhases.has(phase.id) ? "" : "-rotate-90"}`} />
            </button>
            {openPhases.has(phase.id) && (
              <div className="space-y-0.5">
                {phase.statuses.map((s) => {
                  const meta = STATUS_META[s];
                  const checked = filters.statuses.has(s);
                  return (
                    <label key={s} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-white">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 rounded accent-primary-600"
                        checked={checked}
                        onChange={() => toggleStatus(s)}
                      />
                      <span className={`h-2 w-2 shrink-0 rounded-full ${meta.dot}`} />
                      <span className="flex-1 text-xs text-neutral-700">{meta.label}</span>
                      <span className="text-[10px] text-neutral-400">{counts[s] ?? 0}</span>
                    </label>
                  );
                })}
              </div>
            )}
            <div className="my-1.5 h-px bg-neutral-200" />
          </div>
        ))}

        {/* Clear all */}
        {totalActive > 0 && (
          <div className="pt-1 pb-2 px-2">
            <button
              onClick={clearAll}
              className="w-full rounded-md border border-error-200 py-1.5 text-xs text-error-600 hover:bg-error-50"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main view
// ─────────────────────────────────────────────────────────────────────────────

export default function ReportManagementView() {
  const { data: all = [], isLoading } = useGetFinanceExpensesQuery();

  const [filters, setFilters] = useState<FiltersState>({
    needsAction: false,
    overdue: false,
    statuses: new Set(),
  });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // ── Counts ────────────────────────────────────────────────────────────────
  const counts = useMemo(() => {
    const c: Partial<Record<ExpenseStatus | "needsAction" | "overdue", number>> = {};
    for (const e of all) {
      c[e.status] = (c[e.status] ?? 0) + 1;
      if (e.status === "PENDING_REVIEW") c.needsAction = (c.needsAction ?? 0) + 1;
      if (isOverdue(e)) c.overdue = (c.overdue ?? 0) + 1;
    }
    return c;
  }, [all]);

  const totalActive =
    (filters.needsAction ? 1 : 0) +
    (filters.overdue ? 1 : 0) +
    filters.statuses.size;

  // ── Filtered data ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let data = all;

    if (filters.needsAction) data = data.filter((e) => e.status === "PENDING_REVIEW");
    if (filters.overdue)     data = data.filter(isOverdue);
    if (filters.statuses.size > 0) data = data.filter((e) => filters.statuses.has(e.status));
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (e) =>
          (e.title ?? "").toLowerCase().includes(q) ||
          (e.vendorName ?? "").toLowerCase().includes(q),
      );
    }
    return data;
  }, [all, filters, search]);

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const kpiTotal    = all.length;
  const kpiNeedsAction = counts.needsAction ?? 0;
  const kpiApproved = counts["APPROVED"] ?? 0;
  const kpiRejected = counts["REJECTED"] ?? 0;

  // ── Active filter chips ───────────────────────────────────────────────────
  const chips: { label: string; onRemove: () => void }[] = [];
  if (filters.needsAction) chips.push({ label: "Needs action", onRemove: () => setFilters((f) => ({ ...f, needsAction: false })) });
  if (filters.overdue)     chips.push({ label: "Overdue",      onRemove: () => setFilters((f) => ({ ...f, overdue: false })) });
  filters.statuses.forEach((s) =>
    chips.push({ label: STATUS_META[s].label, onRemove: () => {
      const next = new Set(filters.statuses); next.delete(s);
      setFilters((f) => ({ ...f, statuses: next }));
    }}),
  );

  return (
    <div className="-mx-6 md:-mx-8 -my-6 md:-my-8 flex h-[calc(100vh-64px)] overflow-hidden border-t border-neutral-200 bg-white">
      {/* Filter sidebar */}
      <FilterSidebar
        filters={filters}
        onChange={(f) => { setFilters(f); setPage(1); }}
        counts={counts}
        totalActive={totalActive}
      />

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 px-5">
          <div>
            <p className="text-base font-semibold text-neutral-900">Report Management</p>
            <p className="text-xs text-neutral-400">Finance department</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="flex h-8 items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3">
              <Search className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-28 bg-transparent text-xs text-neutral-700 placeholder-neutral-400 outline-none"
              />
            </div>
            {/* New report */}
            <button className="flex h-8 items-center gap-1.5 rounded-lg bg-primary-600 px-3 text-xs font-medium text-white hover:bg-primary-700">
              <Plus className="h-3.5 w-3.5" />
              New report
            </button>
          </div>
        </div>

        {/* Active filter chips */}
        {chips.length > 0 && (
          <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-neutral-100 px-5 py-2">
            <span className="text-xs text-neutral-400">Active:</span>
            {chips.map((chip, i) => (
              <span
                key={i}
                className="flex items-center gap-1 rounded-full border border-warning-300 bg-warning-50 px-2 py-0.5 text-[11px] text-warning-700"
              >
                {chip.label}
                <button onClick={chip.onRemove} className="ml-0.5 opacity-50 hover:opacity-100">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <button
              onClick={() => setFilters({ needsAction: false, overdue: false, statuses: new Set() })}
              className="text-[11px] text-error-600 hover:underline"
            >
              Clear all
            </button>
          </div>
        )}

        {/* KPI cards */}
        <div className="grid shrink-0 grid-cols-4 gap-3 border-b border-neutral-100 px-5 py-3">
          <KpiCard label="Total" value={kpiTotal} sub="+12% this month" subColor="text-success-600" />
          <KpiCard label="Needs action" value={kpiNeedsAction} sub={`Incl. ${counts.overdue ?? 0} overdue`} bg="bg-warning-50" labelColor="text-warning-700" valueColor="text-warning-900" subColor="text-warning-600" />
          <KpiCard label="Approved" value={kpiApproved} sub={`${kpiTotal > 0 ? ((kpiApproved / kpiTotal) * 100).toFixed(1) : 0}% approval rate`} bg="bg-success-50" labelColor="text-success-700" valueColor="text-success-900" subColor="text-success-600" />
          <KpiCard label="Rejected" value={kpiRejected} sub={`${kpiTotal > 0 ? ((kpiRejected / kpiTotal) * 100).toFixed(1) : 0}% rejection rate`} bg="bg-error-50" labelColor="text-error-700" valueColor="text-error-900" subColor="text-error-600" />
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto px-5 py-3">
          <div className="overflow-hidden rounded-xl border border-neutral-200">
            {/* Head */}
            <div className="grid grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)_56px] gap-3 border-b border-neutral-200 bg-neutral-50 px-4 py-2.5">
              {["Report name", "Amount", "Status", "Submitted", ""].map((col, i) => (
                <span key={i} className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{col}</span>
              ))}
            </div>

            {/* Rows */}
            {isLoading ? (
              <div className="flex h-32 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-200 border-t-primary-600" />
              </div>
            ) : paginated.length === 0 ? (
              <p className="p-8 text-center text-sm text-neutral-400">No reports match your filters.</p>
            ) : (
              paginated.map((e) => <ReportRow key={e.id} expense={e} />)
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-2.5">
              <span className="text-[11px] text-neutral-400">
                Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex gap-1">
                <PageBtn onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </PageBtn>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((n) => (
                  <PageBtn key={n} onClick={() => setPage(n)} active={page === n}>{n}</PageBtn>
                ))}
                <PageBtn onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </PageBtn>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function ReportRow({ expense: e }: { expense: Expense }) {
  const meta = STATUS_META[e.status];
  const overdue = isOverdue(e);
  const Icon = TYPE_ICON[e.type] ?? Camera;
  const name = e.title || e.vendorName || `Expense #${e.id}`;
  const submitter = getSubmitter(e.id);

  return (
    <div
      className={`grid grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)_56px] items-center gap-3 border-b border-neutral-100 px-4 py-3 hover:bg-neutral-50/70 last:border-0
        ${overdue ? "border-l-2 border-l-warning-400 bg-warning-50/20" : ""}`}
    >
      {/* Name */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-neutral-900">{name}</p>
          {overdue && (
            <span className="shrink-0 rounded-full bg-warning-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-warning-700">
              Overdue
            </span>
          )}
        </div>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-400">
          <Icon className="h-3 w-3" /> Finance · {submitter}
        </p>
      </div>

      {/* Amount */}
      <span className="text-sm text-neutral-800">
        {e.amount != null ? `${e.amount.toFixed(2)} €` : "—"}
      </span>

      {/* Status */}
      <div>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${meta.bg} ${meta.text}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
          {meta.label}
        </span>
      </div>

      {/* Submitted */}
      <span className={`text-xs ${overdue ? "font-semibold text-error-600" : "text-neutral-500"}`}>
        {fmtDate(e.submittedAt ?? e.createdAt)}
      </span>

      {/* Actions */}
      <div className="flex gap-1">
        <ActionBtn title="View">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M1 6s1.8-4 5-4 5 4 5 4-1.8 4-5 4-5-4-5-4z" stroke="currentColor" strokeWidth="1.3" fill="none"/></svg>
        </ActionBtn>
        <ActionBtn title="More">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="2.5" r="1" fill="currentColor"/><circle cx="6" cy="6" r="1" fill="currentColor"/><circle cx="6" cy="9.5" r="1" fill="currentColor"/></svg>
        </ActionBtn>
      </div>
    </div>
  );
}

function KpiCard({
  label, value, sub, bg = "bg-neutral-50",
  labelColor = "text-neutral-500", valueColor = "text-neutral-900", subColor = "text-neutral-400",
}: {
  label: string; value: number; sub: string;
  bg?: string; labelColor?: string; valueColor?: string; subColor?: string;
}) {
  return (
    <div className={`rounded-lg ${bg} px-3 py-2.5`}>
      <p className={`text-[10px] font-medium ${labelColor}`}>{label}</p>
      <p className={`mt-0.5 text-2xl font-semibold ${valueColor}`}>{value.toLocaleString()}</p>
      <p className={`mt-0.5 text-[10px] ${subColor}`}>{sub}</p>
    </div>
  );
}

function PageBtn({
  onClick, active, disabled, children,
}: {
  onClick: () => void; active?: boolean; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex h-7 w-7 items-center justify-center rounded-md border text-xs transition-colors disabled:opacity-40
        ${active
          ? "border-primary-500 bg-primary-50 font-semibold text-primary-700"
          : "border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50"
        }`}
    >
      {children}
    </button>
  );
}

function ActionBtn({ onClick, title, children }: { onClick?: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex h-6 w-6 items-center justify-center rounded border border-neutral-200 bg-white text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
    >
      {children}
    </button>
  );
}
