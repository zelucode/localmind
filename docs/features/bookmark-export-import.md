# Bookmark Export, Import and Markdown export

**Audit status: working after fixes** (audited 2026-10-06, Task 9). Not yet checked inside the packaged desktop app: file download and the file picker (see Limits).

## Why it exists (what it does for the user)
The bookmark list lives only in this device's local storage, so it needs a way out and a way in:
- **Backup and restore.** A JSON backup brings the list back after a reinstall or on another machine.
- **Move to or from a browser.** The HTML format is the standard browser bookmarks file, so the list can be loaded into Chrome/Firefox/Edge, or an existing browser export can be pulled in.
- **Spreadsheet.** CSV opens in Excel or Sheets; a CSV with just `Title` and `URL` columns can be imported.
- **Sharing.** Markdown produces a readable list for a README, a wiki or a chat.

## What the user sees
**Bookmarks → Manage → Export & Import** opens one window with two tabs.
- **Export:** choose JSON, HTML, Markdown or CSV, all bookmarks or favorites only, see a preview and size, then **Copy** (says "Copy failed" if the clipboard refuses) or **Download File** (`localmind_bookmarks_<all|favorites>_<date>.<ext>`; CSV gets a BOM so Excel reads accents correctly).
- **Import:** pick a file or paste text. The format is detected (JSON, browser HTML or CSV). Before anything changes it shows how many bookmarks are new, how many are already in the list, and how many entries were left out (no title, or not an http/https link). Then choose a strategy:
  - **Merge & Update** (default): adds new links; for links already present, fills in details from the file and keeps favorites, click counts and notes.
  - **Add Only New:** leaves existing bookmarks untouched.
  - **Replace All:** deletes the current list first. It asks for a second, explicit confirmation that states how many bookmarks will be lost.
  - **Reset to N Defaults** also asks for confirmation inline.
  The result message states what really happened ("Imported: 5 added, 2 updated, 1 skipped.").
- **Manage → Quick JSON backup** downloads the same JSON as the Export tab.
- **Manage → Export Markdown** exports only what the page is currently showing, as a table or a list. It overlaps with the Markdown format in the export center (different layout); both are kept.

## How it works
- `src/lib/bookmarkTransfer.ts` (pure, tested): `exportBookmarks`, `parseImport` (JSON, HTML via `DOMParser`, CSV), `previewImport`, `applyImport`, `safeHttpUrl`, `normalizeUrl`.
- `src/lib/files.ts`: `copyText` (resolves false instead of throwing) and `downloadTextFile`.
- `ExportImportBookmarksModal.tsx` is the UI; `App.handleImportBookmarks` calls `applyImport` and persists.
- Two links are the same when they match ignoring case, a trailing slash and `#fragment`.
- A browser HTML import never changes an existing bookmark (it carries no trustworthy metadata); JSON/CSV merges only apply non-empty values, so a sparse file cannot blank a description or category. `isAi` is only taken from a file for new bookmarks.

## Bugs found and fixed in the audit
- **Updated bookmarks appeared twice after a merge** (the merge stored each bookmark under two keys and only replaced one).
- **Importing a browser file overwrote the descriptions, categories and tags** of bookmarks the user already had with placeholders.
- **A JSON backup lost `notes`, `clickCount`, `isCustom` and `license`** on restore.
- **`javascript:`, `file:`, `chrome:` and other non-web links were imported.** Only http(s) is accepted now.
- **CSV cells starting with `=`, `+`, `-`, `@` could run as spreadsheet formulas.** Export prefixes them with `'`; import removes it.
- **HTML round trip lost data:** `&amp;` stayed encoded, and descriptions and tags were dropped. It now parses with the browser's HTML parser.
- **CSV could be exported but not imported.** It can now.
- **Replace All and Reset wiped the list without a proper warning**, and the success message always said "imported N". The message now uses real counts.
- **The drop zone promised drag and drop that did not exist.** The copy now says "Click to choose a file".
- **A broken JSON file said "Unrecognized format"**; it now shows the parser's message. Files over 5 MB and unreadable files give a clear error; choosing the same file twice works.
- **Copy always said "Copied"**, in both modals. Downloads were named `ai_nexus_bookmarks_*` / `free_online_tools_*`.
- **Markdown export** claimed "100% Free & No Account Required" and "FckSignups Registry" for every bookmark (including custom and imported ones), linked "Generated with LocalMind" to a bare `https://github.com`, and broke on titles with `[ ]`, descriptions with newlines and URLs with `)`.
- A categories value that is not one of the app's categories is dropped on import (it used to be kept and made the bookmark unreachable from the category rail).

## Tests
- `bookmarkTransfer.test.ts`: URL safety and matching, each export format, JSON/HTML/CSV round trips, formula protection, every import mode including the regressions above.
- `files.test.ts`: `copyText` success and failure, `downloadTextFile`.
- `ExportImportBookmarksModal.test.tsx`: preview, size, favorites filter, download name and BOM, copy success and failure, honest copy on the drop zone, import preview counts, real JSON error, CSV via the file picker, two-step Replace All and Reset.
- `ExportMarkdownModal.test.tsx`: no false claims or placeholder links, escaping, one-line rows, file name, copy failure.

## Limits and open items
- **Downloads and the file picker have not been run in the real Tauri window.** They use a blob link and an `<input type="file">`; WebView2 normally handles both but this is unverified, and macOS/Linux webviews may not download blob links. If it fails, use the Tauri dialog + fs plugins (needs Rust capabilities) instead. Check with `pnpm tauri dev`.
- Other `window.confirm` calls (deleting a bookmark and Restore defaults on the Bookmarks page) are unchanged and also need checking in the real window.
- Browser folders are not turned into categories: every imported browser bookmark lands in *utilities* with the `imported` tag.
- The JSON backup is plain text. It contains bookmarks only, no API keys, so it is safe to share.
- If `localStorage` is full, the app updates the list on screen but silently fails to save it (existing behavior of `saveBookmarksToStorage`).
- The other copy buttons in the app (tool card, Key Vault, bookmark URL, Runtimes) now report clipboard failures too; see [add-tools-and-quick-query.md](add-tools-and-quick-query.md).
