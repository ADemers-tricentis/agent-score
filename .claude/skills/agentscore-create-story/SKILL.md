---
name: agentscore-create-story
description: >-
  Turn a screenshot plus a short note into one Jira Story with a clear
  description and testable acceptance criteria, then file it on the AgentScore
  board (project AI, board 8084) only after the user approves the draft. The
  issue's Team must be Testing AI or it will not appear on the board. Use this
  whenever the user pastes or attaches a screenshot and wants a story, or says
  "turn this screenshot into a story", "file this on the board", "make a
  ticket from this", or "screenshot to Jira". Leave board cleanup and standup
  updates to agentscore-kanban-sync, roadmap theming to
  agentscore-roadmap-sync, Confluence specs to spec-to-backlog, and meeting
  action items to capture-tasks-from-meeting-notes.
---

# AgentScore Create Story

One screenshot plus a short note becomes one story an engineer can pick up
without the chat. This writes to a shared Jira board. Nothing is created
until the user approves the draft, and the issue only shows on the board
when Team is Testing AI.

## Rules that come first

### 1. The user approves the story before it is posted

Show the full draft in chat and stop. Do not call `createJiraIssue`,
`editJiraIssue`, `addOrEditJiraIssueComment`, `uploadAttachmentToJiraIssue`,
or any other Jira write until the user explicitly approves that draft in a
later message.

Approval is a reply to the draft: "looks good", "post it", "approved", or a
direct yes. The original request to file the screenshot is not approval —
they have not seen the draft yet. Silence, a clarifying question, or an edit
request is not approval. When they edit the draft, show the revised version
and wait again. Create only the approved text. Do not improve, trim, or
rephrase it at create time.

The approval covers three writes and no others: creating the issue, fixing
Team if the create did not stick, and embedding the screenshot. It does not
cover a new summary, a rewritten description, a different epic, or a
different issue type.

### 2. Team must be Testing AI

That is the only way the issue appears on the AgentScore board. On create,
set:

```
additional_fields: {"customfield_10001": "78b767ff-8d79-459d-b8e6-4021bd68a014"}
```

A bare string. `{"id": "..."}` is rejected. This is the same field the
kanban and roadmap skills set.

After create, re-fetch the issue with `getJiraIssue` and `view: "evidence"`
(compact view omits custom fields, so a missing Team there is not evidence).
Confirm Team is Testing AI, or that `customfield_10001` is the id above. If
it is missing or set to anything else, `editJiraIssue` with the same bare
string and re-fetch. If you still cannot confirm Testing AI, say so and do
not claim the story is on the board.

## What you are working with

- **Board:** AI board 8084
  (`https://tricentis.atlassian.net/jira/software/c/projects/AI/boards/8084`).
  Cloud id from `getAccessibleAtlassianResources`, called once per run and
  reused. Site is `tricentis.atlassian.net`.
- **Board scope is the Testing AI team, not project AI.** Pull candidates
  with:
  ```
  project = AI AND cf[10001] = "78b767ff-8d79-459d-b8e6-4021bd68a014"
  ```
- **Issue type:** Story. Parent is an existing epic on this board. Do not
  create epics. Do not transition other issues. Do not set an assignee.
  Leave priority off the create call unless the user named one. You may
  recommend a priority in the draft.
- **A defect** (broken behavior the screenshot shows) is a Bug, not a Story.
  Propose Bug in the draft and use it only if they approve that draft.

## Workflow

### 1. Check the inputs

Require both an image (pasted, attached, or a file path) and a short note.
If either is missing, ask for it and stop. One image is one story. Split
only if the user asks.

The note is the intent. The screenshot is evidence. When they disagree,
follow the note and record the disagreement under Assumptions.

### 2. Read the screenshot

Read the image. Quote visible labels, errors, empty states, and values in
the draft. Do not invent product behavior, personas, or edge cases the image
and the note do not support. If you would have to infer more than a couple
of things that change the acceptance criteria, ask those questions before
drafting. A long Assumptions list means the story is not ready.

