import styles from "./detail-shared.module.css";

function MIcon({ name, size = 20, fill = false }: { name: string; size?: number; fill?: boolean }) {
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

export interface InsightItem {
  icon: string;
  iconColor: string;
  title: string;
  desc: string;
}

type DetailInsightProps =
  | {
      variant: "simple";
      text: string;
      linkLabel?: string;
      onLinkClick?: () => void;
    }
  | {
      variant: "items";
      items: InsightItem[];
    }
  | {
      variant: "efficiency";
      text: string;
      badge: string;
    };

export default function DetailInsight(props: DetailInsightProps) {
  return (
    <div className={styles.insightCard}>
      <div className={styles.insightGlow} />
      <div className={styles.insightHeader}>
        <span className={styles.insightHeaderIcon}>
          <MIcon name="auto_awesome" size={18} fill />
        </span>
        <span className={styles.insightHeaderLabel}>Editorial Insight</span>
      </div>

      {props.variant === "simple" && (
        <>
          <p className={styles.insightText}>{props.text}</p>
          {props.linkLabel && (
            <button className={styles.insightLink} onClick={props.onLinkClick}>
              {props.linkLabel}
              <MIcon name="arrow_forward" size={16} />
            </button>
          )}
        </>
      )}

      {props.variant === "items" && (
        <div className={styles.insightItems}>
          {props.items.map((item) => (
            <div key={item.title} className={styles.insightItem}>
              <span style={{ color: item.iconColor, flexShrink: 0 }}>
                <MIcon name={item.icon} size={20} fill />
              </span>
              <div className={styles.insightItemBody}>
                <p className={styles.insightItemTitle}>{item.title}</p>
                <p className={styles.insightItemDesc}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {props.variant === "efficiency" && (
        <>
          <p className={styles.insightText}>{props.text}</p>
          <span className={styles.insightBadge}>
            <MIcon name="verified" size={14} fill />
            {props.badge}
          </span>
        </>
      )}
    </div>
  );
}
