"use client";

import React, { ReactNode } from "react";
import type { TFunction } from "i18next";
import type { CmsNode } from "./schema";
import { NodeErrorBoundary } from "./NodeErrorBoundary";
import type { Expense } from "@/ducks/expenses/types";

// ============================================================================
// RENDER CONTEXT
// ============================================================================

export interface RenderContext {
  /** Check if current user has a granted UI function */
  hasFunctionId: (id: number) => boolean;

  /** Expense data bound to display.field nodes */
  expense?: Expense;

  /**
   * Map of action string → handler.
   * e.g. { EXPENSE_ACCEPT: handleApprove, EXPENSE_REJECT: () => setActiveFormId('reject-form') }
   */
  actionHandlers: Record<string, () => void>;

  /**
   * Controlled values for input.textarea nodes (keyed by node.id).
   * e.g. { 'txt-reason': 'Duplicate receipt' }
   */
  formValues: Record<string, string>;
  onFormChange: (nodeId: string, value: string) => void;

  /**
   * ID of the currently visible form node (e.g. 'reject-form').
   * layout.form nodes are only rendered when activeFormId === node.id.
   * layout.action-bar nodes are hidden while a form is active.
   */
  activeFormId: string | null;

  /** i18next t() for resolving label_key values */
  t: TFunction;
}

// ============================================================================
// DATA KEY → EXPENSE FIELD MAPPING
// ============================================================================

/** Maps CMS data_key (snake_case) → Expense field (camelCase) + optional formatter */
const DATA_KEY_MAP: Record<string, (e: Expense) => string> = {
  amount:       (e) => e.amount != null ? `${e.amount.toFixed(2)} €` : "—",
  type:         (e) => e.type ?? "—",
  submitted_at: (e) => e.submittedAt?.slice(0, 10) ?? "—",
  vendor_name:  (e) => e.vendorName ?? "—",
  receipt_date: (e) => e.receiptDate ?? "—",
  vat_amount:   (e) => e.vatAmount != null ? `${e.vatAmount.toFixed(2)} €` : "—",
  trip_from:    (e) => e.tripFrom ?? "—",
  trip_to:      (e) => e.tripTo ?? "—",
  country_code: (e) => e.countryCode ?? "—",
  distance_km:  (e) => e.distanceKm != null ? `${e.distanceKm} km` : "—",
  per_diem_days:(e) => e.perDiemDays != null ? String(e.perDiemDays) : "—",
};

function resolveDataKey(dataKey: string, expense?: Expense): string {
  if (!expense) return "—";
  const getter = DATA_KEY_MAP[dataKey];
  return getter ? getter(expense) : "—";
}

// ============================================================================
// BUTTON VARIANT STYLES
// ============================================================================

const VARIANT_CLASS: Record<string, string> = {
  primary:   "bg-success-600 text-white hover:bg-success-700 disabled:opacity-60",
  danger:    "bg-error-600 text-white hover:bg-error-700 disabled:opacity-60",
  secondary: "border border-neutral-300 text-neutral-700 hover:bg-neutral-50",
};

// ============================================================================
// INDIVIDUAL NODE RENDERERS
// ============================================================================

function renderParts(node: CmsNode, ctx: RenderContext): ReactNode[] {
  return (node.parts ?? []).map((child) => (
    <CmsNode key={child.id} node={child} ctx={ctx} />
  ));
}

function LayoutPage({ node, ctx }: { node: CmsNode; ctx: RenderContext }) {
  return <>{renderParts(node, ctx)}</>;
}

function LayoutCard({ node, ctx }: { node: CmsNode; ctx: RenderContext }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-3">
      {renderParts(node, ctx)}
    </div>
  );
}

function LayoutActionBar({ node, ctx }: { node: CmsNode; ctx: RenderContext }) {
  // Hide the action bar while a form is active
  if (ctx.activeFormId !== null) return null;

  const parts = renderParts(node, ctx);
  const visible = parts.filter(Boolean);

  if (node.auto_hide_if_empty && visible.length === 0) return null;

  return <div className="flex gap-3">{visible}</div>;
}

function LayoutForm({ node, ctx }: { node: CmsNode; ctx: RenderContext }) {
  // Only shown when this form is explicitly activated
  if (ctx.activeFormId !== node.id) return null;

  return (
    <div className="rounded-xl border border-error-200 bg-error-50 p-4 space-y-3">
      {renderParts(node, ctx)}
    </div>
  );
}

function DisplayField({ node, ctx }: { node: CmsNode; ctx: RenderContext }) {
  if (!node.data_key) return null;
  const value = resolveDataKey(node.data_key, ctx.expense);
  // Use i18n key for field label: expense.detail.field_<data_key>
  const label = ctx.t(`expense.detail.field_${node.data_key}`, node.data_key);

  return (
    <div className="flex justify-between border-b border-neutral-100 pb-2 last:border-0 last:pb-0">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="text-sm font-medium text-neutral-900">{value}</span>
    </div>
  );
}

function InputButton({ node, ctx }: { node: CmsNode; ctx: RenderContext }) {
  const label = node.label_key ? ctx.t(node.label_key) : (node.action ?? "");
  const handler = node.action ? ctx.actionHandlers[node.action] : undefined;
  const variantClass = VARIANT_CLASS[node.variant ?? "primary"] ?? VARIANT_CLASS.primary;

  return (
    <button
      type="button"
      onClick={handler}
      className={`flex-1 rounded-lg py-3 text-sm font-semibold transition-colors ${variantClass}`}
    >
      {label}
    </button>
  );
}

function InputTextarea({ node, ctx }: { node: CmsNode; ctx: RenderContext }) {
  const label = node.label_key ? ctx.t(node.label_key) : "";
  const value = ctx.formValues[node.id] ?? "";

  return (
    <div className="space-y-1">
      {label && (
        <p className="font-semibold text-error-700">{label}</p>
      )}
      <textarea
        value={value}
        onChange={(e) => ctx.onFormChange(node.id, e.target.value)}
        rows={3}
        required={node.required}
        className="w-full rounded-lg border border-error-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-error-400"
        placeholder={ctx.t("manager.approvals.reject_placeholder", "")}
      />
    </div>
  );
}

// ============================================================================
// MAIN NODE COMPONENT (dispatches by type, wrapped in error boundary)
// ============================================================================

function NodeInner({ node, ctx }: { node: CmsNode; ctx: RenderContext }) {
  // If this node requires a function and the user doesn't have it → skip
  if (node.function_id !== undefined && !ctx.hasFunctionId(node.function_id)) {
    return null;
  }

  switch (node.type) {
    case "layout.page":       return <LayoutPage node={node} ctx={ctx} />;
    case "layout.card":       return <LayoutCard node={node} ctx={ctx} />;
    case "layout.action-bar": return <LayoutActionBar node={node} ctx={ctx} />;
    case "layout.form":       return <LayoutForm node={node} ctx={ctx} />;
    case "display.field":     return <DisplayField node={node} ctx={ctx} />;
    case "input.button":      return <InputButton node={node} ctx={ctx} />;
    case "input.textarea":    return <InputTextarea node={node} ctx={ctx} />;
    default:
      return null; // unknown type → silently skip
  }
}

export function CmsNode({ node, ctx }: { node: CmsNode; ctx: RenderContext }) {
  return (
    <NodeErrorBoundary nodeId={node.id}>
      <NodeInner node={node} ctx={ctx} />
    </NodeErrorBoundary>
  );
}
