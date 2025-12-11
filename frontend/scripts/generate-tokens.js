/**
 * Design Token Generator Script
 *
 * Single Source of Truth (SSOT) Pattern
 * Reads tokens.json and generates:
 * - tokens.css (CSS Custom Properties)
 * - tokens.generated.ts (TypeScript constants)
 *
 * Usage: node scripts/generate-tokens.js
 * Or: npm run generate:tokens
 */

const fs = require("fs");
const path = require("path");

// Paths
const TOKENS_JSON = path.join(__dirname, "../common/styles/tokens.json");
const OUTPUT_CSS = path.join(__dirname, "../common/styles/tokens.css");
const OUTPUT_TS = path.join(__dirname, "../common/styles/tokens.generated.ts");

// Read tokens
const tokens = JSON.parse(fs.readFileSync(TOKENS_JSON, "utf8"));

// ============================================
// CSS Generator
// ============================================
function generateCSS(tokens) {
  let css = `/**
 * Design Tokens - CSS Custom Properties
 * ⚠️ AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
 * Edit tokens.json and run: npm run generate:tokens
 */

:root {
`;

  // Generate color tokens
  if (tokens.color) {
    css += `  /* ============================================\n`;
    css += `   * COLOR PALETTE\n`;
    css += `   * ============================================ */\n`;

    for (const [colorName, shades] of Object.entries(tokens.color)) {
      css += `\n  /* ${colorName.charAt(0).toUpperCase() + colorName.slice(1)} */\n`;
      for (const [shade, value] of Object.entries(shades)) {
        css += `  --color-${colorName}-${shade}: ${value};\n`;
      }
    }
  }

  // Generate gradients (computed from colors)
  css += `\n  /* ============================================\n`;
  css += `   * GRADIENTS\n`;
  css += `   * ============================================ */\n`;
  css += `  --gradient-primary: linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500));\n`;
  css += `  --gradient-primary-hover: linear-gradient(135deg, var(--color-primary-600), var(--color-secondary-600));\n`;
  css += `  --gradient-dark: linear-gradient(135deg, var(--color-neutral-800), var(--color-neutral-900));\n`;

  // Generate typography tokens
  if (tokens.fontFamily) {
    css += `\n  /* ============================================\n`;
    css += `   * TYPOGRAPHY\n`;
    css += `   * ============================================ */\n`;
    for (const [name, value] of Object.entries(tokens.fontFamily)) {
      css += `  --font-${name}: ${value};\n`;
    }
  }

  if (tokens.fontSize) {
    css += `\n  /* Font Sizes */\n`;
    for (const [name, value] of Object.entries(tokens.fontSize)) {
      css += `  --text-${name}: ${value};\n`;
    }
  }

  if (tokens.fontWeight) {
    css += `\n  /* Font Weights */\n`;
    for (const [name, value] of Object.entries(tokens.fontWeight)) {
      css += `  --font-${name}: ${value};\n`;
    }
  }

  if (tokens.lineHeight) {
    css += `\n  /* Line Heights */\n`;
    for (const [name, value] of Object.entries(tokens.lineHeight)) {
      css += `  --leading-${name}: ${value};\n`;
    }
  }

  // Generate spacing tokens
  if (tokens.spacing) {
    css += `\n  /* ============================================\n`;
    css += `   * SPACING\n`;
    css += `   * ============================================ */\n`;
    for (const [name, value] of Object.entries(tokens.spacing)) {
      css += `  --space-${name}: ${value};\n`;
    }
  }

  // Generate border radius tokens
  if (tokens.borderRadius) {
    css += `\n  /* ============================================\n`;
    css += `   * BORDER RADIUS\n`;
    css += `   * ============================================ */\n`;
    for (const [name, value] of Object.entries(tokens.borderRadius)) {
      css += `  --radius-${name}: ${value};\n`;
    }
  }

  // Generate shadow tokens
  if (tokens.shadow) {
    css += `\n  /* ============================================\n`;
    css += `   * SHADOWS\n`;
    css += `   * ============================================ */\n`;
    for (const [name, value] of Object.entries(tokens.shadow)) {
      css += `  --shadow-${name}: ${value};\n`;
    }
  }

  // Generate transition tokens
  if (tokens.transition) {
    css += `\n  /* ============================================\n`;
    css += `   * TRANSITIONS\n`;
    css += `   * ============================================ */\n`;
    for (const [name, value] of Object.entries(tokens.transition)) {
      css += `  --transition-${name}: ${value};\n`;
    }
  }

  // Generate z-index tokens
  if (tokens.zIndex) {
    css += `\n  /* ============================================\n`;
    css += `   * Z-INDEX\n`;
    css += `   * ============================================ */\n`;
    for (const [name, value] of Object.entries(tokens.zIndex)) {
      const kebabName = name.replace(/([A-Z])/g, "-$1").toLowerCase();
      css += `  --z-${kebabName}: ${value};\n`;
    }
  }

  // Generate breakpoint tokens
  if (tokens.breakpoint) {
    css += `\n  /* ============================================\n`;
    css += `   * BREAKPOINTS (for reference)\n`;
    css += `   * ============================================ */\n`;
    for (const [name, value] of Object.entries(tokens.breakpoint)) {
      css += `  --breakpoint-${name}: ${value}px;\n`;
    }
  }

  css += `}\n`;

  // Dark mode
  css += `\n/* Dark mode support */\n`;
  css += `[data-theme="dark"],\n.dark {\n`;
  css += `  --color-neutral-50: #18181b;\n`;
  css += `  --color-neutral-100: #27272a;\n`;
  css += `  --color-neutral-200: #3f3f46;\n`;
  css += `  --color-neutral-300: #52525b;\n`;
  css += `  --color-neutral-400: #71717a;\n`;
  css += `  --color-neutral-500: #a1a1aa;\n`;
  css += `  --color-neutral-600: #d4d4d8;\n`;
  css += `  --color-neutral-700: #e4e4e7;\n`;
  css += `  --color-neutral-800: #f4f4f5;\n`;
  css += `  --color-neutral-900: #fafafa;\n`;
  css += `}\n`;

  return css;
}

