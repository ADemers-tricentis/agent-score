# Changelog

All notable changes to the AgentScore docs site are recorded here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased] - 2026-08-18

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
