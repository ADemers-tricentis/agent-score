---
name: weekly-update
description: >-
  Writes the AgentScore weekly leadership update. Use this whenever the user
  asks for a "weekly update", "weekly status", "leadership update",
  "stakeholder update", "weekly deck", or "who is using AgentScore". Reads
  only the named feedback, updates, and roadmap sources for the seven days
  ending on the run date, writes a slide-by-slide outline that mirrors the
  8-slide weekly deck to docs/decks/weekly-updates/weekly-update-outline.md,
  lists what changed since last week's deck, and after the user approves,
  copies last week's .pptx to a new dated file and changes only the text,
  numbers, and chart data that changed. Never edits last week's deck, does
  not commit, and does not update the source logs.
---

# Weekly update

Produce this week's AgentScore leadership deck by carrying last week's deck forward. The layout, card structure, fonts, and colors stay fixed. Only the facts change.

The deck answers four questions, in this order:

1. Who is using AgentScore right now, internal and external, kept separate.
2. What is stopping more customers from getting onboarded and to a score they can act on.
3. What feedback exists from people who have actually used it, and what accounts ask for most.
4. What the team is doing next: the roadmap priorities and this week's actions.

Audience is internal leadership. Voice is a status readout: a count, a name, a date, or a stated gap. In the outline, every line carries a citation: (path, date or as-of date). On slides, citations collapse into the grey sources line at the bottom of each slide. If a source does not say it, it does not go on a slide. Do not predict, and do not recommend beyond what a source already recommends.

## Workflow

1. **Find the decks.** In `docs/decks/weekly-updates/`, last week's deck is the newest `AgentScore weekly YYYY-MM-DD.pptx` (the date is that deck's window end). If none exists, use `AgentScore weekly.pptx`. This week's deck is `AgentScore weekly <this window end, YYYY-MM-DD>.pptx`. Ignore `~$` lock files.
2. **Read last week's deck.** Pull every slide's text by shape name (see Slide map). This is the baseline. A fact that is still true and still sourced stays word for word, including wording the user edited by hand last week.
3. **Read the sources** for this week's window (see Read these, and only these).
4. **Write the outline** to `docs/decks/weekly-updates/weekly-update-outline.md` (overwrite) using the skeleton below, and show it in chat. Every slot holds the exact slide text, then the citation.
5. **List the changes.** At the end of the outline, a "Changes from last week" table: slide, shape name, old text, new text, source. Slots that did not change are not listed. This table is the edit list for step 7.
6. **Stop for review.** Ask the user to approve or correct the change list before touching any .pptx. Do not create or edit the deck until they say go.
7. **Copy and update the deck** (see Updating the deck). Copy last week's file to this week's name, then edit only the shapes in the approved change list.
8. **Verify** (see Verify). Report the new file path and anything you could not fill. Do not commit.

## Week window

Week window: the 7 days ending on the run date, inclusive. The run date is today unless the user names a date. The header range on every slide is the window, month first: `Oct 29 - Nov 4, 2026`. The title slide's "Week of" date is the Monday of the week the deck is presented: the date the user names, otherwise the first Monday after the run date, written `November 9, 2026`. Also read the current-state tables even when their as-of date is older than the window, and print that as-of date with every number taken from them.

## Read these, and only these

- `docs/feedback/Beta Cohorts.md`: external invites and first sign-ins. This is the only source for "actively using" externally. "First sign-in: not yet" means "no sign-in reported." Do not upgrade it to "confirmed they have not logged in" or "in progress."
- `docs/feedback/External Interest.md`: only the stage definitions, the Cumulative table, the Current stage table, and the company rows whose Status is Pending beta, Invited to beta, Actively using, or Demo scheduled. Skip "likely use case," "known agent tooling," and the per-company research sections.
- `docs/feedback/Customer Feedback Log.md`: Recurring asks (open rows only) and Sessions entries dated inside the window. Use an older session only when an open High row cites it as the reason an account is blocked.
- `docs/feedback/feedback-sessions/`: open a session note only when the log entry is too thin for a claim you are about to make. One claim, one read.
- `docs/updates/`: every file dated inside the window (`docs/updates/YYYY-MM-DD Update.md` and `docs/updates/<Month> Updates/`). Pull attendees, decisions, named agents or accounts, and the action table with owners.
- `docs/updates/AgentScore Updates.md`: the newest dated entry only, for what shipped. Restate it in plain internal language.
- `docs/planning/roadmap/`: the newest roadmap file. If its status says draft, the What is next subtitle says "draft."
- Anything the user pastes or attaches in chat (an email, a screenshot, a count). Cite it as "(user, YYYY-MM-DD)". The user's pasted customer email is the preferred source for the feedback slide's left card.

