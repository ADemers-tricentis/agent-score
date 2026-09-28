# AgentScore Demo Debrief - Aptiv Feedback Session

**Date of session:** 2026-09-25
**Source:** WebVTT call transcript (auto-diarized)
**Format:** Live intro, screen-share overview/demo of AgentScore, open Q&A
**Analyst:** Lead PM review

## Room composition

- **Tricentis side:** Andrew Demers (presenter/PM, lead PM for Agentic evaluations).
- **Aptiv side:**
  - **Meenakshi Sundaram Chockalingam ("Sundaram")** - Test Architect at Aptiv, accountable for maintenance and usage of Aptiv's Tricentis tool set (Qtest, Tosca, NeoLoad). Has a use case for testing AI agents before they deploy to production - the reason he brought colleagues from the data and AI team onto this call.
  - **Ciaran Cooke** - leads enterprise analytics and AI delivery for Aptiv, ~2 months into the role. Standing up Aptiv's operating model for delivering agentic AI to the business, building agentic use cases mainly on Copilot Studio, Azure Foundry, and Google Cloud (Gemini Enterprise). Setting up a testing framework is what kicked this whole conversation off.
  - **Caobhan Mullin** - also recently joined the team, moving into a delivery-lead role soon. Owns the same end-to-end flow as Cooke for managing AI use cases as they come through, plus the longer-range pipeline of demand for agentic AI across the enterprise landscape.
  - **Peter Brennan** - data scientist on the Analytics team. Builds agents on Gemini/ADK supporting supply-chain-residency/SCM and component-engineering functions. Already runs his own evaluation practice: predictive accuracy/precision/recall on the developer side, then an iterative, "pair-programming"-style human-in-the-loop testing pass with component engineers before release.

*(The auto-diarized transcript consistently mis-hears "Ciaran Cooke" as "Karen Koop" and "Caobhan Mullin" as "Qui Von Mullen" - corrected throughout this debrief against the speaker labels.)*

---

## Why Aptiv is here (important context)

Sundaram owns the Tricentis tool relationship and has a concrete use case (testing AI agents before production), but he isn't the one building the agents - Cooke, Mullin, and Brennan are, across three different platforms (Copilot Studio, Azure Foundry, Google Cloud/Gemini Enterprise/ADK). Cooke and Mullin are early in standing up Aptiv's operating model for agentic AI *and* the testing framework underneath it - this call is that testing-framework work reaching out, not a top-down sales inbound. Brennan's team is further along and already shipping production agents (SCM, component engineering) with a real, currently-manual evaluation practice he wants to streamline.

This makes Aptiv a multi-persona account in one call: a tool owner (Sundaram), two operating-model builders (Cooke, Mullin), and an agent builder with an existing evals practice (Brennan) - closer to the Meta and Wolters Kluwer shape (multiple internal stakeholders, enterprise-wide ambition) than a single-buyer intro.

---

## What landed

**1. The core "how do you know your agents are doing the right thing" framing.**
Brennan's own account of Aptiv's current state - measuring predictive accuracy/precision/recall on the dev side, then an iterative, time-consuming manual pass with component engineers before release - mapped almost exactly onto the problem AgentScore opens with. He closed the call naming this directly: "it would solve a lot of the headaches... we can't really spend a lot of time... testing essentially."

**2. Two-line OTel setup, confirmed compatible with their stack.**
Brennan confirmed Aptiv's ADK-based agents already support OpenTelemetry, so the two-line integration path is real and immediately actionable for that agent class, not hypothetical.

**3. Root-cause attribution down to the tool-call/data level.**
Brennan pushed specifically on whether AgentScore can verify *which* table or dataset a NL2SQL-style agent queried, not just that a tool call happened. Andrew confirmed: yes, trace-level detail shows what was called, what came back, and whether that matched what should have come back.

**4. Golden-dataset / regression testing against labeled real traces.**
Landed cleanly - Brennan called it "really good, the deterministic type testing."

**5. Non-deterministic eval handling (three-tier model).**
Brennan raised a specific, real pain point unprompted: his agents' matching logic is non-deterministic (it expands or restrains match criteria depending on result count, and new data sources are added continuously), so a single expected-output check doesn't work. Andrew's three-tier answer - library/deterministic, GEval/LLM-as-judge, and a hybrid deterministic-then-judged mode - answered this directly and got a clean "sounds good."

