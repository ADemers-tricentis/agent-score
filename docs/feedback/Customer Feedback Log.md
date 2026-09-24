# AgentScore Customer Feedback Log

Unified, running log of customer/prospect interviews and demo debriefs. Each entry captures the date, who was in the room, what we learned, and the major asks that came out of the conversation. Full call debriefs (when they exist) live alongside this file in `docs/feedback/` - this doc is the index and summary.

**How to add an entry:** append a new section under "Sessions" using the template at the bottom of this file, newest first. Pull the "Major asks" into the "Recurring asks" table below if they echo a prior session, or add a new row if they don't.

---

## Recurring asks (tracked across sessions)

| Ask | Sessions raised in | Status |
|---|---|---|
| On-prem / no-cloud deployment | Meta (x2) | Confirmed with engineering (2026-09-23) - self-hosted deployment in customer's own AWS/EC2 is a go |
| Firm, consistent timeline (POC/beta dates that don't move mid-call) | Workday, Meta | Open - need one rehearsed slide every speaker uses |
| Clear answer to "is this a testing tool or an observability tool?" | Workday | Answered - name the category, don't fight the word: something else drives the agent, AgentScore grades. Boundary picture: Driver -> Agent -> Traces -> AgentScore grades. Ready to ship to the deck |
| Crisp, rehearsed answer to "why trust the LLM judge / how do you know it's accurate?" | Workday | Answered - tiered: (1) deterministic/hybrid checks wherever ground truth exists, (2) LLM-judge dimensions with pass@k + confidence intervals + minimum-sample gating where it doesn't, (3) golden-dataset back-testing. Close on a live correctness-dimension walkthrough, not narration. Ready to ship to the deck |
| Deterministic/exploratory "red-team the agent" testing / scenario bank (define + run scenarios, not just passive grading) | Meta (x2), L'Oreal | Open - roadmap, not built as an AgentScore capability. Now the pivotal gap for the Meta POC: separates "evaluate prod agents" (shippable) from "test dev-to-prod". L'Oreal hit the same wall from a different angle - asked twice whether he could hand AgentScore a batch of 10-15 test prompts to run on demand; told no, it only scores organic usage traces. Note: on the first Meta call, David floated Tosca (informally, not AgentScore itself) as a way to drive/simulate scenario inputs - a partial, off-product answer, not a shipped fix |
| Point the evaluator/judge at customer's own internal/custom LLMs (self-hosted, not a cloud judge) | Meta | Open - technical precondition for Meta on-prem; to be confirmed with engineering |
| Root-cause attribution (span + fix, not just a score) | Workday, Meta, Wolters Kluwer, Tritusa | Landing well - keep leading with this |
| Evaluate a *group*/hierarchy of agents, not just one in isolation | Meta, Wolters Kluwer | Lands as a concept, not shipped - Wolters Kluwer needs literal bulk/fleet-level scoring (point at a repo of agents, score together) and called per-agent-only "not useful" at their scale; targeted "hopefully end of month" |
| Agentforce / Salesforce-native integration | Workday | Open - known gap |
| Fine-grained access control / RBAC / self-service onboarding | Wolters Kluwer, L'Oreal | Open - admin + mostly-view-only today; roles, per-tenant/agent scoping, and self-service all "on the roadmap" - a stated rollout blocker for a governance-driven buyer; L'Oreal hit the same wall from the other direction - has AI Workspace + credits already purchased, but ingesting into AgentScore from an existing Workspace tenant needs the Workspace admin team to configure it first, so he's trialing standalone instead of waiting |
| Score agents outside the Tricentis ecosystem (e.g. GitHub Copilot, internal platforms) to benchmark against sanctioned tooling | Wolters Kluwer, Tritusa | Solved - any agent that supports OTel can be ingested, regardless of vendor |
| Compliance validation (GxP/SOX-style regimes, PII flagging on traces) | Tritusa | Open - "not currently, easy to add"; roadmap only. Blocker for regulated (bank/pharma) clients |
| Alerting when an agent degrades (Slack/email to managers/admins) | Tritusa | Open - not built, stated "top of the list" |
| Bulk / programmatic export of traces + scores (get the data out, not just view it) | Wolters Kluwer, Tritusa | Open - API in progress, possibly alpha, not shipped. Larger/partner accounts keep asking |
| Synthetic dataset generation (targeted/edge-case coverage without waiting for real traces) | Tritusa | Open - golden sets are curated from real interactions only; roadmap |
| Partner co-sell / co-working motion (SIs who implement + evaluate for their own clients) | Tritusa | Open - asked twice, no answer available; gold-sponsor partner presenting our story at Transatlantic 26 |
| Expose the eval run-count / non-deterministic repetition setting to users (backend-config only today) | BearingPoint | Open - flagged internally as low effort, not yet exposed |
| Point AgentScore at Tricentis's own agents (e.g. QTest ATC) so a partner can prove to their client that agent works | BearingPoint | Open - deliberately not exposed today for proprietary/IP reasons; blocks BearingPoint's most concrete use case |

*Audit note (2026-09-11): reviewed every row for a question that can now be answered vs. a genuine product/roadmap/business gap. Category framing and judge-trust (rows above) now have rehearsed answers and are ready to ship. Cross-ecosystem OTel ingestion is confirmed solved. Everything else - on-prem self-hosting, internal-LLM judge, scenario bank/red-teaming, fleet-level scoring, Agentforce integration, RBAC, compliance validation, alerting, bulk export, synthetic datasets, partner co-sell - is still a real engineering, roadmap, or business decision pending confirmation, not something answerable today.*

*Update (2026-09-23): on-prem self-hosting confirmed with engineering - no longer pending (see row above).*

---

## Sessions

### 2026-09-24 - L'Oreal (Labs beta onboarding)

- **Who:** KASHANI Khadim (Test Automation Manager, L'Oreal India Tech Hub / ITH, covers the APAC zone, leads L'Oreal's test automation factory, works with Tosca). Paul Wagner (Tricentis account contact) joined partway through with org context. Tricentis: Andrew Demers.
- **What we learned:** A Labs signup converted into a first hands-on intro call, driven by Khadim attending the Transform Singapore event (~week of 2026-09-15) and registering for Labs the same weekend. His team runs a live ELK/Elastic-Cloud-based reconciliation agent internally, and evaluates it entirely manually today - run a prompt, open the dashboard, manually compare the agent's answer to the query results, and manually track accuracy/efficiency/tokens/latency. That manual workflow is exactly what he wants AgentScore to replace, and he wants to run a self-driven POC to build an internal pitch to his own stakeholders as L'Oreal ramps up more AI initiatives across zones. Tool-call/argument-correctness verification against backend query results, two-line OTel + standalone operation, configurable weighting/thresholds, and fleet-level status all landed and answered his questions directly. Separately, Paul Wagner noted L'Oreal has already purchased AI Workspace with 1M+ agent credits provisioned.
- **Major asks:**
  - Ability to hand AgentScore a batch of test prompts/scenarios (he asked for 10-15) and have it run them on demand - asked twice, in different words; the answer he got was no, AgentScore only scores traces from real/organic agent usage, it doesn't execute a supplied prompt set. Same scenario-bank/simulation gap raised by Meta.
  - Self-service access to AgentScore when an agent already lives in AI Workspace - today requires the Workspace admin team (Charles Henry's team) to configure it first, so Khadim is trialing standalone instead of waiting on that dependency.
  - Faster public trial access - the public-facing signup site is targeted for "next week," not available on the call itself, and he pushed on this repeatedly.
  - A detailed demo recording/walkthrough (not the existing basic PPT/YouTube asset) to share with his Singapore-based manager ahead of their next call.
- **Full debrief:** [feedback-sessions/L'Oreal Feedback Session.md](feedback-sessions/L'Oreal%20Feedback%20Session.md)

### 2026-09-23 - BearingPoint (partner / SI, Labs beta onboarding)

- **Who:** Rohan Patil (Senior Technology Consultant, testing/QA architecture lead, ~10 yrs, runs BearingPoint's internal SAP-focused testing factory). Tricentis: Andrew Demers.
- **What we learned:** A Labs signup converted into a first hands-on intro call, not a deep technical evaluation yet. BearingPoint's testing factory is picking up more agents/tools and has **no evaluation tooling at all** today ("we don't have anything of that sort") - that gap is exactly what drew Rohan to sign up. Two use cases surfaced: run AgentScore against BearingPoint's own QTest ATC test-case-generation agent, and build an answer he can show his own clients when they ask "how do you know the agent works" (BearingPoint just launched its own agentic-AI platform, GenAIQ, and expects that question soon) - same partner/SI lens as Tritusa and Wolters Kluwer. Auto-derived agent profiles, two-line OTel setup, configurable weighting/verdict bands with immutable versioned baselines, root-cause attribution, and region-based EU/US data residency all landed cleanly and were followed with detailed, technical questions.
- **Major asks:**
  - Expose the non-deterministic run-count / trace-threshold setting to users (currently backend-config only, not shown in-product).
  - Visibility into Tricentis's own agents (e.g. QTest ATC) inside AgentScore, so a partner can point at it and prove "your agent works" to a client - currently withheld for proprietary/IP reasons, and the one wall his most concrete use case hit.
  - Setup + evaluation-criteria slides to bring to his manager (and eventually his own clients) - nothing existed to hand over on the call itself.
- **Full debrief:** [feedback-sessions/BearingPoint Feedback Session.md](feedback-sessions/BearingPoint%20Feedback%20Session.md)

### 2026-09-11 - Meta (POC scoping, via delivery partner)

- **Who:** A delivery/SI partner positioning to build the POC for Sri's team ("your tool, our people") - a business/account lead, Satish (supply chain domain), Alex (technical/integration), Ranjit (Sri liaison), Jagesh (shared the arch slide). End client Sri (Meta autonomous supply chain) not on the call. Tricentis: Andrew Demers (Greg referenced). *(Non-diarized transcript - attributions inferred.)*
- **What we learned:** A follow-on to the 2026-08-11 Meta call, but a POC-scoping session run through a partner who already has an underused Tosca footprint at Meta. Two-line OTel held up under scoping. On-prem finally has a plausible answer: it already runs on AWS, so the path is self-hosting in Meta's own private EC2 (they are a big AWS shop) - uncommitted pending engineer confirmation. Evaluator model (library / gEval / hybrid, 40+ evals, auto-profiles with confidence, weighted dimensions, composite + needs-attention), golden-dataset back-testing, and trace-level root-cause all landed. The crux of the call was exposure/perception risk: the partner asked point-blank whether AgentScore is mature enough to put in front of Meta, and Andrew's honest split - production-agent evaluation yes, full pre-prod simulation not yet - is what the POC scope has to be built around.
- **Major asks:**
  - Self-hosted / on-prem deployment in Meta's own AWS (data can't leave, custom internal models). Now has a floated path (private EC2 + handoff), not yet confirmed.
  - Point the evaluator/judge at Meta's internal/custom LLMs (Spark 1.3, "meta intern"-style models) rather than a cloud judge - the technical precondition for on-prem to work for them.
  - Scenario bank / adversarial simulation ("define scenarios, run them, see how the agent responds") - the pivotal gap; separates "evaluate prod agents" (shippable) from "test dev-to-prod" (not yet). Same red-team ask Sri raised directly.
  - A carefully-scoped, transparent POC framing so an early-stage product doesn't create bad perception with a savvy client ("harder to walk back once it's out there").
  - Fast answers - Sri's need is urgent and there is another partner circling the account.
- **Full debrief:** [feedback-sessions/Meta POC Scoping Feedback Session.md](feedback-sessions/Meta%20POC%20Scoping%20Feedback%20Session.md)

### 2026-09-11 - Tritusa (partner / SI)

- **Who:** Tritusa's AAA evals-and-assurance practice lead (drove the call and demoed live), Pankaj (Tosca lead, ~8 yrs), Vedanth (principal architect, ~decade in Tosca), Deepan + an account contact. Tricentis: Andrew Demers. *(Names approximate - messy auto-diarized transcript.)*
- **What we learned:** Not an end buyer - a **Tricentis gold-sponsor partner/SI** who both builds agents for their clients (two live demos: a Copilot Studio agent and an AI Workspace MCP+A2A agent, each turning a requirements doc into qTest requirements/test cases and Tosca execution) and runs an advisory practice on LLM choice, safety, and compliance. The whole call was driven by a hard deadline: they present an autonomous QA agent at **Transatlantic 26 Singapore the week of 2026-09-15** and expect customers to hammer them on trust/models/benchmarks/safety/compliance. Auto-derived agent card, two-line OTel + "any model, anywhere" (incl. local Llama/Mistral), and root-cause attribution ("agent claimed done but no tool call fired") all landed - the last drew an explicit "brilliant." The benchmark reframe ("we grade the agent, the providers already benchmarked the model") is the right answer but needs to be rehearsed for the event.
- **Major asks:**
  - Compliance validation (GxP/SOX-style, PII flagging) - biggest unmet ask; their clients are banks and pharma. "Not currently, easy to add" won't survive a regulated engagement.
  - Alerting to managers/admins (Slack/email) - not built, "top of the list."
  - Bulk/programmatic export of traces + scores to their own DB for their own reports - API in progress, not shipped.
  - Synthetic dataset generation - not available; golden sets curated from real traces only.
  - Partner enablement before the event: access grant (~a week out), getting-started docs with sample use cases, and a rehearsed "answer guide" for the Singapore Q&A (Andrew is not attending).
  - A partner co-sell/co-working motion - asked twice, no answer available today.
- **Full debrief:** [feedback-sessions/Tritusa Feedback Session.md](feedback-sessions/Tritusa%20Feedback%20Session.md)

### 2026-09 (exact date undated) - Wolters Kluwer

- **Who:** Paul DiGrazia (quality/AI leader, deeply embedded design partner), Chris Allanson (Labs signup contact, QA/governance lens), Hope Isley (joined at the end). Tricentis: Andrew Demers.
- **What we learned:** A warm, high-context relationship that already co-designs the product, not a cold evaluation - tone was positive throughout. "Score agents outside the Tricentis ecosystem" (GitHub Copilot, WK's internal FAB platform) was their reason for the call and landed squarely with the "any agent, anywhere" positioning. LLM before/after benchmarking (immutable runs, rerun and compare) got the strongest single hit of the call. Auto-generated agent card, the dual access model (embedded in AI workspace + standalone platform), and the per-scoring-run packaging model all landed cleanly. Internal dogfooding (scoring Tricentis's own quality agent, Q-tests, MCP agents) was the most credibility-building unscripted moment, same as it was with Meta.
- **Major asks:**
  - Bulk/fleet-level scoring - point at a repo full of agents, score them together. Called out twice as their core requirement; per-agent-only today is "a proof of concept, not the product they need." Biggest gap in the call.
  - RBAC / self-service administration - roles, per-tenant/agent scoping, and self-service onboarding without a central bottleneck, named a "big concern"; currently just admin + mostly-view-only.
  - A lower-touch onboarding path for WK's internal FAB LLM platform (today requires going through the FAB team for endpoint/config changes).
  - Confirmation of WK's telemetry protocol and trace storage before pilot scoping - unverified whether they use OTel.
  - Pair any bulk-scoring date with a sampling/cost story so "we can do your whole fleet" doesn't collide with the cost of scoring every trace on every agent.
- **Full debrief:** [feedback-sessions/Wolters Kluwer Feedback Session.md](feedback-sessions/Wolters%20Kluwer%20Feedback%20Session.md)

### 2026-08-11 - Meta

- **Who:** Sri (owns Meta's autonomous supply chain program, 30-40 engineers). Tricentis: Greg, David, Andrew.
- **What we learned:** Sri's mental model was already sharp (deterministic vs. non-deterministic testing, agent vs. orchestration-level validation, a target metric). Individual + collective evaluation mapped directly onto his functional -> value-stream -> enterprise hierarchy and drew the clearest unprompted buy-signal in the call. Zero-friction OTel ingestion and the broad "agent" definition (covers Metamate too) both landed well.
- **Major asks:**
  - On-prem deployment - stated as the #1 requirement and a dealbreaker (Meta's DMZ policy blocks anything outside it, cloud included).
  - A firm timeline - self-testing is being switched off next week with nothing to replace it; Tricentis dates moved live on the call.
  - Deterministic/exploratory "make the agent fail" red-teaming - not built yet, but matches Sri's own framing exactly.
  - A resolved answer on the HCL/Accenture coopetition risk (both are Tricentis partners and are separately tasked by Meta to build a competing framework).
- **Full debrief:** [feedback-sessions/Meta Feedback Session.md](feedback-sessions/Meta%20Feedback%20Session.md)

### 2026-07-24 - Workday

- **Who:** Rushi (delivery director owning agent delivery), Pradeep (senior QA, agent testing/automation). Run Workday agents and Salesforce Agentforce agents against external Data Cloud + RAG. Tricentis: Greg, Andrew.
- **What we learned:** "Knowing what to measure" was the strongest, most differentiated message and survived the whole call intact. Zero-integration OTel positioning resonated. Root-cause attribution (wrong tool -> bad data -> bad answer, with span + fix) was the most compelling capability shown. Reliability signals (confidence intervals, pass@k, minimum-sample gating) read as credible to a technical QA audience.
- **Major asks:**
  - A clear category answer to "is this a testing tool or not?" - raised four times, never resolved; QA persona left unconvinced. Needs a driver-vs-grader boundary framing (Driver -> Agent -> Traces -> AgentScore grades).
  - A crisp, rehearsed accuracy answer - "there's a response, no error, how do you know it's accurate?" got a wandering answer instead of a tiered one (deterministic checks -> LLM judge + CI -> golden dataset).
  - Stop leading with "supplementary, not a replacement" - audience couldn't state what AgentScore definitively owns.
  - Agentforce/Salesforce-native integration (known gap, this account maps everything to it).
- **Full debrief:** [feedback-sessions/Workday Feedback Session.md](feedback-sessions/Workday%20Feedback%20Session.md)

---

## Template for new entries

```
### YYYY-MM-DD - [Company]

- **Who:** [buyer names/roles], [anyone else notable]. Tricentis: [names].
- **What we learned:** [2-4 sentences - what resonated, what mapped onto their existing mental model, any unprompted buy signals]
- **Major asks:**
  - [ask 1]
  - [ask 2]
- **Full debrief:** [link, if a separate transcript debrief exists]
```
