"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import styles from "./date-picker.module.css";

// ── Helpers ───────────────────────────────────────────────────────────────────
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseYMD(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return isNaN(dt.getTime()) ? null : dt;
}

function formatDisplay(s: string): string {
  const d = parseYMD(s);
  if (!d) return "";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

/** Returns day-of-week index Mon=0 … Sun=6 */
function firstDayOfMonth(year: number, month: number) {
  const dow = new Date(year, month, 1).getDay(); // 0=Sun
  return dow === 0 ? 6 : dow - 1;
}

// ── Icon helper ───────────────────────────────────────────────────────────────
function MIcon({ name, size = 18, fill = false }: { name: string; size?: number; fill?: boolean }) {
  return (
    <span
      className="material-symbols-outlined select-none leading-none shrink-0"
      style={{ fontSize: size, fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24` }}
    >
      {name}
    </span>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface DatePickerProps {
  id?: string;
  value: string;            // "YYYY-MM-DD" or ""
  onChange: (val: string) => void;
  placeholder?: string;
  minDate?: string;         // "YYYY-MM-DD"
  maxDate?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function DatePicker({ id, value, onChange, placeholder = "Select date", minDate, maxDate }: DatePickerProps) {
  const today = new Date();
  const parsed = parseYMD(value);

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear]   = useState(parsed?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth()    ?? today.getMonth());

  const wrapRef = useRef<HTMLDivElement>(null);

  // Sync view when value changes externally
  useEffect(() => {
    if (parsed) {
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Navigate months
  const prevMonth = useCallback(() => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }, [viewMonth]);

  const nextMonth = useCallback(() => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }, [viewMonth]);

  // Day click
  const selectDay = useCallback((day: number) => {
    const dt = new Date(viewYear, viewMonth, day);
    onChange(toYMD(dt));
    setOpen(false);
  }, [viewYear, viewMonth, onChange]);

  const clearValue = useCallback(() => { onChange(""); setOpen(false); }, [onChange]);

  const goToday = useCallback(() => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  }, [today]);

  // Build calendar grid
  const totalDays   = daysInMonth(viewYear, viewMonth);
  const startOffset = firstDayOfMonth(viewYear, viewMonth);
  const todayYMD    = toYMD(today);

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  function cellClasses(day: number | null) {
    if (day === null) return `${styles.calDay} ${styles.calDayEmpty}`;
    const ymd = toYMD(new Date(viewYear, viewMonth, day));
    const isSelected = ymd === value;
    const isToday    = ymd === todayYMD;
    const isDisabled =
      (minDate ? ymd < minDate : false) ||
      (maxDate ? ymd > maxDate : false);
    return [
      styles.calDay,
      isSelected  ? styles.calDaySelected  : "",
      isToday     ? styles.calDayToday     : "",
      isDisabled  ? styles.calDayDisabled  : "",
    ].filter(Boolean).join(" ");
  }

  return (
    <div className={styles.wrapper} ref={wrapRef}>
      {/* Trigger */}
      <button
        id={id}
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={styles.triggerIcon}>
          <MIcon name="calendar_today" size={18} />
        </span>
        {value
          ? <span className={styles.triggerValue}>{formatDisplay(value)}</span>
          : <span className={styles.triggerPlaceholder}>{placeholder}</span>
        }
      </button>

      {/* Popover */}
      {open && (
        <div className={styles.popover} role="dialog" aria-label="Date picker">
          {/* Navigation */}
          <div className={styles.calNav}>
            <button className={styles.calNavBtn} onClick={prevMonth} aria-label="Previous month">
              <MIcon name="chevron_left" size={20} />
            </button>
            <span className={styles.calMonthYear}>
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button className={styles.calNavBtn} onClick={nextMonth} aria-label="Next month">
              <MIcon name="chevron_right" size={20} />
            </button>
          </div>

          {/* Grid */}
          <div className={styles.calGrid}>
            {WEEKDAYS.map((wd) => (
              <div key={wd} className={styles.calWeekday}>{wd}</div>
            ))}
            {cells.map((day, idx) => (
              <button
                key={idx}
                type="button"
                className={cellClasses(day)}
                onClick={() => day !== null && !( (minDate && toYMD(new Date(viewYear, viewMonth, day)) < minDate) || (maxDate && toYMD(new Date(viewYear, viewMonth, day)) > maxDate) ) && selectDay(day)}
                tabIndex={day === null ? -1 : 0}
                aria-label={day ? `${day} ${MONTHS[viewMonth]} ${viewYear}` : undefined}
              >
                {day ?? ""}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className={styles.calFooter}>
            <button className={styles.calClearBtn} onClick={clearValue} type="button">Clear</button>
            <button className={styles.calTodayBtn} onClick={goToday} type="button">Today</button>
          </div>
        </div>
      )}
    </div>
  );
}
