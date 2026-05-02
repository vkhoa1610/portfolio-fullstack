"use client";

import { useGetReceiptViewUrlQuery } from "@/ducks/expenses";
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

// ── RECEIPT ──────────────────────────────────────────────
function ReceiptVisual({ fileUrl }: { fileUrl: string }) {
  const { data, isLoading } = useGetReceiptViewUrlQuery(fileUrl);
  return (
    <div className={styles.visualWrap}>
      {isLoading ? (
        <div className={styles.visualLoading}>Loading receipt…</div>
      ) : data?.viewUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.viewUrl} alt="Receipt scan" className={styles.visualImg} />
          <div className={styles.visualActions}>
            <button className={styles.visualActionBtn} title="Zoom in">
              <MIcon name="zoom_in" size={18} />
            </button>
            <button className={styles.visualActionBtn} title="Download">
              <MIcon name="download" size={18} />
            </button>
          </div>
        </>
      ) : (
        <div className={styles.visualEmpty}>
          <span className={`material-symbols-outlined ${styles.visualEmptyIcon}`}>receipt_long</span>
          <span style={{ fontSize: "0.875rem" }}>No receipt image</span>
        </div>
      )}
    </div>
  );
}

// ── PER DIEM ─────────────────────────────────────────────
const COUNTRY_INFO: Record<string, { name: string; timezone: string }> = {
  DE: { name: "Germany — Berlin",           timezone: "CET (GMT +1)" },
  AT: { name: "Austria — Vienna",           timezone: "CET (GMT +1)" },
  CH: { name: "Switzerland — Zurich",       timezone: "CET (GMT +1)" },
  GB: { name: "United Kingdom — London",    timezone: "GMT +0 (London)" },
  US: { name: "United States",              timezone: "EST / PST" },
  OTHER: { name: "International",           timezone: "Varies by region" },
};

function PerDiemVisual({ countryCode }: { countryCode: string }) {
  const info = COUNTRY_INFO[countryCode] ?? { name: countryCode, timezone: "—" };
  return (
    <div className={styles.visualWrap}>
      <div className={styles.perDiemVisual}>
        <div className={styles.perDiemGlow} />
        <div className={styles.perDiemGlow2} />
        <p className={styles.perDiemTag}>
          <MIcon name="location_on" size={14} />
          Local timezone
        </p>
        <p className={styles.perDiemCountry}>{info.name}</p>
        <p className={styles.perDiemTz}>{info.timezone}</p>
      </div>
    </div>
  );
}

// ── MILEAGE ──────────────────────────────────────────────
function MileageVisual({
  title,
  distanceKm,
  tripDate,
}: {
  title?: string;
  distanceKm?: number;
  tripDate?: string;
}) {
  // Parse "from → to" when available; otherwise keep title as route label
  const parts = title?.split(/→|->/) ?? [];
  const hasExplicitRoute = parts.length > 1;
  const from = parts[0]?.replace(/^Mileage\s*/i, "").trim() || "Origin";
  const to = hasExplicitRoute ? (parts[1]?.trim() || "Destination") : "Destination";
  const routeLabel = title?.trim() || "Business Mileage Trip";

  const dateLabel = tripDate
    ? new Date(tripDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : undefined;

  return (
    <div className={styles.visualWrap}>
      <div className={styles.routeVisual}>
        <div className={styles.routeGlow} />
        <div className={styles.routeGlow2} />

        <div className={styles.routeTopRow}>
          <p className={styles.routeTag}>
            <MIcon name="distance" size={14} />
            Mileage Journey
          </p>
          <div className={styles.routeMetaRow}>
            {distanceKm != null && distanceKm > 0 && (
              <span className={styles.routePillPrimary}>{distanceKm.toFixed(1)} km</span>
            )}
            {dateLabel && (
              <span className={styles.routePillSoft}>
                <MIcon name="calendar_today" size={14} />
                {dateLabel}
              </span>
            )}
          </div>
        </div>

        <p className={styles.routeTitle}>{routeLabel}</p>

        <div className={styles.routeInner}>
          <div className={styles.routeRow}>
            <div className={styles.routeDot} />
            <span className={styles.routeCity}>{from}</span>
          </div>

          <div className={styles.routeConnector}>
            <div className={styles.routeLine} />
            <span className={styles.routeConnectorLabel}>Planned route</span>
          </div>

          <div className={styles.routeRow}>
            <div className={`${styles.routeDot} ${styles.routeDotDest}`} />
            <span className={styles.routeCity}>{to}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PUBLIC API ────────────────────────────────────────────
export interface DetailVisualProps {
  type: "RECEIPT" | "PER_DIEM" | "MILEAGE";
  receiptFileUrl?: string;
  countryCode?: string;
  title?: string;
  distanceKm?: number;
  tripDate?: string;
}

export default function DetailVisual({
  type,
  receiptFileUrl,
  countryCode,
  title,
  distanceKm,
  tripDate,
}: DetailVisualProps) {
  const wrap = (children: React.ReactNode) => (
    <div className={styles.card}>{children}</div>
  );

  if (type === "RECEIPT") {
    return wrap(
      receiptFileUrl ? (
        <ReceiptVisual fileUrl={receiptFileUrl} />
      ) : (
        <div className={styles.visualWrap}>
          <div className={styles.visualEmpty}>
            <span className={`material-symbols-outlined ${styles.visualEmptyIcon}`}>receipt_long</span>
            <span style={{ fontSize: "0.875rem" }}>No receipt image</span>
          </div>
        </div>
      )
    );
  }

  if (type === "PER_DIEM") {
    return wrap(<PerDiemVisual countryCode={countryCode ?? "OTHER"} />);
  }

  return wrap(
    <MileageVisual title={title} distanceKm={distanceKm} tripDate={tripDate} />
  );
}