Do not read the External Interest audit log, mail-merge CSVs, competitive research, or older updates to fill a thin week.

## Definitions

- External "using" = a row in `Beta Cohorts.md` with a first sign-in date, or a dated statement in a source that the account signed in. When the two disagree, the card says what was reported and the status line notes that the tracker needs the date. Invited, pending, replied, demo scheduled, and interested are earlier stages. Never call an invited company a user.
- Internal "using" = a named Tricentis agent that a dated update says is sending traces and getting a score. A leadership request to score an agent is demand, not usage.
- "Feedback from people using it" = statements from accounts that meet a "using" definition. Sales-call comments from accounts that have not signed in go into the top asks card only as counted asks, never as quotes on the left card.
- "Stopping onboarding" = a source ties a named account, or the invited cohort as a whole, to a concrete wall: no sign-in after an invite, a requirement the account says gates a trial (on-prem, data handling), or a stall after sign-in (nothing run, unclear next step). An open feature request with no account blocked by it this week does not go on this slide.
- "Top asks" = open High rows in Recurring asks (Feature Requests), ranked by the number of distinct accounts in "Sessions raised in." Meta (x2) counts as one account. Show up to six.
- "What is next" = the three priorities on slide 2's What is next card, each filled from the newest roadmap's theme text, plus this week's actions with owners from the dated updates. Roadmap items are candidates while the file says draft.

## The deck

Eight slides, in this order. Slide size 1440 x 810 pt. Every slide has the same header row: "AgentScore" (left), "Weekly update" (center), the window range (right). The user reorders or edits slides by hand between weeks. Always follow last week's actual slide order and wording, not this list, when they differ.

| # | Title | What it holds |
|---|---|---|
| 1 | AgentScore Weekly Update | "Week of" date. Footer: "Beta Cohorts and External Interest as of <Mon D, YYYY>." |
| 2 | This week in four answers | Four square cards: Who is using it, What is stopping onboarding, Feedback from people using it, What is next. Each card: blue label, one-line headline, then 2 or 3 bold-lead items. |
| 3 | Who is using it | Subtitle with the counts. Left column EXTERNAL CUSTOMERS: one card per signed-in account (name, blue status line, Use case / Still open or Status). Right column INTERNAL TRICENTIS AGENTS: one card for the scoring agent(s), one "Not scoring yet" card with one line per agent and its reason. Footer: invite split and pending beta. |
| 4 | What is stopping onboarding | Three cards: LACK OF CUSTOMERS, ON-PREM REQUIREMENT, SUSPECTED ONBOARDING DIFFICULTY. Each: headline, then 2 or 3 bold-lead items naming accounts. |
| 5 | 7 of 9 invited: no sign-in reported | Funnel picture (Interested, Replied, No reply, Demo scheduled, No demo, No follow-up, Invited, Live, Logged in - nothing run, No sign-in reported) with dark label boxes over it. Footer: who of the invited is where. |
| 6 | Signups: about 1 a day outside the three Transform events | Line chart of Labs form submissions per day, event callouts, dashed average line, footer with the totals. |
| 7 | Feedback from people using it | Left card: the newest direct feedback from a using account (quote as headline, their asks as a numbered list, a grey italic note on who and when). Right card: TOP ASKS ACROSS ACCOUNTS, up to six, each "Ask  N accounts" then the account names. |
| 8 | What is next | Three cards matching slide 2's What is next items (today: SIMPLER ONBOARDING, EVERY INTERNAL AGENT, SPIKES). Each: headline, then items such as what it is, where it stands, and "This week" with owners. Footer: other actions this week and other Now themes. |

The slide titles on 5 and 6 are claims. Rewrite the claim when the numbers change ("8 of 11 invited: no sign-in reported").

### Slide map (shape names)

Edit by shape name. Names repeat across slides, so always pass the slide index too.

