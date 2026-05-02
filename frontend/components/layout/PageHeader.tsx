"use client";

import React from "react";
import { useRouter } from "next/navigation";
import styles from "./PageHeader.module.css";

function MIcon({ name, size = 16 }: { name: string; size?: number }) {
  return (
    <span
      className="material-symbols-outlined select-none leading-none shrink-0"
      style={{ fontSize: size, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
    >
      {name}
    </span>
  );
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badges?: { icon?: string; label: string }[];
  actions?: React.ReactNode;
  totalLabel?: string;
  totalValue?: string;
  /** href to navigate back; if omitted, uses router.back() */
  backHref?: string;
  /** label for back button; if omitted, back button is hidden */
  backLabel?: string;
}

export default function PageHeader({
  title,
  subtitle,
  badges,
  actions,
  totalLabel,
  totalValue,
  backHref,
  backLabel,
}: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) router.push(backHref);
    else router.back();
  };

  return (
    <div className={styles.header}>
      <div className={styles.glow} />
      <div className={styles.inner}>
        {/* Left */}
        <div className={styles.left}>
          <button
            className={`${styles.backBtn} ${!backLabel ? styles.backBtnHidden : ""}`}
            onClick={handleBack}
            disabled={!backLabel}
            aria-hidden={!backLabel}
            tabIndex={backLabel ? 0 : -1}
          >
            <MIcon name="arrow_back" size={16} />
            {backLabel || "Back"}
          </button>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          {badges && badges.length > 0 && (
            <div className={styles.badges}>
              {badges.map((b) => (
                <span key={b.label} className={styles.badge}>
                  {b.icon && <MIcon name={b.icon} size={12} />}
                  {b.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right */}
        {(actions || totalValue) && (
          <div className={styles.right}>
            {actions && <div className={styles.actions}>{actions}</div>}
            {totalValue && (
              <>
                {totalLabel && <p className={styles.totalLabel}>{totalLabel}</p>}
                <p className={styles.totalValue}>{totalValue}</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Re-export button presets so views can apply consistent styles
export { styles as pageHeaderStyles };
