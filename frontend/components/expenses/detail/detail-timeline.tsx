import styles from "./detail-shared.module.css";

function MIcon({ name, size = 12 }: { name: string; size?: number }) {
  return (
    <span
      className="material-symbols-outlined select-none leading-none"
      style={{ fontSize: size, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
    >
      {name}
    </span>
  );
}

export interface TimelineStep {
  icon: string;
  label: string;
  sublabel: string;
  desc?: string;
  state: "done" | "active" | "future" | "rejected";
}

interface DetailTimelineProps {
  steps: TimelineStep[];
}

const DOT_CLASS: Record<TimelineStep["state"], string> = {
  done:     styles.timelineDotDone,
  active:   styles.timelineDotActive,
  future:   styles.timelineDotFuture,
  rejected: styles.timelineDotRejected,
};

const LABEL_CLASS: Record<TimelineStep["state"], string> = {
  done:     styles.timelineLabel,
  active:   styles.timelineLabelActive,
  future:   styles.timelineLabelFuture,
  rejected: styles.timelineLabelRejected,
};

export default function DetailTimeline({ steps }: DetailTimelineProps) {
  return (
    <div className={styles.timeline}>
      <h3 className={styles.timelineTitle}>
        <span className={styles.timelineTitleIcon}>
          <span
            className="material-symbols-outlined select-none leading-none"
            style={{ fontSize: 20, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
          >
            history
          </span>
        </span>
        Activity Timeline
      </h3>
      <div className={styles.timelineList}>
        {steps.map((step, i) => (
          <div key={i} className={styles.timelineItem}>
            <div className={`${styles.timelineDot} ${DOT_CLASS[step.state]}`}>
              <MIcon name={step.icon} size={12} />
            </div>
            <p className={LABEL_CLASS[step.state]}>{step.label}</p>
            <p className={styles.timelineSublabel}>{step.sublabel}</p>
            {step.desc && <p className={styles.timelineDesc}>{step.desc}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
