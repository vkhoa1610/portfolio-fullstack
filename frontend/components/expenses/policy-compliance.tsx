"use client";

import styles from "./policy-cards.module.css";

// ── Shared icon helper ────────────────────────────────────────────────────────
function MIcon({ name, size = 18, fill = false }: { name: string; size?: number; fill?: boolean }) {
  return (
    <span
      className="material-symbols-outlined select-none leading-none shrink-0"
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
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

interface ChecklistProps {
  mode: "checklist";
  items: CheckItem[];
  readyToSubmit: boolean;
}

interface ProgressProps {
  mode: "progress";
  text: string;
  /** value 0–100; omit or null to hide the bar */
  progress?: { value: number; label: string; over?: boolean } | null;
}

type PolicyComplianceProps = ChecklistProps | ProgressProps;

// ── Component ─────────────────────────────────────────────────────────────────
export default function PolicyCompliance(props: PolicyComplianceProps) {
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
                  <span
                    className="material-symbols-outlined select-none"
                    style={{ fontSize: 14, fontVariationSettings: "'FILL' 0, 'wght' 700, 'GRAD' 0, 'opsz' 20" }}
                  >
                    check
                  </span>
                ) : (
                  <span
                    className="material-symbols-outlined select-none"
                    style={{ fontSize: 14, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
                  >
                    schedule
                  </span>
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

  // progress mode
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
