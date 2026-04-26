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

export interface DocFile {
  name: string;
  meta: string;
  icon: string;
  color?: "primary" | "tertiary";
}

interface DetailDocumentProps {
  files: DocFile[];
}

export default function DetailDocument({ files }: DetailDocumentProps) {
  if (!files.length) return null;

  return (
    <div className={`${styles.card} ${styles.cardPadded}`}>
      <h2 className={styles.cardTitle}>
        <MIcon name="attachment" size={20} />
        Documentation
      </h2>
      <div className={styles.docGrid}>
        {files.map((f) => (
          <div key={f.name} className={styles.docItem}>
            <div
              className={`${styles.docIcon} ${
                f.color === "tertiary" ? styles.docIconTertiary : styles.docIconPrimary
              }`}
            >
              <MIcon name={f.icon} size={22} />
            </div>
            <div className={styles.docMeta}>
              <p className={styles.docName}>{f.name}</p>
              <p className={styles.docSize}>{f.meta}</p>
            </div>
            <span className={styles.docDownload}>
              <MIcon name="download" size={20} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
