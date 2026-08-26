---
name: agentscore-kanban-sync
description: >-
  Bring the AgentScore Kanban board back in sync: epic status reflects what its
  stories are actually doing, and the board reflects what engineers said in the
  latest standup. Use this whenever the user wants to "sync the kanban board",
  "clean up the board", "update Jira from standup", or otherwise reconcile
  epic/story status drift or add tickets for work mentioned in a meeting. Reads
  every Testing AI-team issue on the AI board (board 8084), reconciles epic
  status against child story status, closes epics with nothing left to do,
  moves stories to In Progress based on meeting notes pasted into chat, and
  drafts new stories/spike tasks for undocumented work - after a review gate,
  since it writes directly to Jira.
---

# AgentScore Kanban Sync

Keep epic status honest (it should always reflect what its child stories are
actually doing) and keep the board current with what engineers said in the
latest standup. This writes directly to a shared Jira board, so nothing gets
applied without a review gate.

## What you are working with

- **Board:** AI board 8084 (`https://tricentis.atlassian.net/jira/software/c/projects/AI/boards/8084`),
  cloud ID `tricentis.atlassian.net`.
- **Board scope is a team filter, not a key range.** The board shows issues in
  project `AI` where the **Team** field (`customfield_10001`) equals **Testing
  AI** (team id `78b767ff-8d79-459d-b8e6-4021bd68a014`). The project itself has
  ~12,000 issues across many teams - never assume "all of project AI" or a key
  range means the board. Pull the working set with:
  ```
  project = AI AND cf[10001] = "78b767ff-8d79-459d-b8e6-4021bd68a014"
  ```
- **Epic-story link:** the standard `parent` field. A story's `fields.parent.key`
  is its epic. Pull epics and stories in one query with
  `fields: ["summary", "status", "issuetype", "parent"]` and group client-side.
- **Statuses in play** (project AI's actual workflow - confirm with
  `getTransitionsForJiraIssue` per issue rather than hardcoding transition IDs,
  since transition IDs vary by issue type):
  - `Backlog` - statusCategory "To Do"
  - `To Do` - statusCategory "To Do"
  - `In Progress` - statusCategory "In Progress"
  - `Done` - statusCategory "Done"
  - `Won't Do` - statusCategory "Done" (a terminal state, same bucket as Done
    for "nothing left to do" purposes)
- **Team field is mandatory on everything this skill touches.** Every epic or
  story this skill creates or edits must carry
  `customfield_10001: "78b767ff-8d79-459d-b8e6-4021bd68a014"` - **a bare
  string, not `{"id": ...}`** (the object form is rejected with "Team id ...
  is not valid"). New issues need it set explicitly via `additional_fields` -
  it does not default.
- **Spike tickets:** no native Spike issue type exists in project AI. Represent
  a spike as issue type **Task**, summary prefixed `[Spike]: `, with label
  `spike`.
- **Meeting notes source:** whatever the user pastes into chat this run. Don't
  go looking for a transcript file, Confluence page, or Slack channel - if the
  user hasn't pasted anything and there's no meeting content in the
  conversation already, ask for it before starting the meeting-update pass.

## Workflow

### 1. Pull the current board state

```
searchJiraIssuesUsingJql:
  jql: project = AI AND cf[10001] = "78b767ff-8d79-459d-b8e6-4021bd68a014"
  fields: ["summary", "status", "issuetype", "parent"]
  maxResults: 100  (page with nextPageToken until exhausted)
```

Split into epics and stories, then group stories by `parent.key`. This is your
working snapshot for both passes below - don't re-fetch mid-run unless you
lose track of an issue's current status.

### 2. Consistency pass

Walk every epic and apply these rules in order. Each is a candidate change to
queue for the review gate, not an immediate write:

1. **Epic in `Backlog`** -> for each child story currently in `To Do` or
   `In Progress`, queue a move to `Backlog`. Leave children already `Done` or
   `Won't Do` alone - don't regress finished work just because the epic
   regressed.
2. **Any child story in `In Progress`** -> if the parent epic is not already
   `In Progress`, queue moving the epic to `In Progress`. This overrides rule 1
   and also applies to epics currently `Done` (a reopened/in-progress story
   means the epic isn't done).
3. **Epic where every child story is `Done` or `Won't Do`** -> queue closing
   the epic to `Done`. **Epics with zero child stories are left untouched** -
   don't close them, don't flag them, just skip.

Apply rules in this order per epic (1, then 2 can override, then 3) since a
single pass of standup updates can trigger more than one rule on the same
epic - e.g. an epic pulled to Backlog by rule 1 whose remaining active story
just got marked In Progress by the meeting pass should end up In Progress, not
Backlog.

### 3. Meeting-update pass

Use the meeting notes already in the conversation, or ask the user to paste
them if none are present. For each engineer's mentioned work:

- **"I'm working on X" / "started X" / already-in-flight work** - find the
  matching story by summary/epic context. If more than one story is a
  plausible match, ask rather than guessing. Queue a move to `In Progress`.
- **Work mentioned with no matching ticket** - queue a new **Story** under the
  best-matching epic (infer from context; ask if nothing fits cleanly).
- **A decision that needs engineering research/discovery before it can be
  made** - queue a new **spike Task** (`[Spike]: <topic>`, label `spike`)
  instead of a story, under the relevant epic if one exists.
- **Meetings, decisions, status chatter, anything that isn't dev work and
  isn't a spike** - do not create a ticket. Note it in the final report instead.

### 4. Review gate

Before writing anything to Jira, present the full queued change list, grouped:

- **Epic/story status moves** (issue, current status -> new status, which rule
  triggered it)
- **Epics to close**
- **New stories to create** (summary, target epic)
- **New spike tasks to create** (summary, target epic)
- **Meeting items noted but not ticketed** (for visibility only)

Flag any ambiguous matches you had to guess at. **Wait for the user's
go-ahead before writing anything** - trim, reclassify, or reject items per
their feedback and proceed with the agreed set.

### 5. Apply changes

For each approved status move: `getTransitionsForJiraIssue` on that issue,
find the transition whose target status name matches, then
`transitionJiraIssue` with that transition id. Don't assume yesterday's
transition id still applies to today's issue - fetch fresh each time.

For each approved new story/spike: `createJiraIssue` with `projectKey: "AI"`,
the right `issueTypeName`, `parent` set to the target epic, and
`additional_fields: {"customfield_10001": "78b767ff-8d79-459d-b8e6-4021bd68a014"}`.
Spikes also need `additional_fields.labels: ["spike"]` and the `[Spike]: `
summary prefix.

## Output

Finish with a short report: how many epics/stories moved and why (grouped by
rule), which epics closed, which new stories/spikes were created (with their
keys once created), and which meeting items were noted but intentionally left
unticketed. If you stopped early (no meeting notes provided, ambiguous match
left unresolved, or the user declined at the review gate), say exactly where
and why.
