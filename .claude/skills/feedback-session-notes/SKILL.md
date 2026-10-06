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
  Log.md, updates docs/feedback/External Interest.md (tracker row and
  per-company section), and updates docs/feedback/email
  automation/external-interest-contacts.csv - after a review gate, since it
  writes to four tracked files.
---

# Feedback Session Notes

Turn one call transcript into a debrief note and keep the tracking docs consistent with it.

## Input

- A transcript: a file path (VTT, txt, md) or text pasted into chat.
- Infer from the transcript where possible; ask only for what is missing: **company name**, **session date**, and **session type** (Labs beta onboarding, partner/SI, POC scoping, intro, other).
- Auto-diarized transcripts mishear names. Correct names against speaker labels and note the corrections in a short italic line in the debrief, as `Aptiv Feedback Session.md` does.

## Step 0 - Read before writing

Read 2-3 recent notes in `docs/feedback/feedback-sessions/` (e.g. `Eaton`, `Love's`, `Aptiv`) and copy their exact section structure, heading style, bold-label header block, and level of detail. Read the top of `docs/feedback/Customer Feedback Log.md` (Recurring asks, newest Sessions entries, and the "Template for new entries" at the bottom), the company's existing section in `docs/feedback/External Interest.md` if any, and `docs/feedback/email automation/external-interest-contacts.csv`.

Never invent facts. If the transcript does not support a section, omit it or mark it "not discussed".

## Step 1 - Draft all edits (no writes yet)

Prepare, in memory:

1. **Session note** for `docs/feedback/feedback-sessions/<Company> Feedback Session.md` (same format as existing notes).
2. **Customer Feedback Log** changes:
   - A new entry at the top of `## Sessions` (newest first), following the template at the bottom of the file, with a **Full debrief** link to the new note (URL-encode spaces as `%20`).
   - `## Recurring asks` updates: if an ask matches an existing item, add the company and bump any count; if new, add it under the right subsection (Feature Requests / Messaging & Positioning / Business & Partnership).
3. **External Interest** changes: the company's Pipeline Tracker row and per-company section. If the company is not in the tracker, add it following the existing format.
   - Keep the Status cell plain, no qualifiers. Put "waiting on" notes in the company section.
   - The Demos count is cumulative. Never decrement it.
4. **Contacts CSV** changes, using the existing columns: Company, Name, Email, Status, Signup Date, Email Sent Date, Beta Scheduled Date, Follow-up Sent Date.
   - Update existing rows rather than adding duplicates.
   - Never guess emails. Leave the cell blank if it is not in the transcript.

## Step 2 - Review gate

Show the user a summary of the planned edits to all four files: the session note outline, new or updated recurring asks, the tracker status change, and the contact rows. Wait for approval. Apply requested changes before writing.

## Step 3 - Write

Apply the approved edits **one file at a time** (never parallel edits to the same file). Then give a short report of what changed in each file.

## Rules

- Do not commit. Wait for the user to say so.
- Use hyphens, never em dashes.
- Fix typos silently; do not list them.