### 3. Find the epic and check for duplicates

Search the Testing AI JQL above.

- Epics: add `AND issuetype = Epic AND status not in (Done, "Won't Do")`.
  Recommend one and say why. If two fit, ask. If none fit, ask which epic to
  use. Do not file without a parent, and do not create an epic to hold it.
- Duplicates: add `AND text ~ "<distinctive words>" AND issuetype in (Story, Bug)`.
  A near-duplicate gets shown in the draft. Ask whether to file a new story
  or comment on the existing one. A comment is its own draft: show the
  comment text and wait for approval before `addOrEditJiraIssueComment`.

### 4. Draft the story

Write the description in markdown, ready to pass to `createJiraIssue`.

```markdown
## User story
As a <persona this screen is actually for>, I want <capability>, so that <outcome>.

## Context
<What the screenshot shows. Quote visible labels and states. Include the user's note in their words.>

## Current behavior
<Only what the image and the note establish.>

## Desired behavior
<The outcome. Not an implementation plan.>

## Acceptance criteria
- [ ] Given <state>, when <action>, then <observable result>.
- [ ] Given <state>, when <action>, then <observable result>.

## Out of scope
- <What this story does not include, so it stays one story.>

## Assumptions
- <Only inferences. Omit this section when there are none.>
```

Summary: imperative, the user-visible outcome, roughly 8–12 words. No
"screenshot", "as discussed", or ticket-speak.

Acceptance criteria: 3–7 checkboxes. Each one is Given / When / Then and
pass/fail for someone who never saw the chat. Cover the happy path and the
state the screenshot shows. Add an empty, error, or permission case only
when the image or the note implies it. "Works well", "is intuitive", and
"handles edge cases" are not criteria.

**Example.** Screenshot: Runs page, empty table, a "New run" button. Note:
"clicking New run should open the create-run form."

- Summary: `Open the create-run form from New run`
- Given the Runs page shows no runs, when the user clicks "New run", then the create-run form opens.
- Given the create-run form is open, when the user closes it, then the Runs page is shown and the table is still empty.

### 5. Review gate

Show the user, then stop:

- Summary
- Full description
- Issue type
- Recommended epic (key and summary) and why
- Team: Testing AI
- Recommended priority, if you have one (not set on the issue unless they named it)
- Any near-duplicate

Wait for approval as defined in rule 1.

### 6. Create the approved story

Only after approval:

```
createJiraIssue:
  cloudId: <cached>
  projectKey: "AI"
  issueType: "Story"          # or "Bug" if that is what they approved
  summary: <approved summary>
  description: <approved markdown>
  contentFormat: "markdown"
  parent: <approved epic key>
  additional_fields:
    customfield_10001: "78b767ff-8d79-459d-b8e6-4021bd68a014"
```

No assignee. No priority unless they named one. Inline images cannot go on
the create call.

### 7. Confirm Team, then embed the screenshot

Re-fetch and confirm Team is Testing AI, per rule 2. Fix and re-fetch before
telling the user it is on the board.

Then embed the screenshot. `discover` `uploadAttachmentToJiraIssue` and call
it through `executeWrite` with `filePath` and the new issue key (phase 1
only). Run the returned `uploadCommand`. Pass the resulting file id and
collection to `editJiraIssue` as `inlineFileId` and `inlineFileCollection`
with `contentFormat: "html"`. That appends the image and keeps the approved
description. Do not run upload phase 2 for the same file.

Use the image path from the conversation. If you have no file path, skip
embedding, leave the approved description as the record, and say so. If
embedding fails, do the same. Do not rewrite the approved description to
force the image in.

### 8. Report

End with the issue key, browse URL
(`https://tricentis.atlassian.net/browse/<KEY>`), parent epic, and
confirmation that Team is Testing AI. Say whether the screenshot was
embedded. Mention anything left out because it was not in the image or the
note.
