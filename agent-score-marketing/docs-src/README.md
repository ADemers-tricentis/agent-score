# Agent Score Docs

Source for the customer-facing docs site published as a single static file at
`../docs/index.html`. Covers onboarding, the evaluation catalog, and the
scoring journey for a non-technical audience.

## Structure

- `src/nav.ts` - the sidebar table of contents (sections + pages). Add a page
  here and it appears in the sidebar automatically.
- `src/content/*.tsx` - one component per page.
- `src/components/diagrams/*.tsx` - hand-built SVG/React diagrams used across
  pages.
- `src/App.tsx` - layout shell + a small hash router (`#/slug`) so pages are
  linkable without needing server-side routing on static hosting.

## Edit the docs

1. Edit or add a page component under `src/content/`.
2. Register it in `src/nav.ts` if it's new.
3. From this directory: `pnpm run build`.
4. Commit both the source change and the regenerated `../docs/index.html`.

## Local preview

`pnpm run dev`
