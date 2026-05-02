"use client";

import React from "react";
import styles from "./policy-cards.module.css";

interface PolicyInsightProps {
  children: React.ReactNode;
  linkLabel: string;
  onLinkClick?: () => void;
  aiText?: string;
  aiLoading?: boolean;
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

export default function PolicyInsight({ children, linkLabel, onLinkClick, aiText, aiLoading }: PolicyInsightProps) {
  const showAi = aiLoading || !!aiText;

  return (
    <div className={styles.insightCard}>
      <div className={styles.insightGlow} />
      <div className={styles.insightHeader}>
        <MIcon name="auto_awesome" size={18} fill />
        <span className={styles.insightHeaderLabel}>Policy Insight</span>
      </div>

      {/* Static CMS text */}
      <p className={styles.insightText}>{children}</p>

      {linkLabel && (
        <button className={styles.insightLink} onClick={onLinkClick}>
          {linkLabel}
          <MIcon name="arrow_forward" size={16} />
        </button>
      )}

      {/* AI-generated section */}
      {showAi && (
        <div className={styles.aiSection}>
          <div className={styles.aiLabel}>
            <MIcon name="auto_awesome" size={13} fill />
            <span>AI-assisted</span>
          </div>
          {aiLoading ? (
            <div className={styles.aiSkeleton}>
              <div className={styles.aiSkeletonLine} />
              <div className={`${styles.aiSkeletonLine} ${styles.aiSkeletonLineShort}`} />
            </div>
          ) : (
            <p className={styles.aiText}>{aiText}</p>
          )}
        </div>
      )}
    </div>
  );
}

export function Highlight({ children }: { children: React.ReactNode }) {
  return <strong className={styles.insightHighlight}>{children}</strong>;
}
