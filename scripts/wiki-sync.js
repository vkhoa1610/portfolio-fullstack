#!/usr/bin/env node
/**
 * wiki-sync.js — copy docs/i18n/{locale}/*.md into wiki's generated i18n path.
 *
 * Source of truth: docs/i18n/{locale}/*.md (committed)
 * Target:          wiki/i18n/{locale}/docusaurus-plugin-content-docs/current/
 *                  (generated, gitignored)
 *
 * EN source docs/*.md are read directly by Docusaurus via `path: '../docs'` in
 * docusaurus.config.ts — no sync needed for the default locale.
 *
 * Runs before every `wiki:dev` / `wiki:build`, and in CI before Docusaurus build.
 */

const fs = require('node:fs');
const path = require('node:path');

const LOCALES = ['de', 'vi'];
const REPO_ROOT = path.join(__dirname, '..');
const DOCS_I18N = path.join(REPO_ROOT, 'docs', 'i18n');
const WIKI_I18N = path.join(REPO_ROOT, 'wiki', 'i18n');

let synced = 0;
let skippedLocales = 0;

for (const locale of LOCALES) {
  const src = path.join(DOCS_I18N, locale);
  const dst = path.join(WIKI_I18N, locale, 'docusaurus-plugin-content-docs', 'current');

  if (!fs.existsSync(src)) {
    console.log(`[wiki-sync] skip ${locale}: docs/i18n/${locale}/ not found`);
    skippedLocales++;
    continue;
  }

  fs.mkdirSync(dst, { recursive: true });

  const files = fs.readdirSync(src).filter((f) => f.endsWith('.md'));
  for (const file of files) {
    const srcFile = path.join(src, file);
    const dstFile = path.join(dst, file);
    const srcMtime = fs.statSync(srcFile).mtimeMs;
    const dstMtime = fs.existsSync(dstFile) ? fs.statSync(dstFile).mtimeMs : 0;

    if (srcMtime > dstMtime) {
      fs.copyFileSync(srcFile, dstFile);
      console.log(`[wiki-sync] ${locale}/${file} → synced`);
      synced++;
    }
  }
  console.log(`[wiki-sync] ${locale}: ${files.length} files processed`);
}

console.log(`[wiki-sync] Done. Files synced: ${synced}, locales skipped: ${skippedLocales}`);
