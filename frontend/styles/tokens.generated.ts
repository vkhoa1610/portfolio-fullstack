/**
 * Design Tokens - TypeScript Constants
 * AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
 * Edit tokens.json and run: npm run generate:tokens
 */

export const colors = {
  primary: {
    "50": "#f0f0ff",
    "100": "#e0e1ff",
    "200": "#c7c8fe",
    "300": "#a5a7fc",
    "400": "#8b8df8",
    "500": "#667eea",
    "600": "#5a67d8",
    "700": "#4c51bf",
    "800": "#434190",
    "900": "#3c366b",
  },
  secondary: {
    "50": "#faf5ff",
    "100": "#f3e8ff",
    "200": "#e9d5ff",
    "300": "#d8b4fe",
    "400": "#c084fc",
    "500": "#764ba2",
    "600": "#6b21a8",
    "700": "#581c87",
    "800": "#4a1772",
    "900": "#3b0764",
  },
  neutral: {
    "50": "#fafafa",
    "100": "#f4f4f5",
    "200": "#e4e4e7",
    "300": "#d4d4d8",
    "400": "#a1a1aa",
    "500": "#71717a",
    "600": "#52525b",
    "700": "#3f3f46",
    "800": "#27272a",
    "900": "#18181b",
  },
  success: {
    "50": "#f0fdf4",
    "500": "#22c55e",
    "700": "#15803d",
  },
  warning: {
    "50": "#fffbeb",
    "500": "#f59e0b",
    "700": "#b45309",
  },
  error: {
    "50": "#fef2f2",
    "500": "#ef4444",
    "700": "#b91c1c",
  },
  info: {
    "50": "#eff6ff",
    "500": "#3b82f6",
    "700": "#1d4ed8",
  },
} as const;

export const spacing = {
  "0": "0",
  "1": "0.25rem",
  "2": "0.5rem",
  "3": "0.75rem",
  "4": "1rem",
  "5": "1.25rem",
  "6": "1.5rem",
  "8": "2rem",
  "10": "2.5rem",
  "12": "3rem",
  "16": "4rem",
  "20": "5rem",
  "24": "6rem",
} as const;

export const fontSize = {
  xs: "0.75rem",
  sm: "0.875rem",
  base: "1rem",
  lg: "1.125rem",
  xl: "1.25rem",
  "2xl": "1.5rem",
  "3xl": "1.875rem",
  "4xl": "2.25rem",
  "5xl": "3rem",
} as const;

export const fontWeight = {
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

export const fontFamily = {
  sans: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
  mono: "JetBrains Mono, Fira Code, Consolas, monospace",
} as const;

export const lineHeight = {
  tight: "1.25",
  normal: "1.5",
  relaxed: "1.75",
} as const;

export const borderRadius = {
  none: "0",
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  "2xl": "1.5rem",
  full: "9999px",
} as const;

export const shadows = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
  primary: "0 8px 24px rgba(102, 126, 234, 0.35)",
} as const;

export const transitions = {
  fast: "150ms ease",
  normal: "300ms ease",
  slow: "500ms ease",
} as const;

export const zIndex = {
  dropdown: "1000",
  sticky: "1020",
  fixed: "1030",
  modalBackdrop: "1040",
  modal: "1050",
  popover: "1060",
  tooltip: "1070",
  toast: "1080",
} as const;

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

// Type exports for TypeScript usage
export type ColorScale = keyof typeof colors;
export type SpacingScale = keyof typeof spacing;
export type FontSizeScale = keyof typeof fontSize;
export type BreakpointScale = keyof typeof breakpoints;
