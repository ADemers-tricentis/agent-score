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
| Root-cause attribution (span + fix, not just a score) | Workday, Meta | Landing well - keep leading with this |
| Evaluate a *group*/hierarchy of agents, not just one in isolation | Meta | Landing well - candidate for a named slide/feature |
| Agentforce / Salesforce-native integration | Workday | Open - known gap |

---

## Sessions

### 2026-08-11 - Meta

- **Who:** Sri (owns Meta's autonomous supply chain program, 30-40 engineers). Tricentis: Greg, David, Andrew.
- **What we learned:** Sri's mental model was already sharp (deterministic vs. non-deterministic testing, agent vs. orchestration-level validation, a target metric). Individual + collective evaluation mapped directly onto his functional -> value-stream -> enterprise hierarchy and drew the clearest unprompted buy-signal in the call. Zero-friction OTel ingestion and the broad "agent" definition (covers Metamate too) both landed well.
- **Major asks:**
  - On-prem deployment - stated as the #1 requirement and a dealbreaker (Meta's DMZ policy blocks anything outside it, cloud included).
  - A firm timeline - self-testing is being switched off next week with nothing to replace it; Tricentis dates moved live on the call.
  - Deterministic/exploratory "make the agent fail" red-teaming - not built yet, but matches Sri's own framing exactly.
  - A resolved answer on the HCL/Accenture coopetition risk (both are Tricentis partners and are separately tasked by Meta to build a competing framework).
- **Full debrief:** [Meta Feedback Session.md](Meta%20Feedback%20Session.md)

### 2026-07-24 - Workday

- **Who:** Rushi (delivery director owning agent delivery), Pradeep (senior QA, agent testing/automation). Run Workday agents and Salesforce Agentforce agents against external Data Cloud + RAG. Tricentis: Greg, Andrew.
- **What we learned:** "Knowing what to measure" was the strongest, most differentiated message and survived the whole call intact. Zero-integration OTel positioning resonated. Root-cause attribution (wrong tool -> bad data -> bad answer, with span + fix) was the most compelling capability shown. Reliability signals (confidence intervals, pass@k, minimum-sample gating) read as credible to a technical QA audience.
- **Major asks:**
  - A clear category answer to "is this a testing tool or not?" - raised four times, never resolved; QA persona left unconvinced. Needs a driver-vs-grader boundary framing (Driver -> Agent -> Traces -> AgentScore grades).
  - A crisp, rehearsed accuracy answer - "there's a response, no error, how do you know it's accurate?" got a wandering answer instead of a tiered one (deterministic checks -> LLM judge + CI -> golden dataset).
  - Stop leading with "supplementary, not a replacement" - audience couldn't state what AgentScore definitively owns.
  - Agentforce/Salesforce-native integration (known gap, this account maps everything to it).
- **Full debrief:** [Workday Feedback Session.md](Workday%20Feedback%20Session.md)

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
