---
name: weekly-update
description: >-
  Writes one fact-based weekly briefing as a PowerPoint outline for internal
  leadership. Use this whenever the user asks for a "weekly update", "weekly
  status", "leadership update", "stakeholder update", or "who is using
  AgentScore". Reads only the named feedback, updates, and roadmap sources
  for the seven days ending on the run date, answers who is using AgentScore,
  what is stopping onboarding, what people who have used it said, and the
  Now, Next, and Later themes on the newest roadmap, and overwrites
  docs/decks/weekly-updates/weekly-update-outline.md. Does not build a
  .pptx, does not commit, and does not
  update the source logs.
---

# Weekly update

Write one fact-based weekly briefing as a PowerPoint outline. Do not build a .pptx, do not commit, and do not update the source logs.

The briefing answers four questions, in this order, and nothing else:

1. Who is using AgentScore right now, internal and external, kept separate.
2. What is stopping more customers from getting onboarded and to a score they can act on.
3. What feedback exists from people who have actually used it.
4. What the newest roadmap lists as Now, Next, and Later, and which of it changes (1) or (2).

Audience is internal leadership. Voice is a status readout. Every sentence is a count, a name, a date, or a stated gap, followed by a citation: (path, date or as-of date). If a source does not say it, the slide says "not in the sources" and stops. Do not predict, recommend beyond what a source already recommends, or explain why a number is encouraging.

## Output

Write markdown the user can paste into slides. One file, overwritten every run: `docs/decks/weekly-updates/weekly-update-outline.md`. Create `docs/decks/weekly-updates/` if it does not exist. Show the same text in chat. No dated copies.

## Week window

Week window: the 7 days ending on the run date, inclusive. The run date is today unless the user names a date. Also read the current-state tables even when their as-of date is older than the window, and print that as-of date next to every number taken from them.

## Read these, and only these

- `docs/feedback/Beta Cohorts.md` — external invites and first sign-ins. This is the only source for "actively using" externally. "First sign-in: not yet" means not using. "not yet" is "no sign-in reported," so say that, and do not upgrade it to "confirmed they have not logged in" or to "they are in progress."
- `docs/feedback/External Interest.md` — only the stage definitions, the Cumulative table, the Current stage table, and the company rows whose Status is Pending beta, Invited to beta, Actively using, or Demo scheduled. Skip "likely use case" and "known agent tooling." Those lines are inferences. Skip the per-company research sections.
- `docs/feedback/Customer Feedback Log.md` — Recurring asks (open rows only) and Sessions entries dated inside the window. Use a session older than the window only when an open High row cites it as the reason an account is blocked. Quote the blocking sentence. Do not summarize the call.
- `docs/feedback/feedback-sessions/` — open a session note only when the log entry is too thin to support a claim you are about to make. One claim, one read.
- `docs/updates/` — every file whose date falls in the window (`docs/updates/YYYY-MM-DD Update.md` and `docs/updates/<Month> Updates/`). These are internal working-session notes. Pull attendees, decisions, named agents or accounts, and the action table. Skip narrative color.
- `docs/updates/AgentScore Updates.md` — the newest dated entry only, for what shipped and its Coming next list. Customer-facing voice in that file is not evidence. Restate the capability in plain internal language, or omit it.
- `docs/planning/roadmap/` — the newest roadmap file. If its status says draft, or that Jira alignment was not run, the "next" slide says that in the subtitle. A roadmap item is a candidate, not a commitment, unless a dated update assigns an owner.

Do not read the External Interest audit log, mail-merge CSVs, competitive research, or older updates to fill a thin week.

## Definitions the outline must use

