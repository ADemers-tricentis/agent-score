---
name: agent-score-updates
description: >-
  Publish a new AgentScore feature-update entry and tell the internal team
  about it. Use this whenever the user wants to "post an update", "write the
  updates page", "tell people what shipped", "summarize new features for
  Slack", or otherwise announce recent AgentScore product changes to
  customers/prospects (via the public updates page) and the internal team
  (via a Slack draft). Gathers update items from what the user pastes into
  chat plus a scan of merged PRs on the Tricentis-AI/agent-score GitHub repo,
  prepends a new dated entry to docs/updates/AgentScore Updates.md, rebuilds
  the updates page, and drafts an internal Slack summary.
---

# AgentScore Updates

Keep customers/prospects and the internal team both aware of what shipped.
One markdown file is the source of truth; this skill turns it into a public
updates page and an internal Slack draft in the same pass.

## What you are working with

- **Source of truth:** `docs/updates/AgentScore Updates.md`. Entries are
  `## <Month Day, Year> Update` headings, each with one or more
  `### <headline>` sections (2-3 bullets) and usually a `### Coming next`
  section. Entries live newest-first by convention, but don't assume that -
  scan all headings for the actual max date.
- **Rendered by:** `agent-score-marketing/updates-src` (Vite + React). Its
  `pnpm run build` runs `scripts/sync-content.mjs` (copies the source
  markdown into `src/content/updates.md` for a `?raw` import) and then
  `vite build`, which writes the single-file
  `agent-score-marketing/updates/index.html`.
- **NOT** `agent-score-marketing/docs-src` - that's the separate onboarding
  docs site owned by the `agent-score-docs-sync` skill. Don't touch it here.
- **Deploy:** pushing to `main` under `agent-score-marketing/**` fires
  `.github/workflows/notify-demers-demos.yml`, which dispatches a sync to
  `Tricentis-PM-Tools/demers-demos` (auto-merged PR there mirrors this repo
  and redeploys). Live at `https://demers-demos.product.tricentis.com/updates/`.
- **Product GitHub source** (a different repo from this one):
  `https://github.com/Tricentis-AI/agent-score`. Only merged PRs count, and
  only the customer-facing ones.

## Workflow

### 1. Find the cutoff date

Read `docs/updates/AgentScore Updates.md` and parse every
`## <Month Day, Year> Update` heading. Take the latest date across all of
them (don't just take the first heading in the file) - that's the cutoff for
the GitHub scan in step 2.

### 2. Gather update items

- **Primary source: whatever the user pasted into chat this run.** Treat that
  as the main list of what to write about.
- **Cross-check GitHub** for anything the user didn't mention:
  ```
  gh pr list --repo Tricentis-AI/agent-score --state merged \
    --search "merged:>=<cutoff-date>" \
    --json number,title,body,mergedAt,url --limit 100
  ```
  Read each title/body. Keep only PRs that are **customer-facing or change
  user-visible behavior** - new features, UI/UX changes, behavior changes,
  fixes to bugs a customer would have noticed. Drop internal refactors,
  test-only changes, CI/infra/deploy-only changes, dependency bumps, and
  changes to internal docs.
- **If chat had nothing usable AND the GitHub scan found nothing
  customer-facing, stop and ask the user for input.** Do not invent an
  update to fill the page.

### 3. Promote shipped "Coming next" items

Read the previous (latest-dated) entry's `### Coming next` section. For each
bullet there, check whether this run's sources (chat + filtered PRs) show it
has now shipped:

- If shipped: promote it into a headline bullet in the **new** entry, reworded
  in shipped voice (past tense, "is now live", not "will" / "coming") - don't
  leave it duplicated as still-pending in the new entry's own Coming next.
- If still unshipped: carry it forward into the new entry's Coming next
  section, refreshing the wording only if something material changed.

### 4. Write the new entry

Prepend (top of file, above the current newest entry) a new section:

```
## <Month Day, Year> Update
```

using **today's date** (the run date), regardless of when the underlying
work actually shipped.

- One or more `### <headline>` sections, each with 2-3 bullets.
- Match the file's existing voice: plain language, benefit-first, second
  person ("you" / "your agent"), no internal jargon (TAIS, epic names, Jira,
  internal tool names) unless the item is genuinely something the customer
  would notice.
- Add a `### Coming next` section per step 3 if anything unshipped carries
  forward. Omit the section entirely if there's nothing left to promise.

### 5. Build

```bash
cd agent-score-marketing/updates-src
pnpm install   # only if node_modules is missing
pnpm run build
```

This regenerates `agent-score-marketing/updates/index.html`. If the build
fails, fix the cause before continuing - never commit a broken build.

### 6. Review gate, then commit and push

Show the user:
- the diff of `docs/updates/AgentScore Updates.md`
- confirmation that `agent-score-marketing/updates/index.html` was rebuilt
  (e.g. `git status` / `git diff --stat`)

**Wait for the user's go-ahead before pushing.** A push here is a real
production deploy other people may see (it triggers the demers-demos sync),
so this is the one hard stop in the flow - editing and building don't need
approval, pushing does.

Once confirmed:
- Stage only the markdown source and the rebuilt `index.html`.
- Commit message: summarize the update, e.g.
  `updates: publish <Month Day, Year> update (<N items>)`.
- End the commit message with:
  `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`
- `git push`. Confirm the push succeeded and tell the user the redeploy will
  follow via the demers-demos sync.

### 7. Draft the internal Slack message

Output as **plain text in chat only** - there is no Slack integration in this
repo to post it automatically.

- Audience: internal team channel, informal tone - unlike the public copy,
  it's fine to reference internal work directly (which system, which team).
- Summarize this run's new headline bullets.
- Include a link to the live page: `https://demers-demos.product.tricentis.com/updates/`.

## Output

Finish with a short report: the new entry's headline(s), any items promoted
out of Coming next, whether the build passed, and (if pushed) confirmation of
the push plus the Slack draft. If you stopped early (no update items, build
failure, or the user declined to push), say exactly where and why.
