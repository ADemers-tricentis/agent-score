# AgentScore Customer Feedback Log

Unified, running log of customer/prospect interviews and demo debriefs. Each entry captures the date, who was in the room, what we learned, and the major asks that came out of the conversation. Full call debriefs (when they exist) live alongside this file in `docs/feedback/` - this doc is the index and summary.

**How to add an entry:** append a new section under "Sessions" using the template at the bottom of this file, newest first. Pull the "Major asks" into the "Recurring asks" table below if they echo a prior session, or add a new row if they don't.

---

## Recurring asks (tracked across sessions)

| Ask | Sessions raised in | Status |
|---|---|---|
| On-prem / no-cloud deployment | Meta | Open - no architecture answer yet |
| Firm, consistent timeline (POC/beta dates that don't move mid-call) | Workday, Meta | Open - need one rehearsed slide every speaker uses |
| Clear answer to "is this a testing tool or an observability tool?" | Workday | Open - category framing needs to be fixed in the deck |
| Crisp, rehearsed answer to "why trust the LLM judge / how do you know it's accurate?" | Workday | Open - tiered answer drafted in Workday debrief, not yet shipped |
| Deterministic/exploratory "red-team the agent" testing (not just passive grading) | Meta | Open - not built yet, matches buyer's own mental model |
| Root-cause attribution (span + fix, not just a score) | Workday, Meta, Wolters Kluwer | Landing well - keep leading with this |
| Evaluate a *group*/hierarchy of agents, not just one in isolation | Meta, Wolters Kluwer | Lands as a concept, not shipped - Wolters Kluwer needs literal bulk/fleet-level scoring (point at a repo of agents, score together) and called per-agent-only "not useful" at their scale; targeted "hopefully end of month" |
| Agentforce / Salesforce-native integration | Workday | Open - known gap |
| Fine-grained access control / RBAC / self-service onboarding | Wolters Kluwer | Open - admin + mostly-view-only today; roles, per-tenant/agent scoping, and self-service all "on the roadmap" - a stated rollout blocker for a governance-driven buyer |
| Score agents outside the Tricentis ecosystem (e.g. GitHub Copilot, internal platforms) to benchmark against sanctioned tooling | Wolters Kluwer, Tritusa | Open - vision, not a named shipped feature; was Wolters Kluwer's origin reason for the call; Tritusa needs it for non-Tricentis client agents |
| Compliance validation (GxP/SOX-style regimes, PII flagging on traces) | Tritusa | Open - "not currently, easy to add"; roadmap only. Blocker for regulated (bank/pharma) clients |
| Alerting when an agent degrades (Slack/email to managers/admins) | Tritusa | Open - not built, stated "top of the list" |
| Bulk / programmatic export of traces + scores (get the data out, not just view it) | Wolters Kluwer, Tritusa | Open - API in progress, possibly alpha, not shipped. Larger/partner accounts keep asking |
| Synthetic dataset generation (targeted/edge-case coverage without waiting for real traces) | Tritusa | Open - golden sets are curated from real interactions only; roadmap |
| Partner co-sell / co-working motion (SIs who implement + evaluate for their own clients) | Tritusa | Open - asked twice, no answer available; gold-sponsor partner presenting our story at Transatlantic 26 |

---

## Sessions

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
