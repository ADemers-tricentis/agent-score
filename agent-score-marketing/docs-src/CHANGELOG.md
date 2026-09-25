# Changelog

All notable changes to the AgentScore docs site are recorded here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [0.38.0] - 2026-09-25

### Added
- Ask the Assistant: new page documenting the tenant-scoped chat (reads
  freely, only writes by starting a scoring run, and asks first) - a
  brand-new nav item and per-agent "Ask the assistant" entry point.
- Scoring Engine Settings: documented the real **Usage & cost** page
  (traces, tokens in/out, usage cost, eval results, scoring runs, profile
  fits, eval cost in credits, Export to Excel) and the per-agent **Cost**
  section (input/output $ per 1M tokens) that feeds it.
- Welcome, Glossary, Scoring Over Time: documented **AI credits** - the
  header balance that gates billable actions (scoring) when exhausted.
- Reading Your Scorecard: documented per-agent verdict-band overrides
  (Settings tab, with "Reset to profile defaults").
- Dimensions & Profiles: documented the manual "Change profile" /
  "Re-evaluate fit" controls on the Profile tab, alongside the existing
  automatic first pick.

### Changed
- Welcome: swapped the hero screenshot and copy from the old card-grid
  dashboard to **Home**, the actual landing page (tour banner, real-agent/
  interaction/scoring-run tiles, verdict trend, removable example agents).
- Scoring Engine Settings: judge-model provider/model/region is now
  self-serve per agent (Settings tab → Model connection) - removed the
  "ask the Agent Score team" framing. Glossary's "Judge model" entry
  updated to match.
- Scoring Over Time: relocated the "what it looks like in the product"
  screenshot from a since-retired "Activity" tab to the Score tab's own
  **Score over time** section, where that content actually lives today.
- Connect Your Agent: "+ Add agent" → "**+ Connect Agent**" (button label
  only; the wizard content is unchanged and still matches).

### Fixed
- Welcome, Glossary: removed remaining stale "a letter grade" / "grade"
  references missed in the 2026-08-27 pass (Welcome's hero paragraph and
  the "Decide" step, Glossary's Scorecard definition).

### Not changed (see drift log)
- Verdict-tier labels ("Needs work" / "Don't ship (recommended)") are
  unchanged - re-confirmed correct against the live product for the 5th
  audit in a row. The Profile tab's "The bar" table is still the stale
  surface (product-should-catch-up); do not flip the docs to match it.

## [0.37.0] - 2026-09-08

### Added
- Dimensions & Profiles, Meet Your Agent Card, Glossary: documented the
  rebuilt profile catalog - Grounded Answerer, Summarizer, Tool Caller, Task
  Agent, Conversational Assistant, Policy Guardrail, and General Answerer
  (the renamed fallback, was "General Starter").

### Removed
- The old profile catalog (RAG, Computer-Use, Conversational,
  Tool-Orchestrator, Code, Structured-Generation, EvalClaw), replaced
  wholesale in the product, not extended.

### Changed
- Dimensions & Profiles: swapped the Profile-tab screenshot to a live capture
  of the General Answerer profile (the old one showed the now-retired RAG
  Starter profile).

## [0.36.0] - 2026-08-27

### Added
- Connect Your Agent: documented the in-app **Connect an agent** wizard
  (Agents page → + Add agent) - pick a tenant, see its ingest key, and get
  the exact exporter configuration to paste in - with a genuine screenshot.
  This closes an onboarding-entry-point gap first flagged, but not yet
  fixed, on 2026-08-26.
- Reading Your Scorecard: documented the predictive score range and
  "close to the line" callout that appears when a score is near a verdict
  boundary.

### Fixed
- Reading Your Scorecard, Glossary: corrected the verdict names to match
  the live product - "Ship with note" (was "Ship (with note)"), "Needs
  work" (was "Review required"), and "Don't ship (recommended)" (was
  "Block recommended"). Ship and Block are unchanged.
- Connect Your Agent: corrected the reason for using the `_TRACES_`-suffixed
  OTel variables - it prevents the ingest path from being appended twice,
  not (as previously stated) separating traces from logs/metrics.
- Meet Your Agent Card: corrected a screenshot caption quote from
  "Synthesized by the judge model" to "Synthesized by the model," matching
  the real product copy.

## [0.35.0] - 2026-08-26

