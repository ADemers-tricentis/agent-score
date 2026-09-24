---
name: share-to-pm-workspace
description: >-
  Share AgentScore docs from this repo into the AI Product team workspace
  (ai-pm-team-workspace) so the team can see them. Use this whenever the user
  wants to "share these docs with the PM team", "push X to the team workspace",
  "send the customer feedback / external interest / updates to the AI PM repo",
  or otherwise get a doc out of this personal AgentScore repo and into the
  team's source of truth. Copies a named set of docs into the workspace's
  gitignored private/inbox/ drop zone, then hands off to that repo's
  ingest-notes flow, which sanitizes each doc, routes every fact to its one
  home (labs/testing-ai-agentscore.md, org/customers/, decisions/), and gates
  customer/PII material on review before anything lands in git. Defaults to the
  three docs the team most often wants (Customer Feedback Log, External
  Interest, AgentScore Updates) but takes any file list the user names. This
  skill only does the copy + handoff; it never commits, and it never ships
  customer PII into git without the workspace-side review gate.
---

# Share to PM Workspace

Get AgentScore docs from this personal repo into the AI Product team's source
of truth (`ai-pm-team-workspace`) the way the team's rules expect: raw files
land in the gitignored inbox first, then `ingest-notes` sanitizes, routes, and
review-gates them. This skill automates the **copy + handoff** half. The
sanitize/route/PII decisions still happen in the workspace, on purpose - two of
the default docs are customer PII and must not enter git unreviewed.

## What you are working with

- **Source repo (here):** `/Users/a.demers/dev/Tricentis/AgentScore` - the
  personal AgentScore repo. Docs live under `docs/`.
- **Target repo:** `/Users/a.demers/dev/Tricentis/ai-pm-team-workspace` - the
  AI Product team workspace, the team's working source of truth.
- **Drop zone:** `<workspace>/private/inbox/` - gitignored. Safe landing spot
  for unsanitized material (customer names, transcripts, contact emails).
  Nothing here is committed.
- **Intake flow (workspace-side):** the `ingest-notes` skill /
  `practices/ingest-notes.md` in the workspace repo. It sanitizes each doc,
  lists extracts with a routing bucket, proposes minimal diffs, and gates
  CUSTOMER/PRIVATE material on review.
- **Default doc set** (what the team most often wants shared):
  - `docs/feedback/Customer Feedback Log.md`
  - `docs/feedback/External Interest.md`
  - `docs/updates/AgentScore Updates.md`

## Data-handling note (read before copying)

Two of the default docs - **Customer Feedback Log** and **External Interest** -
name real customers/prospects (BearingPoint, L'Oreal, Meta, Workday, and
others) and contain contact detail. That is customer PII. This skill copies
raw files only into the gitignored inbox, never into a tracked path, and never
commits. The decision about what gets sanitized and what stays private is made
in the workspace at the `ingest-notes` review gate - do not try to shortcut it
here. If the user asks to skip the review and commit customer docs straight to
git, decline and explain why (team data rules).

## Workflow

### 1. Confirm the doc set

If the user named specific files, use those. Otherwise use the default doc set
above. Resolve each to an absolute path under this repo and confirm it exists
(`ls`); if a named file is missing, say so and stop rather than guessing at a
similar filename. Show the user the final list of files that will be shared and
which are customer/PII, before copying.

### 2. Confirm the target workspace is present

Check `/Users/a.demers/dev/Tricentis/ai-pm-team-workspace` exists. If it does
not, tell the user the workspace repo is not checked out at that path and stop -
don't create it or pick a different path.

### 3. Copy into the inbox

Create the inbox if needed and copy the confirmed files in, preserving their
names:

```bash
mkdir -p /Users/a.demers/dev/Tricentis/ai-pm-team-workspace/private/inbox
cp "<each absolute source path>" \
   /Users/a.demers/dev/Tricentis/ai-pm-team-workspace/private/inbox/
```

Do not modify the source files. Do not `git add` anything in either repo.

### 4. Hand off to ingest-notes

The copy is done in this repo's session, but the sanitize/route/review work
runs in the workspace repo. Tell the user exactly how to continue, and stop -
do not attempt the workspace-side triage from this AgentScore session:

> Copied N file(s) into `ai-pm-team-workspace/private/inbox/`. To finish, open
> a session in the workspace repo and run `/ingest-notes private/inbox` - it
> will sanitize each doc, show you where every fact routes, and gate the
> customer docs on your review before anything is committed.

If the user is already working in the workspace repo (or asks you to continue
there), follow `practices/ingest-notes.md` in that repo rather than
improvising: expected routing is Customer Feedback Log + External Interest ->
`org/customers/<slug>.md` (+ index row in `org/customers/README.md`, raw stays
in `private/`), and AgentScore Updates -> folded into
`labs/testing-ai-agentscore.md` in current language.

## Output

Finish with a short report: which files were copied, how many, which of them
are customer/PII (so they will stay in `private/` until the review gate clears
them), and the exact next command to run in the workspace repo. If you stopped
early (a named file was missing, or the workspace repo was not found at the
expected path), say exactly where and why.

## Do not

- Commit or `git add` in either repo - this skill only stages files in a
  gitignored inbox.
- Ship customer/PII docs into any tracked path, or skip the `ingest-notes`
  review gate for them.
- Modify or delete the source docs in this repo.
- Paste doc bodies directly into workspace living docs - routing is
  `ingest-notes`' job, not this skill's.
