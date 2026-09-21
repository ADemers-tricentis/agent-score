# AgentScore Business Case

> *Alignment document for internal use: who AgentScore is for, what problems it solves, and why customers will pay for it. No resourcing ask attached - this is the business case, not a launch plan.*

---

## Document Summary

| Field | Details |
| --- | --- |
| **Title** | AgentScore Business Case |
| **Author** | Andrew Demers |
| **Status** | Draft |
| **Last Updated** | 2026-09-17 |
| **Purpose** | Executive alignment |

---

## Overview

Every enterprise we talk to is shipping AI agents faster than they can tell whether those agents work. AgentScore is Tricentis's answer: point it at an agent's OTel trace, and it hands back a defensible 0-100 score, a ship/warn/block verdict, and the exact reasoning failure that caused it - with zero instrumentation. We are not pitching a new investment here. We're laying out why we believe this problem is real, growing, and one that named enterprise buyers are already telling us they'd pay to solve.

---

## Why Now

**Agents are being built faster than anyone can validate them.** Gartner puts task-specific agents in under 5% of enterprise apps in 2025, rising to 40% by the end of 2026. The average enterprise already runs ~12 agents and that count is projected to grow 67% in two years; Fortune 500 companies alone are expected to have 150,000+ agents deployed within two years. The AI agent market itself is projected to roughly triple from $7.8B (2025) to $11.5B in 2026 en route to a 49.6% CAGR through 2033. ([Gartner](https://www.gartner.com/en/newsroom/press-releases/2025-08-26-gartner-predicts-40-percent-of-enterprise-apps-will-feature-task-specific-ai-agents-by-2026-up-from-less-than-5-percent-in-2025), [Digital Applied](https://www.digitalapplied.com/blog/ai-agent-adoption-2026-enterprise-data-points))

**Governance has not kept pace with deployment**, and that gap is exactly where AgentScore sells. Only 1 in 5 companies has a mature governance model for autonomous agents - 80% are deploying without the infrastructure to manage them safely at scale. Gartner projects over 40% of agentic AI projects will be canceled by end of 2027 on cost, unclear value, or inadequate risk controls. That's the failure mode AgentScore exists to prevent: agents shipped, then pulled back, because nobody could put a number on whether they were ready. ([Gartner Hype Cycle for Agentic AI](https://www.gartner.com/en/articles/hype-cycle-for-agentic-ai))

**The land grab is happening now, and the money already knows it.** Braintrust raised an $80M Series B at ~$800M (Feb 2026); Galileo was acquired by Cisco into Splunk Observability (May 2026); Patronus AI raised $50M Series B; Langfuse was acquired by ClickHouse. This category is consolidating fast. Every quarter we wait, the "is this a testing tool or an observability tool" question gets answered by someone else's product, not ours.

**And the demand isn't hypothetical - it's already in our pipeline.** 50 companies have inbound-expressed interest through the Tricentis Labs form and Sales in the last six weeks, 5 have moved to scheduled demos, and named accounts - Meta (autonomous supply chain, 4-5 production agents), Workday, Wolters Kluwer, a Tricentis gold-sponsor partner (Tritusa) - are actively scoping paid engagements, not just kicking tires.

---

## The Cost of Getting It Wrong

This is the flip side of "why now": shipping a bad or inefficient agent is not a hypothetical risk, it's a line item. Two distinct failure modes, both billable:

**Wrong behavior costs money directly.** Industry incident tracking puts the average enterprise at 2.3 significant AI-driven errors per quarter, with individual incidents ranging $50K-$2.1M depending on severity; in financial services specifically, hallucinated analysis contributed an estimated $2.3B in avoidable trading losses industry-wide in Q1 2026 alone. Beyond the incident itself, someone has to clean it up - employees using AI tools report spending ~4.3 hours/week just verifying whether outputs are true, an estimated $14K/employee/year in pure overhead that never shows up as a line item but is real cost all the same. ([ContextQA](https://contextqa.com/blog/cost-of-ai-agent-failures/))

**Inefficient behavior costs money even when nothing "breaks."** An agent that takes ten tool calls to do a two-call job, or loops past the point of diminishing return, burns real spend with no incident report to flag it. Gartner's March 2026 analysis puts agentic workloads at 5-30x the token consumption of a standard chatbot task per unit of work; independent research across production API usage consistently finds 40-60% of that spend goes to tokens that contribute nothing to the answer - redundant context, unused tool schemas, verbose reasoning re-sent on every turn of a loop. That waste compounds: 100 wasted tokens in turn one of a session gets paid for again on every subsequent turn. ([Faraday Machines](https://www.faradaymachines.com/ai-per-token-leak/), [LeanOps](https://leanopstech.com/blog/agentic-ai-cost-runaway-token-budget-2026/))

Neither failure mode announces itself. A hallucinated answer looks identical to a correct one until someone downstream acts on it; a wasteful agent's cloud bill looks like "traffic," not "waste," until someone compares tokens spent to work done. This is precisely the gap AgentScore's evidence-backed score and root-cause attribution are built to close - it's the only party in the pipeline whose job is to notice both failure modes before the bill or the incident does.

---

## Who It's For

| Persona | What they need and why they care | Priority |
| --- | --- | --- |
| **QA/quality leader at an agent-deploying enterprise** (e.g. Paul DiGrazia, Wolters Kluwer; Rushi/Pradeep, Workday) | Owns "is this agent safe to ship" but has no tooling built for agent behavior - traditional test automation doesn't grade reasoning. Wants a defensible score, root-cause attribution, and a category answer ("testing tool" vs. "observability tool"). | Primary |
| **AI/platform program owner at scale** (e.g. Sri, Meta autonomous supply chain; Kaleb Jackson, Freddie Mac) | Owns dozens of agents shipping to prod with fragmented ownership across teams and no shared way to validate behavior org-wide. Reacts most strongly to the ship/warn/block verdict model - a single number they can put in front of leadership. | Primary |
| **SI/consulting partner building agents for clients** (Tritusa, Capgemini, Accenture, Xebia, and 15+ similar entries in the External Interest pipeline) | Builds and delivers agents for enterprise clients and needs third-party evidence of quality to close deals and defend against trust/compliance questions - a resale/advisory motion, not just internal use. | Secondary |
| **Regulated-industry buyer** (Merck, Regeneron, McKesson, banks/pharma via Tritusa's client base) | Compliance and audit sensitivity make "how do you know it's accurate" a gating question before any agent reaches production. Wants tiered evidence (deterministic checks, judge + confidence intervals, golden-dataset back-testing), not a black box. | Secondary |

---

## Problems We Solve

1. **"We don't know if our agent is actually ready to ship."** Root-cause attribution (span + fix, not just a score) is the single most consistently praised capability across every customer session we've run (Workday, Meta, Wolters Kluwer, Tritusa) - it's what turns a vague "seems fine" into a defensible, evidence-backed decision.
2. **"Knowing what to measure is the hard part, not the grading."** There is no shortage of open-source eval frameworks. What buyers lack is confidence they've covered every dimension that matters. AgentScore's zero-setup auto-profiling and 60+ evals across 11 dimensions answers that without requiring the buyer to have AI expertise on staff.
3. **"Our agents came from everywhere and we can't compare them."** Cross-ecosystem OTel ingestion - any agent, any vendor, any orchestration framework - is already confirmed solved and lands well specifically because it lets buyers benchmark sanctioned tooling against shadow IT (Wolters Kluwer scoring GitHub Copilot alongside their own agents; Tritusa benchmarking a Copilot Studio agent against an AI Workspace agent).
4. **"We have no shared, org-wide way to validate agent behavior."** Fragmented AI ownership (Freddie Mac: product team and AI accelerator team building overlapping agents with no common yardstick) is a named pain point independent of any single agent's quality - AgentScore's evidence-backed scoring model is the shared yardstick.

Open gaps that are currently costing us deals rather than winning them: on-prem/self-hosted deployment (Meta's #1 requirement, a stated dealbreaker), RBAC/SSO (Wolters Kluwer named it a "big concern"), compliance/PII validation (Tritusa's bank/pharma clients), and scenario-bank/red-teaming (the line between "grades production agents" - which we do - and "tests dev-to-prod" - which we don't yet). These aren't reasons to doubt the business case; they're the honest list of what stands between "strong pipeline" and "signed contracts."

---

## Why Customers Will Pay

- **They're already reacting to the pricing-relevant feature, not just the demo.** Freddie Mac's Kaleb Jackson reacted most directly to the ship/warn/block verdict model - the part of the product that maps straight to "would I pay to put a number on this." Wolters Kluwer called per-agent-only scoring "a proof of concept, not the product they need" and is asking for the fleet-level version - a sign they're already thinking about this as a budgeted capability, not a curiosity.
- **The market has already validated willingness to pay for exactly this unit of value.** Braintrust, PromptLayer, Humanloop, and Patronus all meter "scoring/eval runs" as a distinct, premium-priced line separate from raw trace ingestion - and all four are funded or profitable doing it. Our own billing research confirms AgentScore's cost driver (a scoring run can fan out to ~10 LLM calls) maps directly to that precedent: give away ingestion, charge for scoring runs in credits, unlimited seats. This isn't a novel model we're hoping works - it's the model the category has already proven.
- **We have a distribution and cost advantage no outside vendor can match.** AI Workspace agents auto-provision a tenant and get graded with zero setup. That's a built-in funnel from "agent exists inside Tricentis" to "agent is being scored" that Langfuse, Arize, Braintrust, and Galileo structurally cannot replicate - they all require an integration decision. Every AIW customer is a warm lead we don't have to acquire.
- **The buyers with money already ride the wave we're standing on.** Merck signed a $1B multi-year Google Cloud agentic AI deal; Workday, HP, and Cargill are each running double-digit-million-dollar agent programs. These are not companies deciding whether to spend on agentic AI - they're companies who've already committed and are now looking for the validation layer that de-risks it.

---

## Open Questions / Honest Risks

1. We have zero external paying customers today - this is a strong internal alpha with real inbound interest, not a market participant yet. The competitors we're benchmarked against are all GA with marquee logos.
2. On-prem and RBAC/SSO are named dealbreakers for at least two of our most active named accounts (Meta, Wolters Kluwer) - closing them is a multi-quarter infra investment, not a packaging decision.
3. Pricing is directionally validated by the market but not finalized for AgentScore - exact credit-to-dollar conversion and volume-discount curve are still open per the July 2026 billing research.

---

## References

* `docs/feedback/Customer Feedback Log.md` - session-by-session buyer evidence
* `docs/feedback/External Interest.md` - 50-company pipeline tracker
* `docs/research/competitive-analysis-report.md` - market map, capability gaps, positioning recommendations
* `docs/research/billing-model-research.md` - pricing precedent across 13 competitors
* Gartner: [40% of enterprise apps will feature task-specific AI agents by 2026](https://www.gartner.com/en/newsroom/press-releases/2025-08-26-gartner-predicts-40-percent-of-enterprise-apps-will-feature-task-specific-ai-agents-by-2026-up-from-less-than-5-percent-in-2025)
* Gartner: [2026 Hype Cycle for Agentic AI](https://www.gartner.com/en/articles/hype-cycle-for-agentic-ai)
* Digital Applied: [AI Agent Adoption 2026 - 120+ Enterprise Data Points](https://www.digitalapplied.com/blog/ai-agent-adoption-2026-enterprise-data-points)
