"use client";

import styles from "./policy-cards.module.css";
import type { RuleSeverity } from "@/ducks/cms/types";

// ── Shared icon helper ────────────────────────────────────────────────────────
function MIcon({ name, size = 18, fill = false }: { name: string; size?: number; fill?: boolean }) {
  return (
    <span
      className="material-symbols-outlined select-none leading-none shrink-0"
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 20`,
      }}
    >
      {name}
    </span>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface CheckItem {
  ok: boolean;
  pending?: boolean;
  title: string;
  desc: string;
}

export type SeverityState = "pending" | "ok" | "triggered";

export interface SeverityCheckItem {
  id: string;
  icon: string;
  title: string;
  desc: string;
  severity: RuleSeverity;
  state: SeverityState;
  blocksSave?: boolean;
}

interface ChecklistProps {
  mode: "checklist";
  items: CheckItem[];
  readyToSubmit: boolean;
}

interface ProgressProps {
  mode: "progress";
  text: string;
  progress?: { value: number; label: string; over?: boolean } | null;
}

interface SeverityProps {
  mode: "severity";
  items: SeverityCheckItem[];
}

type PolicyComplianceProps = ChecklistProps | ProgressProps | SeverityProps;

// ── Severity helpers ──────────────────────────────────────────────────────────
const SEVERITY_DOT: Record<RuleSeverity, string> = {
  error:   styles.checkDotError,
  warning: styles.checkDotWarning,
  info:    styles.checkDotInfo,
  success: styles.checkDotSuccess,
};

function severityIcon(severity: RuleSeverity): string {
  switch (severity) {
    case "error":   return "close";
    case "warning": return "warning";
    case "info":    return "info";
    case "success": return "check_circle";
  }
}

function tooltipText(state: SeverityState, severity: RuleSeverity): string {
  if (state === "pending")  return "Pending: waiting for input";
  if (state === "ok")       return "Passed: rule check passed";
  switch (severity) {
    case "error":   return "Error: blocks submission";
    case "warning": return "Warning: advisory";
    case "info":    return "Info: informational";
    case "success": return "Success: confirmed";
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function PolicyCompliance(props: PolicyComplianceProps) {
  // ── Severity mode (4-state CMS-driven) ────────────────────────────────────
  if (props.mode === "severity") {
    const { items } = props;
    const blockedByError = items.some(
      (it) => it.blocksSave && it.state === "triggered" && it.severity === "error"
    );
    const allFilled = items.every((it) => it.state !== "pending");

    return (
      <div className={styles.card}>
        <p className={styles.cardTitle}>Policy Compliance</p>
        <div className={styles.checkList}>
          {items.map((item) => {
            const isPending   = item.state === "pending";
            const isTriggered = item.state === "triggered";

            let dotClass = styles.checkDotPending;
            let iconName = "schedule";
            let iconFill = false;

            if (isPending) {
              dotClass = styles.checkDotPending;
              iconName = "schedule";
            } else if (item.state === "ok") {
              dotClass = styles.checkDotOk;
              iconName = "check";
              iconFill = false;
            } else if (isTriggered) {
              dotClass = SEVERITY_DOT[item.severity];
              iconName = severityIcon(item.severity);
              iconFill = item.severity === "success";
            }

            return (
              <div
                key={item.id}
                className={`${styles.checkRow} ${isPending ? styles.checkRowDim : ""}`}
              >
                <div
                  className={styles.checkDotWrapper}
                  data-tooltip={tooltipText(item.state, item.severity)}
                >
                  <div className={`${styles.checkDot} ${dotClass}`}>
                    <MIcon name={iconName} size={14} fill={iconFill} />
                  </div>
                </div>
                <div>
                  <p className={styles.checkTitle}>{item.title}</p>
                  <p className={styles.checkDesc}>{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div
          className={`${styles.badge} ${
            blockedByError
              ? styles.badgeBlocked
              : allFilled
              ? styles.badgeReady
              : styles.badgePending
          }`}
        >
          <MIcon
            name={blockedByError ? "block" : allFilled ? "verified" : "pending"}
            size={18}
            fill={allFilled && !blockedByError}
          />
          <span>
            {blockedByError
              ? "Blocked — resolve errors to proceed"
              : allFilled
              ? "Ready for Submission"
              : "Complete the form to proceed"}
          </span>
        </div>
      </div>
    );
  }

  // ── Checklist mode ─────────────────────────────────────────────────────────
  if (props.mode === "checklist") {
    const { items, readyToSubmit } = props;
    return (
      <div className={styles.card}>
        <p className={styles.cardTitle}>Policy Compliance</p>
        <div className={styles.checkList}>
          {items.map((item, i) => (
            <div
              key={i}
              className={`${styles.checkRow} ${item.pending && !item.ok ? styles.checkRowDim : ""}`}
            >
              <div className={`${styles.checkDot} ${item.ok ? styles.checkDotOk : styles.checkDotPending}`}>
                {item.ok ? (
                  <MIcon name="check" size={14} />
                ) : (
                  <MIcon name="schedule" size={14} />
                )}
              </div>
              <div>
                <p className={styles.checkTitle}>{item.title}</p>
                <p className={styles.checkDesc}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className={`${styles.badge} ${readyToSubmit ? styles.badgeReady : styles.badgePending}`}>
          <MIcon name={readyToSubmit ? "verified" : "pending"} size={18} fill={readyToSubmit} />
          <span>{readyToSubmit ? "Ready for Submission" : "Complete the form to proceed"}</span>
        </div>
      </div>
    );
  }

  // ── Progress mode ──────────────────────────────────────────────────────────
  const { text, progress } = props;
  return (
    <div className={styles.cardProgress}>
      <div className={styles.progressHeader}>
        <MIcon name="verified" size={16} fill />
        <span className={styles.progressLabel}>Policy Compliance</span>
      </div>
      <p className={styles.progressText}>{text}</p>
      {progress && (
        <div className={styles.progressWrap}>
          <div className={styles.progressTrack}>
            <div
              className={`${styles.progressBar} ${progress.over ? styles.progressBarOver : styles.progressBarOk}`}
              style={{ width: `${Math.min(progress.value, 100)}%` }}
            />
          </div>
          <span className={`${styles.progressPct} ${progress.over ? styles.progressPctOver : styles.progressPctOk}`}>
            {progress.label}
          </span>
        </div>
      )}
    </div>
  );
}
