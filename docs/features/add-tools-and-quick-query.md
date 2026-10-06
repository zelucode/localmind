# Adding tools and bookmarks, Quick Query, and in-app copy

**Audit status: working after fixes** (audited 2026-10-06, Task 9).

## What the user sees
- **Add Tool** (AI Tools page, or Ctrl+K): a form for a custom AI platform: name, link, category, scope, description, free-tier notes, download link, tags and three yes/no flags. It adds the tool to the catalog and saves it on this device.
- **Add / Edit Bookmark** (Bookmarks page): a form for a web tool: link, title (filled from the link), description, category, AI or utility, badge, tags and private notes. Editing opens the same form with the bookmark's values.
- **Quick Query** (a button on tool cards that support it): type a prompt and launch it in the tool.
- **Welcome screen and search/navigation text:** the first-run overview and the subtitles in Ctrl+K and the title bar.

## How links are handled
`src/lib/url.ts` (`toWebUrl`) is used by both forms. A bare address (`example.com/tool`, `localhost:3000`) gets `https://`; an explicit `http://` or `https://` link is kept; anything else (`javascript:`, `ftp:`, `file:`, `mailto:`) is refused with a reason, as are addresses with spaces or without a dot (other than `localhost`). The same check applies to the optional download link. A link that is already in the catalog or the bookmark list (ignoring case, a leading `www.`, a trailing slash and `#fragment`) is refused with the name of the existing entry.

## Quick Query
`src/lib/quickQuery.ts` (`planQuickQuery`) decides what Launch does:
- **No prompt typed:** open the tool.
- **The tool's template has a `{query}` slot:** open the link with the encoded prompt in it (every `{query}` is filled).
- **The tool cannot take a prompt from a link** (Google AI Studio's template has no slot), **or the link would be over 8,000 characters:** copy the prompt to the clipboard, open the tool, and say so ("Copied to your clipboard: paste it into Google AI Studio (Ctrl+V)", or that copying failed). The dialog states this before launching, under the input.
Only 3 of the 29 catalog tools have a template (Perplexity, ChatGPT, Google AI Studio). Custom tools never do, so they have no Quick Query button.

## Bugs found and fixed in the audit
- **Add Tool kept the last tool's values** every time it was reopened (the hooks ran before the "closed" early return). It now starts empty on every open.
- **The link check accepted nonsense.** Anything was prefixed with `https://`, so `ftp://x.com` became `https://ftp://x.com` (accepted), and `javascript:` text became a bad link. Now refused with an explanation.
- **Duplicates were silently allowed** in both forms.
- **Add Tool invented free-tier details:** summary "Custom free tier details as provided." and credit value "Free tier" when the user wrote nothing. They now read "No free-tier details added." and "Not specified".
- **Add Bookmark pre-filled the badge "100% Free • No Sign Up"**, so most user-added bookmarks claimed something nobody checked. The field now starts empty and falls back to "Free Web Tool".
- **Editing a bookmark dropped its GitHub link, stars and license**, and turned curated bookmarks into "custom" (deletable) ones. Edits now keep everything the form does not show, and the custom flag as it was.
- **Deleting a custom tool was one click on a small icon, with no confirmation and no undo** (bookmarks did ask). A shared `ConfirmDeleteButton` now needs a second click in both the card and the list row; it backs out when it loses focus or after 4 seconds and never uses `window.confirm`.
- **Copy buttons claimed success without checking** (tool card share-link, Key Vault key, bookmark URL, Runtimes start command). They now use `copyText` and a shared `useCopyFeedback` hook: a check on success, a red X and a "Copy failed" title otherwise.
- **Quick Query silently discarded the prompt for Google AI Studio** (template without a slot) and opened a blank chat. It now copies and says so. Only the first `{query}` was replaced; all are now.
- **Copy that was not true** (corrected in the UI and now guarded by a test):
  - Welcome screen: "v2.5" (the app is `package.json`'s version), "frontier AI models" for a 29-tool catalog, "{n}+ curated" bookmarks, "zero-cost rotation", "AES-GCM Encrypted", "100% Private & Client-Side ... local browser sandbox" (this is a desktop app that contacts a provider when the user tests a key).
  - Ctrl+K and the title bar: "50+ frontier AI models", hard-coded "270+" bookmarks (now the real counts), "AES-GCM encrypted", "zero-cost rotation strategy", "synchronize".
  - Offline runners panel: "100% free forever; no subscriptions or credit cards" (now "Free to run on your own hardware; no account needed"). Omnibar tooltip and the (hidden) Advisor text also lost "zero-cost" and "100% free".

## Tests
- `url.test.ts`: bare addresses, host:port, explicit schemes, refused schemes, spaces and non-addresses.
- `AddToolModal.test.tsx`: normalized link and honest defaults, `javascript:` and download-link refusal, duplicate warning, fresh form on every open.
- `AddBookmarkModal.test.tsx`: link normalization and title from the link, no invented badge, refusal and duplicate warning, edit keeps GitHub/stars/license/favorite/clicks, curated stays curated, own link is not a duplicate.
- `quickQuery.test.ts`: every plan (open, prefilled, copy, too long), every placeholder filled, non-web templates refused, and a check that every real catalog template is an https link on the tool's own site.
- `QuickSearchModal.test.tsx`: launch, Enter, the up-front note, copy-and-open, and copy failure.
- `StartupWelcomeModal.test.tsx`: real version and counts, accurate storage text, navigation, every way to close, the startup toggle.
- `GlobalSearchModal.test.tsx`: real counts in the tab and the page subtitle.
- `ConfirmDeleteButton.test.tsx`, `ToolCard.test.tsx` and the updated `ToolsPage.test.tsx`: two-step delete, back out on blur and timeout, no delete for built-in tools, share-link success and failure.
- `useCopy.test.tsx` and `copyButtons.test.tsx`: the hook, the icon, and each copy button (success and failure).
- `copy.test.ts`: reads the source of every component and fails if a banned claim returns ("270+", "frontier AI models", "v2.5", "zero-cost", "100% free forever", "100% Private", "browser sandbox", "verified active", "No Account Required").

## Limits and open items
- The Quick Query templates for Perplexity and ChatGPT are standard prompt links, but whether they still prefill the prompt was not checked against the live sites. Google AI Studio may support a prompt parameter; if it does, add `{query}` to its template and the copy fallback goes away for it.
- Custom tools cannot define a Quick Query template (the form has no field for one).
- The Add Tool and Add Bookmark forms have labels that are not linked to their inputs, so screen readers do not announce the field names. They were not changed in this audit.
- A custom *tool* can be deleted (after confirming) but not edited; bookmarks can be edited and deleted.
