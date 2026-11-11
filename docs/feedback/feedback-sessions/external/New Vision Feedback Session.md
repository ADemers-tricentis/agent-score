# AgentScore Demo Debrief - New Vision Feedback Session

**Date of session:** 2026-10-08 (per the External Interest tracker; the transcript carries no date)
**Source:** WebVTT call transcript (speaker-labeled)
**Format:** Introductions, short slide overview of the problem, live screen-share demo of AgentScore, open Q&A and beta next steps (~21 minutes)
**Analyst:** Lead PM review
**Status:** Active beta as of 2026-10-20. First sign-in not yet recorded.

## Room composition

- **Tricentis side:** Andrew Demers (presenter/PM, lead PM for Agentic evaluations).
- **New Vision side:** Rohan Bansod - Quality Architect, ~10.5 years in IT. Oversees projects across Tosca and other Tricentis products plus open-source tooling such as Playwright, working with a range of clients and customers. Earlier in his career he spent ~7.5 years on a professional-services team in India (the transcript garbles the team name, so it is not recorded here).

*(The auto-diarized transcript mis-hears "Tricentis" as "Presentis", "SoftServe" as "Soft Serve"/"Saucer", "PII" as "PI", and "LLMs" as "ALMs". A stray "Pugazhenthi" line at 19:17 is transcription noise. The testing tool he calls "the DPL" is unclear and is not recorded here.)*

---

## Why New Vision is here (important context)

Rohan signed up through the Tricentis Labs form (2026-08-20) and this was a **Labs beta-onboarding call**, the first real conversation. New Vision is an existing Tricentis partner (Pune-based IT services/QA consultancy) and is now officially part of SoftServe, a Ukraine-based company that is moving into AI and engineering work.

Rohan both uses agents and tests them, and he said both areas are active:

- **Using agents:** mostly open source, mainly Playwright, because that is what customers ask for - "when it comes to the token AI product usage, it boils down to the tokens and how the consumption is going on." They use agents to automate tasks, distribute tester workload across verticals, build dashboards, and optimize automation frameworks.
- **Testing agents:** they are testing how agents behave today, and a separate team is running POCs around that.

He did not name a specific agent to connect, and he did not describe a client-facing offering. The partner lens (extending a QA practice into agentic-AI testing for clients) is plausible given his client-facing role but was not stated on the call.

---

## What landed

**1. Auto-derived agent card with editable success criteria.**
Rohan asked where typical behavior and suggested success criteria are defined - configured by the user, or pre-configured. Andrew's answer (derived from how the agent is actually used, and editable interactively through an agent) was accepted without follow-up.

**2. Configurable verdict thresholds.**
Rohan framed it as "70% and above we are good to ship, below 30% we scrap it" and asked if the bar can be set. Andrew confirmed, quoting the defaults (above 85 good, 70-85 ship with notes, 55-70 needs work, below 40 block), all editable.

**3. Dimensions and custom evals.**
Rohan asked which dimensions are checked (accuracy, safety, latency, policy compliance). Andrew showed the dimension and eval catalog (41 out of the box, editable, with custom dimensions) and made the point that evals are largely a solved problem, and that knowing which to apply to which agent is the hard part.

**4. Data handling.**
Rohan raised data as the thing his customers care about most. Traces are stored because evals run on them. Andrew said Tricentis can set a deletion period (30 days, 10 days, whatever). Nothing is used to train models; data stays per-agent and traces are only scored. Both answers were accepted.

**5. Free beta, usage-based later, direct support.**
The beta is free with unlimited traces and users. Later pricing is AI credits per scoring run (how often you score and how many evals). Support is Andrew personally, including calls and screen shares.

---

## What could have gone better / gaps surfaced

**1. Retention is not self-serve.**
Andrew started to say the user can set the deletion period, then corrected himself: the end user cannot, Tricentis can set it for them. For a partner whose customers put data first, this is a likely follow-up question.

**2. No answer on pricing rate.**
"Not exactly sure what the rate will be." Rohan asked about cost directly and left with a model (AI credits per scoring run) but no number. Related to the Business & Partnership row added to the Feedback Log.

**3. No committed agent or use case.**
Rohan ended with "looking forward to explore it further" but no named agent, timeline, or owner. His own agents are Playwright-based, and the call never confirmed that they emit OpenTelemetry traces, so the two-line setup is not yet shown to work for his stack.

**4. Transcript gap.**
There is a ~20-second hole around 20:00 before Rohan's closing remark ("...by anyone, but whether they are doing the right job or not, that we have to test"). His point appears to be that agents can be built by anyone but still need to be tested, which supports the problem framing, but the full sentence is lost.

---

## Follow-ups Andrew committed to

1. **Send a follow-up email with a quick-start guide** covering how to sign up and get in, and point Rohan to the in-product documentation (connecting an agent, the agent card, how scoring works).
2. Rohan will explore on his own and email Andrew with any questions.

---

## Recommended next steps

1. **Ask which agent he will connect first, and whether it emits OTel.** Access was granted 2026-10-20. His agents are Playwright-based, so confirm the instrumentation path before he hits it alone.
2. **Prepare a clear answer on retention control and pricing.** Both were soft on the call, and both matter to a partner whose customers care about data and token cost.
3. **Track New Vision as another partner/SI prospect** (alongside Tritusa, BearingPoint, Merito, Wolters Kluwer), and confirm whether the intent is internal use, a client-facing offering, or both.
