---
name: agentscore-roadmap-sync
description: >-
  Turn a rough, pasted list of AgentScore features into a themed Now / Next /
  Later roadmap, check the current Jira epics and stories against it, and draft
  the epics and stories that are missing. Use this whenever the user wants to
  "build the roadmap", "theme these features", "sort these into a roadmap",
  "check Jira against the roadmap", "what epics are we missing", or pastes a
  messy feature list and wants it organized. Cleans up the pasted list,
  groups features into themes, writes a new dated entry to
  planning/roadmap/, reads the Testing AI-team epics and stories on the AI
  board (board 8084) read-only, reports which are aligned, out of scope, or
  likely missing, and drafts new epics/stories in pm:stories format. Stops for
  review after every phase and never writes to Jira without explicit approval.
---

# AgentScore Roadmap Sync

Take a rough feature list, make it a roadmap, then hold Jira up against it.
Four phases. **Stop and wait for the user's go-ahead after each one.** Nothing
is written to Jira unless the user approves the drafts in Phase 4.

## What you are working with

- **Input:** a rough feature list pasted into chat this run. Expect mixed
  formats, duplicates, vague wording, half-finished thoughts. If nothing has
  been pasted and there is no feature list in the conversation, ask for it
  before starting.
- **Output location:** `planning/roadmap/` at the repo root. Create the folder
  if it does not exist. Each run writes a **new** file named
  `YYYY-MM-DD-<short-kebab-title>.md`. Never overwrite or edit an earlier entry.
  If a same-day file with that name exists, add a `-2` suffix.
- **Horizon:** Now / Next / Later.
- **Jira scope:** AI board 8084, cloud ID `tricentis.atlassian.net`, issues in
  project `AI` where Team (`customfield_10001`) is Testing AI (team id
  `78b767ff-8d79-459d-b8e6-4021bd68a014`). The project has thousands of issues
  from other teams, so always filter by team:
  ```
  project = AI AND cf[10001] = "78b767ff-8d79-459d-b8e6-4021bd68a014"
  ```
  Epic-story link is the `parent` field. See `agentscore-kanban-sync` for the
  full board conventions (statuses, Team field format, spike representation).
