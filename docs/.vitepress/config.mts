import { defineConfig } from 'vitepress';

// GitHub project pages are served from /<repo>/. Override with DOCS_BASE=/ for a custom domain.
const base = process.env.DOCS_BASE ?? '/localmind/';
const repo = 'https://github.com/zelucode/localmind';
const siteUrl = 'https://zelucode.github.io/localmind/';

export default defineConfig({
  title: 'LocalMind',
  description:
    'LocalMind is a free, open-source desktop app that catalogs free-tier AI tools, finds the AI servers running on your machine, and keeps your API keys in an encrypted local vault.',
  lang: 'en-US',
  base,
  cleanUrls: true,
  lastUpdated: true,
  // The build fails on a broken internal link: keep it that way.
  ignoreDeadLinks: false,

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}favicon.svg` }],
    ['meta', { name: 'theme-color', content: '#e0a8c5' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'LocalMind: your private AI hub, always nearby' }],
    ['meta', { property: 'og:image', content: `${siteUrl}og.png` }],
  ],

  themeConfig: {
    logo: '/favicon.svg',
    siteTitle: 'LocalMind',

    nav: [
      { text: 'Guide', link: '/guide/', activeMatch: '/guide/' },
      { text: 'Development', link: '/development/', activeMatch: '/development/' },
      { text: 'Changelog', link: '/changelog' },
      { text: 'Download', link: `${repo}/releases` },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Start here',
          items: [
            { text: 'What is LocalMind?', link: '/guide/' },
            { text: 'Install', link: '/guide/install' },
            { text: 'Quick tour', link: '/guide/getting-started' },
          ],
        },
        {
          text: 'Discover',
          items: [
            { text: 'Home and the Ask box', link: '/guide/home' },
            { text: 'AI Tools', link: '/guide/ai-tools' },
            { text: 'Bookmarks', link: '/guide/bookmarks' },
          ],
        },
        {
          text: 'Developer',
          items: [
            { text: 'Runtimes', link: '/guide/runtimes' },
            { text: 'Configs and limits', link: '/guide/configs-and-limits' },
            { text: 'Setup', link: '/guide/setup' },
          ],
        },
        {
          text: 'Secure',
          items: [{ text: 'Key Vault', link: '/guide/key-vault' }],
        },
        {
          text: 'Using the app',
          items: [
            { text: 'Settings, themes and backups', link: '/guide/settings-and-backups' },
            { text: 'Keyboard shortcuts', link: '/guide/shortcuts' },
            { text: 'Privacy and security', link: '/guide/privacy-and-security' },
            { text: 'Troubleshooting', link: '/guide/troubleshooting' },
            { text: 'FAQ', link: '/guide/faq' },
          ],
        },
      ],
      '/development/': [
        {
          text: 'Contributing',
          items: [
            { text: 'Overview', link: '/development/' },
            { text: 'Architecture', link: '/development/architecture' },
            { text: 'Testing', link: '/development/testing' },
            { text: 'Writing these docs', link: '/development/docs' },
          ],
        },
        {
          text: 'Build and release',
          items: [
            { text: 'Building installers', link: '/development/building' },
            { text: 'Releasing', link: '/development/releasing' },
          ],
        },
        {
          text: 'Design notes',
          items: [
            { text: 'Security design', link: '/development/security-design' },
            { text: 'Provider data and the live feed', link: '/development/provider-data' },
            { text: 'Setup recipes', link: '/development/setup-recipes' },
            { text: 'Logging and diagnostics', link: '/development/logging' },
          ],
        },
      ],
    },

    socialLinks: [{ icon: 'github', link: repo }],

    editLink: {
      pattern: `${repo}/edit/main/docs/:path`,
      text: 'Suggest a change to this page',
    },

    search: { provider: 'local' },

    outline: { level: [2, 3] },

    footer: {
      message: 'Released under the Apache License 2.0. The LocalMind name and logo are trademarks; see the trademark policy.',
      copyright: 'Copyright 2026 Haroon Abbasi',
    },
  },
});
