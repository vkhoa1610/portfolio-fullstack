import styles from "./reimbursement-card.module.css";

interface ReimbursementCardProps {
  title?: string;
  rows: { label: string; value: string }[];
  totalLabel: string;
  totalValue: string;
}

export default function ReimbursementCard({
  title = "Estimated Reimbursement",
  rows,
  totalLabel,
  totalValue,
}: ReimbursementCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.glow} />
      <div className={styles.inner}>
        <p className={styles.title}>{title}</p>
        <div className={styles.rows}>
          {rows.map((r) => (
            <div key={r.label} className={styles.row}>
              <span>{r.label}</span>
              <span>{r.value}</span>
            </div>
          ))}
        </div>
        <div className={styles.divider} />
        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>{totalLabel}</span>
          <span className={styles.totalValue}>{totalValue}</span>
        </div>
      </div>
    </div>
  );
}