- **Ranking inputs (read what is relevant, don't read everything):**
  customer demand in `docs/feedback/Customer Feedback Log.md` and
  `docs/feedback/External Interest.md`, and the Labs graduation criteria
  (see the memory note on Ignite to Activate graduation). Use these to justify
  placement, and cite which one drove a call.
- **Writing style:** no em dashes anywhere in output or files. Use a hyphen.

## Workflow

### Phase 1: Clean up the input

Normalize the pasted list into one row per feature:

| Feature | Description (one sentence) | Audience (if clear) |

- Merge duplicates and near-duplicates. Say which rows you merged.
- Tighten vague wording but do not invent scope. If a feature is ambiguous,
  keep your best reading and list it under **Open questions**.
- Silently fix typos. Do not list them.

Show the cleaned table and the open questions. **Wait for the user** before
Phase 2.

### Phase 2: Themes and roadmap

1. Group features into 4 to 7 themes. Each theme gets a short name and a
   one-line rationale (why it matters to AgentScore users).
2. Place every feature on Now / Next / Later. For any placement the user might
   dispute, add a short reason and the evidence (feedback entry, graduation
   criterion, dependency).
3. If earlier entries exist in `planning/roadmap/`, read the most recent one
   and include a **Changes since last roadmap** section (added, moved,
   dropped).
4. Write the entry to `planning/roadmap/YYYY-MM-DD-<title>.md` in this order:
   - Bold title line, date, and status.
   - At the very top, a summary table with columns Now, Next, Later and the
     theme names listed under each column (themes only, no features).
   - **North star** paragraph.
   - Target user flow diagram, if the input contains a user flow or numbered
     steps. Pasted flows are meant to become a diagram, not prose: render them
     as a Mermaid `flowchart TD` (decisions as diamonds, loops as labelled
     edges) with `classDef` colors by horizon (green Now, blue Next, grey
     Later). Keep the step numbers so features can reference them, and do not
     restate the steps as numbered lists elsewhere in the file.
   - The roadmap body, using exactly this heading structure:
     - `# Now`, `# Next`, `# Later` (one H1 each, in that order)
     - `## <Theme name>` for each theme under its horizon, followed by four
       bold-labelled paragraphs: **What it is**, **Why it matters** (cite
       feedback entries and graduation criteria as placement evidence),
       **What we hope to accomplish**, **North star tie**. Flag any placement
       the user might dispute here.
     - `### Features and epics` under each theme, as bullets: bold feature
       name, flow step reference if any, then a description. Mention merges.
   - `# Changes since last roadmap` (if earlier entries exist), `# Open
     questions`. The roadmap file holds only the roadmap: no Jira alignment
     tables and no drafted stories (the per-feature `Jira:` links are the
     only Jira content allowed in it).

Show the user the file path and a summary. **Wait for the user.** Apply their
edits to the same file before moving on.

### Phase 3: Jira alignment (read-only)

```
searchJiraIssuesUsingJql:
  jql: project = AI AND cf[10001] = "78b767ff-8d79-459d-b8e6-4021bd68a014"
  fields: ["summary", "status", "issuetype", "parent"]
  maxResults: 100  (page with nextPageToken until exhausted)
```

Skip epics and stories in `Done` or `Won't Do` whose work does not touch the
roadmap, but do include Done items when they show a roadmap feature is already
delivered (mark that feature "shipped" rather than "missing").

Map each epic (using its stories for context) to a roadmap theme and feature.
Produce three lists:

1. **Aligned:** epic maps to a roadmap feature. Show epic key, summary, theme.
2. **Out of scope:** epic maps to no roadmap feature. Give a one-line reason
   and a recommendation: keep (roadmap should probably include it), descope,
   or defer.
3. **Likely missing:** a roadmap feature with no epic, or an epic whose stories
   do not cover the feature's full scope. Say why you believe it is missing,
   and for partial coverage say what is uncovered.

When a mapping is a guess, flag it instead of presenting it as fact. Also add
a `Jira:` sub-bullet under every feature in the roadmap body, linking each
matching epic or story as
`[AI-123](https://tricentis.atlassian.net/browse/AI-123) (status)`, or
`Jira: none found.` The compact search view omits `parent`, so request
`view: "evidence"` with `fields: ["summary","parent"]` when you need to
confirm which epic a story belongs to, and say so when a grouping is inferred
from key order. Append
this to a separate file, `planning/jira-alignment/YYYY-MM-DD-<title>-jira.md`,
with a link back to the roadmap entry (and a link to it from the roadmap's
header). Never put the alignment tables in the roadmap file. **Do not write to
Jira in this phase.** Wait for the user.

### Phase 4: Draft the gaps

For everything on the "likely missing" list, draft epics and stories in
`pm:stories` format: epic summary and goal, then stories as user stories with
acceptance criteria and a priority. Tag each with its roadmap theme and
horizon. Reuse an existing epic as the parent for new stories when one fits
instead of drafting a duplicate epic.

Write the drafts to the same Jira alignment file, under **Draft epics and
stories**, not the roadmap file.
Present them and **wait for explicit approval**.

Only if the user approves, create them in Jira with `createJiraIssue`:
`projectKey: "AI"`, correct `issueTypeName`, `parent` set to the epic for
stories, and
`additional_fields: {"customfield_10001": "78b767ff-8d79-459d-b8e6-4021bd68a014"}`
(bare string, not an object). Create only the approved items, never edit or
transition existing issues, and report the created keys. Add the created keys
back into the Jira alignment file (and the `Jira:` links in the roadmap).

## Final report

End with: the roadmap file path, theme and feature counts, the Jira alignment
counts (aligned / out of scope / likely missing), what was drafted, and what
was created in Jira (or "nothing written to Jira").
