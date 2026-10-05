# AI Tools

## What the user sees

A catalog of free-tier AI tools (25 built in, plus any the user adds). The default view is a **list** with one row per tool: name and badge, scope, free-tier summary, "good for" tags, and actions. A **grid** view shows the original cards.

- **Left rail:** categories with counts (All, Web LLMs & Search, Coding & Local Agents, Design & Media, OmniRoute & Runners, Favorites) and four capability filters: *Can edit local files*, *Live web search*, *No credit card*, *Free API key*.
- **Toolbar:** one search box (name, description, free-tier text, tags), a sort menu (Recommended, Name A–Z, Most starred), and the list/grid toggle.
- **Row actions:** quick query (for tools with a search URL template), export config (for tools that can use an API key), favorite, delete (custom tools only), **Launch**.
- **Scope badges** say what a tool can really do: Web Only, Local Agent, IDE Integrated, Local Hardware, Router / Proxy, Cloud Builder. "Edits local files" appears only for local agents and IDE plugins.
- If nothing matches, an empty state offers *Reset All Filters* and *Add Tool*.

## How it works

- `ToolsPage.tsx` owns all filter, sort and view state; `App.tsx` passes the tool list and callbacks.
- Filtering is a single `useMemo` over the tool list. Category counts are computed from the full list, so they don't change when a filter is on.
- View and sort are remembered under `localmind_tools_view_v1` and `localmind_tools_sort_v1`. A corrupt stored value falls back to the default.
- `canExportConfig(tool)` in `ToolCard.tsx` decides which tools get the config exporter button: tools that allow a custom API key, coding agents, and a fixed list of provider ids. Clicking it opens Configs & Limits on the exporter tab with that provider selected.
- **Launch** opens the tool's URL. If the "default launch search" setting is on and the tool has a search template, Launch opens the Quick Query dialog instead.
- Seed data lives in `src/data/defaultTools.ts`; user tools and favorites are stored in `localStorage` (`ai_nexus_custom_tools_v1`, `ai_nexus_favorites_v1`) and merged over the seed on load.

## Tests
`ToolsPage.test.tsx`: row counts for every filter against the real seed data, category counts, search, sort, favorites, custom-tool delete, config exporter visibility (including the coding-agent regression), empty state, view toggle and its persistence, corrupt stored view.

## Limits
- The free-tier text is a summary. The detailed numbers live in the Rate-Limit Matrix and are maintained by hand; they can go stale as providers change plans.
- Sorting by "most starred" only affects tools that have a `stars` value.
