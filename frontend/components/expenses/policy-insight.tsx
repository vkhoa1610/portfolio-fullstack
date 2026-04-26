"use client";

import React from "react";
import styles from "./policy-cards.module.css";

interface PolicyInsightProps {
  children: React.ReactNode;
  linkLabel: string;
  onLinkClick?: () => void;
}

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

export default function PolicyInsight({ children, linkLabel, onLinkClick }: PolicyInsightProps) {
  return (
    <div className={styles.insightCard}>
      <div className={styles.insightGlow} />
      <div className={styles.insightHeader}>
        <MIcon name="auto_awesome" size={18} fill />
        <span className={styles.insightHeaderLabel}>Policy Insight</span>
      </div>
      <p className={styles.insightText}>{children}</p>
      <button className={styles.insightLink} onClick={onLinkClick}>
        {linkLabel}
        <MIcon name="arrow_forward" size={16} />
      </button>
    </div>
  );
}

// Re-export highlight helper for use in parent components
export function Highlight({ children }: { children: React.ReactNode }) {
  return <strong className={styles.insightHighlight}>{children}</strong>;
}
