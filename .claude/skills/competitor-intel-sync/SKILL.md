---
name: competitor-intel-sync
description: >-
  Run a weekly competitive-intelligence sweep on AgentScore's tracked
  competitors and write one digest for that week. Use this whenever the
  user wants to "check competitors", "run competitor research", "competitive
  intel", "what's new with our competitors", "weekly competitor digest",
  "see what Langfuse/Arize/Patronus/etc shipped", or otherwise wants a
  refresh on competitor product moves, customer sentiment, or adoption
  patterns - even if they just say "anything new in the eval space" or ask
  about one specific competitor by name. Reads the competitor list straight
  from docs/research/competitive-analysis-report.md, searches a deliberately
  varied mix of first-party, repository, independent-news, and practitioner
  sources, checks findings against the full digest history so old releases do
  not resurface, and writes docs/research/competitive-intel/YYYY-MM-DD.md
  named for the Monday of the week covered. Built to run unattended once a
  week (Monday morning cron) with no review gate, since it only ever adds or
  updates that week's research file. A manual request mid-week updates the
  same file instead of starting a new one.
---

# Competitor Intel Sync

Keep a running, de-duplicated record of what AgentScore's competitors are
doing, so nobody has to re-Google the same companies every week to notice
one of them shipped something that matters.

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
- **Output (one file per week):**
  `docs/research/competitive-intel/YYYY-MM-DD.md`, where the date is the
  Monday that opens the week covered (Monday through Sunday). The unattended
  Monday run covers the week that ended the day before, so a run on Monday
  2026-11-02 writes or updates `2026-10-26.md`. A manual run on Thursday
  updates the file for that week's Monday. Never open a second file for the
  same week.
- **Dedup corpus:** every earlier weekly Markdown file in
  `docs/research/competitive-intel/`. The point of this archive is cumulative
  memory: a release reported in a prior week is still old even if this week's
  file does not mention it yet. Exclude the target week file when building
  the corpus; if that file already exists, read it separately and add only
  genuinely new evidence. Do not rewrite settled findings.

## Workflow

### 1. Load the competitor list

Read `docs/research/competitive-analysis-report.md` and extract the
competitor names as described above. If the file has moved or the section
headings no longer match this pattern, say so and stop rather than guessing
- silently falling back to a stale hardcoded list would defeat the point of
  reading it fresh.

### 2. Build the seen-facts ledger

Read all earlier `YYYY-MM-DD.md` files in
`docs/research/competitive-intel/`, not just the latest one. Build a compact
working ledger with:

- normalized source URL (remove tracking parameters and fragments);
- release/version number, announcement title, or other stable event ID;
- the underlying claim in a short canonical form;
- event/publication date when the source provides one.

Deduplicate on the underlying event, not wording. A roundup, repost,
syndicated article, generic releases-page URL, or newly discovered source
about an already reported release does not make the event new. A later
version, material follow-up, changed pricing, newly named customer, or
substantive new evidence does.

If no earlier files exist, start with an empty ledger. If this week's file
already exists, read it too; update it only when this run finds genuinely new
evidence or a better specific source.

### 3. Search each competitor across source families

For each competitor, run web searches for:

1. **Updates/news** - product releases, changelog entries, funding,
   partnerships, pricing changes. Cover the week since the previous digest
   (Monday through Sunday for the unattended run). An older item may be
   included only if it has never appeared in the ledger and there is a clear
   publication/event date. Search the competitor's changelog,
   product blog, docs/release notes, pricing page, newsroom, and newsletter;
   then check relevant trade press and general tech/business news. For OSS
   products, inspect exact GitHub release/tag pages plus recent repository
   activity. Link to the specific release or post rather than a generic
   `/releases` or blog landing page whenever possible.
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

Use this source-family checklist for the sweep. It is a coverage guide, not a
reason to include low-quality claims:

1. **First-party product:** changelog, release notes, docs, blog, newsroom,
   pricing page, newsletter/RSS.
2. **Code and community:** GitHub Releases, tags, merged PRs, Discussions,
   issues, package registries, public Discord/forum pages.
3. **Independent reporting:** TechCrunch, VentureBeat, Business Wire/press
   release wires, analyst/trade publications, acquisition/funding databases.
4. **Practitioner conversation:** Hacker News, Reddit, Stack Overflow,
   public LinkedIn/X posts, engineering blogs, conference talks, podcasts,
   YouTube demos/webinars.
5. **Customer evidence:** named case studies, G2/Capterra reviews, integration
   partner stories, implementation write-ups, job posts that name the stack.