### Added
- Dimensions & Profiles: documented **General Starter**, the fallback profile
  brand-new agents are scored against before enough behavioral evidence
  exists for a specific profile match - previously undocumented despite being
  the first profile most freshly-connected agents actually get.

### Fixed
- Glossary: corrected the "Judge model" definition, which claimed provider
  choice is self-serve - it contradicted Scoring Engine Settings' own
  (already-accurate) statement that it isn't yet.
- Welcome, Connect Your Agent, Reading Your Scorecard, Scoring Over Time, Meet
  Your Agent Card: refreshed five screenshots that were stale by one sidebar
  icon - the customer app added a fourth nav-rail item (Docs) since these were
  last captured.

## [0.34.0] - 2026-08-24

Note: the sidebar version badge jumps from 0.5.0 to 0.34.0 in this release -
by request, it now tracks the AgentScore product's own alpha version rather
than the docs site's independent semver.

### Added
- Connect Your Agent: documented the real internal-agent onboarding process
  (identify the service name in BetterStack, register it in the Back Office's
  Ingestion > Stream > Configuration, confirm the pull, check the resolved
  agent), replacing the inaccurate "ingested automatically, nothing to
  configure" claim. Added two real screenshots: the `service.name` attribute
  in a BetterStack trace, and the Back Office Configuration screen.
- Building a Custom Eval: documented the real **Runner** tool (pick an eval,
  tenant, and agent; run against already-captured traces) with a genuine
  screenshot, as the actual way to test an eval before trusting it.
- The Evaluation Catalog: added a missing real screenshot for the Library
  eval type (previously had none).

### Changed
- Welcome, Connect Your Agent, Reading Your Scorecard, Scoring Over Time, The
  Evaluation Catalog, Building a Custom Eval: replaced eight stale or
  design-prototype screenshots (`agents-cards`, `integrations-tab`,
  `scorecard-tab`, `activity-tab`, `catalog-door`, `entry-doors`,
  `studio-geval`, `studio-hybrid`) with genuine current-build captures, and
  corrected the alt/caption text to match what's actually shown (dropped a
  fictitious Runs-table Change/Revision column, a "61/100, Needs work, 24
  below" framing that doesn't reflect the real Score tab, and stale eval
  counts).
- The Evaluation Catalog, Building a Custom Eval: removed claims of a docked
  "Live preview" panel (a real-time score gauge, PASS/FAIL, Agree/Disagree,
  and a version-diff/"what the judge saw" transparency panel) that could not
  be found anywhere in the current Builder after checking three separate
  surfaces (the eval detail modal, the Builder editor, and the Runner tool).
  "Nothing changes silently" is now "Versions are immutable" and only claims
  the confirmed-real behavior (publishing creates a new immutable version;
  past grades stay attributed to it).
- The Evaluation Catalog, Building a Custom Eval: added explicit framing that
  the catalog, builder, and runner live in Agent Score's Back Office and are
  operated by the Agent Score team on a customer's behalf, not a customer
  self-serve surface - the previous prose read as if the customer clicked
  through these tools directly.

### Removed
- Building a Custom Eval: the inline trace-picker and version-diff/
  transparency-panel screenshots and their accompanying claims (see Changed).

## [0.5.0] - 2026-08-18

### Added
- Connect Your Agent: documented self-serve ingest key management (create,
  rotate, revoke from Integrations), a real screenshot of that page, and the
  Tricentis-VPN-only network requirement.
- Connect Your Agent: exact OTel env var names and bearer-token header format
  for external agents.
- Scoring Over Time: exact schedule constraints (60-minute minimum cadence,
  1-90 day lookback) and the per-agent "Autonomous scoring" toggle.

### Changed
- Connect Your Agent: replaced the fictitious "Collecting data" state with the
  real agent states (Setting up -> Learning your agent (n/20 traces) -> Scored
  / Needs attention).
- Scoring Engine Settings: relocated pass-threshold guidance to the Profile
  tab (where it actually lives) and reframed judge-model choice and the usage
  log as Agent-Score-managed today rather than self-serve.
- Meet Your Agent Card: replaced a design-prototype screenshot (mislabeled as
  "an actual Agent Card") with a real screenshot from production, and removed
  the claim that a latency/cost envelope ships today - that's a designed but
  unbuilt feature, logged as a product gap instead.

### Fixed
- Dimensions & Profiles: added plain-language glosses for all 11 dimensions,
  rewritten to avoid two wording collisions in an internal prototype's label
  set (Relevance/Reliability, Safety/Groundedness both said "grounded").
