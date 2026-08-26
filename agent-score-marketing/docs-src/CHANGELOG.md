# Changelog

All notable changes to the AgentScore docs site are recorded here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

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