- Every slide: header range is in `TextBox 4` (top right). Change it with a deck-wide find and replace of last week's range, never by name, because slide 6 has a second `TextBox 4`. Title `TextBox 5`, subtitle `TextBox 6`.
- Slide 1: `TextBox 6` "Week of", `TextBox 9` footer.
- Slide 2: `Card N label`, `Card N headline`, `Card N body` for N = 1 to 4. `Sources`.
- Slide 3: `Ext 1 name|status|body`, `Ext 2 name|status|body`, `Int 1 name|status|body`, `Int 2 name|status|body`, column labels `TextBox 22` and `TextBox 23`, footer `TextBox 21`.
- Slide 4: `Card N label|headline|body` for N = 1 to 3. `Sources`.
- Slide 5: `Title`, `Kicker`, `Foot`. Funnel counts in the label boxes `Shape_2` (Interested) to `Shape_11` (No reply). Each box text is "Label" + line break + count.
- Slide 6: `TextBox 5` title, `TextBox 4` subtitle (the one at top 133), `Chart 7`, event callouts `TextBox 8|9|10`, dashed-line note `TextBox 11`, footer `TextBox 12`.
- Slide 7: `Left label|headline|body|note`, `Right label|headline|body`, footer `TextBox 16`.
- Slide 8: `Card N label|headline|body` for N = 1 to 3. Footer `TextBox 27`.

If a name is missing (the user rebuilt a slide), list that slide's shapes and match by position and text, then say so in the report.

## Outline skeleton

Use this shape. Fill every slot with the slide text exactly as it will appear, then the citation in parentheses. Keep last week's wording for any slot whose facts did not change.

The outline must have the same sections, slot names, and order as the skeleton, every week. Read the existing `docs/decks/weekly-updates/weekly-update-outline.md` before writing. It is last week's filled-in outline and the reference for level of detail and wording. Match it section for section, then overwrite it. If last week's deck and last week's outline disagree, the deck wins: the user edits the deck by hand, so read the slide text, not the old outline, for the baseline. Section headings and labels are plain text (no bold). Write `Lead: detail`, not `**Lead** detail`.

```markdown
# AgentScore weekly
Window: YYYY-MM-DD to YYYY-MM-DD
Last week's deck: docs/decks/weekly-updates/<file>
This week's deck: docs/decks/weekly-updates/AgentScore weekly YYYY-MM-DD.pptx
Beta Cohorts as of: YYYY-MM-DD. External Interest counts as of: YYYY-MM-DD.
Counts were not refreshed this week.   <!-- only when the newest tracker as-of date is older than the window -->

## 1. Title
Week of: Month D, YYYY
Footer: Beta Cohorts and External Interest as of Mon D, YYYY. (paths, as-of)

## 2. This week in four answers
### Who is using it
Headline: N customer live, N internal agent scoring
- External: <one line per signed-in account> (path, date)
- Internal: <scoring agents>; <agents in progress> (path, date)
### What is stopping onboarding
Headline: <one-line claim>
- <Lead>: <detail> (path, date)   <!-- 2 or 3 items, same leads as slide 4 -->
### Feedback from people using it
Headline: <one-line claim>
- <Lead>: <detail> (path, date)
### What is next
Headline: <one-line claim>
- <Priority>: <detail> (roadmap path, date)   <!-- same three as slide 8 -->
Sources: <one line>

## 3. Who is using it
Subtitle: N external accounts signed in, N internal agent scoring. As of Mon D
### External customers
- <Account> | status: <line> | Use case: <line> | Still open or Status: <line> (path, date)
### Internal Tricentis agents
- <Agent> | status: <line> | <Lead>: <line> (path, date)
- Not scoring yet | status: <line>
  - <Agent>: <reason> (path, date)
Footer: External: N of N invited have no sign-in reported. Invited Mon D: <names>. Invited Mon D: <names>. Pending beta: <names>. Internal: <sessions>.

## 4. What is stopping onboarding
Subtitle: <one line>
### Lack of customers
Headline: <claim>
- <Lead>: <detail> (path, date)
### On-prem requirement
Headline: <claim>
- <Lead>: <detail> (path, date)
### Suspected onboarding difficulty
Headline: <claim>
- <Lead>: <detail> (path, date)
Sources: <one line>

## 5. Funnel
Title: N of N invited: no sign-in reported
Kicker: No response. Companies, as of Mon D
Counts: Interested N, Replied N, No reply N, Demo scheduled N, No demo N, No follow-up N, Invited N, Live N, Logged in - nothing run N, No sign-in reported N (path, as-of)
Footer: <who of the invited is where>

## 6. Signups
Title: <claim>
Subtitle: Lack of signups. Labs form submissions per day (people, not companies), Mon D - Mon D
Data range: Mon D - Mon D. New days since last deck: <dates and counts, or "none">
Event days: <name (Mon D): N>. Average outside event days: N a day. Overall: N a day.
Footer: <totals line>

## 7. Feedback from people using it
Subtitle: <one line>
### Left: <Account>, <source type>
Label: <ACCOUNT, SOURCE TYPE>
Headline: "<quote>"
- <their asks, numbered>
Note: <who, when, constraints>
### Right: Top asks across accounts
Label: TOP ASKS ACROSS ACCOUNTS
Headline: <claim>
- <Ask>  N accounts: <names> (Customer Feedback Log, row)
Footer: <sources line>

## 8. What is next
Subtitle: The three priorities from the <draft> roadmap (Mon D), with this week's actions
### <Priority 1>
Headline: <claim>
- <Lead>: <detail> (roadmap path, date)
- This week: <action, owner> (update path, date)
### <Priority 2>
Headline: <claim>
- <Lead>: <detail> (path, date)
- This week: <action, owner> (update path, date)
### <Priority 3>
Headline: <claim>
- <Lead>: <detail> (path, date)
- Why now: <reason> (path, date)
Footer: Also this week: <other actions with owners>. Also on Now: <other Now themes>.

## Changes from last week
| Slide | Shape | Old | New | Source |
|---|---|---|---|---|
```

