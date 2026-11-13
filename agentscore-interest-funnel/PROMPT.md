Build a local lead-funnel app that replaces `External Interest.md` as the source of
truth for AgentScore external interest. Design doesn't matter yet: plain, functional
UI only. Before you write any code, send me a schema and plan to approve.

## Where it lives
- Build the app in `/Users/a.demers/dev/Tricentis/agentscore-interest-funnel` (this
  folder). It is outside the AgentScore repo, so make it its own git repo with a
  `.gitignore` that excludes the database file, `.env`, and dependencies.
- The source data lives in the AgentScore repo at `/Users/a.demers/dev/Tricentis/AgentScore`
  (called `<repo>` below). Read it from there; don't copy the md or CSV files into this
  folder.

## What it replaces (read these first)
- `<repo>/docs/feedback/External Interest.md`: intro notes (exclusions, repeats,
  stacked submitters), Agent Stacks table, Pipeline Tracker (Cumulative + Current stage
  counts, Details table), and one `### Company` section per company with submitter
  groups (Date/Name/Title/Relationship), Account owner (Salesforce), Email sent /
  Follow-up sent / Replied / Beta invite sent / Beta check-in sent dates, outreach,
  waiting on, what they do, likely use case, known agent tooling (with source links),
  agent stack (stated).
- `<repo>/docs/feedback/email automation/external-interest-contacts.csv` (per-person
  stage dates).
- `<repo>/docs/feedback/Beta Cohorts.md` (invite date -> first sign-in).
- `<repo>/docs/feedback/AgentScore-interest-fit.html`: fit buckets (ICP and motivated,
  ICP silent customer/partner, Motivated not ICP yet, Potential not now, Agent program
  unconfirmed, Platform vendor, Closed, Junk), evidence + why per company, "Chase these
  first", accounts by owner, "What would move the funnel", signup quality (no company /
  internal / duplicate).
Every field and view in these must exist in the app. If something doesn't fit the
schema, tell me. Don't drop it without asking.

## Data model (a starting point; push back on it if needed)
- Company, Contact/Submission (one company has many submitters, the same person can
  submit more than once), Salesforce account + owner (one company can map to several
  accounts), research notes with sources, fit bucket + evidence + reason, stated agent
  stack.
- Stage changes as an event history with dates (not a single status column), so
  Cumulative and Current counts are calculated from it instead of edited by hand.
- Exclusions and signup-quality issues kept as records with their reason, not dropped.
- Use SQLite (one file in this folder, gitignored) unless you have a strong reason for
  Postgres.

## Funnel stages
Use the tracker's eight stages, in this order:

1. Interested
2. Email sent
3. Follow-up sent
4. Replied
5. Demo scheduled
6. Pending beta
7. Invited to beta
8. Actively using (Beta Cohorts has a first sign-in)

Plus two exit states outside the funnel: Not a fit and Do not email. A company in an
exit state keeps its history, but it isn't counted in the funnel (Ferrara Candy and
Sky Plc are the current examples).

Count rules, matching the tracker: Current = companies whose latest stage is that
stage. Cumulative = companies that have reached that stage or any later one, so each
cumulative count equals its current count plus every current count below it. Stages
never move backwards automatically; a manual move backwards needs a reason, and the
reason is saved.

## Features
- Funnel view: current and cumulative count per stage, drill into the companies at
  each stage.
- Leads table: filter and search by stage, fit bucket, owner, relationship
  (customer/partner), signup date, "no reply in N days".
- Company detail page: every submitter, the full stage timeline, research, the
  Salesforce owner, fit, and audit-log entries that mention it. Editable.
- Manual actions: change stage, set fit bucket, add a note, mark a first sign-in,
  merge duplicates, exclude with a reason.
- Fit page that reproduces the interest-fit views from live data.
- Growth over time: cumulative companies and stage moves per week.
- Usage: who has signed in and how long from signup to first sign-in, by cohort.
- Mail-merge export: generates the same CSV the sync agent writes today.

## Migration
Write a one-time, re-runnable import from the md, the CSVs, and the fit HTML payload.
Then print a reconciliation report against the md's own numbers (116 companies, 114
emailed, the current Cumulative and Current stage tables) and list every row it
couldn't parse. Don't delete `External Interest.md`; I'll archive it after checking
the import.

## Sync agent
Update both `<repo>/.claude/agents/external-interest-sync-agent.md` and
`<repo>/.cursor/agents/external-interest-sync-agent.md` to write to the app through a
CLI or API (not raw SQL), keeping every rule: exclusions, stacking, research with
sources, Salesforce lookup, reply detection, untrusted-content handling, never moving
a company backwards. `<repo>/docs/feedback/External Interest Audit Log.md` stays as it
is (markdown, append-only, no emails), and the app should also store each change it
makes.

## Downstream
`weekly-update`, `feedback-session-notes`, `agentscore-roadmap-sync`, and
`share-to-pm-workspace` (in `<repo>/.claude/skills/`) read `External Interest.md`.
Either have the app export a read-only md snapshot under that name or update those
skills. Recommend one.

## Done when
The app runs locally with one command, the import reconciles (or every gap is
explained), a dry run of the sync agent writes to the app plus the audit log, and a
README explains how to run it, import, and back up the DB.