For each competitor, search at least one first-party source and one source
outside the vendor's own site. Across the whole run, inspect at least four
source families and report which families were checked. Do not let GitHub
Releases become the default answer for every OSS competitor: it is one source
family, not the entire sweep. If external sources have no credible new
evidence, say so instead of recycling a release.

Vary queries from the previous run. In addition to the competitor name, use
product aliases and intent terms such as `changelog`, `release notes`,
`pricing`, `customer`, `case study`, `migration`, `switched to`, `production`,
`evaluation`, `tracing`, `integration`, and `review`. Prefer date filters and
source-specific searches over broad result pages that tend to return the same
high-ranking links every day.

### 4. Apply freshness, evidence, and dedup gates

Keep a candidate only when all of these are true:

1. **New fact:** its stable event ID and underlying claim do not occur
   anywhere in the seen-facts ledger.
2. **Fresh enough:** it was published or materially updated during the week
   this file covers, or it is an older never-reported item whose date and
   relevance are explicit. Search-result recency is not evidence. A version
   already summarized in an earlier week is not fresh because a later tag
   notes it again.
3. **Specific source:** the link resolves to the exact release, article,
   review, thread, case study, or post supporting the claim. A generic landing
   page is insufficient when a permalink exists.
4. **Substantive:** it changes product capability, positioning, pricing,
   adoption evidence, or customer understanding. Patch churn and dependency
   maintenance belong only when they materially affect buyers or AgentScore.
   A security fix, a pricing change, or a new workflow qualifies. A docs-only
   patch, a dependency bump, or another tag in a range you are already
   summarizing does not.

When several releases in the same week are patch or minor tags from one
product, write one Update bullet for the range and name the capability
changes. Do not write one bullet per tag, and do not list version numbers
that added nothing a buyer would notice.

When uncertain, omit the candidate. A true "nothing new" week is more useful
than a digest padded with familiar facts.

If a competitor has nothing left after filtering, drop that competitor from
this week's digest entirely. Don't write an empty section or a "nothing new"
placeholder for it. A digest that's mostly empty sections is worse than a
short one, because it trains the reader to skim past sections instead of
trusting that everything present is worth reading.

### 5. Write the digest

Create or update `docs/research/competitive-intel/YYYY-MM-DD.md` for the
Monday of the week covered (make the directory if it doesn't exist yet):

```markdown
# Competitor Intel, week of YYYY-MM-DD

_Coverage: Monday YYYY-MM-DD through Sunday YYYY-MM-DD. Checked <N>
competitors across <source families>. Compared against <N> prior weekly
digests through <latest prior Monday>._

## <Competitor Name>
- **Update (YYYY-MM-DD):** <one-line bullet> ([specific source](url))
- **Customers love (YYYY-MM-DD):** <one-line bullet, specific feature/workflow named> ([specific source](url))
- **Using it for (YYYY-MM-DD):** <one-line bullet, concrete use case> ([specific source](url))

## <Next Competitor Name>
...
```

Use the source's event/publication date in each bullet, not the day it was
discovered. Only include the three sub-bullets that actually have new findings for that
competitor. A competitor with only a pricing update and nothing on
sentiment or usage that week gets the one bullet. Every bullet needs a
source link; a claim with no link isn't verifiable later and shouldn't ship.
When two independent sources materially strengthen an important claim, cite
both. Do not add a second citation that merely syndicates the first.

If, across every competitor, nothing new turned up at all, still write the
file with the heading, coverage line, and one sentence saying so. A future
reader scanning the directory should be able to tell "the sweep ran and
found nothing" apart from "the sweep didn't run."

### 6. Add the synthesis, only if something earns it

After the per-competitor sections, add a closing paragraph titled
`## So what for AgentScore` - but only when something in this week's findings
is actually competitively material: a real feature-parity gap opening or
closing, a pricing move that changes the comparison, or a customer pain
point that AgentScore already solves (cross-reference
`docs/research/competitive-analysis-report.md`'s "Capability Gaps" and
"Where AgentScore Differentiates Itself" sections if it helps you tell
material from routine). Keep it to 2-3 sentences. If nothing this week rises
to that bar, omit the section rather than manufacturing a takeaway from
routine releases. Forcing a "so what" every week is how these digests turn
into noise nobody reads.

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
were skipped as unchanged, which source families were inspected, and whether
a "So what for AgentScore" synthesis was included or omitted (and why, if
omitted). Point to the file path you wrote.
