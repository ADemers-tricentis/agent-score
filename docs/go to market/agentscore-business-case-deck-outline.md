# AgentScore Business Case - Slide Deck Outline

**Source:** Mirrors `docs/decks/AgentScore - Business Case.pptx` slide for slide (8 slides). Restructured after the 2026-09-29 pitch review around why / why now / why us. See [`one-pager-agentscore-business-case.md`](one-pager-agentscore-business-case.md) for full citations, caveats, and cross-links.
**Format note:** Content only, no visual design/theme. The deck is the source of truth; this outline is updated to match it.

**Thesis:** The market already exists and is already moving. The question is whether there is an angle where Tricentis wins. That angle: we already own the people who decide whether an agent can go to production, and no one is serving those gatekeepers with a tool.

---

## 1. Title Slide

**AgentScore - Business Case**

*"Point it at a trace, get back a defensible answer."*

- October 2026

---

## 2. Market Signal (why now)

**"Agents are being built faster than anyone can validate them."**

Stat cards, grouped in three columns:

**Agents are multiplying**

- **5% → 40%** - of enterprise apps will have task-specific agents, 2025 to end of 2026
- **150,000+** - agents across the Fortune 500 within two years

**Nobody is governing them**

- **1 in 5** - companies have a mature governance model for autonomous agents
- **80%** - of companies deploy agents without one

**And it's costing money** (the two hero cards, outlined in the accent color)

- **40%+** - of agentic AI projects canceled by 2027 (Gartner): cost, unclear value, weak risk controls
- **43%** - of companies saw AI incidents top $2M last year

**So what** panel:

- Someone has to decide whether each agent can go to production.
- Today, they have no tool.

Footer: Sourced from Gartner, Digital Applied, and WitnessAI

*Notes (speaker notes on slide): citations for Gartner (task-specific agents press release; 2026 Hype Cycle for Agentic AI), Digital Applied (AI agent adoption 2026), and CIO Dive / Channel Dive (AI incidents cost enterprises $2M or more). Also carries a scratch line "~$196B by 2033" and "Slide last updated: 09/27/2026".*

*Removed in the restructure: the $7.8B → $11.5B market-size card and the "Demand Isn't Hypothetical" funnel (74 → 10 → 5). The funnel is traction, not market signal, and invited the question of how a first-pitch lab has this much customer data. Pipeline numbers still live in the one-pager.*

---

## 3. Competitive Landscape (why us)

**"The market already exists. We win a different part of it."**

*These companies prove the market. We are not trying to beat them at their own game.*

Funding raised (legend: Independent / Acquired):

- Braintrust - $116M
- Galileo - $68M (acquired)
- Langfuse - $4.5M (acquired)
- Patronus AI - $70M

- Galileo → acquired by Cisco, folded into Splunk Observability (May 2026). Langfuse → acquired by ClickHouse (Jan 2026).
- Combined: ~$258.5M raised across these four - two already acquired (prices undisclosed). Category TAM: $1.15B in 2025 → $9.57B by 2035

**Where Tricentis wins**

- **We own the gatekeepers.** The people who decide whether an agent can go to production are already Tricentis customers. No one is serving them with a tool.
- **We complete the quality loop.** Tosca and qTest cover code. AgentScore extends the same trust to the agents that code powers.
- **Competitors prove the demand.** Rivals already charge a premium for eval runs, but they serve expert eval engineers. We serve the people who sign off on production.

*Notes (speaker notes on slide): citations for Braintrust Series B, Galileo Series B (Forbes), Langfuse seed round, Patronus AI $50M (TechCrunch), and Precedence Research (model evaluation and benchmarking tools market, 2026-2035). Dollar figures on this slide are funding raised, not ARR.*

*Removed in the restructure: the standalone "Why Tricentis Should Solve This" slide (its cost-advantage and timing-advantage claims were rejected in the pitch review), and the "no competitor leads with zero-setup grading" differentiator (easy setup is too thin a moat).*

---

## 4. What AgentScore Is

**"What AgentScore Is"** (eyebrow: Product)

*Easy to start, smart defaults, works for most teams. Not the top-tier data-science scorer.*

Problem strip: Customers don't know what to test, how, or whether it's enough. Fear leads to ship paralysis. Other tools say go learn to be a data scientist.

Four cards:

- **Zero setup** - Point it at a trace. AgentScore picks the right evals from 40+ for you. No data science required.
- **A Verdict, Not a Pass/Fail** - A 0-100 score and a ship/warn/block verdict. It answers "can this go to production?"
- **Root-Cause Attribution** - Down to the span, paired with a suggested fix.
- **Tiered Evidence Model** - Deterministic checks, judge with confidence intervals, golden-dataset back-testing. Audit-ready, not a black box.

*Positioning spine: "Apple for agent evaluation."*

---

## 5. Target Persona

**"Who Actually Buys This" - Ranked by priority: who reacts to the score, and why.**

| Persona | Why they care | Priority |
| --- | --- | --- |
| QA/quality leader at an agent-deploying enterprise | Owns "is this agent safe to ship" but has no tooling built for agent behavior - wants a defensible score and root-cause attribution. | Primary |
| AI/platform program owner at scale | Owns dozens of agents shipping to prod with fragmented ownership - reacts most strongly to the single ship/warn/block verdict. | Primary |
| SI/consulting partner building agents for clients | Needs third-party evidence of quality to close their own client deals - a resale motion, not just internal use. | Secondary |
| Regulated-industry buyer | Compliance/audit sensitivity makes "how do you know it's accurate" a gating question before production. | Secondary |

