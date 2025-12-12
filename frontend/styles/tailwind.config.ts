import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    // Override breakpoints to match Token JSON
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    // Override Font Family to match Token JSON
    fontFamily: {
      sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
    },
    extend: {
      /**
       * 1. COLORS
       * Mapped to Token JSON values.
       * NOTE: Using direct HEX values here allows VS Code IntelliSense to show color previews.
       * If you want dynamic theming (CSS Variables), replace hex strings with 'var(--color-primary-500)' etc.
       */
      colors: {
        primary: {
          50: "#f0f0ff",
          100: "#e0e1ff",
          200: "#c7c8fe",
          300: "#a5a7fc",
          400: "#8b8df8",
          500: "#667eea", // DEFAULT
          600: "#5a67d8",
          700: "#4c51bf",
          800: "#434190",
          900: "#3c366b",
          DEFAULT: "#667eea",
        },
        secondary: {
          50: "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          300: "#d8b4fe",
          400: "#c084fc",
          500: "#764ba2", // DEFAULT
          600: "#6b21a8",
          700: "#581c87",
          800: "#4a1772",
          900: "#3b0764",
          DEFAULT: "#764ba2",
        },
        neutral: {
          50: "#fafafa",
          100: "#f4f4f5",
          200: "#e4e4e7",
          300: "#d4d4d8",
          400: "#a1a1aa",
          500: "#71717a",
          600: "#52525b",
          700: "#3f3f46",
          800: "#27272a",
          900: "#18181b",
        },
        // Semantic Colors
        success: {
          50: "#f0fdf4",
          500: "#22c55e",
          700: "#15803d",
          DEFAULT: "#22c55e",
        },
        warning: {
          50: "#fffbeb",
          500: "#f59e0b",
          700: "#b45309",
          DEFAULT: "#f59e0b",
        },
        error: {
          50: "#fef2f2",
          500: "#ef4444",
          700: "#b91c1c",
          DEFAULT: "#ef4444",
        },
        info: {
          50: "#eff6ff",
          500: "#3b82f6",
          700: "#1d4ed8",
          DEFAULT: "#3b82f6",
        },
        // Custom Surface Aliases (Useful for semantic layout)
        surface: {
          ground: "#fafafa", // neutral-50
          card: "#ffffff",
          border: "#e4e4e7", // neutral-200
        },
      },

      /**
       * 2. SPACING
       * Extended with Token JSON values + Custom layout values
       */
      spacing: {
        "fixed-top": "177px", // "Magic Number" for Onboarding Layout
        // Standard Token mappings (Tailwind defaults are already close, but these ensure precision)
        "18": "4.5rem",
        "112": "28rem",
        "128": "32rem",
        "144": "36rem",
      },

      /**
       * 3. BORDER RADIUS
       * Mapped from Token JSON
       */
      borderRadius: {
        none: "0",
        sm: "0.25rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.5rem",
        full: "9999px",
        // Semantic Aliases
        card: "1rem", // xl
        input: "0.5rem", // md
      },

      /**
       * 4. SHADOWS
       * Mapped from Token JSON
       */
      boxShadow: {
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
        primary: "0 8px 24px rgba(102, 126, 234, 0.35)",
        // Custom for Sticky Footer
        float: "0 -4px 20px rgba(0,0,0,0.05)",
      },

      /**
       * 5. Z-INDEX
       * Mapped from Token JSON
       */
      zIndex: {
        dropdown: "1000",
        sticky: "1020",
        fixed: "1030",
        modalBackdrop: "1040",
        modal: "1050",
        popover: "1060",
        tooltip: "1070",
        toast: "1080",
      },

      /**
       * 6. TRANSITIONS
       * Mapped from Token JSON
       */
      transitionDuration: {
        fast: "150ms",
        normal: "300ms",
        slow: "500ms",
      },
    },
  },
  plugins: [],
};

export default config;
