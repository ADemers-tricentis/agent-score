# AgentScore Business Case

> *Alignment document for internal use: who AgentScore is for, what problems it solves, and why customers will pay for it. No resourcing ask attached - this is the business case, not a launch plan.*

---

## Document Summary

| Field | Details |
| --- | --- |
| **Title** | AgentScore Business Case |
| **Author** | Andrew Demers |
| **Status** | Draft |
| **Last Updated** | 2026-09-18 |
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

## The Cost of Getting Our Timing Wrong

This is a different risk than the one below - it's not what a bad agent costs a customer, it's what a mistimed decision costs us.

**The cost of waiting has a competitor's name attached to it.** Every quarter we don't ship is a quarter Braintrust, Galileo, Patronus, or Langfuse gets closer to answering the "testing tool or observability tool" question for the market instead of us (see Land Grab, above). Named accounts we're actively courting - Meta, Workday, Wolters Kluwer - are evaluating this category right now; whichever vendor closes one first sets the reference architecture the next five buyers compare everyone else against. Waiting doesn't preserve optionality, it hands it to whoever moves first.

**The cost of rushing has one of our own named accounts attached to it.** On-prem (Meta's stated #1 requirement), RBAC/SSO (Wolters Kluwer's named blocker), and compliance/PII validation (Tritusa's bank/pharma clients) are not nice-to-haves for these accounts - they're stated dealbreakers. Launching broadly before closing those gaps risks a failed pilot with exactly the marquee logo we most need, and a burned pilot is harder to win back than a delayed one - it costs us the reference, not just the deal.

**The asymmetry is the point.** Inaction is not the safe choice here; it's a bet that no competitor closes a comparable deal before we're ready, in a category that's already consolidating (Braintrust, Galileo, Patronus, Langfuse all raised or got acquired in the last two quarters). This is why "when do we call ourselves ready" (see [How We'll Know We're Ready for Go-to-Market](#how-well-know-were-ready-for-go-to-market), below) needs its own answer, not just a feature checklist.

---

## The Cost of Getting It Wrong

This is the flip side of "why now": shipping a bad or inefficient agent is not a hypothetical risk, it's a line item. Two distinct failure modes, both billable:

**Wrong behavior costs money directly.** Industry incident tracking puts the average enterprise at 2.3 significant AI-driven errors per quarter, with individual incidents ranging $50K-$2.1M depending on severity; in financial services specifically, hallucinated analysis contributed an estimated $2.3B in avoidable trading losses industry-wide in Q1 2026 alone. Beyond the incident itself, someone has to clean it up - employees using AI tools report spending ~4.3 hours/week just verifying whether outputs are true, an estimated $14K/employee/year in pure overhead that never shows up as a line item but is real cost all the same. ([ContextQA](https://contextqa.com/blog/cost-of-ai-agent-failures/))

**Inefficient behavior costs money even when nothing "breaks."** An agent that takes ten tool calls to do a two-call job, or loops past the point of diminishing return, burns real spend with no incident report to flag it. Gartner's March 2026 analysis puts agentic workloads at 5-30x the token consumption of a standard chatbot task per unit of work; independent research across production API usage consistently finds 40-60% of that spend goes to tokens that contribute nothing to the answer - redundant context, unused tool schemas, verbose reasoning re-sent on every turn of a loop. That waste compounds: 100 wasted tokens in turn one of a session gets paid for again on every subsequent turn. ([Faraday Machines](https://www.faradaymachines.com/ai-per-token-leak/), [LeanOps](https://leanopstech.com/blog/agentic-ai-cost-runaway-token-budget-2026/))

Neither failure mode announces itself. A hallucinated answer looks identical to a correct one until someone downstream acts on it; a wasteful agent's cloud bill looks like "traffic," not "waste," until someone compares tokens spent to work done. This is precisely the gap AgentScore's evidence-backed score and root-cause attribution are built to close - it's the only party in the pipeline whose job is to notice both failure modes before the bill or the incident does.

---

## Ideal Customer Profile (ICP)

The clearest-fit customer isn't defined by industry or headcount - it's defined by four things being true at once, plus one bonus signal that makes the fit even stronger:

1. **Already running agents in AI Workspace.** They get zero-setup auto-profiling for free and are a warm lead, not a cold integration decision (see [Why Tricentis Should Solve This](#why-tricentis-should-solve-this)).
2. **Running multiple agents or workflows, not just one.** Scale is what turns "we'll eyeball this one agent" into a real problem - more agents means more surface area for something to go wrong and more manual effort spent grading each one.
3. **Motivated by risk, by eval efficiency, or both.** We've seen deals engage for either reason, and they're not mutually exclusive:
   - **Risk-driven:** worried about governance and spend, not just shipping faster - asking "how do we know this is safe" before "how do we ship more," the gap Gartner quantifies at 1 in 5 companies having a mature agent governance model (see [Why Now](#why-now)); or watching the token bill stop tracking cleanly to work done, with no way to separate a performant agent from a wasteful one (see [Cost of Getting It Wrong](#the-cost-of-getting-it-wrong)).
   - **Efficiency-driven:** already grading agents themselves - ad hoc scripts, spreadsheet rubrics, a homegrown eval harness - and want to cut the manual time/cost of doing that per agent, or want more rigor than what they've built in-house. AgentScore's zero-setup auto-profiling and 60+ evals across 11 dimensions replaces that manual effort rather than adding a new one.
4. **Running external agents, tools, or MCPs alongside AI Workspace.** GitHub Copilot, Copilot Studio, homegrown frameworks, other vendors' agents, MCP servers they've wired in - shadow IT and third-party tooling they didn't build and can't currently score side-by-side with their sanctioned AIW agents.

**Bonus: no dedicated AI engineers or existing eval tooling of their own.** If they don't have the in-house expertise or a homegrown framework to build evals themselves, AgentScore isn't competing against a build option - it's the only realistic path to a rigorous eval, not just the faster one. This is what turns the efficiency-driven motivation in #3 from "nice to have" into "no other option."

Wolters Kluwer is the cleanest real match today: risk-driven (named RBAC/self-service a governance blocker), running agents through AI Workspace, with a stated reason for engaging of scoring agents outside the Tricentis ecosystem (GitHub Copilot, their internal FAB platform) alongside it. Tritusa fits three of four - AI Workspace agent plus a Copilot Studio agent, also risk-driven via a compliance/governance advisory practice layered on top. Both data points confirm the risk-driven motivation; neither yet confirms efficiency-driven independently, and neither confirms the bonus signal either way - those are hypotheses to validate against the next batch of inbound, not yet proven. This profile overall is a hypothesis sharpened by two data points, not a validated segment. [Section 2 of the graduation plan](agentscore-labs-graduation-plan.md#2-build-the-icp-from-the-green-accounts-own-words) is where that validation happens - green-account outreach is designed to directly test the risk/efficiency split and the bonus signal, not just collect more anecdotes.

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

## Why Tricentis Should Solve This

Being right about the market isn't the same as being the right company to act on it. Three reasons this specifically belongs at Tricentis:

- **We start the trust conversation somewhere else has to earn it.** The buyer who owns "is this agent safe to ship" is the same QA/quality leader who has trusted Tricentis for Tosca and qTest for years. A category outsider - Braintrust, Langfuse, Patronus - has to convince that buyer it understands enterprise QA rigor from zero. We don't; we're extending a relationship, not starting one.
- **We have a distribution and cost advantage no outside vendor can match.** AI Workspace agents auto-provision a tenant and get graded with zero setup. That's a built-in funnel from "agent exists inside Tricentis" to "agent is being scored" that Langfuse, Arize, Braintrust, and Galileo structurally cannot replicate - they all require a separate integration decision. Every AIW customer is a warm lead we don't have to acquire.
- **Our existing regulated-industry footprint is the hardest part of this sale for anyone else.** Merck, Regeneron, McKesson, and Tritusa's bank/pharma clients already trust Tricentis for compliance-grade software validation. For a category outsider, "how do you know it's accurate" is a cold trust-building exercise; for us, it's a question our existing customer relationships have already answered in an adjacent product.

None of this guarantees we win the category - the open gaps in [Problems We Solve](#problems-we-solve) are real and someone else could close them faster. But it means our odds of winning a category fight are better than a startup's, and worse odds still beat sitting out a market this size (see [Why Now](#why-now)).

---

## Why Customers Will Pay

### The Value They're Getting

- **A defensible verdict instead of a gut call.** Freddie Mac's Kaleb Jackson reacted most directly to the ship/warn/block verdict model - it replaces "seems fine to me" with a number leadership can act on.
- **Root-cause attribution, not just a score.** Span-level attribution (span + fix) is the single most consistently praised capability across every customer session we've run (Workday, Meta, Wolters Kluwer, Tritusa) - it turns debugging into a fix, not a re-run.
- **A shared yardstick across fragmented ownership.** Wolters Kluwer called per-agent scoring "a proof of concept, not the product they need" and is asking for the fleet-level version; Freddie Mac has two teams building overlapping agents with no common way to compare them. AgentScore is the first shared measure either has had.
- **Coverage without in-house AI expertise.** Zero-setup auto-profiling and 60+ evals across 11 dimensions mean a buyer doesn't need to already know what to measure - a real gap, per [Problems We Solve](#problems-we-solve).
- **Third-party evidence SIs can resell.** Tritusa, Capgemini, Accenture, and Xebia need evidence of quality to close their own client deals - this is a resale motion for them, not just internal use.

### The ROI We Can Measure (and What We're Still Hypothesizing)

What's already market-validated: Braintrust, PromptLayer, Humanloop, and Patronus all meter "scoring/eval runs" as a distinct, premium-priced line separate from raw trace ingestion - and all four are funded or profitable doing it. Our own billing research confirms AgentScore's cost driver (a scoring run can fan out to ~10 LLM calls) maps directly to that precedent: give away ingestion, charge for scoring runs in credits, unlimited seats. That's not a novel model we're hoping works - it's the model the category has already proven, and it gives us a real denominator to sell against: the average enterprise already eats 2.3 significant AI-driven errors per quarter at $50K-$2.1M each, and $14K/employee/year verifying whether outputs are true (see [Cost of Getting It Wrong](#the-cost-of-getting-it-wrong)). A subscription only has to prevent a fraction of one incident, or claw back a fraction of that time, to pay for itself many times over.

What's still a hypothesis - none of the below is validated by a paying customer yet, and each needs pilot data before it goes in front of a buyer as a claim rather than a discussion point:

- **Savings hypothesis.** If root-cause attribution cuts incident-investigation time by even 25%, that's roughly $3.5K/employee/year reclaimed off the $14K verification-overhead figure above. We have no before/after measurement yet - this needs a pilot that times root-cause investigation with and without AgentScore.
- **Governance hypothesis.** "Time to produce audit-ready evidence that an agent is safe to ship" is currently unmeasured and ad hoc at every account we've talked to (Wolters Kluwer, Freddie Mac). AgentScore's tiered evidence model could turn that into a reportable SLA metric - but we don't have a baseline from any account to compare against yet.
- **Token-waste hypothesis.** Gartner's finding that 40-60% of agentic token spend contributes nothing to the answer implies a direct, meterable cost-avoidance story if AgentScore's scoring surfaces that waste. We don't yet have a real customer token bill to benchmark this against.

These three belong alongside [Open Questions / Honest Risks](#open-questions--honest-risks) until a pilot gives us real numbers - they're the shape of the ROI story, not the story itself yet.

---

## How We'll Know We're Ready for Go-to-Market

**The signal isn't raw pipeline count - it's use-case convergence.** Internal review of the current pipeline surfaced this directly: three customers all saying "we love doing X with AgentScore" is a stronger readiness signal than five customers each doing something different. The first means we've found a repeatable, sellable wedge; the second means we're still fielding one-off inbound with no common thread to build a launch around.

**Grouping the current pipeline by use case (hypothesis, to be re-validated as beta volume grows):**

| Use-case cluster | Named accounts converging here | Blocker to close before this cluster is sellable |
| --- | --- | --- |
| Fleet-level governance / shared yardstick across fragmented AI ownership | Freddie Mac, Wolters Kluwer (explicitly asked for the fleet version), Meta (dozens of agents, one team) | Fleet-level scoring (not yet built) |
| Ship/no-ship verdict for a specific agent | Workday, Wolters Kluwer's QA leader (Paul DiGrazia) | None named - closest to sellable today |
| Third-party/resale evidence for SI-delivered agents | Tritusa, Capgemini, Accenture, Xebia | RBAC/SSO, partner enablement collateral |
| Compliance/regulated-industry evidence | Tritusa's bank/pharma clients, Merck, Regeneron, McKesson | Compliance/PII validation (not yet built) |

**Proposed readiness thresholds (hypothesis, for discussion, not yet agreed):**

- A use-case cluster is *validated* once 3+ independently-sourced named accounts land in it using consistent language about the same job-to-be-done - not just 3+ signups.
- We are *ready for GTM* on a given use case once it has a validated cluster **and** a working answer to that cluster's named blocker (e.g. fleet-level scoring for the governance cluster).
- We are **not** ready if the pipeline keeps spreading across new use cases rather than reinforcing the four above - that pattern means we're being pulled by inbound rather than converging on a wedge.

**Two more thresholds, borrowed directly from the Labs graduation bar (criteria #1 and #4 in [the graduation plan](agentscore-labs-graduation-plan.md#the-bar-we-have-to-clear)), have to clear alongside the use-case thresholds above:**

- **Active users, defined as real signal, not signups.** Proposed threshold: **5 tenants** showing real usage in the same rolling period - not 5 signups, not 5 tenants running only unattended schedules. "Real usage" means both (a) at least one manually-triggered scoring run ("Score now," not just an autonomous schedule - metric #11 in the Beta Metrics doc exists specifically because a schedule nobody looks at is a weak signal even when it runs cleanly) and (b) return usage across 2+ distinct weeks (metric #18, retention/days-active). Validate against the weekly usage dashboard once it's built - Part 2 of [`AgentScore-Beta-Metrics-Instrumentation.md`](../documentation/AgentScore-Beta-Metrics-Instrumentation.md) marks the metrics this threshold depends on (#11, #12, #18) as "needs new instrumentation" today, so this is a build dependency before it's a reportable number.
- **ROI materials, defined as measured, not hypothesized.** The three hypotheses above - savings, governance, token-waste - have to move from "directional" to "measured" using the timed study's output ([graduation plan §4](agentscore-labs-graduation-plan.md#4-turn-the-study-into-roisizing-materials)): the FTE-cost conversion, the accuracy delta, and at least one draft credit/pricing package. We are not ready on ROI messaging while all three are still discussion points rather than numbers we'd put in front of a buyer.

**Where we actually stand on both, today:** zero. Zero active betas per the External Interest pipeline tracker, and zero measured ROI numbers - all three hypotheses above are still open. Naming that plainly, rather than rounding either number up, is the point (see [Section 5 of the graduation plan](agentscore-labs-graduation-plan.md#5-package-it-as-an-honest-ask-not-a-pitch)).

**Next steps to get a real read on this (not yet started):**

- Work with marketing to build a targeted beta list *per use-case cluster*, rather than one generic "sign up for beta" funnel, so new inbound has a chance to concentrate instead of scatter further.
- Prioritize automatic tenant provisioning beyond AI Workspace (which already has it) so we can gather a larger volume of usage feedback per cluster faster, without waiting on manual onboarding for each new account.
- Build the Part 2 behavior-metrics instrumentation the active-user threshold depends on - manual-vs-scheduled trigger tagging (#11) and the retention/return-usage rollup (#18) don't exist yet per the Beta Metrics doc, so the threshold above isn't checkable until they do.

---

## Open Questions / Honest Risks

1. We have zero external paying customers today - this is a strong internal alpha with real inbound interest, not a market participant yet. The competitors we're benchmarked against are all GA with marquee logos.
2. On-prem and RBAC/SSO are named dealbreakers for at least two of our most active named accounts (Meta, Wolters Kluwer) - closing them is a multi-quarter infra investment, not a packaging decision.
3. Pricing is directionally validated by the market but not finalized for AgentScore - exact credit-to-dollar conversion and volume-discount curve are still open per the July 2026 billing research.
4. The ROI hypotheses in [Why Customers Will Pay](#why-customers-will-pay) (savings, governance SLA, token-waste capture) are directional, not measured - no pilot has produced a before/after number yet.
5. The ICP in [Ideal Customer Profile](#ideal-customer-profile-icp) and the use-case clusters in [How We'll Know We're Ready for Go-to-Market](#how-well-know-were-ready-for-go-to-market) are built from two to four named accounts each - directionally useful, but a small enough sample that the next few pipeline conversations could reshape both.

---

## References

* `docs/feedback/Customer Feedback Log.md` - session-by-session buyer evidence
* `docs/feedback/External Interest.md` - 50-company pipeline tracker
* `docs/research/competitive-analysis-report.md` - market map, capability gaps, positioning recommendations
* `docs/research/billing-model-research.md` - pricing precedent across 13 competitors
* Gartner: [40% of enterprise apps will feature task-specific AI agents by 2026](https://www.gartner.com/en/newsroom/press-releases/2025-08-26-gartner-predicts-40-percent-of-enterprise-apps-will-feature-task-specific-ai-agents-by-2026-up-from-less-than-5-percent-in-2025)
* Gartner: [2026 Hype Cycle for Agentic AI](https://www.gartner.com/en/articles/hype-cycle-for-agentic-ai)
* Digital Applied: [AI Agent Adoption 2026 - 120+ Enterprise Data Points](https://www.digitalapplied.com/blog/ai-agent-adoption-2026-enterprise-data-points)
