# AgentScore Market Traction Update — Deck Outline

Audience: internal Tricentis leadership. Purpose: executive alignment on pipeline momentum, the value hypothesis, and what customers are telling us — not a pitch deck. Target length: 7-9 slides.

Data as of 2026-09-23 (Pipeline Tracker) and the Customer Feedback Log. Status values below are plain per the tracker convention — qualifiers/dates live in the "Note" column, not the Status cell. Demo/pipeline counts are cumulative.

---

## Slide 1 — Title / Framing

**AgentScore Market Traction Update**
Pipeline momentum, a validated value hypothesis, and voice-of-customer signal — aligning on next steps.

- Why now: pipeline has moved from cold inbound to 5 companies in Pending Beta and a marquee account (Meta) stalled on an engineering decision we control the timeline on. This is a checkpoint to align on where to lean in.
- Presented by: [name] · [date]

---

## Slide 2 — Pipeline Overview

**Funnel (cumulative):**

| Interested | Replied | Demos | Pending Betas | Active Betas |
|---|---|---|---|---|
| 73 | 12 | 10 | 5 | 0 |

**Advanced pipeline (Replied or better):**

| Company | Status | Source | Note |
|---|---|---|---|
| Aptiv | Pending Beta | Labs form | Needs onboarding checklist before their architecture review board |
| Tritusa Consulting | Pending Beta | Labs form | Compliance-flagging position + co-sell answer still open |
| Wolters Kluwer | Pending Beta | Labs form | Waiting on pilot tenant access + bulk-scoring date |
| L'Oreal | Pending Beta | Labs form | Waiting on a demo video for his manager |
| Accenture (multi-entity) | Pending Beta | Labs form | Scoping a beta on Meta's behalf; needs on-prem AWS setup |
| Eaton | Demo Scheduled | Referral (VP of AI/ML) | — |
| Meta Platforms | Demo Scheduled | Sales | Overdue AWS/judge-LLM confirmation; competing partner circling |
| Workday | Demo Scheduled | Labs form | Category-framing gap, no next call committed — ours to fix |
| BearingPoint | Demo Scheduled | Labs form (partner) | Awaiting their manager's decision to add agents to beta |
| Merito Solutions | Demo Scheduled | Labs form | — |
| Freddie Mac | Replied | Sales | — |
| Stanza | Replied | Labs form | — |

*55 additional companies remain earlier-stage (Email sent / Follow-up sent), not itemized here.*

---

## Slide 3 — Use Cases (Beta / POC-Scoped Customers)

- **Aptiv** — Replace manual evaluation of production supply-chain/component-engineering agents (Gemini/ADK) as they stand up an agentic-AI operating model from scratch.
- **Tritusa** (SI/partner) — Score client-built agents (Copilot Studio, AI Workspace MCP+A2A) and arm their own evals-and-assurance advisory practice.
- **Wolters Kluwer** — Score agents built outside the Tricentis ecosystem (internal platform, GitHub Copilot) for fleet-level, shared-yardstick ownership.
- **L'Oreal** — Replace a fully manual reconciliation-agent eval workflow (run prompt → open dashboard → hand-compare accuracy/tokens/latency).
- **Accenture (for Meta)** — Delivery/SI partner building a POC on Meta's underused Tosca footprint to evaluate Meta's autonomous supply-chain agents.
- **Meta** — Owns Meta's autonomous supply-chain program; needs to test 4-5 production agents (order management flagship) as manual self-testing is retired.
- **BearingPoint** (partner) — Evaluate their own QTest ATC agent, and build a client-facing "how do you know the agent works" answer ahead of their GenAIQ launch.
- **Workday** — Evaluating Workday Build + Salesforce Agentforce agents; stalled on category framing, not capability.

---

## Slide 4 — Top Feature Requests