- External "using" = a row in `Beta Cohorts.md` with a first sign-in date. Invited, pending, replied, demo scheduled, and interested are earlier stages. Print them as earlier stages. Never call an invited company a user.
- Internal "using" = a named Tricentis agent or team that a dated update says is sending traces and getting a score. A leadership request to score an agent is demand, not usage. Put demand on the blocker or next slide.
- "Feedback from customers using it" = statements from accounts that meet the external "using" definition, or internal teams that meet the internal one. Demo, POC, and roadmap-slide comments from people who have not signed in go on a separate slide titled "What non-users said," and only when the comment names a reason they have not started or could not get value. If the using-feedback slide has no rows, write "No in-product feedback this week" and the as-of date. Do not backfill it from sales calls.
- "Stopping onboarding" = a source ties a named account, or the invited cohort as a whole, to a concrete wall: no sign-in after an invite, a product gap the account said blocks a trial, or an internal step (terms, access, attribution, instrumentation) a dated update says is unfinished. An open feature request with no account blocked by it this week does not go on this slide.
- "Next" = the Now, Next, and Later themes in the newest roadmap. One bullet per theme, tagged Now, Next, or Later. A theme is a candidate, not a commitment, while the file's status says draft. Do not list working-session action items or Coming next bullets on this slide. If a theme does not move a named account over a wall on the blocker slide, say so under the bullet.

## Slide outline

Fixed sequence. Six slides. A slide with nothing to report still exists, and its body is the sentence "Nothing in the sources this week." plus the files checked.

1. Title. "AgentScore weekly" and the window dates. Subtitle: the as-of dates of Beta Cohorts and the External Interest counts.
2. Who is using it. Two blocks, Internal and External. External block: companies signed in, out of companies invited, from the Beta Cohorts summary table, then the current-stage counts for Invited to beta and Actively using. Name every invited company and its first sign-in cell. Internal block: one line per named agent or team, "scoring" or "not scoring," with the update that says which.
3. What is stopping onboarding. Bullets, each: who is stuck, the wall, the source. Order by how many invited or in-trial accounts the wall applies to. End with a count of invited companies that have no sign-in, and the older of the two invite dates, so the wait is visible.
4. Feedback from people using it. Bullets: who, what they said, date, source. Empty state as specified above.
5. What non-users said that bears on getting to value. Only blocking quotes. Attribute the company and the date. Do not merge several accounts into "customers want."
6. What is next. The newest roadmap's Now, Next, and Later themes, in that order. Tag each bullet Now, Next, or Later. After each bullet, one clause: which wall on slide 3 it addresses, or "does not address a current wall."

Slide text is a phrase plus a number or a name. No paragraph longer than two lines. No adjectives about momentum, excitement, traction, confidence, or strategic fit. Cohort notes that say a company was "excited" are selection comments, not evidence, and do not appear.

Use this skeleton. Fill every slot from a line you read. Leave the empty-state sentence when a slide has no rows.

```markdown
# AgentScore weekly
Window: YYYY-MM-DD to YYYY-MM-DD
Beta Cohorts as of: YYYY-MM-DD
External Interest counts as of: YYYY-MM-DD
Counts were not refreshed this week.   <!-- only when the newest tracker as-of date is older than the window -->

## Who is using it

### External
Signed in: N of N invited (docs/feedback/Beta Cohorts.md, as of YYYY-MM-DD)
Invited to beta: N (docs/feedback/External Interest.md, as of YYYY-MM-DD)
Actively using: N (docs/feedback/External Interest.md, as of YYYY-MM-DD)
- Company — first sign-in: <cell> (docs/feedback/Beta Cohorts.md, as of YYYY-MM-DD)

### Internal
- Name — scoring | not scoring (docs/updates/YYYY-MM-DD Update.md, YYYY-MM-DD)

## What is stopping onboarding
- Who — wall (path, date)
- Invited, no sign-in: N. Older invite date: YYYY-MM-DD (docs/feedback/Beta Cohorts.md, as of YYYY-MM-DD)

## Feedback from people using it
- Who — what they said (path, YYYY-MM-DD)
<!-- or: No in-product feedback this week (as of YYYY-MM-DD) -->

## What non-users said
- Company — blocking quote (path, YYYY-MM-DD)

## What is next
Subtitle: <draft, or Jira alignment was not run, when the newest roadmap says so> (path, date)
### Now
- Theme — one line from the roadmap (Now) — addresses <wall on slide 3> | does not address a current wall
### Next
- Theme — one line from the roadmap (Next) — addresses <wall on slide 3> | does not address a current wall
### Later
- Theme — one line from the roadmap (Later) — addresses <wall on slide 3> | does not address a current wall
```

## Before writing, check

Drop any bullet you cannot point at a line you read. If two sources disagree, print both lines and the dates, and do not pick a winner. If the newest tracker as-of date is older than the window, the title subtitle says the counts were not refreshed this week.
