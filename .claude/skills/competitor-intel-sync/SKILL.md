---
name: competitor-intel-sync
description: >-
  Run a daily competitive-intelligence sweep on AgentScore's tracked
  competitors and write a dated digest of what's new. Use this whenever the
  user wants to "check competitors", "run competitor research", "competitive
  intel", "what's new with our competitors", "daily competitor digest",
  "see what Langfuse/Arize/Patronus/etc shipped", or otherwise wants a
  refresh on competitor product moves, customer sentiment, or adoption
  patterns - even if they just say "anything new in the eval space" or ask
  about one specific competitor by name. Reads the competitor list straight
  from docs/research/competitive-analysis-report.md, searches the web for
  each one's recent product updates/news, what customers explicitly praise
  (G2, Capterra, Reddit, Hacker News, X/LinkedIn), and what customers are
  actually using it for, skips anything already reported in a prior digest,
  and writes docs/research/competitive-intel/YYYY-MM-DD.md - built to run
  unattended once a day (e.g. via the `loop` or `schedule` skill) with no
  review gate, since it only ever adds a new dated research file.
---

# Competitor Intel Sync

Keep a running, de-duplicated record of what AgentScore's competitors are
doing, so nobody has to re-Google the same nine companies every morning to
notice one of them shipped something that matters.

## Where things live

