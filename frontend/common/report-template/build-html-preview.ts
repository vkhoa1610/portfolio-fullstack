import { TemplateConfig, SectionKey } from '@/ducks/admin/types';

export interface PreviewReportData {
  period: string;
  generatedAt: string;
  summary: { totalAmount: number; expenseCount: number; avgAmount: number };
  byCategory: Record<string, { count: number; amount: number }>;
  byEmployee: Array<{ sub: string; count: number; amount: number }>;
  anomalies: Array<{ id: number; title: string; amount: number; avgAmount: number }>;
  topExpenses: Array<{ id: number; title: string; amount: number; type: string }>;
  markdown?: string;
}

export const SAMPLE_DATA: PreviewReportData = {
  period: '2026-03',
  generatedAt: '2026-03-20T10:00:00',
  summary: { totalAmount: 3794.5, expenseCount: 12, avgAmount: 316.21 },
  byCategory: {
    RECEIPT: { count: 7, amount: 2969.5 },
    PER_DIEM: { count: 3, amount: 760.0 },
    MILEAGE: { count: 2, amount: 165.0 },
  },
  byEmployee: [
    { sub: 'vkhoa1610', count: 5, amount: 1935.5 },
    { sub: 'vkhoajap1610', count: 4, amount: 1540.0 },
    { sub: 'sample-fin', count: 3, amount: 319.0 },
  ],
  anomalies: [
    { id: 5, title: 'Software License', amount: 1500.0, avgAmount: 316.21 },
    { id: 9, title: 'Hardware Purchase', amount: 850.0, avgAmount: 316.21 },
  ],
  topExpenses: [
    { id: 5, title: 'Software License', amount: 1500.0, type: 'RECEIPT' },
    { id: 9, title: 'Hardware Purchase', amount: 850.0, type: 'RECEIPT' },
    { id: 7, title: 'Munich Business Trip', amount: 390.0, type: 'PER_DIEM' },
  ],
  markdown: `## Financial Analysis\n\n**Key Findings:**\n- Software License (€1,500) is 4.7× the average — flag for review.\n- Hardware Purchase (€850) is 2.7× the average.\n\n**Recommendation:** Set approval threshold at €500 for single receipts.`,
};

const fmt = (n: number) => `€${Number(n).toFixed(2)}`;

type SectionRenderer = (title: string, content: string) => string;

function makeSectionHtml(title: string, content: string): string {
  return `
    <section class="section">
      <h2>${title}</h2>
      ${content}
    </section>`;
}

function renderExecutiveSummary(data: PreviewReportData): string {
  return makeSectionHtml('Executive Summary', `
    <div class="summary-grid">
      <div class="kpi-card">
        <div class="kpi-label">Total Amount</div>
        <div class="kpi-value">${fmt(data.summary.totalAmount)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Expense Count</div>
        <div class="kpi-value">${data.summary.expenseCount}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Average Amount</div>
        <div class="kpi-value">${fmt(data.summary.avgAmount)}</div>
      </div>
    </div>`);
}

function renderByCategory(data: PreviewReportData): string {
  const rows = Object.entries(data.byCategory).map(([type, d]) =>
    `<tr><td>${type}</td><td>${d.count}</td><td>${fmt(d.amount)}</td></tr>`).join('');
  return makeSectionHtml('Breakdown by Category', `
    <table>
      <thead><tr><th>Category</th><th>Count</th><th>Amount</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`);
}

function renderByEmployee(data: PreviewReportData): string {
  const rows = data.byEmployee.map(e =>
    `<tr><td>${e.sub}</td><td>${e.count}</td><td>${fmt(e.amount)}</td></tr>`).join('');
  return makeSectionHtml('By Employee (Top 5)', `
    <table>
      <thead><tr><th>Employee</th><th>Count</th><th>Amount</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`);
}

function renderAnomalies(data: PreviewReportData): string {
  if (data.anomalies.length === 0) {
    return makeSectionHtml('Anomalies Detected', '<p class="no-anomaly">No anomalies detected.</p>');
  }
  const rows = data.anomalies.map(a =>
    `<tr class="anomaly-row"><td>#${a.id}</td><td>${a.title}</td><td>${fmt(a.amount)}</td><td>${fmt(a.avgAmount)}</td></tr>`).join('');
  return makeSectionHtml('Anomalies Detected', `
    <table>
      <thead><tr><th>ID</th><th>Title</th><th>Amount</th><th>Avg</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`);
}

function renderTopExpenses(data: PreviewReportData): string {
  const items = data.topExpenses.map(e =>
    `<li>${e.title} — ${fmt(e.amount)} (${e.type})</li>`).join('');
  return makeSectionHtml('Top Expenses', `<ul>${items}</ul>`);
}

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

export function buildHtmlPreview(config: TemplateConfig, data: PreviewReportData = SAMPLE_DATA): string {
  const color = config.primaryColor || '#1E40AF';

  let sections = '';
  for (const { key, enabled } of config.sections) {
    if (!enabled) continue;
    switch (key as SectionKey) {
      case 'executiveSummary':     sections += renderExecutiveSummary(data); break;
      case 'breakdownByCategory':  sections += renderByCategory(data); break;
      case 'byEmployee':           sections += renderByEmployee(data); break;
      case 'anomalies':            sections += renderAnomalies(data); break;
      case 'recommendations':      sections += renderTopExpenses(data); break;
      case 'aiAnalysis':           sections += renderAiAnalysis(data.markdown); break;
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
  ul { padding-left: 20px; } li { margin-bottom: 4px; }
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
    <div>Period: <strong>${data.period}</strong></div>
    <div>Generated: ${data.generatedAt.replace('T', ' ').substring(0, 16)}</div>
  </div>
  ${sections}
  <div class="footer">Generated by FintechSaaS · ${config.company || ''}</div>
</body>
</html>`;
}
