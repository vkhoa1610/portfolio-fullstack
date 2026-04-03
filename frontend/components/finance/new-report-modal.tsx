/* eslint-disable jsx-a11y/label-has-associated-control */
"use client";

import { useState } from "react";
import {
  X,
  Check,
  ChevronRight,
  Plus,
  Trash2,
  AlertCircle,
} from "lucide-react";
import {
  useCreateFinanceReportMutation,
  type FinanceReportType,
  type FinanceReportPriority,
  type LineItem,
  type ApprovalLevel,
} from "@/ducks/expenses";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const REPORT_TYPES: { value: FinanceReportType; label: string }[] = [
  { value: "FINANCIAL",   label: "Financial" },
  { value: "ANALYTICS",   label: "Analytics" },
  { value: "OPERATIONS",  label: "Operations" },
  { value: "COMPLIANCE",  label: "Compliance" },
];

const PRIORITIES: { value: FinanceReportPriority; label: string; color: string }[] = [
  { value: "LOW",    label: "Low",    color: "" },
  { value: "NORMAL", label: "Normal", color: "primary" },
  { value: "HIGH",   label: "High",   color: "warning" },
  { value: "URGENT", label: "Urgent", color: "error" },
];

const FISCAL_PERIODS = ["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026", "Q1 2025", "Q4 2025"];

const CURRENCIES = ["EUR", "USD", "GBP"];

const DEMO_APPROVAL_ROUTE: ApprovalLevel[] = [
  { level: 1, reviewerName: "Minh Tran",  deadlineDays: 3 },
  { level: 2, reviewerName: "Hoa Nguyen", deadlineDays: 5 },
  { level: 3, reviewerName: "Long Pham",  deadlineDays: 7 },
];