- **Competitor list (source of truth):**
  `docs/research/competitive-analysis-report.md`. Don't hardcode the
  competitor names in this skill - the list changes as the market does, and
  the doc is where the team already maintains it. Read it fresh each run:
  - Every `### <Name>` heading under `## Competitor Profiles` is a tracked
    competitor. Strip parenthetical qualifiers for the search query (e.g.
    "Arize AI (Phoenix + Arize AX)" → search as "Arize AI", but keep "Phoenix"
    and "Arize AX" in mind since news may be branded under either sub-product
    name) but keep the full heading text as the digest's section label.
  - The `### Also-competing (watch list)` section lists lighter-weight
    entries as `- **Name** - description` bullets. Treat each bold name as
    an additional competitor to check, same as the profiled ones - the doc
    distinguishes "profiled in depth" from "watching," not "matters" from
    "doesn't."
  - A competitor explicitly marked adjacent/non-head-to-head in its own
    profile (the doc does this for int4 TrustGate: "adjacent - AI TRiSM, not
    a head-to-head evaluator") still gets checked. Being adjacent affects
    how interesting a finding is, not whether you look.
- **Output (one file per run):**
  `docs/research/competitive-intel/YYYY-MM-DD.md`, dated by the day the
  sweep runs.
- **Dedup baseline:** the most recent existing file in
  `docs/research/competitive-intel/` (by filename date, not necessarily
  yesterday - the skill may not run every single day). If the directory
  doesn't exist yet or is empty, this is the first run: there's no prior
  digest to dedup against, so everything found is by definition new. Don't
  reach further back than the single most recent file - if something
  resurfaced that was reported two digests ago but not the last one, it's
  fair to resurface (it may reflect renewed momentum, and chasing multi-file
  history adds cost for little benefit).

## Workflow

### 1. Load the competitor list

Read `docs/research/competitive-analysis-report.md` and extract the
competitor names as described above. If the file has moved or the section
headings no longer match this pattern, say so and stop rather than guessing
- silently falling back to a stale hardcoded list would defeat the point of
  reading it fresh.

### 2. Load yesterday's (or the last) digest, if any

Find the most recent file in `docs/research/competitive-intel/` and read it.
This is your dedup reference for step 4 - keep the URLs/headlines it already
reported in mind as you search.

### 3. Search each competitor, three buckets at a time

For each competitor, run web searches for:

1. **Updates/news** - product releases, changelog entries, funding,
   partnerships, pricing changes. Bias toward the last 24-48 hours, but a
   slightly older item is fine to include if it's still new *to this
   digest* (e.g. the skill didn't run yesterday). Good query shapes:
   `"<name>" changelog OR "release notes" 2026`, `"<name>" funding OR
   partnership OR pricing`, plus news-site coverage (TechCrunch, VentureBeat,
   trade press). For competitors with a public GitHub repo (Langfuse, Comet/
   Opik, and others on the watch list are OSS), check the repo's Releases
   and Discussions tabs directly - GitHub often has the release before any
   blog post or news coverage picks it up.
2. **What customers love** - specific, recurring praise, not generic
   sentiment ("great tool!" tells you nothing; "cut our eval-writing time in
   half because of X" does). Search G2, Capterra, Reddit, Hacker News,
   X/LinkedIn: `"<name>" review site:g2.com`, `"<name>" reddit`, `"<name>"
   site:news.ycombinator.com`. For OSS competitors, GitHub Discussions and
   issue threads are often where the most specific praise (and complaints)
   actually live - a maintainer's response to "why we switched to X" is
   worth more than a star rating. A quote or close paraphrase naming the
   actual feature/workflow is worth including; a star rating alone is not.
3. **What customers are actually using it for** - concrete use
   cases/integrations/stack combos ("pairs it with LangGraph for agent
   tracing," "uses it as the eval gate in their CI"). This is different from
   bucket 2 even when the source overlaps - bucket 2 is *sentiment*, this is
   *behavior*. Search for integration announcements, case studies, and
   "how we use X" posts: `"<name>" case study`, `"<name>" "how we use"`. For
   OSS competitors, a repo's own "Used by" / dependents list, or GitHub
   issues where someone describes their setup, are direct evidence of real
   usage rather than a vendor's own marketing claim.

Treat each bucket as genuinely separate research, not one search reused
three ways - they tend to live on different kinds of pages (blog vs. review
site vs. case study vs. GitHub), and conflating them is how digests end up
thin on one bucket and padded on another.

### 4. Filter against the dedup baseline

Drop any item whose URL (or, if the URL differs but the substance is
identical - e.g. syndicated coverage of the same release - the underlying
fact) already appears in the digest you loaded in step 2. What's left is
what's actually new since last time.

If a competitor has nothing left after filtering, drop that competitor from
today's digest entirely - don't write an empty section or an "nothing new
today" placeholder for it. A digest that's mostly empty sections is worse
than a short one, because it trains the reader to skim past sections instead
of trusting that everything present is worth reading.

### 5. Write the digest

Create `docs/research/competitive-intel/YYYY-MM-DD.md` (make the directory
if it doesn't exist yet):

```markdown
# Competitor Intel — YYYY-MM-DD

## <Competitor Name>
- **Update:** <one-line bullet> ([source](url))
- **Customers love:** <one-line bullet, specific feature/workflow named> ([source](url))
- **Using it for:** <one-line bullet, concrete use case> ([source](url))

## <Next Competitor Name>
...
```

Only include the three sub-bullets that actually have new findings for that
competitor - a competitor with only a pricing update and nothing on
sentiment/usage that day just gets the one bullet. Every bullet needs a
source link; a claim with no link isn't verifiable later and shouldn't ship.

If, across every competitor, nothing new turned up at all, still write the
file, but keep it to a single line saying so - a future reader scanning the
directory should be able to tell "the sweep ran and found nothing" apart
from "the sweep didn't run."

### 6. Add the synthesis, only if something earns it

After the per-competitor sections, add a closing paragraph titled
`## So what for AgentScore` - but only when something in today's findings is
actually competitively material: a real feature-parity gap opening or
closing, a pricing move that changes the comparison, or a customer pain
point that AgentScore already solves (cross-reference
`docs/research/competitive-analysis-report.md`'s "Capability Gaps" and
"Where AgentScore Differentiates Itself" sections if it helps you tell
material from routine). Keep it to 2-3 sentences. If nothing today rises to
that bar, omit the section rather than manufacturing a takeaway from routine
news - forcing a "so what" every day is exactly how these things turn into
noise nobody reads.

### 7. Export this run as an AgentScore trace

This skill's own run can be dogfooded as a real traced agent in AgentScore,
without instrumenting the skill itself: `test-agent/export_claude_session.py`
reads the Claude Code session transcript this run just produced and replays
it as OTel spans (real tool calls, real token usage/cost) to AgentScore.

The script refuses a bare `--latest` (it once turned an entire multi-hour
session into one giant trace) - scope it with `--since`, read from the
shared marker `.claude/skills/agent-score-docs-sync/.last-exported.json` (a
session-id -> ISO-timestamp map, also written by the Stop hook that
auto-exports other sessions). Look up the current session id's entry:

```bash
cd /Users/a.demers/dev/Tricentis/AgentScore/test-agent
source venv/bin/activate
# If the current session id has an entry in .last-exported.json, use it:
python export_claude_session.py --latest --agent-name competitor-intel-sync --since <that timestamp>
# If it has no entry yet (nothing exported this session so far), export the whole thing instead:
python export_claude_session.py --latest --agent-name competitor-intel-sync --full-session
```

Requires the AgentScore ingest key set as an environment variable in
`test-agent/.env` (see the other skills' `.env` for the exact variable name)
- without it, spans print to the console instead of exporting. Run this
step automatically, once the digest is written - don't wait for the user to
ask. This step never blocks the sync: skip it only if the key isn't set.

Skip this step entirely if the run stopped early (competitor list couldn't
be loaded) - there's nothing meaningful to trace.

## Output

Finish with a short report: how many competitors had new findings, how many
were skipped as unchanged, and whether a "So what for AgentScore" synthesis
was included or omitted (and why, if omitted). Point to the file path you
wrote.
