# AgentScore Updates page

Source for the exec-facing updates page published as a single static file at
`../updates/index.html`. Renders `docs/AgentScore Updates.md` directly - no
manual copy/paste into HTML.

## Update the page

1. Edit `docs/AgentScore Updates.md`. Add new entries as a new `## <Month Day, Year> Update`
   heading (anywhere in the file - entries are sorted by date automatically).
2. From this directory: `pnpm run build`
3. Commit both the markdown change and the regenerated `../updates/index.html`.

## Local preview

`pnpm run dev` (copies the markdown and starts a dev server).
