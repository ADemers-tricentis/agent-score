# AgentScore Business Case — Slide Deck Outline

**Source:** Content pulled directly from [`one-pager-agentscore-business-case.md`](one-pager-agentscore-business-case.md) - see that doc for full citations, caveats, and cross-links.
**Format note:** Content only, no visual design/theme yet - that comes later.

---

## 1. The Market Signal

**"Agents are being built faster than anyone can validate them."**

- Task-specific agents: <5% of enterprise apps (2025) → 40% by end of 2026 (Gartner)
- Average enterprise already runs ~12 agents - projected +67% in two years; Fortune 500 alone expected to have 150,000+ agents deployed within two years
- AI agent market: $7.8B (2025) → $11.5B (2026), 49.6% CAGR through 2033
- Governance hasn't kept pace: only 1 in 5 companies has a mature governance model for autonomous agents - 80% are deploying without one
- Gartner projects 40%+ of agentic AI projects canceled by end of 2027 (cost, unclear value, inadequate risk controls) - the exact failure mode AgentScore exists to prevent
- Demand isn't hypothetical: 74 companies inbound-interested in the last six weeks, 5 moved to scheduled demos, 1 moved to a pending beta (Accenture, on-prem/private-AWS, on behalf of Meta), named accounts (Meta, Workday, Wolters Kluwer, Tritusa) actively scoping paid engagements
  - *Visual note: display as a 3-stage funnel (74 → 5 → 1), not a plain before/after stat card - decreasing bar widths per stage so the drop-off reads at a glance, each stage labeled (inbound-interested, scheduled demos, pending beta).*

*Notes: Sourced from Gartner + Digital Applied - see "Why Now" in the one-pager for links.*

---

## 2. Desk Research (Competitive Landscape, Brief)

**"The category is consolidating fast - and validating our model along the way."**

- Braintrust: $80M Series B at ~$800M valuation (Feb 2026) - $116M total raised
- Galileo: $68M total raised, acquired by Cisco → folded into Splunk Observability (May 2026, price undisclosed)
- Langfuse: $4.5M total raised (seed), acquired by ClickHouse (Jan 2026, price undisclosed)
- Patronus AI: $70M total raised ($50M Series B, Jun 2026)
- Combined: ~$258.5M raised across these four - two already acquired, acquisition prices undisclosed
- Every eval-first competitor (Braintrust, PromptLayer, Humanloop, Patronus) already meters "scoring/eval runs" as a distinct, premium-priced line separate from raw ingestion - validates our own billing direction
- No competitor leads with zero-setup automatic grading straight from an OTel trace - our clearest structural differentiator today

*Notes: Full detail in `docs/research/competitive-analysis-report.md` and `docs/research/billing-model-research.md`.*

---

## 3. Why Tricentis Should Solve This

**"Being right about the market isn't the same as being the right company to act on it - but here we are."**

