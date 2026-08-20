**Owner:** Andrew (Lead PM, AI Chat - taking over AI Agent Evaluation) **Date:** May 19, 2026 **Engineering deadline (fixed):** Scoring algorithm + pass/fail criteria to Leo by Tuesday, May 26, 2026

---

## Phase 0: Land and orient (Days 1-3, this week)

1. **Get the artifacts and access.** Pull the existing slide deck on shipping-readiness hypotheses, the Langfuse setup notes, the "random web" prototype, and any inbound emails from the marketing landing page. You cannot scope work you have not seen.
2. **Run 30-minute 1:1s with each named stakeholder**, in this order:
    - **David (business owner):** confirm scope boundaries, success metrics for Q3, and the list of customers they will introduce you to.
    - **Leo:** confirm what he needs in the scoring spec on May 26 and in what format (pseudocode, formulas, decision tree).
    - **Eugene:** align on which Kuro experiments are running, what they will output, and the handoff format into your signal taxonomy.
    - **Chris Colosimo:** get the innovation-project customer list and his read on which accounts are furthest along with agents.
3. **Resolve the two blocking ambiguities before the end of the week:**
    - Is the prototype web app internal-only or customer-facing? This changes auth, data handling, and demo posture.
    - Are we building for DIY agent builders only, or are we also serving TCoEs in v1? The meeting landed on DIY first, but TCoE keeps surfacing as a wedge. Pick one for v1 and write it down.

---

## Phase 1: Unblock engineering (Days 4-7, deadline May 26)

The hard commitment is a scoring algorithm and pass/fail criteria. See the **Scoring Algorithm Draft v0.1** in the appendix below - that is the artifact to hand to Leo.

Workflow this week:

1. Walk Leo through the draft on Wednesday or Thursday. Capture pushback on schema, units, and feasibility.
2. Revise Friday. Send final spec to Leo end of day Monday, May 25, so he has 24 hours to push back before the deadline.
3. Eugene's Kuro experiments should validate evaluator selection against the dynamic profiling table (Appendix A, Section 5). If Kuro disagrees with the profile defaults, the table updates, not the algorithm shape.

---

## Phase 2: Market validation (Weeks 2-3)

This is your primary PM workstream and the one David expects from you specifically. The **Customer Interview Script v0.1** is in the appendix.

1. **Competitor teardown** of Braintrust, LangSmith, and Langfuse: ingestion model, evaluator selection, scoring presentation, and pricing. Add Arize and Patronus if time permits.
2. **Privacy and deployment model research:** which competitors offer self-hosted or VPC deployment, what percentage of their customer base uses it, and what the gating mechanism looks like. The team is debating whether to invest in on-prem, and this answer should drive that call.
3. **Customer interviews.** Aim for six to eight conversations in three weeks, weighted toward Chris Colosimo's innovation accounts. Use the script in Appendix B.
4. **Synthesize into a one-page positioning memo:** target user, problem, why us, what we are not.

---

## Phase 3: Productize the core (Weeks 4-6)

1. **Lock the architecture decision on data residency.** The meeting leaned toward client-side storage with cloud processing and a configurable proxy. Validate against customer interviews, then write an ADR so it stops getting relitigated.
2. **Define the SDK contract.** What signals does it emit, in what schema, over what transport (OTel by default, with SDK and decorator fallbacks). This is what unblocks multiple delivery channels later.
3. **Decide the v1 surface area.** Recommendation: ship as a standalone service, surface results in AI Workspace, do not couple to the new Tricentis app on the August roadmap.
4. **Build a one-page risk register** and review it weekly. Top candidates: enterprise data-access barriers, vendor walled gardens crowding out the use case, scope creep from TCoE, dependency on AI Workspace's own readiness.

---

## Phase 4: Pilot and iterate (Weeks 7+)

1. **Select two to three pilot customers** from the interview pool. Mix one DIY-heavy account with one TCoE-led account if you want to validate the bridging hypothesis.
2. **Define pilot success criteria up front:** number of agents evaluated, decisions made using the score, willingness to pay or expand.
3. **Set a four-week pilot cadence** with a written readout at the end. Use it to decide whether to invest in connectors, channel UIs, or the test-management integration question that was deferred.

---

## Cross-cutting

- **Stakeholder cadence:** weekly written update to David, biweekly sync with Leo and Eugene, monthly executive note.
- **Documentation default:** every decision goes in a short ADR. The meeting surfaced a lot of "we agreed for now" items that will get re-opened if not written down.
- **Things to explicitly not do in v1:** build a generic evaluation engine, specialize for SAP or Salesforce agent ecosystems, take on AI Workspace's roadmap dependencies.


