import type { Config } from '@docusaurus/types';

const config: Config = {
  title: 'FintechSaaS Expense Platform',
  tagline: 'Technical documentation — German finance compliance',
  favicon: 'img/favicon.ico',

  url: 'https://vkhoa1610.github.io',
  baseUrl: '/portfolio-fullstack/',

  organizationName: 'vkhoa1610',
  projectName: 'portfolio-fullstack',
  trailingSlash: false,

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  markdown: {
    mermaid: true,
    format: 'md',
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'de', 'vi'],
    localeConfigs: {
      en: { label: 'English',      direction: 'ltr' },
      de: { label: 'Deutsch',      direction: 'ltr' },
      vi: { label: 'Tiếng Việt',   direction: 'ltr' },
    },
  },

  presets: [
    [
      'classic',
      {
        docs: {
          path: '../docs',
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/vkhoa1610/portfolio-fullstack/edit/main/',
        },
        blog: false,
        theme: { customCss: './src/css/custom.css' },
      },
    ],
  ],

  themes: [
    '@docusaurus/theme-mermaid',
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      { hashed: true, indexDocs: true, searchBarPosition: 'right', language: ['en', 'de'] },
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'FintechSaaS Docs',
      items: [
        { type: 'docSidebar', sidebarId: 'wikiSidebar', position: 'left', label: 'Documentation' },
        { type: 'localeDropdown', position: 'right' },
        { href: 'https://github.com/vkhoa1610/portfolio-fullstack', label: 'GitHub', position: 'right' },
      ],
    },
    footer: {
      style: 'dark',
      copyright: 'FintechSaaS Expense Platform — Portfolio project. Built with Docusaurus.',
    },
    prism: { additionalLanguages: ['java', 'sql', 'bash'] },
  },
};

export default config;
