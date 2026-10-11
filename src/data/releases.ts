/**
 * Release notes shown in About > What's New. Newest first.
 * Keep in step with CHANGELOG.md (src/data/releases.test.ts checks the top entry
 * against package.json and the changelog) and write only what really ships.
 */
export interface Release {
  version: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  title: string;
  highlights: string[];
}

export const RELEASES: Release[] = [
  {
    version: '1.0.0-beta.1',
    date: '2026-10-11',
    title: 'First public beta',
    highlights: [
      'AI Tools: a catalog of free-tier AI tools with filters, search, list or grid view, favorites and Quick Query (launch a tool with your prompt).',
      'Ask box on Home: send a prompt to one default engine, or compare several at once.',
      'Setup: detect and install Ollama, Gemini CLI and Qwen Code in one click, after you confirm the exact command.',
      'Runtimes: see which local AI servers (Ollama, OmniRoute, LM Studio, Jan) are running on this computer.',
      'Key Vault: API keys are encrypted on disk with a master key kept in your OS credential store, and can be tested against each provider.',
      'Config Exporter and Rate-Limit Matrix: ready-made snippets for editors, agents and SDKs, and a free-tier quota comparison with a fallback order.',
      'Bookmarks: a curated library of free web tools, with import and export (JSON, browser HTML, CSV, Markdown).',
      'Backups: workspace backup and restore, optionally protected with a passphrase (Argon2id + AES-256-GCM).',
      'Themes: 10 presets plus your own custom themes and accent color.',
      'Report a Problem: saves a diagnostics file with keys redacted. Nothing is sent automatically.',
      'Beta notes: tested on Windows. macOS and Linux builds exist but have not been tested yet, and installers are not code-signed.',
    ],
  },
];