---

## 6. Target ICP

**"Does the account answer yes to these?"**

*If you're a sales rep, here's what to look for in an account.*

**Yes to these**

- Are you building agents today?
- Are you running agents in production every day?
- Are you running multiple agents or workflows, not just one? More surface area, more manual grading pain.
- Are you running external agents, tools, or MCPs alongside internal ones that you can't score side by side? (GitHub Copilot, Copilot Studio, homegrown frameworks, other vendors, MCP servers)
- Why they say yes: governance and spend worry ("how do we know it's safe?"), or homegrown grading they want to cut or tighten.

**Not our ICP**

- Talks about Claude, not about evaluating agents. Interest in AI is not the same as wanting agent evaluation.
- Very early in the AI journey, with no agents built yet.

Callout: **Bonus signal:** no dedicated AI engineers or existing eval tooling in-house → AgentScore isn't competing against a build option, it's the only realistic path to a rigorous eval.

Footer: Nearly all demo customers already have AI Workspace. Useful as proof, not the definition.

---

## 7. Customer Value

**"Customer Value"** (eyebrow: Value Prop)

*Teams with evals ship in days. Teams without spend weeks.*

Hero strip:

- Quote: "Teams without evals face weeks of testing while competitors with evals can quickly determine the model's strengths, tune their prompts, and upgrade in days." - Anthropic Engineering, "Demystifying evals for AI agents"
- **~2.5 months** - Internal example: first agent version to a confident "this works." Target: minutes.

| What you get | Cost of not having it |
| --- | --- |
| Velocity: know when you're ready, instead of running on customer vibes. | Weeks of testing instead of days |
| A defensible verdict instead of a gut call, with one yardstick across fragmented ownership. | ~2.3 AI-driven errors/qtr at $50K-$2.1M each |
| Root-cause attribution: a fix, not a re-run. | Engineering hours per issue *(number still needed)* |
| Coverage without in-house AI expertise. Zero-setup profiling means no data scientists required. | Cost to hire or build eval expertise *(number still needed)* |

*Notes (speaker notes on slide): citation for Barot, D. (2026, July 15), "The cost of AI agent failures: What breaks and why" (ContextQA); the Anthropic Engineering source URL; a note that the "~7x faster" claim is pending a source from David and the pull-quote wording should be verified against the live post; and the labor stat moved off-slide (~4.3 hours/week/employee verifying AI outputs).*

*Removed in the restructure: the "Why Customers Will Pay" framing, the SI-resale bullet (a partner motion, covered on the persona slide), and the "How AgentScore pays for itself" box (its figures moved into the ROI slide).*

---

## 8. ROI Metrics

**"Four ROI Metrics We Can Measure Today"**

*Computed from existing telemetry - no pilot required.*

1. **Time to Production Readiness**
   - Measuring: First agent trace to first ship verdict.
   - Estimate: ~2.5 months today (internal example). Target: minutes.
   - Improves via: Know when you're ready, not guess. Teams with evals upgrade in days, not weeks.
   - Cost avoided: 2.3 AI-driven errors/qtr, $50K-$2.1M each.
2. **Fewer Incidents**
   - Measuring: Pre-production verdicts flagged, per agent.
   - Estimate: ??? per agent - baseline needs a telemetry pull.
   - Improves via: Visibility that's ~0 today without it.
3. **Dollar-Justified Budget Line**
   - Measuring: Estimated incident cost avoided vs. subscription price.
   - Estimate: Directional until incident-cost estimates are validated with a customer.
   - Improves via: Turns "we flagged 40 issues" into "we avoided an estimated $2M." The number that justifies the budget line.
4. **Less Engineering Time**
   - Measuring: Root-cause coverage, and evals auto-generated vs. hand-authored.
   - Estimate: ??? % of issues with a root cause. ~4.3 hrs/week/employee verifying AI outputs today.
   - Improves via: Root cause and evals are automatic. Answers "why not build it ourselves."

**Status:** Velocity and verdict metrics come from existing telemetry. Dollar figures are directional until incident-cost estimates are validated with a customer.

*Notes (speaker notes on slide): how each one ties to ROI -*

- *Time to production readiness → ROI = velocity. The hard part of building agents is not fixing them, it is knowing when they are ready. Teams with evals upgrade in days; teams without face weeks of testing (Anthropic Engineering). The ~7x faster claim is pending a source from David.*
- *Fewer incidents → ROI = risk avoided. Every flagged issue is a bug, hallucination, or policy violation that didn't reach production. Fortune 500: ~2.3 AI-driven errors per quarter at $50K-$2.1M each.*
- *Dollar-justified budget line → ROI = the dollar figure executives buy on, the number that justifies the subscription price against a budget line.*
- *Less engineering time → ROI = time saved on debugging and the cost of the alternative (build vs. buy). Labor context: ~4.3 hours/week/employee spent verifying AI outputs.*
- *Together, these map to the four things a buyer pays for: velocity (1), fewer incidents (2), a dollar-justified budget line (3), less engineering time (4). Regression rate was dropped as a standalone card (needs weeks of history, no cross-customer baseline).*