- We start the trust conversation somewhere else has to earn from zero - the buyer who owns "is this agent safe to ship" already trusts Tricentis for Tosca and qTest
- Distribution and cost advantage no outside vendor can match - AI Workspace agents auto-provision a tenant and get graded with zero setup; every AIW customer is a warm lead, not a cold integration decision
- Existing regulated-industry footprint (Merck, Regeneron, McKesson, Tritusa's bank/pharma clients) already answers "how do you know it's accurate" in an adjacent product
  - *Visual note: current deck pairs this bullet with a gift/present icon, which doesn't fit "regulated industry" - swap for a compliance/shield-style icon.*

*Notes: This doesn't guarantee we win the category - on-prem, RBAC/SSO, and compliance/PII gaps are real and someone else could close them faster. But the odds are better than a startup's, and worse odds still beat sitting out a market this size.*

---

## 4. What AgentScore Is

**"Point it at a trace, get back a defensible answer."**

- Ingests an agent's OTel trace - any agent, any vendor, any orchestration framework, no proprietary SDK or instrumentation required
- Returns a 0-100 score and a ship/warn/block verdict, not just pass/fail
- Root-cause attribution down to the span, paired with a suggested fix
- 60+ evals across 11 dimensions, auto-selected via zero-setup profiling - buyer doesn't need to know what to measure going in
- Tiered evidence model (deterministic checks, judge + confidence intervals, golden-dataset back-testing) for buyers who need audit-ready proof, not a black box
- AI Workspace agents get all of this free, without any extra setup or configuration, the moment the agent exists

---

## 5. Target Persona

**"Who actually buys this."**

| Persona | Why they care | Priority |
| --- | --- | --- |
| QA/quality leader at an agent-deploying enterprise | Owns "is this agent safe to ship" but has no tooling built for agent behavior - wants a defensible score and root-cause attribution | Primary |
| AI/platform program owner at scale | Owns dozens of agents shipping to prod with fragmented ownership - reacts most strongly to the single ship/warn/block verdict | Primary |
| SI/consulting partner building agents for clients | Needs third-party evidence of quality to close their own client deals - a resale motion, not just internal use | Secondary |
| Regulated-industry buyer | Compliance/audit sensitivity makes "how do you know it's accurate" a gating question before production | Secondary |

---

## 6. Target ICP - What Tells You an Account Is Worth Targeting

**"If you're a sales rep, here's what to look for in an account."**

- Already running agents in AI Workspace → zero-setup, warm lead, not a cold integration decision
- Running multiple agents or workflows, not just one → more surface area, more manual grading pain
- Risk-driven signals: talk of governance/spend concerns, "how do we know this is safe" before "how do we ship more," or a token bill that's stopped tracking cleanly to work done
- Efficiency-driven signals: already grading agents themselves - ad hoc scripts, spreadsheet rubrics, a homegrown eval harness - and want to cut the manual cost of doing that, or want more rigor than what they've built
- Running external agents/tools/MCPs alongside AI Workspace (GitHub Copilot, Copilot Studio, homegrown frameworks, other vendors, MCP servers) that they can't currently score side-by-side with their sanctioned agents
- **Bonus signal:** no dedicated AI engineers or existing eval tooling in-house → AgentScore isn't competing against a build option, it's the only realistic path to a rigorous eval

*Notes: Wolters Kluwer is the cleanest real match today (risk-driven, AIW + external agents). Tritusa fits 3 of 4. This is a hypothesis sharpened by two data points, not yet a validated segment.*

---

## 7. Value Prop / Overall Value

**"Why customers will pay."**

- A defensible verdict instead of a gut call - replaces "seems fine to me" with a number leadership can act on
- Root-cause attribution, not just a score - turns debugging into a fix, not a re-run
- A shared yardstick across fragmented ownership - the fleet-level ask we're already hearing (Wolters Kluwer, Freddie Mac)
- Coverage without in-house AI expertise - zero-setup auto-profiling means the buyer doesn't need to already know what to measure
- Third-party evidence SIs can resell - a resale motion for partners like Tritusa, Capgemini, Accenture, Xebia

**Overall value:** the billing model is already proven by the category (eval-first competitors meter scoring runs at a premium, separate from ingestion) - and it maps to a real denominator: the average enterprise already eats 2.3 significant AI-driven errors per quarter ($50K-$2.1M each) and $14K/employee/year verifying whether outputs are true. A subscription only has to prevent a fraction of one incident, or claw back a fraction of that time, to pay for itself many times over.

*Notes: Tricentis-side revenue sizing isn't modeled yet - pricing isn't finalized and we have no beta usage data. See "What This Is Worth to Tricentis" in the one-pager.*

---

## 8. The ROI Metric We Can Measure

**"Incident-investigation time saved."**

- Baseline: employees report spending ~4.3 hours/week verifying whether AI outputs are true - an estimated $14K/employee/year in pure overhead
- Hypothesis: if root-cause attribution cuts incident-investigation time by even 25%, that's ~$3.5K/employee/year reclaimed
- How we'll measure it: a timed pilot comparing root-cause investigation time with vs. without AgentScore, per incident
- Status today: hypothesis, not yet validated by a paying customer - needs before/after pilot data before it goes in front of a buyer as a claim

*Notes: Two other candidate ROI metrics exist (audit-evidence turnaround time; % of token spend recovered as waste) but aren't measured yet either - see "The ROI We Can Measure" in the one-pager for all three.*
