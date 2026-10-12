# Writing these docs

This site is built with [VitePress](https://vitepress.dev/) from the Markdown files in `docs/`. It is published to GitHub Pages at <https://zelucode.github.io/localmind/> by `.github/workflows/docs.yml` whenever a change to the docs reaches `main`.

## Run it locally

```sh
pnpm docs:dev       # live-reloading dev server
pnpm docs:build     # production build into docs/.vitepress/dist; fails on a broken link
pnpm docs:preview   # serve the production build
```

## Where things go

| Path | Content |
|---|---|
| `docs/index.md` | The home page |
| `docs/guide/` | The user guide: how to use the app. Plain language, no code paths |
| `docs/development/` | For contributors: architecture, building, releasing and design notes |
| `docs/changelog.md` | Includes the repository's `CHANGELOG.md`. Do not edit it |
| `docs/public/` | Files served as they are: the favicon, the social image and screenshots |
| `docs/.vitepress/config.mts` | The site title, navigation and sidebar |
| `docs/.vitepress/theme/` | The brand colors |

A new page needs two things: the file, and an entry in the `sidebar` in `config.mts`. Pages not listed in the sidebar are still built, but readers will not find them.

## Writing guidelines

- **Say what happens, not what is nice about it.** The project's tests reject marketing claims in the app, and the docs hold to the same standard. State limits next to features.
- **Write the user guide for someone who has not seen the code.** Use the labels they see on screen, in bold: **Save to Local Vault**, not `onAddKey`.
- **Keep code paths and internals in `docs/development/`.**
- **Document only what is true.** If you are not sure the app behaves a certain way, run it. If a feature has not been checked on a platform, say so.
- **Keep counts current or avoid them.** The catalog sizes (29 tools, 270 bookmarks) appear on a few pages. If you change the catalog, search the docs for the old number.

## Links

- Use absolute paths without the extension for pages in the site: `[Key Vault](/guide/key-vault)`. Do not include the base path (`/localmind/`); VitePress adds it.
- Link to a section with its anchor: `/guide/settings-and-backups#backup`.
- Link to files elsewhere in the repository with their full GitHub URL, because they are outside the site.
- The build fails on a dead internal link, so a typo is caught before it ships.

## Screenshots

Put images in `docs/public/screenshots/` and reference them as `![Alt text](/screenshots/name.png){.screenshot}`. The `.screenshot` class adds a border. Always write alt text. Check that a screenshot shows no real API key or personal data before you commit it.

## Callouts

```md
::: tip
Helpful advice.
:::

::: warning
Something that could go wrong.
:::

::: details Click to expand
Hidden detail.
:::
```

## Publishing

Nothing to do by hand. The workflow builds the site and deploys it on every push to `main` that touches `docs/`, `CHANGELOG.md` or the workflow itself. One-time setup, done by a maintainer: in the repository's **Settings, then Pages**, set **Source** to **GitHub Actions**.

If the site is ever moved to a custom domain, build with `DOCS_BASE=/` so links are not prefixed with `/localmind/`.
