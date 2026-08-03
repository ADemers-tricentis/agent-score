# Competitive Teardown: Salesforce Agentforce vs. AgentScore

**Source for Agentforce:** Salesforce public marketing/blog pages (Testing Center, Observability) - see Sources below. No access to Salesforce internals, docs, or pricing beyond what's published.
**Source for AgentScore:** `docs/AgentScore-PRD.md` (aspirational/PRD) + `docs/AgentScore-Sales-Pitch-Outline.md` - what's actually built is a React front-end wired to mock data, no backend in this repo (see caveat in `docs/competitive-teardown-decagon.md`).
**Date:** 2026-07-24

---

## 1. What Agentforce actually is

Agentforce is Salesforce's end-to-end platform for *building and deploying* agents inside the Salesforce/Data Cloud ecosystem. Testing Center and Observability are modules bolted onto that platform to validate agents built there - not a standalone eval product.

**Testing Center:**
- Evaluates AI agents built within Salesforce's platform via conversation-level testing that simulates full conversations, not isolated exchanges.
- Built-in metrics (e.g. task resolution - "how well the agent completes the user's original request") plus custom evaluations defined via natural-language scoring prompts (e.g. "Rate the politeness of the agent response on a scale of 0 to 5").
- LLM-judge scoring that returns reasoning alongside a score.
- Traces subagent selection, actions called, inputs/outputs, latency; includes voice-agent conversation playback.
- Integrates with "DevOps Testing Center" via Salesforce CLI for quality gates that block deployments until a test suite passes; users can set a pass/fail threshold on custom evaluations.
- No mention of confidence intervals, statistical significance, or quantified reliability measures.
- Scope appears limited to agents built in Agentforce/Agent Builder - no cross-platform compatibility described.

**Observability:**
- Went fully GA in February 2026 (Session Tracing Data Model, Agent Analytics, Agent Optimization, Agent Health Monitoring), bundled at no additional Data Cloud cost for all Agentforce customers.
- Captures prompt versions, model parameters (temperature, top-p), retrieved grounding context, tool invocations, and reasoning ("thought") steps.
- Says it's adopting "OpenTelemetry for AI standards to ensure data remains consistent across platforms," but doesn't clarify whether this is exclusive or supplementary to proprietary formats, and doesn't describe third-party agent integration.
- Key metrics mentioned: success rate per task, average steps to resolution, accuracy of tool calls, cost-to-value ratio.
- Positioned as fighting the "black box problem" by tracing the reasoning chain, though specific root-cause attribution mechanisms aren't detailed.

Notably absent from public materials: confidence intervals, sample-size gating, multi-run reliability (pass@k), safety-severity overrides, or a story for evaluating agents built outside Salesforce's own tooling.

---

## 2. Where Agentforce is better (as marketed)

| Area | Agentforce's edge | Why it matters |
|---|---|---|
| **Maturity and scale** | Observability went fully GA in February 2026, bundled free with Data Cloud for all Agentforce customers; Testing Center is shipped and integrated directly into Agentforce Studio. | AgentScore is currently a PRD plus a front-end prototype over mock data - no backend, ingestion server, or LLM judge dispatcher exists yet. This is the single biggest gap. |
| **Zero-integration-friction for its own ecosystem** | Testing Center lives inside the same tool used to build the agent - no setup step at all for a Salesforce-native agent. | AgentScore's "no proprietary SDK" pitch is real, but still requires wiring an OTel exporter - a few minutes of friction Agentforce customers never see. |
| **Breadth of native product surface** | Bundles agent-building, voice-agent testing/playback, prediction/lead-scoring, and observability into one platform purchase. | Agentforce customers get testing "for free" as part of a much bigger platform; AgentScore has to win as a standalone line item. |
| **Proven customer outcomes** | Large, existing, referenceable Salesforce install base already running Agentforce in production. | AgentScore has no shipped production references yet. |
| **Ops-native CI/CD tooling** | DevOps Testing Center via Salesforce CLI, wired into the same release pipeline Salesforce admins already use. | Familiar plumbing for the existing Salesforce admin/dev audience - no new tool to learn. |

---

## 3. Where AgentScore is better (per PRD - aspirational, not all built)

