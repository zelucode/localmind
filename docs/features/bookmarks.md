# Bookmarks

## What the user sees

About 270 curated free web tools (developer utilities, design, converters, productivity, privacy, media, learning, and free AI helpers), plus any the user adds.

- **Left rail:** categories with counts, and a *Show* filter: All, Web utilities, Free AI utilities, Favorites. Empty categories are hidden.
- **Toolbar:** search (name, description, URL, notes, tags), sort (Top GitHub stars, Most used, Name A–Z, Recently added) and the list/grid toggle.
- **List (default):** star, avatar with name and domain, up to two tags, type badge, GitHub stars, and actions: Edit, Copy URL, GitHub (when known), Delete (custom bookmarks only, with confirmation), **Open**.
- **Grid:** compact cards with the same actions.
- **Show more:** 60 bookmarks load at a time, with a "Show N more (M remaining)" button. There is no page numbering.
- Clicking a tag filters by it; a chip shows the active tag and clears it.
- **Manage menu:** Export & Import (the full export/import center), Export Markdown (the filtered set), Quick JSON backup, Restore defaults (asks first).
- Opening a bookmark counts a visit, which feeds the "Most used" sort.

## How it works

- `BookmarksPage.tsx` owns filter, sort and view state; `App.tsx` owns the bookmark list and persists every change to `ai_nexus_bookmarks_v3`.
- Avatars are letters on a color derived from the domain, so the same site always looks the same. Real favicons are deliberately not fetched from a third-party service, since that would reveal the user's bookmarks; local favicon caching is backlog Task 11b.
- Links open through `openExternal` (the Tauri opener plugin, or `window.open` in a browser).
- View and sort are saved under `localmind_bookmarks_view_v1` and `localmind_bookmarks_sort_v1`.
- Seed data: `src/data/defaultBookmarks.ts`. Duplicate ids in storage are removed on load.

## Tests
`BookmarksPage.test.tsx`: first batch of 60 and "show more", category counts, search across title/domain/tag, type filters, sorting, tag filter and clearing, empty state, opening a tool (records the click and uses the external opener), favorite and edit callbacks, custom-only delete with confirm and cancel, the Manage menu (including the restore confirmation), view toggle persistence.

## Limits
- Favicons are letter avatars for now.
- The export/import center and Markdown export were audited; see [bookmark-export-import.md](bookmark-export-import.md).
