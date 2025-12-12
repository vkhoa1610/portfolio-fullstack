import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./common/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    fontFamily: {
      sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
    },
    extend: {
      /**
       * COLORS - Using CSS Variables for dynamic theming
       */
      colors: {
        primary: {
          50: "var(--color-primary-50)",
          100: "var(--color-primary-100)",
          200: "var(--color-primary-200)",
          300: "var(--color-primary-300)",
          400: "var(--color-primary-400)",
          500: "var(--color-primary-500)",
          600: "var(--color-primary-600)",
          700: "var(--color-primary-700)",
          800: "var(--color-primary-800)",
          900: "var(--color-primary-900)",
          DEFAULT: "var(--color-primary-600)",
        },
        secondary: {
          50: "var(--color-secondary-50)",
          100: "var(--color-secondary-100)",
          200: "var(--color-secondary-200)",
          300: "var(--color-secondary-300)",
          400: "var(--color-secondary-400)",
          500: "var(--color-secondary-500)",
          600: "var(--color-secondary-600)",
          700: "var(--color-secondary-700)",
          800: "var(--color-secondary-800)",
          900: "var(--color-secondary-900)",
          DEFAULT: "var(--color-secondary-500)",
        },
        neutral: {
          50: "var(--color-neutral-50)",
          100: "var(--color-neutral-100)",
          200: "var(--color-neutral-200)",
          300: "var(--color-neutral-300)",
          400: "var(--color-neutral-400)",
          500: "var(--color-neutral-500)",
          600: "var(--color-neutral-600)",
          700: "var(--color-neutral-700)",
          800: "var(--color-neutral-800)",
          900: "var(--color-neutral-900)",
        },
        success: {
          50: "var(--color-success-50)",
          500: "var(--color-success-500)",
          700: "var(--color-success-700)",
          DEFAULT: "var(--color-success-500)",
        },
        warning: {
          50: "var(--color-warning-50)",
          500: "var(--color-warning-500)",
          700: "var(--color-warning-700)",
          DEFAULT: "var(--color-warning-500)",
        },
        error: {
          50: "var(--color-error-50)",
          500: "var(--color-error-500)",
          700: "var(--color-error-700)",
          DEFAULT: "var(--color-error-500)",
        },
        info: {
          50: "var(--color-info-50)",
          500: "var(--color-info-500)",
          700: "var(--color-info-700)",
          DEFAULT: "var(--color-info-500)",
        },
        surface: {
          ground: "var(--color-neutral-50)",
          card: "#ffffff",
          border: "var(--color-neutral-200)",
        },
      },

      /**
       * SPACING
       */
      spacing: {
        "fixed-top": "177px",
        "18": "4.5rem",
        "112": "28rem",
        "128": "32rem",
        "144": "36rem",
      },

      /**
       * BORDER RADIUS
       */
      borderRadius: {
        none: "0",
        sm: "0.25rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.5rem",
        full: "9999px",
        card: "1rem",
        input: "0.5rem",
      },

      /**
       * SHADOWS
       */
      boxShadow: {
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
        primary: "0 8px 24px rgba(102, 126, 234, 0.35)",
        float: "0 -4px 20px rgba(0,0,0,0.05)",
      },

      /**
       * Z-INDEX
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
       * TRANSITIONS
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