## Updating the deck

Use the PowerPoint MCP tools (`ppt_*`). Pass the deck's full path as `presentation` on every call.

1. Copy the file with `cp` (last week's file stays untouched), then `ppt_open_presentation` on the copy.
2. Header range: `ppt_find_replace_text` with last week's range, then each old date that changed. Dates are month first everywhere: `Nov 4`, `Oct 29 - Nov 4, 2026`, `Nov 4, 2026`.
3. Text slots: `ppt_set_text` with `runs`, giving every run its font and color, because plain `text` flattens a box to one run. For a one-word or one-number change inside a box, use `search_text` so the rest of the box keeps its formatting.
4. Funnel counts (slide 5): change only the number after the line break in each `Shape_N` box with `search_text`, and keep the number bold. The funnel itself is a picture. If its stage counts changed, the picture is stale: say so in the report and ask the user for a new image. Do not redraw it.
5. Signup chart (slide 6): append new days with `ppt_set_chart_data` only when a source gives dated counts past the chart's last day. Move the event callouts and the dashed average only if the numbers changed. If the chart's value-axis numbers disappear or turn dark, they need an explicit grey text color in the chart XML (`c:valAx/c:txPr`, color C7D2E3), which the MCP tools cannot set. Close the deck, patch the XML, then reopen it.
6. A new card or item: copy an existing card's shapes (`ppt_duplicate_shape`), rename the copies right away by index (copies keep the source's name), then set the text. Do not add a fifth card to a row. Drop the lowest-priority item instead and note it in the report.

### Format rules

These are the format the user approved. Keep them. Do not restyle.

- Font Aptos everywhere. Background black with the blue glow picture (`Picture 1`) at the right.
- Title 36pt bold white. Subtitle 18pt blue #2D8FCF. Header row 12pt.
- Cards: rounded rectangle, fill #050505, white 1.25pt outline, corner radius about 12pt.
- Inside a card: label 15pt bold blue caps. Headline 22pt bold white, at most 2 lines. A thin blue line (#2D8FCF, 1pt) under the headline. Items: bold white 18pt lead, then a line break, then 17pt detail in #C7D2E3. 14pt space after each item. No bullets. Grey notes 15pt italic #9A9A9A.
- Sources line: 15pt grey #9A9A9A, below the cards.
- Writing: no em dashes (use a hyphen or a colon). Month-first dates. Counts as numerals.

## Verify

- Export each changed slide with `ppt_export_images` (to the scratchpad) and look at it. This PDF render is the only trustworthy check. officecli's HTML preview hides font problems.
- Text must sit inside its card. If a card overflows, make all cards in that row the same new height, move the sources line down, and keep it above y 760. If it still does not fit, shorten the wording.
- `ppt_check_layout` reports to ignore: overlaps with `Picture 1` (the glow is meant to sit behind text), and "#000000 low contrast" on card bodies (the line-break characters; the export shows the text is fine).
- Save with `ppt_save_presentation`. Then report: the new file path, the change list as applied, any slot left as "not in the sources," and anything that needs the user (a new funnel image, a tracker date that disagrees).

## Before writing, check

Drop any line you cannot point at a line you read. If two sources disagree, print both in the outline with their dates and do not pick a winner. On the slide, say what was reported and note that the tracker needs updating. If the newest tracker as-of date is older than the window, the outline header says the counts were not refreshed this week, and the title slide footer keeps the older as-of date.