// ============================================
// TypeScript Generator
// ============================================
function generateTS(tokens) {
  let ts = `/**
 * Design Tokens - TypeScript Constants
 * ⚠️ AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
 * Edit tokens.json and run: npm run generate:tokens
 */

`;

  // Generate each token category
  if (tokens.color) {
    ts += `export const colors = ${JSON.stringify(tokens.color, null, 2)} as const;\n\n`;
  }

  if (tokens.spacing) {
    ts += `export const spacing = ${JSON.stringify(tokens.spacing, null, 2)} as const;\n\n`;
  }

  if (tokens.fontSize) {
    ts += `export const fontSize = ${JSON.stringify(tokens.fontSize, null, 2)} as const;\n\n`;
  }

  if (tokens.fontWeight) {
    ts += `export const fontWeight = ${JSON.stringify(tokens.fontWeight, null, 2)} as const;\n\n`;
  }

  if (tokens.fontFamily) {
    ts += `export const fontFamily = ${JSON.stringify(tokens.fontFamily, null, 2)} as const;\n\n`;
  }

  if (tokens.lineHeight) {
    ts += `export const lineHeight = ${JSON.stringify(tokens.lineHeight, null, 2)} as const;\n\n`;
  }

  if (tokens.borderRadius) {
    ts += `export const borderRadius = ${JSON.stringify(tokens.borderRadius, null, 2)} as const;\n\n`;
  }

  if (tokens.shadow) {
    ts += `export const shadows = ${JSON.stringify(tokens.shadow, null, 2)} as const;\n\n`;
  }

  if (tokens.transition) {
    ts += `export const transitions = ${JSON.stringify(tokens.transition, null, 2)} as const;\n\n`;
  }

  if (tokens.breakpoint) {
    ts += `export const breakpoints = ${JSON.stringify(tokens.breakpoint, null, 2)} as const;\n\n`;
  }

  if (tokens.zIndex) {
    ts += `export const zIndex = ${JSON.stringify(tokens.zIndex, null, 2)} as const;\n\n`;
  }

  // Add type exports
  ts += `// Type exports for TypeScript usage\n`;
  ts += `export type ColorScale = keyof typeof colors;\n`;
  ts += `export type SpacingScale = keyof typeof spacing;\n`;
  ts += `export type FontSizeScale = keyof typeof fontSize;\n`;
  ts += `export type BreakpointScale = keyof typeof breakpoints;\n`;

  return ts;
}

// ============================================
// Main
// ============================================
function main() {
  console.log("🎨 Generating design tokens...\n");

  // Generate CSS
  const css = generateCSS(tokens);
  fs.writeFileSync(OUTPUT_CSS, css);
  console.log(`✅ Generated: ${path.relative(process.cwd(), OUTPUT_CSS)}`);

  // Generate TypeScript
  const ts = generateTS(tokens);
  fs.writeFileSync(OUTPUT_TS, ts);
  console.log(`✅ Generated: ${path.relative(process.cwd(), OUTPUT_TS)}`);

  console.log("\n🎉 Done! Tokens generated successfully.");
}

main();
