import React from "react";
import styles from "./detail-shared.module.css";

function MIcon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <span
      className="material-symbols-outlined select-none leading-none shrink-0"
      style={{ fontSize: size, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
    >
      {name}
    </span>
  );
}

export interface InfoItem {
  label: string;
  value: string;
  badge?: string;
  boxed?: boolean;
}

interface DetailInfoProps {
  title: string;
  icon: string;
  items: InfoItem[];
  columns?: 2 | 4;
  children?: React.ReactNode;
}

export default function DetailInfo({
  title,
  icon,
  items,
  columns = 2,
  children,
}: DetailInfoProps) {
  const gridClass = columns === 4 ? styles.infoGrid4 : styles.infoGrid2;

  return (
    <div className={`${styles.card} ${styles.cardPadded}`}>
      <h2 className={styles.cardTitle}>
        <MIcon name={icon} size={20} />
        {title}
      </h2>

      <div className={`${styles.infoGrid} ${gridClass}`}>
        {items.map((item) => (
          <div key={item.label} className={styles.infoItem}>
            <span className={styles.infoLabel}>{item.label}</span>
            {item.boxed ? (
              <span className={styles.infoValueBoxed}>
                {item.value}
                {item.badge && <span className={styles.infoBadge}>{item.badge}</span>}
              </span>
            ) : (
              <span className={styles.infoValue}>
                {item.value}
                {item.badge && <span className={styles.infoBadge}>{item.badge}</span>}
              </span>
            )}
          </div>
        ))}
      </div>

      {children && <div className={styles.infoChildren}>{children}</div>}
    </div>
  );
}

// ── Daily Breakdown Table (used inside DetailInfo for PER_DIEM) ──
export interface BreakdownRow {
  date: string;
  location: string;
  desc: string;
  rate: string;
}

export function DailyBreakdownTable({ rows }: { rows: BreakdownRow[] }) {
  return (
    <table className={styles.table}>
      <thead className={styles.tableHead}>
        <tr>
          <th>Date</th>
          <th>Location</th>
          <th>Description</th>
          <th>Daily Rate</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className={styles.tableRow}>
            <td>{r.date}</td>
            <td>{r.location}</td>
            <td>{r.desc}</td>
            <td>{r.rate}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