**6. Configurable scoring cadence + on-demand runs.**
Cooke asked whether scoring is limited to checking every trace on every call, or whether it can be scheduled/sampled instead. Andrew's answer - every trace is ingested, but scoring can run hourly/daily/weekly with a configurable history window, plus a manual run any time (e.g. before a release) - answered this cleanly.

**7. Configurable profiles and dimensions.**
Brennan's own account of how Aptiv already handles misuse/toxicity (Model Armor, a short-circuit mechanism) and where their real interest lies (groundedness/correctness) mapped directly onto AgentScore's configurable-dimension model - user-editable profiles, dimensions, and individual evals, not a fixed rubric.

---

## What could have gone better / gaps surfaced

**1. No way to connect fully platform-managed agents with no exportable traces - the biggest gap of the call.**
Brennan identified two classes of Aptiv's own agents that AgentScore likely cannot reach at all today:
- **Gemini Enterprise agents built via Dialogflow** - simple agentic flow, business logic can be complex, but entirely managed by Google.
- **"DQ" data agents** - Gemini talking to NL2SQL, wrapped and deployed by Google via BigQuery, seeing rising uptake from end users building their own.

Both are fully managed by Google: no CLI, no API, no container access, and per Brennan, no way to export traces at all. Andrew's response was a direct acknowledgment, not a workaround: **"We have - that might be a gap then that we have."** This is a net-new, unanswered gap - no other account has raised "agent platform gives us literally no instrumentation surface" before - and it blocks a real chunk of Aptiv's own footprint regardless of price or positioning.

**2. No multi-agent / workflow-level view.**
Mullin asked whether multi-agent workflows can be stored/scored as a whole, rather than as a list of individual agents (referencing the demo's list of five). Andrew: not currently, something being looked into. Same underlying gap as Meta and Wolters Kluwer's "evaluate a group/hierarchy of agents" ask, from yet another account.

**3. No bulk/programmatic agent onboarding.**
Mullin's follow-up: if Aptiv wants AgentScore to be a single source of truth for AI agents across the enterprise (spanning Microsoft and other systems), does that pull or push automatically, or does every agent have to be connected one at a time? Andrew: today, one at a time. He floated - but didn't commit to - a possible bulk-connect solution, noting each agent already gets a unique fingerprint that could support it, and said he'd have to follow up.

**4. No auto shut-off, or any control-plane access to agents at all.**
Mullin asked directly: if an agent's score drops below a threshold, can AgentScore turn it off? Andrew: no - AgentScore only receives traces that are exported to it; it has no control over what the agent does. Alerting is in progress but not shipped. Mullin reframed it as an auto-notification-to-owners feature instead (people who *do* have those controls), which Andrew agreed would fit within that constraint.

---

## Follow-ups Andrew committed to

1. **Look into a bulk/multi-agent connection solution** - given agents already get a unique fingerprint, there may be a better path than connecting one at a time (Mullin's ask).
2. **Send documentation on onboarding requirements** - what Aptiv needs to satisfy (cloud-based access, connection steps, any checkboxes) - specifically so Sundaram can take it through Aptiv's internal architecture review board.
3. **Share the meeting recording** (Mullin asked explicitly).

---

## Recommended next steps

1. **Decide on the fully-managed/no-OTel agent gap.** This is net new and unanswered - Gemini Enterprise/Dialogflow agents and Google-managed NL2SQL agents have zero instrumentation surface today. Worth flagging to engineering as a pattern (any customer building on a fully-managed third-party platform, not just Google's, could hit the same wall), not just an Aptiv-specific request.
2. **Get Sundaram the onboarding/architecture-review documentation fast.** That review board is the actual gate to a POC here, not enthusiasm - all three of Cooke, Mullin, and Brennan were engaged and asking detailed follow-up questions.
3. **Track the bulk-agent-onboarding and multi-agent-workflow asks together, alongside Meta and Wolters Kluwer's "group/hierarchy" ask.** Mullin's two questions (score workflows as a whole; connect many agents at once) are two sides of the same "don't make us do this one at a time" complaint that keeps surfacing at enterprise-scale accounts.
4. **Note Brennan as a distinct persona within this account.** Unlike Sundaram (tool owner) and Cooke/Mullin (operating-model builders), Brennan is an agent builder with an existing evals practice and explicit hands-on intent - he wants to try AgentScore against his own ADK agents specifically, and is the most concrete, near-term adoption path inside Aptiv even though he isn't the Labs signup contact.
