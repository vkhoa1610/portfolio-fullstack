/**
 * Design Token Generator – 2025 Edition
 *
 * Single Source of Truth (SSOT) workflow
 * Reads tokens.json (DTCG / Tokens Studio format) and generates:
 *   → tokens.css      (CSS Custom Properties + dark mode support)
 *   → tokens.generated.ts (TypeScript constants)
 *
 * Supports:
 *   • Nested token sets (global, dark, etc.)
 *   • Alias resolution {color.primary.500}
 *   • All token types: color, spacing, radius, shadow, gradient, etc.
 *
 * Run: node scripts/generate-tokens.js
 *      or: npm run generate:tokens
 */

const fs = require("fs");
const path = require("path");

// Paths
const TOKENS_JSON = path.join(__dirname, "../styles/tokens.json");
const OUTPUT_CSS = path.join(__dirname, "../styles/tokens.css");
const OUTPUT_TS = path.join(__dirname, "../styles/tokens.generated.ts");

// Load tokens.json
const raw = JSON.parse(fs.readFileSync(TOKENS_JSON, "utf8"));

// Resolve aliases like {color.primary.500} → actual value
function resolveValue(value, sets) {
  if (typeof value !== "string") return value;
  const aliasMatch = value.match(/^{(.+)}$/);
  if (!aliasMatch) return value;

  const pathParts = aliasMatch[1].split(".");
  let current = sets.global;
  for (const part of pathParts) {
    current = current?.[part];
    if (current === undefined) return value; // fallback if not found
  }
  return current.value ?? value;
}

// ============================================
// 1. CSS Generator
// ============================================
function generateCSS() {
  let css = `/**
 * Design Tokens - CSS Custom Properties
 * AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
 * Edit tokens.json and run: npm run generate:tokens
 */

:root {
`;

  const globalSet = raw.global || {};

  // Recursively walk through tokens and generate --variable-name
  function walkTokens(obj, prefix = "") {
    for (const [key, token] of Object.entries(obj)) {
      if (token.value !== undefined) {
        const varName = prefix ? `${prefix}-${key}` : key;
        const resolved = resolveValue(token.value, raw);
        css += `  --${varName}: ${resolved};\n`;
      } else if (typeof token === "object" && token !== null) {
        const newPrefix = prefix ? `${prefix}-${key}` : key;
        walkTokens(token, newPrefix);
      }
    }
  }

  walkTokens(globalSet);
  css += `}\n\n`;

  // Dark mode – automatically from "dark" token set
  if (raw.dark) {
    css += `/* Dark mode support */\n`;
    css += `[data-theme="dark"],\n.dark {\n`;
    walkTokens(raw.dark);
    css += `}\n`;
  }

  return css;
}

// ============================================
// 2. TypeScript Generator
// ============================================
function generateTS() {
  let ts = `/**
 * Design Tokens - TypeScript Constants
 * AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
 * Edit tokens.json and run: npm run generate:tokens
 */
 
`;

  const globalSet = raw.global || {};

  // Extract only .value from token objects
  function extractValues(obj) {
    const result = {};
    for (const [key, token] of Object.entries(obj)) {
      if (token.value !== undefined) {
        result[key] = resolveValue(token.value, raw);
      } else if (typeof token === "object" && token !== null) {
        result[key] = extractValues(token);
      }
    }
    return result;
  }

  const cleanTokens = extractValues(globalSet);

  // Export each category if it exists
  const categories = {
    colors: cleanTokens.color,
    spacing: cleanTokens.spacing,
    fontSize: cleanTokens.typography?.size,
    fontWeight: cleanTokens.typography?.weight,
    fontFamily: cleanTokens.typography?.font,
    lineHeight: cleanTokens.typography?.leading,
    borderRadius: cleanTokens.radius,
    shadows: cleanTokens.shadow,
    transitions: cleanTokens.transition,
    zIndex: cleanTokens["z-index"],
    breakpoints: cleanTokens.breakpoint,
  };

  for (const [name, data] of Object.entries(categories)) {
    if (data) {
      ts += `export const ${name} = ${JSON.stringify(data, null, 2)} as const;\n\n`;
    }
  }

  // Type exports for better autocomplete
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
  console.log("Generating design tokens from tokens.json...\n");

  const cssContent = generateCSS();
  fs.writeFileSync(OUTPUT_CSS, cssContent);
  console.log(`Generated: ${path.relative(process.cwd(), OUTPUT_CSS)}`);

  const tsContent = generateTS();
  fs.writeFileSync(OUTPUT_TS, tsContent);
  console.log(`Generated: ${path.relative(process.cwd(), OUTPUT_TS)}`);

  console.log("\nDone! Tokens generated successfully.");
}

main();
