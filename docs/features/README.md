# Feature docs

One page per feature: what it does for the user, how it works, where the code lives, how it is tested, and what its limits are. For the overall structure see [ARCHITECTURE.md](../ARCHITECTURE.md); for planned work see [BACKLOG.md](../BACKLOG.md).

| Feature | What it covers |
|---|---|
| [Navigation and layout](navigation-and-layout.md) | Sidebar pages, title bar, Help menu, keyboard shortcuts, scrolling model |
| [AI Tools](ai-tools.md) | The free-tier catalog: filter rail, search, sort, list/grid |
| [Bookmarks](bookmarks.md) | 270 free web tools: category rail, list/grid, management menu |
| [Runtimes](runtimes.md) | Detecting OmniRoute, Ollama, LM Studio and Jan on localhost |
| [Key Vault](key-vault.md) | Storing keys encrypted, verifying them with each provider |
| [Config Exporter](config-exporter.md) | Generating IDE / agent / SDK config snippets for each provider and model |
| [Rate-Limit Matrix](rate-limit-matrix.md) | Free-tier quota comparison and the fallback (rotation) order |
| [Advisor](advisor.md) | The Free Tier Advisor (built, currently hidden) |
| [Startup and window](startup-and-window.md) | Boot splash, loading screen, frameless window and window controls |
| [Testing](testing.md) | Running and writing the Vitest and Rust tests |

## Conventions that apply to every feature

- **Never fake a result.** If something can't be checked (no desktop backend, provider unreachable, key type unsupported) the UI says so. It does not show "online" or "valid" by default.
- **Never delete a feature that isn't ready.** Hide it behind a flag in `src/config/features.ts` and keep its tests.
- **Gaps are tracked, not skipped.** Anything unfinished or undecided is an entry in [BACKLOG.md](../BACKLOG.md).
- **Styling goes through theme variables** (`var(--theme-*)`), never fixed colors, so every theme works.
