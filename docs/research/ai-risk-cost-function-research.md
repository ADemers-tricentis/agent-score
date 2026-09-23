# Cost Functions for Eval Failures & Risk-Profiling as a Service

> *Exploratory research, not a business-case claim. Spun out of the AgentScore business case so the main doc stays focused on what's validated - see [Open Questions](../../docs/go%20to%20market/one-pager-agentscore-business-case.md#open-questions--honest-risks) there for how this connects.*

---

## The question this started from

> Can I associate a "cost function" with failures in different evals (the "so what")?
> Reputational harm. Regulatory breach. E.g. "slightly increased risk of legal action against you due to a 5% reduction in Bias score."
>
> The dream: how do we create a repeatable delivery service at scale for identifying the business risk, connecting agents, building the profile, evaluating, and delivering the report to the customer?

Two separate ideas live in that question:

1. **A cost function** - can a specific eval failure be priced, not just scored?
2. **A delivery model** - can the whole pipeline (connect -> profile -> evaluate -> price -> report) run repeatably, at scale, without a human analyst in the loop per account?

---

## 1. Is anyone actually doing this? (FAIR and FAIR-AIR)

**FAIR (Factor Analysis of Information Risk)** is a real, widely-adopted quantitative risk standard - it's the basis for the Open Group's O-RT risk taxonomy and is used across cyber-risk quantification (CRQ) platforms: Safe Security (which acquired RiskLens), Kovrr, Axio, and FortifyData all build on it; SimpleRisk layers FAIR-based scoring with AI assistance on top ([vCSO.ai CRQ comparison](https://vcso.ai/learn/cyber-risk-quantification-tools-comparison/)). The core formula:

```
Risk = Loss Event Frequency (LEF) x Loss Magnitude (LM)
```

LM splits into **primary loss** (direct financial: legal fees, remediation, lost revenue) and **secondary loss** (reputational: brand erosion, lost contract discounts, emergency PR response).

**FAIR-AIR (AI Risk) is narrower and newer than it sounds.** It's not an independently-governed standard the way core FAIR is - it's a GenAI/agentic-risk extension published through the FAIR Institute's blog, authored by Jacqueline Lebo of **Safe Security** ([FAIR AI Cyber Risk Playbook](https://www.fairinstitute.org/blog/fair-artificial-intelligence-ai-cyber-risk-playbook), [FAIR-AIR for third-party AI risk](https://www.fairinstitute.org/blog/navigating-the-new-frontier-a-deep-dive-into-fair-air-for-third-party-risk)). Safe Security's own SAFE One platform is the primary implementation - it "instantly contextualizes and quantifies AI risk in dollar terms" for CISOs, per their own materials. There's at least one real-world usage citation: FAIR-AIR was used to support a dissent in an FTC case involving Rytr, an AI-writing tool ([case study](https://www.fairinstitute.org/blog/ai-risk-quantification-case-study-fair-air-ftc-rytr-case)) - so it has been used outside a vendor's own marketing, but as a novel/contested application, not an established norm.

**Read on this: FAIR itself is proven and widely adopted for cyber risk broadly. FAIR-AIR specifically for AI/agent risk is one vendor's extension, applied in a handful of documented cases - a leading-edge approach, not an industry-standard one yet.** That's a meaningfully different claim than "the industry does this," and matters for how confidently AgentScore could market a FAIR-AIR-based cost function - it would be adopting an emerging methodology, not a settled one.

**NIST AI RMF** makes a similar move independent of FAIR: its Map and Measure functions call for mapping each AI failure/threat domain to a loss category (regulatory penalty schedules, breach-notification-cost models, customer-churn models), then measuring toward that mapping rather than a generic score ([NIST AI RMF](https://airc.nist.gov/airmf-resources/airmf/)). NIST AI RMF is far more broadly adopted as a governance reference than FAIR-AIR specifically, but it's a framework for organizing the mapping, not a formula for computing a dollar figure the way FAIR is.

**Bottom line:** the *shape* of "map a failure to a loss category, then price it with frequency x magnitude" is a legitimate, precedented move - AgentScore wouldn't be inventing risk quantification. But citing "FAIR" cleanly (core FAIR, cyber risk generally) is on firmer ground than citing "FAIR-AIR" as if it were an established AI-risk standard - it's currently one vendor's applied methodology.

---

## 2. Mapping AgentScore's own eval catalog to loss categories (proposed, not built)

Using the marketing-facing eval catalog (`agent-score-marketing/docs-src/src/content/EvalCatalog.tsx`) as the framing customers already see:

| Eval family | Loss category | What it maps to |
| --- | --- | --- |
| Bias, Toxicity, Misuse, Role Violation (Safety) | Reputational (secondary loss) | Brand erosion, SI/partner trust, lost contract discounts |
| PII Leakage (Safety) | Regulatory (primary loss) | Breach notification cost, fines - FAIR's own worked example prices this around $150/exposed record |
| Hallucination, Faithfulness, Answer Correctness (Groundedness/Correctness) | Direct financial (primary loss) | The $50K-$2.1M/incident figure already cited in the business case's [Cost of Getting It Wrong](../go%20to%20market/one-pager-agentscore-business-case.md#the-cost-of-getting-it-wrong) |
| Trajectory Efficiency, Conciseness (Quality/Efficiency) | Waste (no incident) | The 40-60% wasted-token spend cited in the same section |

**Worked example**, using the framing this started from: a 5-point drop in **Bias** isn't "the score went down" - it's "reputational-loss exposure went up." Risk = Frequency x Magnitude gives a path to size that: if an agent handles 5,000 customer interactions/day (frequency) and a Bias failure at this severity has historically triggered an escalation once per some number of interactions, multiply that rate by the cost of one escalation - PR response, a lost contract discount, a legal review (magnitude) - and the result is an annualized loss expectancy, not a gut call.

### What this actually requires that doesn't exist yet

A prior codebase audit (September 2026) found no shipped foundation for this:

- **No per-eval risk/loss-category tag anywhere in running code.** The closest thing is a data-model sketch in the PRD (`docs/planning/AgentScore-PRD.md`) - a per-eval `riskLevel` (high/medium/low), `behaviorClass` (permissible/impermissible), and a `SafetyOverride.severity` flag that can force a Block verdict independent of the composite score. None of these are wired into a scoring pipeline in this repo.
- **No root-cause attribution chain is implemented.** The PRD's `Attribution` type (`rootCause`, `confidence`, `agentFault`, `chain[]`) is a sketch with zero implementation found in `agentscore-frontend/src/`. Without this, there's no way to attribute a specific failure to a specific eval at the frequency needed to compute Loss Event Frequency - today's data only supports eval-level evidence refs and a coarse per-eval error-class count (`fake-runs.ts`), not a causal chain.
- **No dollar-cost or loss-category field in the schema at all.** There's a per-run infra cost (`ledgerCostUsd`) and token-usage cost controls, but that's inference cost, not customer-impact cost.
- **The "11 dimensions / 60+ evals" claim itself is inconsistent across the repo** - marketing docs, the PRD, the FAQ, and the actual frontend fixtures each describe a different count/list. Any cost-function taxonomy built on top of "the eval catalog" needs to first settle which catalog is real.

**What building this for real would need, beyond what exists:**
1. A loss-category tag per eval (the table above is a starting taxonomy).
2. Frequency data - which needs root-cause attribution to ship first, since "how often does this fire" requires attributing failures to a specific eval, not reading a composite score.
3. A customer-specific magnitude input - blast radius, records touched, actual regulatory exposure - which is an account-specific discovery question, not a constant that can be hardcoded once.

---

## 3. "The dream": risk profiling as a repeatable, scaled delivery service

The larger idea in the original question is a pipeline that does five things for any customer, automatically, at the frequency of a scoring run instead of an annual audit:

**Connect an agent -> build its risk profile -> evaluate it against that profile -> price the failures against loss categories -> deliver a report a compliance/GC stakeholder can act on.**

The first three are already true today for the AI Workspace ICP - zero-setup connection, auto-profiling, and evaluation are the product as it exists now. The last two - the cost-function layer above and an auto-generated risk report instead of a score-plus-fix - are what would close the loop.

**That gap is exactly where today's AI-risk-assessment market still charges the most and scales the least.** GRC-style AI risk assessment services (e.g. Schneider Downs, Elevate Consult, Continuum GRC) are consultant-driven and largely point-in-time because nothing in their pipeline is automated end-to-end - a person has to translate "the model did X" into "here's what that's worth" ([Elevate Consult, "What a Quality AI Risk Assessment Service Should Deliver in 2026"](https://elevateconsult.com/insights/what-a-quality-ai-risk-assessment-service-should-deliver-in-2026/)). The market is visibly moving toward continuous, platform-based assessment aligned to NIST AI RMF / ISO 42001 rather than point-in-time audits - but "moving toward" means this isn't a solved problem elsewhere either; it's a live gap, not just AgentScore's gap.

If AgentScore closed steps 4 and 5, it would be automating a motion that's currently manual and expensive across the entire AI-risk-assessment market - not just catching up to a competitor who's already done it. That's the actual size of the opportunity in "the dream," and also why it's a multi-step build (attribution -> cost function -> report generation), not a packaging change.

---

## 4. Is there an existing standard we could adopt, instead of inventing one?

Short answer: **no single standard does all three jobs we need** (categorize the failure, price it in dollars, and be recognized enough that a compliance buyer trusts the label). But there's a real, composable answer - each job has a standard that's actually a good fit, and none of them require inventing new taxonomy from scratch.

| Job | Best-fit standard | Why | Adoption reality |
| --- | --- | --- | --- |
| **Categorize what kind of risk an eval failure represents** | **ISO/IEC 23894** (AI risk management guidance) | Annex B gives a real AI-specific risk-source taxonomy (automation, explainability, complexity, data quality, drift, lifecycle, security, privacy) built by adapting ISO 31000 for AI - not vendor-invented. Feeds directly into ISO 42001's risk clauses. | Guidance, not certifiable itself - but it's the standard teams reach for specifically to structure this kind of mapping ([AI Standards Hub](https://aistandardshub.org/a-new-standard-for-ai-risk-management), [Mindgard](https://mindgard.ai/blog/iso-iec-23894-ai-risk-management-standard)) |
| **Categorize agent-specific behavioral failures** (closest fit to our actual eval dimensions) | **OWASP Top 10 for Agentic Applications (2026)** | Ten named risk categories - planning, tool use, identity, supply chain, code execution, memory, inter-agent communication, cascading failures, human-agent trust, rogue agents - map almost directly onto AgentScore's own Agentic/Tool-use, Safety, and Reliability dimensions. Actively maintained, community-driven (not one vendor), extends the broader OWASP LLM Top 10. | Live and current - 2026 edition, cross-references NIST and MITRE ATLAS ([OWASP GenAI Security Project](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/)) |
| **Give the categorization procurement/audit weight with regulated buyers** | **ISO/IEC 42001** (certifiable AI management system standard) | Requires an AI system inventory, risk assessment, and - the distinctive part - an AI *impact* assessment (clauses 6.1.4, 8.4), not just a generic risk register. Already certified for AWS, Anthropic, and Microsoft; adopted in the EU as EN ISO/IEC 42001:2026. This is the standard a bank/pharma compliance buyer (Tritusa's clients, Merck, Regeneron) is most likely to already be building toward. | Real, growing, certifiable - the strongest "this counts as evidence" claim of anything researched here ([Reco.ai](https://www.reco.ai/ciso-hub/iso-42001), [Konfirmity](https://www.konfirmity.com/blog/iso-42001)) |
| **Tie risk tier to what regulation actually requires** (for EU-exposed accounts) | **EU AI Act risk tiers** (unacceptable / high / limited / minimal) | Legally binding, not voluntary, for EU-exposed buyers. A published mapping already decomposes high-risk obligations into 48 operational sub-requirements and 66 verification activities - which is the same shape as AgentScore's own tiered evidence model (deterministic checks, judge + CI, golden-dataset back-testing). | Binding law, not a voluntary standard - the highest-stakes but narrowest-scoped fit, since it only applies where the AI Act applies ([arXiv: Assessing High-Risk AI Systems under the EU AI Act](https://arxiv.org/pdf/2512.13907)) |
| **Compute an actual dollar figure** | **Core FAIR** (Loss Event Frequency x Loss Magnitude) | The only one of these that produces a number, not just a category. Real, widely-adopted for cyber risk broadly (Safe Security, Kovrr, Axio, FortifyData all build on it). | Proven for cyber risk generally; **not** proven for AI-agent-specific risk - that's the FAIR-AIR gap already flagged in section 1 above |

**Two candidates considered and ruled out:**
- **AIVSS** (an emerging CVSS-style score for AI vulnerabilities) requires a published CVE with a CVSS base score as its starting point, then layers on ten "agentic risk amplification factors." It doesn't fit most of AgentScore's eval failures at all - a Bias or Hallucination failure isn't a CVE. Independent security analysis also flags it as having "a high barrier to entry," difficult to keep current against release cadence, and requiring deep AI/ML security expertise most teams don't have ([Spektion](https://spektion.com/articles/ai-risk-scoring-frameworks)). Not usable here.
- **AIR 2024** (an academic taxonomy unifying 314 risk types from EU/US/China regulation plus 9 AI labs' policies into one 4-level hierarchy) is a genuinely useful cross-jurisdiction reference, but it's a research paper, not an adopted standard - no certification, no procurement pull, nobody asks "are you AIR-2024-aligned." Worth citing internally as the most complete map of *how many different ways* regulators and vendors already slice this, not as something to claim compliance with.

**The realistic answer to "is there a standard we can use":** yes, but as a stack, not a single label - OWASP's Agentic Top 10 (or ISO 23894's risk-source taxonomy) to categorize *what kind* of failure an eval represents, ISO 42001 and/or EU AI Act tiers to give that categorization weight with regulated buyers, and core FAIR's frequency x magnitude formula to turn the categorized failure into an actual number. That's also how real GRC practice already treats this space - composing multiple standards, not picking one - so it's not an unusual position for AgentScore to take.

---

## Recommendation if this goes back into the business case

- Keep any FAIR citation scoped to **core FAIR** ("a proven cyber-risk-quantification methodology, which we'd be the first to apply to agent evals" or similar) rather than implying FAIR-AIR is an established AI-risk norm - it isn't yet, it's Safe Security's own extension with a handful of documented applications.
- If citing a categorization standard, **OWASP's Top 10 for Agentic Applications (2026)** is the strongest fit for the eval-dimension mapping itself - it's the only one of these built around agent behavior categories rather than generic AI risk or cyber vulnerabilities.
- If citing a compliance/procurement-facing standard, **ISO/IEC 42001** is the strongest fit for regulated-industry buyers specifically - it's certifiable, growing, and already held by names (AWS, Anthropic, Microsoft) those buyers already trust.
- Keep the "what doesn't exist yet" section prominent wherever this appears - the doc's own credibility depends on not overclaiming past what's shipped, per its existing Open Questions pattern.
- Treat the "repeatable service" vision as a north star tied to the fleet-level governance use-case cluster already in the business case, not a new pitch - it's five steps past where that cluster currently stops, not a separate idea.

---

## Sources

* FAIR Institute: [A Risk-Based Approach to Leveraging Agents](https://www.fairinstitute.org/blog/risk-based-approach-to-leveraging-agents-beyond-the-ai-horror-stories)
* FAIR Institute: [A FAIR Artificial Intelligence (AI) Cyber Risk Playbook](https://www.fairinstitute.org/blog/fair-artificial-intelligence-ai-cyber-risk-playbook)
* FAIR Institute: [Navigating a New Frontier - FAIR-AIR for Third-Party AI Risk](https://www.fairinstitute.org/blog/navigating-the-new-frontier-a-deep-dive-into-fair-air-for-third-party-risk)
* FAIR Institute: [AI Risk Quantification Case Study - FAIR-AIR Supports Dissent in FTC Rytr Case](https://www.fairinstitute.org/blog/ai-risk-quantification-case-study-fair-air-ftc-rytr-case)
* vCSO.ai: [CRQ Tools 2026 - 6 Platforms Compared](https://vcso.ai/learn/cyber-risk-quantification-tools-comparison/)
* NIST: [AI Risk Management Framework](https://airc.nist.gov/airmf-resources/airmf/)
* Elevate Consult: [What a Quality AI Risk Assessment Service Should Deliver in 2026](https://elevateconsult.com/insights/what-a-quality-ai-risk-assessment-service-should-deliver-in-2026/)
* ISO: [ISO/IEC 23894:2023 - AI, Guidance on risk management](https://www.iso.org/standard/77304.html)
* AI Standards Hub: [ISO/IEC 23894 - A new standard for risk management of AI](https://aistandardshub.org/a-new-standard-for-ai-risk-management)
* Mindgard: [ISO/IEC 23894: AI Risk Management Standard Explained](https://mindgard.ai/blog/iso-iec-23894-ai-risk-management-standard)
* ISO: [ISO/IEC 42001:2023 - AI management systems](https://www.iso.org/standard/42001)
* Reco.ai: [ISO 42001 - What the AI Management System Standard Requires](https://www.reco.ai/ciso-hub/iso-42001)
* Konfirmity: [ISO 42001 - The AI Management System Standard (2026)](https://www.konfirmity.com/blog/iso-42001)
* OWASP GenAI Security Project: [OWASP Top 10 for Agentic Applications for 2026](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/)
* arXiv: [Assessing High-Risk AI Systems under the EU AI Act - From Legal Requirements to Technical Verification](https://arxiv.org/pdf/2512.13907)
* Airia: [EU AI Act Risk Categories - Which Tier Is Your AI System?](https://airia.com/blog/eu-ai-act-risk-categories-which-tier-is-your-ai-system/)
* Spektion: [AI Risk Scoring Frameworks - AIVSS, MITRE ATLAS, OWASP](https://spektion.com/articles/ai-risk-scoring-frameworks)
* arXiv: [AI Risk Categorization Decoded (AIR 2024) - From Government Regulations to Corporate Policies](https://arxiv.org/pdf/2406.17864)