| Theme | # Companies | Who | Our take |
|---|---|---|---|
| Scenario bank / simulation testing | 3 | Meta, L'Oreal, Tritusa | High priority — Meta calls it the deciding roadmap gap; live deal-blocker, not a nice-to-have |
| Fleet-level / group agent scoring | 3 | Meta, Wolters Kluwer, Aptiv | High priority — repeated ask from our largest accounts; matches our "shared yardstick" positioning |
| Cost/token report per agent | 3 | L'Oreal, Tritusa, Meta | Urgent — described as working on sales calls but not actually shipped; close this gap before it costs us trust |
| RBAC / self-service onboarding | 2 | Wolters Kluwer, L'Oreal | Medium — adoption friction, workaroundable manually short-term |
| Bulk / programmatic trace export | 2 | Wolters Kluwer, Tritusa | Medium — needed to scale betas, not a blocker to start one |
| Alerting on agent degradation | 2 | Tritusa, Aptiv | Medium — strengthens the production-monitoring story, not beta-blocking |
| Judge/evaluator pointed at customer's own LLM | 1 | Meta | High for this deal specifically — gating requirement for Meta's self-hosted deployment; low general reuse |
| Compliance validation (regulated data) | 1 (Tritusa) + ICP pattern | Tritusa; echoed by Aptiv (automotive safety), LGT (banking), Regeneron (pharma) | Medium-high — narrow today, but matches a recurring regulated-industry pattern across the pipeline |
| Expose non-deterministic run-count setting | 1 | BearingPoint | Low effort / quick win |
| Visibility into Tricentis's own agents for partner proof | 1 | BearingPoint | Low priority — conflicts with IP protection; needs a product/legal call, not just engineering |
| Partner co-sell motion | 1 | Tritusa | Medium — a business-motion ask for Alliances, not Product |

---

## Slide 5 — Value Hypothesis

- **Core thesis** (validated framing, reused from the Business Case deck): AgentScore turns "does the agent work?" from a gut call into a defensible verdict — root-cause attribution to the tool-call level, a shared yardstick for fleet-level agent ownership, zero-setup coverage, and third-party evidence resale-partners can put in front of their own clients.
- **Signal backing it up:**
  - Fragmented AI ownership with no shared way to validate agent behavior — Freddie Mac's stated pain, directly.
  - Fleet-level scoring demand from our largest accounts (Meta, Wolters Kluwer, Aptiv).
  - A resale channel forming organically: Tritusa, BearingPoint, Accenture, and Capgemini all want to use AgentScore as proof-of-quality for their own clients.
- **Caveat:** the Business Case deck's dollar-sizing (≈2.3 significant AI errors/quarter at $50K-$2.1M each; ~$14K/employee/yr verifying outputs) is still hypothesis-stage — no customer has validated those numbers yet. Present it as a hypothesis, not a proof point.
- **Also flag:** that deck's pipeline stats (74 interested / 5 demos / 1 pending beta) are stale against today's numbers on Slide 2 — recommend a refresh pass on that deck separately.

---

## Slide 6 — Risks, Gaps & Asks of Leadership

- **Meta** — Overdue AWS self-host + internal-judge-LLM engineering confirmation, already past the partner's own target date; a competing partner is circling the account. **Ask: leadership push to fast-track the engineering decision this week.**
- **Aptiv** — Two of their agent classes are fully platform-managed with no trace export at all — a real product gap, acknowledged live on the call. **Ask: roadmap decision on whether/how to support trace-less agents.**
- **Wolters Kluwer** — Pilot tenant access and a firm bulk-scoring date are their top ask, unresolved. **Ask: prioritize provisioning.**
- **Workday** — "Is this a testing tool?" was raised four times on one call and never resolved; no next call committed. **Ask: alignment on driver-vs-grader positioning, and product-marketing support before we re-engage.**
- **Cross-account** — Cost/token-per-agent reporting was described as already working on both the Tritusa and Meta calls, but it isn't actually shipped. This is an expectation gap, not a messaging slip. **Ask: fast-track this or adjust what we say in demos.**
- **BearingPoint** — Stalled on the partner's own internal manager decision; tracked, no leadership action needed yet.

---

## Slide 7 — Close / Next Steps

- **This week:** unblock Meta's engineering confirmation before the competing partner wins the account.
- **This quarter:** convert at least one of the 5 Pending Betas to our first Active Beta.
- **Product:** decide priority on scenario-bank/simulation testing and fleet-level scoring — both are recurring asks from our largest accounts, not one-offs.
- **Trust:** close the cost/token-reporting gap before it's raised in another live demo.
- **Decisions needed from leadership today:** Meta escalation, Aptiv trace-less-agent roadmap call, Workday positioning alignment.
- **Next check-in:** propose cadence (e.g., biweekly pipeline + product-gap review).