| Area | AgentScore's edge | Why it matters |
|---|---|---|
| **Statistical rigor** | Wilson-score confidence intervals, pass@k reliability, paired significance tests on run comparisons, minimum-sample gating before a "Ship" verdict is issued. | No mention of confidence intervals or statistical significance anywhere in Salesforce's public materials on Testing Center or Observability. |
| **Framework/vendor neutrality** | Standard OTLP ingestion; explicitly built for LangChain, LangGraph, OpenAI Agents SDK, AutoGen, CrewAI, or a custom loop (C1 constraint). | Testing Center evaluates agents built in Agentforce/Agent Builder; Observability references "OpenTelemetry for AI standards" but scope is the Salesforce platform, not third-party agent stacks. |
| **Failure semantics** | Worst-dimension gate + Safety Override: one Critical safety signal forces FAIL regardless of composite score. | No equivalent severity-override concept described for Agentforce. |
| **Eval design as a product capability** | Dual path - Observation-Based (watch traces, infer dimensions) and Spec-Based ASSERT pipeline (plain-language/YAML spec -> behavior taxonomy -> calibrated eval set, with citations back to the source spec). | Agentforce's custom evals are natural-language scoring prompts you write yourself; no structured spec-to-taxonomy pipeline. |
| **Pre-execution intervention** | Runtime Guard blocks/warns on risky tool calls *before* they execute (<50ms P95) - a live control, not just after-the-fact grading. | Testing Center and Observability both read as post-hoc (simulate/trace, then grade). |
| **Embedding in the review workflow itself** | Designed to surface verdicts inline inside Tosca Cloud / qTest, where a Tricentis practitioner is already working. | Testing lives inside Agentforce Studio only - no story for surfacing verdicts inside a third-party product. |
| **Legibility for non-AI domain experts** | Explicit product constraint that verdict language must map to domain outcomes, validated with non-AI-background users, across many domains (legal, finance, testing, content, support). | Agentforce targets teams already building/operating inside Salesforce - not designed for a domain expert with zero AI/Salesforce background. |

---

## 4. Where they're comparable

- **LLM-judge scoring with reasoning** - both use an LLM judge that returns a score plus rationale, with custom/curated criteria per use case.
- **Conversation/session-level testing** - Agentforce's "full simulated conversation" testing is conceptually close to AgentScore's session-level scoring.
- **CI/CD quality gates** - Agentforce's DevOps Testing Center blocks deployments on failed test suites via Salesforce CLI; AgentScore blocks merges via GitHub Actions/Azure DevOps/Jenkins on a FAIL verdict. Similar intent, different plumbing.
- **Root-cause / trace attribution** - Agentforce traces subagent selection, tool calls, and reasoning steps to fight the "black box problem"; AgentScore's Attribution panel does the same with a categorized root cause, confidence score, and evidence chain. Rough parity in ambition, unclear how deep Agentforce's attribution actually goes in practice.

---

## 5. Important caveat: PRD vs. what's actually built

As with the Decagon teardown, the honest comparison here is **"ambitious spec vs. shipped platform module,"** not "product vs. product." Agentforce Testing Center and Observability are live, GA, and bundled into a massive existing customer base. AgentScore's design is more rigorous and more general-purpose on paper (statistical confidence, safety severity overrides, cross-framework neutrality, a structured spec-to-eval pipeline, pre-execution guarding), but none of that has shipped yet in this repo.

AgentScore's honest pitch against Agentforce isn't "we do more" - it's "we're the neutral evaluation layer for every agent you have, not just the ones you built inside one vendor's platform," while being transparent that the product itself is still pre-launch.

---

## Sources

1. Salesforce, _AI Agents Are Advancing Rapidly... Is Your Testing Strategy Keeping Up?_ - https://www.salesforce.com/blog/agentforce-testing-center/?bc=OTH
2. SalesforceDevops.net, _Salesforce Makes Agent Observability GA, Extending the Agentic SDLC_ - https://salesforcedevops.net/index.php/2025/11/20/salesforce-makes-agent-observability-ga-extending-the-agentic-sdlc/
3. Salesforce, _What is Agent Observability? Monitoring AI Reliability_ - https://www.salesforce.com/agentforce/observability/agent-observability/
4. Demand Gen Report, _Salesforce Adds Deep Observability to Agentforce 360 Platform_ - https://www.demandgenreport.com/industry-news/news-brief/salesforce-adds-deep-observability-to-agentforce-360-platform/50937/
