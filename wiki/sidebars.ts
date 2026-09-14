import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  wikiSidebar: [
    { type: 'category', label: 'Overview',       collapsed: false, items: ['home', 'demo-guide'] },
    { type: 'category', label: 'Architecture',   collapsed: false, items: ['architecture', 'expense-lifecycle'] },
    { type: 'category', label: 'Workflows',      collapsed: false, items: ['onboarding', 'auth-flow', 'finance-workflows', 'ai-report'] },
    { type: 'category', label: 'Administration', collapsed: false, items: ['admin-management', 'cms-policy-rules'] },
    { type: 'category', label: 'Compliance',     collapsed: false, items: ['gdpr-compliance', 'gobd-notes'] },
    { type: 'category', label: 'Reference',      collapsed: false, items: ['api-reference', 'tax-export'] },
  ],
};

export default sidebars;
