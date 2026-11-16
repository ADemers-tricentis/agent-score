---
name: feedback-session-notes
description: >-
  Turn a customer call transcript into a feedback-session debrief and
  propagate the findings to the tracking docs. Use this whenever the user
  pastes a transcript or gives a transcript file path (VTT, txt, md) and
  wants "feedback session notes", a "debrief", or to "log this call", or
  otherwise process a customer/prospect/partner call into
  docs/feedback/. Creates docs/feedback/feedback-sessions/<Company> Feedback
  Session.md in the same format as the existing notes, adds a new session
  entry and updates Recurring asks in docs/feedback/Customer Feedback
  Log.md, and updates the company in the interest-funnel app (stage,
  contacts, notes, link to the debrief) through its CLI - after a review
  gate, since it writes to two tracked files and the app.
---

# Feedback Session Notes

Turn one call transcript into a debrief note and keep the tracking docs consistent with it.

## Input

- A transcript: a file path (VTT, txt, md) or text pasted into chat.
- Infer from the transcript where possible; ask only for what is missing: **company name**, **session date**, and **session type** (Labs beta onboarding, partner/SI, POC scoping, intro, other).
- Auto-diarized transcripts mishear names. Correct names against speaker labels and note the corrections in a short italic line in the debrief, as `Aptiv Feedback Session.md` does.

## The interest-funnel app

External interest (companies, contacts, stages, research) lives in the interest-funnel app, not in markdown. Read and write it only with its CLI, `/Users/a.demers/dev/Tricentis/AgentScore/agentscore-interest-funnel/bin/funnel` (`funnel` below). Never edit the database, `docs/feedback/External Interest.md` (the pre-app tracker, kept for reference) or `docs/feedback/External Interest (generated).md` (a read-only snapshot the app rewrites after every change). The contacts CSV `docs/feedback/email automation/external-interest-contacts.csv` is retired; don't write to it. Every command prints JSON; on failure it prints `{"error", "code"}` and exits 1. `funnel help` lists every command.

## Step 0 - Read before writing

Read 2-3 recent notes in `docs/feedback/feedback-sessions/` (e.g. `Eaton`, `Love's`, `Aptiv`) and copy their exact section structure, heading style, bold-label header block, and level of detail. Read the top of `docs/feedback/Customer Feedback Log.md` (Recurring asks, newest Sessions entries, and the "Template for new entries" at the bottom). For the company, run `funnel company find <name>`, then `funnel company show <id>` for its stage, contacts, touchpoints and research.

Never invent facts. If the transcript does not support a section, omit it or mark it "not discussed".

## Step 1 - Draft all edits (no writes yet)

Prepare, in memory:

1. **Session note** for `docs/feedback/feedback-sessions/<Company> Feedback Session.md` (same format as existing notes).
2. **Customer Feedback Log** changes:
   - A new entry at the top of `## Sessions` (newest first), following the template at the bottom of the file, with a **Full debrief** link to the new note (URL-encode spaces as `%20`).
   - `## Recurring asks` updates: if an ask matches an existing item, add the company and bump any count; if new, add it under the right subsection (Feature Requests / Messaging & Positioning / Business & Partnership).
3. **App changes** for the company, as a list of `funnel` commands:
   - Company not in the app: `funnel company add --name "<Company>" --source sales|referral --detail "<who brought it in>" --date YYYY-MM-DD`. Use `--source form` only if they came through the Labs form.
   - The call itself: `funnel touchpoint add --company <id> --kind demo_scheduled --date <session date> --source manual --note "<session type>"` for a demo or onboarding call. The app moves the company forward to Demo scheduled if it isn't there yet and never moves it back, so the counts stay cumulative on their own.
   - A later stage the call establishes: `funnel stage set --company <id> --stage pending_beta|invited_to_beta --date YYYY-MM-DD`, or `funnel signin add --company <id> --person <email> --date YYYY-MM-DD --kind reported_use` when they say they are already using it. Never move a company backwards. If the call really does call for it (for example they are not a fit), propose it in the review gate with a reason and pass `--reason`.
   - Attendees: `funnel contact add --company <id> --name "<Name>" [--email <email>] --role demo_contact`. Never guess emails; leave `--email` off if it is not in the transcript. The app does not duplicate a contact who is already there.
   - "Waiting on" items and anything a reader needs: `funnel research add --company <id> --field waiting_on --body "<text>"`, or `funnel note add --company <id> --body "<text>"`. Keep the stage plain, with no qualifiers.
   - Link the debrief: `funnel link add --company <id> --kind feedback_session --label "<Session type> <date>" --path "docs/feedback/feedback-sessions/<Company> Feedback Session.md"`.

## Step 2 - Review gate

Show the user a summary of the planned edits: the session note outline, new or updated recurring asks, and the app commands (stage change, contacts, notes, link). Wait for approval. Apply requested changes before writing.

## Step 3 - Write

Apply the approved edits **one file at a time** (never parallel edits to the same file), then run the app commands in order. If a command fails, stop and report the error rather than working around it. Then give a short report of what changed in each file and in the app (`funnel company show <id>` confirms the result).

## Rules

- Do not commit. Wait for the user to say so.
- Use hyphens, never em dashes.
- Fix typos silently; do not list them.
