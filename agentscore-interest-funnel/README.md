# AgentScore interest funnel

A local app that holds AgentScore external interest: companies, submitters, form submissions, Salesforce owners, research, fit, beta cohorts and every stage change. It replaces `docs/feedback/External Interest.md`, the contacts CSV, `Beta Cohorts.md` and `AgentScore-interest-fit.html` in the AgentScore repo as the source of truth.

- Data lives in SQLite at `data/funnel.db` (not in git).
- The app sits inside the AgentScore repo and reads its source files from the parent folder (override with `AGENTSCORE_REPO`). Nothing is copied here.
- Every change, from the UI, the CLI or the sync agent, goes through one service layer that enforces the stage rules and writes a row to `change_log`.

## Run

Requires Node 24 and pnpm.

```sh
pnpm install
pnpm start          # http://localhost:4310
```

Pages: Funnel (current and cumulative counts, click a number to drill down), Leads (filters for stage, fit, owner, relationship, signup date, "no reply in N days"; CSV download), company detail (all actions and history), Fit, Growth per week, Usage by cohort, Submissions (excluded, repeat, held), Activity (runs and change log), Exports (mail merge, snapshot, backup), Notes (page text carried over from the old docs).

## Stage rules

- Eight funnel stages: Interested, Email sent, Follow-up sent, Replied, Demo scheduled, Pending beta, Invited to beta, Actively using. Two exit states, Not a fit and Do not email, are outside the funnel.
- Each company's stage history is a list of events. Current = the latest event. Cumulative = companies at that stage or any later one. Nobody edits counts.
- Touchpoints (intro email, follow-up, reply, demo, beta invite, sign-in) only move a company forward.
- Moving a company backwards, or out of an exit state, needs a reason, which is saved. The sync agent is never allowed to move a company backwards.

## Import

```sh
pnpm db:import            # builds data/funnel.db from the AgentScore repo files
pnpm db:import --force    # rebuild even if the app has changes since the last import
```

The import is re-runnable: it rebuilds the database from scratch each time. It refuses to run once anyone has changed data in the app (to avoid losing those changes) unless you pass `--force`.

It writes `reports/reconciliation-YYYY-MM-DD.md` and exits non-zero if any check fails. The report compares the app's numbers with the source files: 116 companies, 114 emailed, both stage tables, sources, cohorts, agent stacks, fit buckets, chase list and signup quality. It also lists findings to review (likely duplicates, conflicting dates, rows that matched by name prefix) and every row the parser could not place.

Sources read: `docs/feedback/External Interest.md`, `docs/feedback/email automation/external-interest-contacts.csv` (plus the two follow-up CSVs, as a cross-check), `docs/feedback/Beta Cohorts.md`, `docs/feedback/AgentScore-interest-fit.html`, and the two marker files under `.claude/skills/external-interest-sync/`. Name fixes and known exclusions the markdown can't express are in `src/import/aliases.json` and `src/import/exclusions.json`.

## CLI

`bin/funnel` is the write path for agents and scripts. It prints JSON; errors go to stderr as `{"error", "code"}` with exit code 1. `bin/funnel help` lists every command. Main ones:

```sh
bin/funnel report                                   # funnel counts
bin/funnel company find capgemini
bin/funnel company show 95
bin/funnel match --name "Jane Doe" --email jane@example.com --company "Example"
bin/funnel touchpoint add --company 95 --person jane@example.com --kind reply_received --date 2026-11-13 --source inbox
bin/funnel stage set --company 95 --stage email_sent --reason "Reply was an auto-responder"
bin/funnel export mail-merge --all-unemailed        # same CSV format as before
bin/funnel paths                                    # resolved DB, audit log, mail-merge and snapshot paths
```

The sync agent passes `--actor sync-agent --run <id>` on every write (`run start` creates the id). Without a run id its writes are refused. `bin/funnel changes --run <id>` lists what a run changed.

## The sync agent

`.claude/agents/external-interest-sync-agent.md` and `.cursor/agents/external-interest-sync-agent.md` in the AgentScore repo write through this CLI. They keep the same rules as before: exclusions, stacking, research with sources, Salesforce lookup, reply detection, untrusted-content handling, and never moving a company backwards. `docs/feedback/External Interest Audit Log.md` stays markdown, append-only and without email addresses. The app also records each change under the run id.

The contacts CSV is no longer written; its data is in the app. The run and reply markers are now stored in the app (`bin/funnel marker get last_processed`).

### Dry run

```sh
bin/funnel dryrun prepare            # copies the DB and the audit log to data/dryrun/
bin/funnel --dryrun <command> ...    # every path points at the copies
```

Ask the agent for a dry run and it follows the same steps with `--dryrun`, writing its audit entry to `data/dryrun/External Interest Audit Log.md`. Re-run `dryrun prepare` to start over.

## Snapshot for skills and readers

After every change the app rewrites `docs/feedback/External Interest (generated).md`, a read-only markdown file in the old tracker layout. It contains the intro, Agent Stacks, the Pipeline Tracker (both tables and the Details rows), a Beta Cohorts section, and the per-company sections. `weekly-update`, `agentscore-roadmap-sync` and `share-to-pm-workspace` read it, and fall back to `External Interest.md` when the generated file is missing (which it is after cutover). `feedback-session-notes` writes through the CLI.

### Cutover

Once you have checked the import:

1. Archive `docs/feedback/External Interest.md`, for example as `docs/feedback/archive/External Interest (pre-app).md`.
2. Create `.env` in this folder with `FUNNEL_SNAPSHOT="/Users/a.demers/dev/Tricentis/AgentScore/docs/feedback/External Interest.md"`.
3. Run `bin/funnel export snapshot`. From then on the snapshot uses the old filename, so every skill that reads it keeps working.

You can also archive `Beta Cohorts.md`, the contacts CSV and the fit HTML; the app has their content. Don't re-run `pnpm db:import` after cutover. The source files would be stale (or be the snapshot itself), and the app's own changes would be lost.

## Backup and restore

```sh
bin/funnel backup                    # writes backups/funnel-<timestamp>.db (online backup, safe while the app runs)
```

The Exports page has the same button. To restore, stop the app, then copy the backup over `data/funnel.db` and delete `data/funnel.db-wal` and `data/funnel.db-shm` if they exist. `backups/` is not in git, so copy backups somewhere safe if you need them off this machine.

## Configuration

Environment variables, or a `.env` file in this folder:

| Variable | Default |
|---|---|
| `AGENTSCORE_REPO` | the parent folder (the AgentScore repo) |
| `FUNNEL_DB` | `data/funnel.db` |
| `FUNNEL_AUDIT_LOG` | `<repo>/docs/feedback/External Interest Audit Log.md` |
| `FUNNEL_MAIL_MERGE` | `<repo>/docs/feedback/email automation/external-interest-mail-merge.csv` |
| `FUNNEL_SNAPSHOT` | `<repo>/docs/feedback/External Interest (generated).md` |
| `PORT` | `4310` |

## Development

```sh
pnpm typecheck
```

Schema changes go in a new numbered file in `src/migrations/`; they run automatically when the database opens.