const STEP_LABELS = ["General info", "Financial details", "Attachments", "Approval route", "Review & submit"];

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface FormData {
  // Step 1
  title: string;
  reportType: FinanceReportType;
  fiscalPeriod: string;
  dueDate: string;
  description: string;
  priority: FinanceReportPriority;
  // Step 2
  totalAmount: string;
  currency: string;
  lineItems: LineItem[];
  // Step 3
  attachmentFiles: { name: string; size: string; fileType: "PRIMARY" | "SUPPORTING" }[];
  // Step 4
  approvalRoute: ApprovalLevel[];
  notifyCc: { name: string }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Stepper
// ─────────────────────────────────────────────────────────────────────────────

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-0">
      {STEP_LABELS.map((label, i) => {
        const num = i + 1;
        const done = num < step;
        const active = num === step;
        return (
          <div key={num} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                  done
                    ? "bg-success-100 text-success-700 border border-success-300"
                    : active
                    ? "bg-primary-600 text-white"
                    : "border border-neutral-200 bg-neutral-50 text-neutral-400"
                }`}
              >
                {done ? <Check className="h-3 w-3" /> : num}
              </div>
              <span
                className={`whitespace-nowrap text-[10px] font-medium ${
                  done ? "text-success-600" : active ? "text-primary-600" : "text-neutral-400"
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={`mb-4 mx-1 h-px flex-1 min-w-[20px] ${
                  done ? "bg-success-300" : "bg-neutral-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 — General info
// ─────────────────────────────────────────────────────────────────────────────

function Step1({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
}) {
  return (
    <div>
      <div className="mb-4 text-sm font-medium text-neutral-900">General information</div>

      {/* Title */}
      <div className="mb-3">
        <label className="mb-1 block text-[11px] font-medium text-neutral-500">
          Report name <span className="text-error-500">*</span>
        </label>
        <input
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="e.g. Q1 Revenue Report 2026"
          className="h-9 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-200"
        />
      </div>

      {/* Report type */}
      <div className="mb-3">
        <label className="mb-1 block text-[11px] font-medium text-neutral-500">Report type <span className="text-error-500">*</span></label>
        <div className="flex flex-wrap gap-2">
          {REPORT_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => onChange({ reportType: t.value })}
              className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors ${
                data.reportType === t.value
                  ? "border-primary-500 bg-primary-50 text-primary-700"
                  : "border-neutral-200 bg-neutral-50 text-neutral-500 hover:border-neutral-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Fiscal period + due date */}
      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-neutral-500">Fiscal period</label>
          <select
            value={data.fiscalPeriod}
            onChange={(e) => onChange({ fiscalPeriod: e.target.value })}
            className="h-9 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-900 focus:border-primary-400 focus:outline-none"
          >
            <option value="">Select period...</option>
            {FISCAL_PERIODS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-neutral-500">Due date</label>
          <input
            type="date"
            value={data.dueDate}
            onChange={(e) => onChange({ dueDate: e.target.value })}
            className="h-9 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-900 focus:border-primary-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Description */}
      <div className="mb-3">
        <label className="mb-1 block text-[11px] font-medium text-neutral-500">Description</label>
        <textarea
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={3}
          placeholder="Brief description of the report purpose..."
          className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-200 resize-none"
        />
      </div>

      {/* Priority */}
      <div>
        <label className="mb-1 block text-[11px] font-medium text-neutral-500">Priority</label>
        <div className="flex gap-2">
          {PRIORITIES.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => onChange({ priority: p.value })}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                data.priority === p.value
                  ? p.color === "primary"
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : p.color === "warning"
                    ? "border-warning-400 bg-warning-50 text-warning-700"
                    : p.color === "error"
                    ? "border-error-400 bg-error-50 text-error-700"
                    : "border-neutral-400 bg-neutral-100 text-neutral-700"
                  : "border-neutral-200 bg-neutral-50 text-neutral-500 hover:border-neutral-300"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 — Financial details
// ─────────────────────────────────────────────────────────────────────────────

function Step2({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
}) {
  const addLine = () =>
    onChange({ lineItems: [...data.lineItems, { description: "", category: "OPEX", amount: 0 }] });

  const removeLine = (i: number) =>
    onChange({ lineItems: data.lineItems.filter((_, idx) => idx !== i) });

  const updateLine = (i: number, patch: Partial<LineItem>) =>
    onChange({ lineItems: data.lineItems.map((l, idx) => (idx === i ? { ...l, ...patch } : l)) });

  const total = data.lineItems.reduce((s, l) => s + (Number(l.amount) || 0), 0);

  return (
    <div>
      <div className="mb-4 text-sm font-medium text-neutral-900">Financial details</div>

      {/* Amount + currency */}
      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-neutral-500">
            Total amount <span className="text-error-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={data.totalAmount}
            onChange={(e) => onChange({ totalAmount: e.target.value })}
            placeholder="0.00"
            className="h-9 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-900 focus:border-primary-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-neutral-500">Currency</label>
          <select
            value={data.currency}
            onChange={(e) => onChange({ currency: e.target.value })}
            className="h-9 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-900 focus:border-primary-400 focus:outline-none"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Line items */}
      <div className="mb-2 text-[11px] font-medium text-neutral-500">Line items</div>
      <div className="mb-2 overflow-hidden rounded-lg border border-neutral-200">
        <div className="grid grid-cols-[2fr_1fr_1fr_36px] gap-2 border-b border-neutral-100 bg-neutral-50 px-3 py-2">
          <span className="text-[10px] font-medium text-neutral-500">Description</span>
          <span className="text-[10px] font-medium text-neutral-500">Category</span>
          <span className="text-[10px] font-medium text-neutral-500">Amount ({data.currency})</span>
          <span />
        </div>
        {data.lineItems.map((line, i) => (
          <div
            key={i}
            className="grid grid-cols-[2fr_1fr_1fr_36px] items-center gap-2 border-b border-neutral-100 px-3 py-1.5 last:border-0"
          >
            <input
              value={line.description}
              onChange={(e) => updateLine(i, { description: e.target.value })}
              placeholder="e.g. Personnel costs"
              className="h-7 w-full rounded border border-neutral-200 bg-white px-2 text-xs text-neutral-900 focus:border-primary-400 focus:outline-none"
            />
            <select
              value={line.category}
              onChange={(e) => updateLine(i, { category: e.target.value as "OPEX" | "CAPEX" })}
              className="h-7 w-full rounded border border-neutral-200 bg-white px-2 text-xs text-neutral-900 focus:border-primary-400 focus:outline-none"
            >
              <option value="OPEX">Opex</option>
              <option value="CAPEX">Capex</option>
            </select>
            <input
              type="number"
              min="0"
              step="0.01"
              value={line.amount || ""}
              onChange={(e) => updateLine(i, { amount: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              className="h-7 w-full rounded border border-neutral-200 bg-white px-2 text-xs text-neutral-900 focus:border-primary-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => removeLine(i)}
              className="flex h-6 w-6 items-center justify-center rounded border border-error-200 bg-error-50 text-error-500 hover:bg-error-100"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addLine}
        className="mb-3 w-full rounded-lg border border-dashed border-primary-300 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 transition-colors"
      >
        <Plus className="mr-1 inline h-3 w-3" /> Add line item
      </button>

      {/* Total */}
      {data.lineItems.length > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-sm">
          <span className="text-neutral-500">Subtotal from line items</span>
          <span className="font-medium text-neutral-900">
            {data.currency} {total.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3 — Attachments (demo upload UI)
// ─────────────────────────────────────────────────────────────────────────────

function Step3({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
}) {
  const toggleType = (i: number) =>
    onChange({
      attachmentFiles: data.attachmentFiles.map((f, idx) =>
        idx === i ? { ...f, fileType: f.fileType === "PRIMARY" ? "SUPPORTING" : "PRIMARY" } : f
      ),
    });

  const remove = (i: number) =>
    onChange({ attachmentFiles: data.attachmentFiles.filter((_, idx) => idx !== i) });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const newFiles = files.map((f) => ({
      name: f.name,
      size: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
      fileType: data.attachmentFiles.length === 0 ? ("PRIMARY" as const) : ("SUPPORTING" as const),
    }));
    onChange({ attachmentFiles: [...data.attachmentFiles, ...newFiles] });
    e.target.value = "";
  };

  const ext = (name: string) => name.split(".").pop()?.toUpperCase() ?? "FILE";

  const extColor: Record<string, string> = {
    PDF: "bg-primary-100 text-primary-700",
    XLSX: "bg-success-100 text-success-700",
    XLS: "bg-success-100 text-success-700",
    DOCX: "bg-info-100 text-info-700",
    DOC: "bg-info-100 text-info-700",
  };

  return (
    <div>
      <div className="mb-4 text-sm font-medium text-neutral-900">Attachments</div>

      {/* Drop zone */}
      <label className="mb-3 flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-neutral-200 p-6 text-center hover:border-primary-300 hover:bg-primary-50/30 transition-colors">
        <div className="mb-2 text-2xl">📎</div>
        <div className="text-sm font-medium text-neutral-600">Click to browse files</div>
        <div className="mt-1 text-[11px] text-neutral-400">PDF, Excel, Word · Max 25 MB / file</div>
        <input type="file" className="hidden" multiple accept=".pdf,.xlsx,.xls,.docx,.doc" onChange={handleFile} />
      </label>

      {/* File list */}
      {data.attachmentFiles.length > 0 && (
        <>
          <div className="mb-2 text-[11px] text-neutral-400">{data.attachmentFiles.length} file(s) added</div>
          <div className="flex flex-col gap-2">
            {data.attachmentFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
                <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded text-[10px] font-bold ${extColor[ext(f.name)] ?? "bg-neutral-200 text-neutral-600"}`}>
                  {ext(f.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium text-neutral-900">{f.name}</div>
                  <div className="text-[10px] text-neutral-400">{f.size}</div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleType(i)}
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors ${
                    f.fileType === "PRIMARY"
                      ? "border-success-300 bg-success-50 text-success-700"
                      : "border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-100"
                  }`}
                >
                  {f.fileType === "PRIMARY" ? "Primary" : "Supporting"}
                </button>
                <button type="button" onClick={() => remove(i)} className="flex h-6 w-6 items-center justify-center rounded border border-error-200 bg-error-50 text-error-500 hover:bg-error-100">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-lg border border-primary-100 bg-primary-50 px-3 py-2 text-[11px] text-primary-700">
            File marked as <strong>Primary</strong> will be reviewed first. Click the badge to toggle.
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 4 — Approval route
// ─────────────────────────────────────────────────────────────────────────────

function Step4({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
}) {
  const updateDeadline = (i: number, days: number) =>
    onChange({
      approvalRoute: data.approvalRoute.map((r, idx) =>
        idx === i ? { ...r, deadlineDays: days } : r
      ),
    });

  const levelBg = ["bg-primary-100 text-primary-700", "bg-success-100 text-success-700", "bg-purple-100 text-purple-700"];

  return (
    <div>
      <div className="mb-1 text-sm font-medium text-neutral-900">Approval route</div>
      <div className="mb-4 text-xs text-neutral-400">System-suggested based on report type. You can adjust deadlines.</div>

      <div className="mb-3 flex items-center gap-2 rounded-lg border border-primary-100 bg-primary-50 px-3 py-2 text-xs text-primary-700">
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        Suggested route for Finance report — requires {data.approvalRoute.length} level(s) of approval
      </div>

      <div className="flex flex-col gap-3 mb-4">
        {data.approvalRoute.map((r, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${levelBg[i] ?? levelBg[2]}`}>
                L{r.level}
              </div>
              {i < data.approvalRoute.length - 1 && (
                <div className="mt-1 h-full w-px bg-neutral-200" />
              )}
            </div>
            <div className="flex-1 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                Level {r.level} — {i === 0 ? "Manager Review" : i === 1 ? "Director Approval" : "Final Approval"}
              </div>
              <div className="mb-2 flex items-center gap-2">
                <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${levelBg[i] ?? levelBg[2]}`}>
                  {r.reviewerName.split(" ").map((w) => w[0]).join("")}
                </div>
                <div>
                  <div className="text-xs font-medium text-neutral-900">{r.reviewerName}</div>
                  <div className="text-[10px] text-neutral-400">{i === 0 ? "Finance Manager" : i === 1 ? "Finance Director" : "CFO"}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                <span>Deadline:</span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={r.deadlineDays}
                  onChange={(e) => updateDeadline(i, parseInt(e.target.value) || 1)}
                  className="h-6 w-16 rounded border border-neutral-200 px-2 text-center text-xs text-neutral-900 focus:border-primary-400 focus:outline-none"
                />
                <span>days after receiving</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CC */}
      <div>
        <label className="mb-1 block text-[11px] font-medium text-neutral-500">Notify (CC)</label>
        <div className="flex flex-wrap gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 p-2">
          {data.notifyCc.map((cc, i) => (
            <span key={i} className="flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-xs text-neutral-700">
              {cc.name}
              <button type="button" onClick={() => onChange({ notifyCc: data.notifyCc.filter((_, idx) => idx !== i) })} className="text-neutral-400 hover:text-error-500">
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => {
              const name = prompt("Enter name to notify:");
              if (name?.trim()) onChange({ notifyCc: [...data.notifyCc, { name: name.trim() }] });
            }}
            className="rounded-full border border-dashed border-neutral-300 px-2 py-0.5 text-[11px] text-neutral-400 hover:border-neutral-400"
          >
            + Add
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 5 — Review & submit
// ─────────────────────────────────────────────────────────────────────────────

function Step5({
  data,
  onEdit,
  agreed,
  setAgreed,
}: {
  data: FormData;
  onEdit: (step: number) => void;
  agreed: boolean;
  setAgreed: (v: boolean) => void;
}) {
  const total = data.lineItems.reduce((s, l) => s + (Number(l.amount) || 0), 0);

  return (
    <div>
      <div className="mb-4 text-sm font-medium text-neutral-900">Review & submit</div>

      <div className="flex flex-col gap-3 mb-4">
        {/* General */}
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500">General info</span>
            <button onClick={() => onEdit(1)} className="text-[11px] text-primary-600 hover:underline">Edit</button>
          </div>
          <div className="grid grid-cols-2 gap-y-1.5 text-xs">
            <div><span className="text-neutral-400">Name · </span><span className="font-medium text-neutral-900">{data.title || "—"}</span></div>
            <div><span className="text-neutral-400">Type · </span><span className="font-medium text-neutral-900">{data.reportType}</span></div>
            <div><span className="text-neutral-400">Period · </span><span className="font-medium text-neutral-900">{data.fiscalPeriod || "—"}</span></div>
            <div><span className="text-neutral-400">Priority · </span><span className="font-medium text-neutral-900">{data.priority}</span></div>
          </div>
        </div>

        {/* Financial */}
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500">Financial</span>
            <button onClick={() => onEdit(2)} className="text-[11px] text-primary-600 hover:underline">Edit</button>
          </div>
          <div className="grid grid-cols-2 gap-y-1.5 text-xs">
            <div>
              <span className="text-neutral-400">Total · </span>
              <span className="text-base font-semibold text-neutral-900">
                {data.currency} {(parseFloat(data.totalAmount) || 0).toLocaleString("en", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div><span className="text-neutral-400">Line items · </span><span className="font-medium text-neutral-900">{data.lineItems.length}</span></div>
            {data.lineItems.length > 0 && total !== parseFloat(data.totalAmount) && (
              <div className="col-span-2 text-warning-600">
                ⚠ Line items subtotal ({data.currency} {total.toLocaleString()}) differs from total amount
              </div>
            )}
          </div>
        </div>

        {/* Approval */}
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500">Approval route</span>
            <button onClick={() => onEdit(4)} className="text-[11px] text-primary-600 hover:underline">Edit</button>
          </div>
          <div className="flex items-center gap-2">
            {data.approvalRoute.map((r, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-[9px] font-bold text-primary-700">
                  {r.reviewerName.split(" ").map((w) => w[0]).join("")}
                </div>
                <span className="text-[11px] text-neutral-500">{r.reviewerName.split(" ")[0]}</span>
                {i < data.approvalRoute.length - 1 && <ChevronRight className="h-3 w-3 text-neutral-300" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Declaration */}
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 flex-shrink-0 accent-primary-600"
        />
        <span className="text-xs leading-relaxed text-neutral-600">
          I confirm that the information in this report is accurate and complete in accordance with company policy.
        </span>
      </label>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Modal
// ─────────────────────────────────────────────────────────────────────────────

interface NewReportModalProps {
  open: boolean;
  onClose: () => void;
}

export default function NewReportModal({ open, onClose }: NewReportModalProps) {
  const [step, setStep] = useState(1);
  const [agreed, setAgreed] = useState(false);
  const [createReport, { isLoading }] = useCreateFinanceReportMutation();

  const [form, setForm] = useState<FormData>({
    title: "",
    reportType: "FINANCIAL",
    fiscalPeriod: "",
    dueDate: "",
    description: "",
    priority: "NORMAL",
    totalAmount: "",
    currency: "EUR",
    lineItems: [],
    attachmentFiles: [],
    approvalRoute: DEMO_APPROVAL_ROUTE,
    notifyCc: [],
  });

  const patch = (p: Partial<FormData>) => setForm((f) => ({ ...f, ...p }));

  const handleClose = () => {
    setStep(1);
    setAgreed(false);
    setForm({
      title: "",
      reportType: "FINANCIAL",
      fiscalPeriod: "",
      dueDate: "",
      description: "",
      priority: "NORMAL",
      totalAmount: "",
      currency: "EUR",
      lineItems: [],
      attachmentFiles: [],
      approvalRoute: DEMO_APPROVAL_ROUTE,
      notifyCc: [],
    });
    onClose();
  };

  const canNext = () => {
    if (step === 1) return form.title.trim().length > 0;
    if (step === 5) return agreed;
    return true;
  };

  const handleSubmit = async (submitNow: boolean) => {
    try {
      await createReport({
        title: form.title,
        reportType: form.reportType,
        fiscalPeriod: form.fiscalPeriod || undefined,
        dueDate: form.dueDate || undefined,
        description: form.description || undefined,
        priority: form.priority,
        totalAmount: parseFloat(form.totalAmount) || undefined,
        currency: form.currency,
        lineItems: form.lineItems.length > 0 ? JSON.stringify(form.lineItems) : undefined,
        attachments: form.attachmentFiles.length > 0 ? JSON.stringify(form.attachmentFiles) : undefined,
        approvalRoute: JSON.stringify(form.approvalRoute),
        notifyCc: form.notifyCc.length > 0 ? JSON.stringify(form.notifyCc) : undefined,
        submitNow,
      }).unwrap();
      handleClose();
    } catch {
      // error handled by RTK Query
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-6">
      <div className="w-[680px] max-w-[calc(100vw-32px)] rounded-xl border border-neutral-200 bg-white shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 flex-shrink-0">
          <div>
            <div className="text-[15px] font-semibold text-neutral-900">New report</div>
            <div className="text-[11px] text-neutral-400 mt-0.5">Finance department</div>
          </div>
          <button
            onClick={handleClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-400 hover:bg-neutral-100 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Stepper */}
        <div className="border-b border-neutral-100 px-6 py-4 flex-shrink-0">
          <Stepper step={step} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 1 && <Step1 data={form} onChange={patch} />}
          {step === 2 && <Step2 data={form} onChange={patch} />}
          {step === 3 && <Step3 data={form} onChange={patch} />}
          {step === 4 && <Step4 data={form} onChange={patch} />}
          {step === 5 && <Step5 data={form} onEdit={setStep} agreed={agreed} setAgreed={setAgreed} />}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-neutral-100 bg-white px-5 py-3 flex-shrink-0">
          <div className="flex gap-2">
            {step > 1 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="h-8 rounded-lg border border-neutral-200 bg-neutral-50 px-4 text-xs font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
              >
                ← Back
              </button>
            )}
            <button
              onClick={() => handleSubmit(false)}
              disabled={isLoading}
              className="h-8 rounded-lg border border-neutral-200 bg-white px-4 text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              Save draft
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-neutral-400">Step {step} of {STEP_LABELS.length}</span>
            {step < STEP_LABELS.length ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canNext()}
                className="h-8 rounded-lg bg-primary-600 px-5 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-40 transition-colors"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={() => handleSubmit(true)}
                disabled={!canNext() || isLoading}
                className="h-8 rounded-lg bg-success-600 px-5 text-xs font-semibold text-white hover:bg-success-700 disabled:opacity-40 transition-colors"
              >
                {isLoading ? "Submitting…" : "Submit report"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
