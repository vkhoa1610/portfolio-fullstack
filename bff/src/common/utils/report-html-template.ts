/**
 * Builds an HTML string for a PDF expense report.
 * Used by both:
 *   - BFF (adm-016) for Puppeteer PDF generation
 *   - Frontend (iframe srcdoc) for live preview
 */

export type SectionKey =
  | 'executiveSummary'
  | 'breakdownByCategory'
  | 'anomalies'
  | 'recommendations'
  | 'byEmployee'
  | 'aiAnalysis';

export interface SectionItem {
  key: SectionKey;
  enabled: boolean;
}

export interface TemplateConfig {
  title: string;
  company: string;
  logoUrl: string;
  primaryColor: string;
  // Accept both new array format and old object format for backward compat
  sections: SectionItem[] | Record<string, boolean>;
}

export interface ReportData {
  period: string;
  generatedAt: string;
  markdown: string;
  reportData: string; // JSON string
}

const SECTION_ORDER: SectionKey[] = [
  'executiveSummary', 'breakdownByCategory', 'byEmployee',
  'anomalies', 'recommendations', 'aiAnalysis',
];

function normalizeSections(sections: SectionItem[] | Record<string, boolean>): SectionItem[] {
  if (Array.isArray(sections)) return sections;
  return SECTION_ORDER.map(key => ({
    key,
    enabled: key === 'aiAnalysis' ? true : Boolean((sections as Record<string, boolean>)[key]),
  }));
}

function makeSectionHtml(title: string, content: string): string {
  return `
    <section class="section">
      <h2>${title}</h2>
      ${content}
    </section>`;
}

const fmt = (n: number | string) =>
  typeof n === 'number' ? `€${Number(n).toFixed(2)}` : `€${parseFloat(String(n) || '0').toFixed(2)}`;

function renderAiAnalysis(markdown: string | undefined): string {
  if (!markdown) return '';
  const html = markdown
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/((?:<li>[^<]*<\/li>\n?)+)/g, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hup])/gm, '<p>')
    .replace(/<p>\s*<\/p>/g, '');
  return makeSectionHtml('Financial Analysis (AI)', `<div class="ai-analysis">${html}</div>`);
}

export function buildReportHtml(config: TemplateConfig, report: ReportData): string {
  const color = config.primaryColor || '#1E40AF';
  const parsed = (() => {
    try { return JSON.parse(report.reportData || '{}'); } catch { return {}; }
  })();

  const summary = parsed.summary || {};
  const byCategory = parsed.byCategory || {};
  const byEmployee = parsed.byEmployee || [];
  const anomalies = parsed.anomalies || [];
  const topExpenses = parsed.topExpenses || [];

  const sectionItems = normalizeSections(config.sections);

  let sections = '';

  for (const { key, enabled } of sectionItems) {
    if (!enabled) continue;

    switch (key) {
      case 'executiveSummary':
        sections += makeSectionHtml('Executive Summary', `
          <div class="summary-grid">
            <div class="kpi-card">
              <div class="kpi-label">Total Amount</div>
              <div class="kpi-value">${fmt(summary.totalAmount || 0)}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Expense Count</div>
              <div class="kpi-value">${summary.expenseCount ?? 0}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Average Amount</div>
              <div class="kpi-value">${fmt(summary.avgAmount || 0)}</div>
            </div>
          </div>`);
        break;

      case 'breakdownByCategory': {
        const rows = Object.entries(byCategory).map(([type, data]: [string, any]) =>
          `<tr><td>${type}</td><td>${data.count}</td><td>${fmt(data.amount)}</td></tr>`).join('');
        sections += makeSectionHtml('Breakdown by Category', `
          <table>
            <thead><tr><th>Category</th><th>Count</th><th>Amount</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="3">No data</td></tr>'}</tbody>
          </table>`);
        break;
      }

      case 'byEmployee': {
        const rows = byEmployee.map((e: any) =>
          `<tr><td>${e.sub}</td><td>${e.count}</td><td>${fmt(e.amount)}</td></tr>`).join('');
        sections += makeSectionHtml('By Employee (Top 5)', `
          <table>
            <thead><tr><th>Employee</th><th>Count</th><th>Amount</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="3">No data</td></tr>'}</tbody>
          </table>`);
        break;
      }

      case 'anomalies': {
        const rows = anomalies.map((a: any) =>
          `<tr class="anomaly-row"><td>#${a.id}</td><td>${a.title}</td><td>${fmt(a.amount)}</td><td>${fmt(a.avgAmount)}</td></tr>`).join('');
        sections += makeSectionHtml('Anomalies Detected', anomalies.length === 0
          ? '<p class="no-anomaly">No anomalies detected. All expenses are within normal range.</p>'
          : `<table>
              <thead><tr><th>ID</th><th>Title</th><th>Amount</th><th>Avg</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>`);
        break;
      }

      case 'recommendations': {
        const items = topExpenses.map((e: any) =>
          `<li>${e.title} — ${fmt(e.amount)} (${e.type})</li>`).join('');
        sections += makeSectionHtml('Top Expenses', `<ul>${items || '<li>No data</li>'}</ul>`);
        break;
      }

      case 'aiAnalysis':
        sections += renderAiAnalysis(report.markdown);
        break;
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #111; padding: 32px; }
  .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid ${color}; padding-bottom: 16px; margin-bottom: 24px; }
  .header-left h1 { font-size: 20px; color: ${color}; }
  .header-left p { font-size: 11px; color: #666; margin-top: 4px; }
  .logo { max-height: 60px; max-width: 160px; object-fit: contain; }
  .meta { font-size: 11px; color: #555; text-align: right; margin-bottom: 24px; }
  .section { margin-bottom: 28px; }
  .section h2 { font-size: 14px; color: ${color}; border-left: 4px solid ${color}; padding-left: 8px; margin-bottom: 12px; }
  .summary-grid { display: flex; gap: 16px; }
  .kpi-card { flex: 1; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; text-align: center; }
  .kpi-label { font-size: 11px; color: #6b7280; }
  .kpi-value { font-size: 18px; font-weight: bold; color: ${color}; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: ${color}; color: white; padding: 8px 10px; text-align: left; }
  td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; }
  tr:nth-child(even) td { background: #f9fafb; }
  .anomaly-row td { color: #dc2626; font-weight: 500; }
  .no-anomaly { color: #16a34a; font-style: italic; }
  ul { padding-left: 20px; }
  li { margin-bottom: 4px; }
  .ai-analysis { line-height: 1.7; color: #374151; }
  .ai-analysis h3 { font-size: 13px; color: ${color}; margin: 12px 0 6px; }
  .ai-analysis h4 { font-size: 12px; margin: 10px 0 4px; }
  .ai-analysis p { margin-bottom: 8px; }
  .ai-analysis ul { padding-left: 18px; margin-bottom: 8px; }
  .footer { margin-top: 40px; font-size: 10px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 12px; }
</style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>${config.title || 'Expense Report'}</h1>
      <p>${config.company || ''}</p>
    </div>
    ${config.logoUrl ? `<img class="logo" src="${config.logoUrl}" alt="logo" />` : ''}
  </div>
  <div class="meta">
    <div>Period: <strong>${report.period}</strong></div>
    <div>Generated: ${report.generatedAt ? report.generatedAt.replace('T', ' ').substring(0, 16) : ''}</div>
  </div>
  ${sections}
  <div class="footer">Generated by FintechSaaS · ${config.company || ''}</div>
</body>
</html>`;
}
