# Competitive Teardown: Decagon Testing & QA vs. AgentScore

**Source for Decagon:** https://decagon.ai/product/testing-qa (public marketing page - no access to their internals, docs, or pricing page beyond what's published there)
**Source for AgentScore:** `docs/AgentScore-PRD.md` (aspirational/PRD) + `src/` (what's actually built - a React front-end wired to mock data, no backend in this repo)
**Date:** 2026-07-13

---

## 1. What Decagon's Testing & QA ("Simulations") actually is

Decagon is a customer-support-agent platform first; Testing & QA is a module inside it, not a standalone eval product. The public page describes:

- **Auto-generated tests** covering conversation pathways, checked for accurate responses, policy adherence, and brand consistency.
- **Granular checkpoints** confirming the agent triggered the right action/tool/data at the right moment in a conversation.
- **Evaluation rationale** - shows why a test passed or failed (judge reasoning, but not a documented methodology).
- **Stale test detection** - automatically retires tests that no longer reflect current agent behavior.
- **Root-cause + suggested fixes** via a built-in AI chat interface.
- **Scheduled recurring simulations** for ongoing monitoring, not just pre-ship.
- **CI/CD integration** to test every version before it ships, with PagerDuty-style alerting when metrics drift out of range.
- **Case-study claims** of 70-95% resolution rates and cost reduction, but no disclosed scoring formula, dimension taxonomy, or statistical methodology on this page.

Notably absent from the public materials: any mention of confidence intervals, sample-size gating, multi-run reliability (pass@k), safety-severity overrides, or a general-purpose (non-support) agent story. Decagon's entire framing is **conversational customer-support QA** - not a cross-domain agent evaluation platform.

---

## 2. Where Decagon is better (as marketed)

| Area | Decagon's edge | Why it matters |
|---|---|---|
| **Turnkey, narrow product** | Auto-generates the tests themselves ("auto-generate tests covering diverse pathways") with no separate spec-writing step. | Lower time-to-first-test for support teams who don't want to write specs at all - a true zero-config path, ahead of where AgentScore's Observation-Based path currently sits in the PRD. |
| **Test lifecycle hygiene** | Automatically detects and prunes stale tests as agent behavior evolves. | AgentScore's PRD has no equivalent - profiles are versioned and immutable, but nothing auto-flags an eval as no longer relevant. This is a real gap worth stealing. |
| **Built-in remediation chat** | Root cause + "actionable improvements" surfaced through a conversational interface, not just a static report. | AgentScore's Attribution panel is close (root cause, confidence, evidence chain, recs) but it's a report, not an interactive chat loop. |
| **Ops-native alerting** | Native PagerDuty integration for metric drift. | AgentScore's PRD only lists CI/CD gates (GitHub Actions/Azure DevOps/Jenkins) - no on-call/alerting integration is scoped in any phase. |
| **Vertical depth for conversational support** | Purpose-built for policy adherence, brand consistency, and conversational pathway coverage - concepts tuned specifically to chat support. | AgentScore is deliberately domain-agnostic (ATA, ATC, CURA, coding, etc.), so it will never match Decagon's out-of-the-box vocabulary for a pure support use case. |
| **Market maturity** | Decagon is a shipped, customer-referenced product (case studies, named verticals: retail, travel, fintech, health, media, telco). | AgentScore is pre-launch (Phase 1 draft, per the PRD); Decagon has already proven the workflow in production at scale. |

---

## 3. Where AgentScore is better (per PRD - aspirational, not all built)

| Area | AgentScore's edge | Why it matters |
|---|---|---|
| **Statistical rigor** | Confidence intervals (Wilson score), pass@k reliability, paired significance tests on run comparisons, minimum-sample-size gating before issuing a "Ship" verdict. | The PRD explicitly notes this is "nearly absent in the field" (citing LangSmith, Langfuse, Arize Phoenix, Braintrust) - Decagon's page shows zero evidence of this either. This is AgentScore's clearest differentiation claim. |
| **Multi-dimensional scoring model** | 6 core + 5 extended dimensions (Correctness, Efficiency, Relevance, Safety, Consistency, Tool Use, plus Groundedness/Instruction-Following/Transparency/Robustness/Communication), each independently weighted and gated. | Decagon's page only references "accuracy and conversationality" as evaluation axes - much coarser and support-specific. AgentScore's model generalizes across agent types (autonomous test agents, coding assistants, RCA agents, not just chatbots). |
| **Worst-dimension gate + Safety Override** | A single weak or unsafe dimension can force FAIL/PARTIAL regardless of composite score (e.g., a Critical safety signal overrides everything). | Prevents a strong average from masking a dangerous failure - not described anywhere in Decagon's materials. |
| **Vendor/framework neutrality via OTel** | Standard OTel ingestion, no proprietary SDK required (C1 constraint); works with LangChain, LangGraph, OpenAI Agents SDK, AutoGen, CrewAI, custom loops. | Decagon's testing is presumably built specifically for its own agent runtime; there's no indication it can evaluate an agent built on someone else's stack. AgentScore is designed as a neutral, bolt-on layer for any agent. |
| **Behavioral fingerprinting** | Agents are identified by a hash of service name + tool set + model ID + handoff pattern, not a self-declared name - avoids score pollution when agents rename or fork. | Not mentioned by Decagon at all. |
| **Dual eval-design paths** | Observation-Based (watch traces, infer dimensions) *and* Spec-Based (ASSERT pipeline: plain-language or YAML/JSON spec -> behavior taxonomy -> calibrated eval set in <60s). | Decagon only advertises auto-generation (closer to AgentScore's Observation path) - it has no equivalent to the structured, auditable ASSERT spec pipeline with citations back to the source spec. |
| **Runtime Guard (pre-execution)** | A <50ms P95 decision layer that blocks/warns on risky tool calls *before* they execute (exact-repeat block, error-repeat warn, inspect-streak warn) - separate from and faster than the async LLM scoring path. | This is a live intervention capability, not just after-the-fact grading. Nothing on Decagon's page suggests a pre-execution guard; their model reads as fully post-hoc (simulate, then grade). |
| **CI/CD-native ship gating with granular bands** | Four-band verdict (Ship / Ship with notes / Review / Block) wired into GitHub Actions/Azure DevOps/Jenkins, with profile-versioned reproducibility and regrade-on-version-change. | Decagon claims CI/CD integration too, but with no detail on band granularity, versioning, or reproducibility guarantees. |
| **Inline-in-host-product surfacing** | Designed to surface verdicts inside Tosca Cloud/qTest without a separate UI (C6) - meets practitioners where they work. | Decagon's QA lives inside its own platform only; no story for embedding into a third-party review workflow. |
| **Legibility for non-AI domain experts** | Explicit constraint (C4) that score labels/verdict language must map to domain outcomes, not model internals - validated via user research as a stated objective. | Decagon targets ops/CX teams already fluent in its own product; AgentScore is explicitly designing for practitioners with zero AI background across many different domains (legal, finance, testing, content). |

---

## 4. Important caveat: PRD vs. what's actually built

The AgentScore repo (`agent-score/`) is currently a **front-end prototype only**:

- All 19 views (`src/views/*.tsx`, ~10.7k lines) render against a single static mock dataset (`src/data/mock.ts`, 1,770 lines) - there is no backend, ingestion server, or LLM judge dispatcher in this repo.
- No OTel ingest endpoint, EvalClaw scoring engine, ASSERT pipeline, or Runtime Guard implementation exists in this codebase - they're referenced in the PRD as the product layer AgentScore sits on top of ("AgentScore is a product layer on top of the EvalClaw evaluation engine"), but that engine's code wasn't found under this directory.
- Everything in Section 3 above describes **the PRD's Phase 1/2 design**, not a shipped, customer-facing product. Decagon, by contrast, is already live with paying customers and public case studies.

**Bottom line:** on paper, AgentScore's design is more rigorous and more general-purpose than what Decagon discloses publicly (statistical confidence, safety overrides, cross-framework neutrality, dual eval-design paths). But Decagon is a real, shipped product with proven customer outcomes, while AgentScore today is a UI mockup over a documented plan. The honest comparison is "ambitious spec vs. shipped narrow product" - not "product vs. product."
