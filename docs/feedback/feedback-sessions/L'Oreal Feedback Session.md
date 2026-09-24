# AgentScore Demo Debrief - L'Oreal Feedback Session

**Date of session:** 2026-09-24
**Source:** `KASHANI Khadim - 30 minutes meeting.vtt` (recorded call transcript)
**Format:** Live intro, screen-share overview/demo of AgentScore, open Q&A (Khadim also screen-shared his own agent/dashboard)
**Analyst:** Lead PM review

## Room composition

- **Tricentis side:** Andrew Demers (presenter/PM). Paul Wagner (account-team contact) joined partway through - mic/camera issues at first - and gave org context rather than product commentary.
- **L'Oreal side:** KASHANI Khadim - Test Automation Manager at L'Oreal India Tech Hub (ITH), which recently stood up. Covers the APAC zone (a second zone name was garbled in the transcript). Works closely with L'Oreal's global team in Paris and leads L'Oreal's test automation factory out of ITH. Uses Tosca for automation testing; describes L'Oreal as "a great partner with Tricentis."

Khadim signed up for Tricentis Labs right after attending the Transform event in Singapore (~week of 2026-09-15) - registered the Saturday after the event completed on Thursday, explicitly wanting to be the first at ITH to take the initiative on AgentScore and L'Oreal's other Labs offerings (release/test efficiency tooling). This was a **Labs beta-onboarding call**, the first real conversation, not a deep technical evaluation yet.

Paul Wagner's context is useful background: L'Oreal has already purchased AI Workspace, with over 1M in agent credits provisioned, and Charles Henry (a workspace-side contact) is relocating to Hyderabad to lead the India tech factory, sitting near Khadim's team going forward.

---

## Why L'Oreal is here (important context)

Khadim's team is already running a live agent internally: an Elastic Cloud (ELK)-based reconciliation agent connected to L'Oreal's own agent platform and LLM cloud. It answers prompts like "what percentage of deliveries succeeded with CNS in Singapore over the last 30 days" by running backend ESQL/SQL queries against reconciliation dashboards and returning the result. Khadim was personally part of the informal testing effort for this agent, and today that testing is **entirely manual**: run a prompt, open the dashboard, manually compare the agent's answer to the dashboard/query values, and manually track accuracy, efficiency, tokens, and latency.

With L'Oreal ramping up "many AI initiative projects" across zones, Khadim wants to replace that manual process with AgentScore, and to use a self-driven POC as the evidence he brings back to his own stakeholders and management to justify wider adoption.

---

## What landed

**1. Response verification against backend/tool-call ground truth (his core question).**
He asked directly whether AgentScore can verify an agent's response against what it actually queried in the backend (his ELK/ESQL example). Andrew demoed this live with a travel-agent example: an argument-correctness eval flags exactly when a tool call didn't match the user's request, with root-cause attribution down to the specific trace - a direct answer to the question he came in with.

**2. Two-line OTel setup, per-tenant API key, standalone operation.**
Confirmed AgentScore runs independently of AI Workspace and can ingest an external agent like his ELK-connected reconciliation agent directly, without needing it to live inside Workspace first.

**3. Configurable dimension weighting, ship/don't-ship thresholds, fleet-level view.**
Landed as directly relevant given L'Oreal's stated plan for multiple AI initiatives across zones - being able to see many agents at a glance and act only on the ones needing attention is the shape of problem he's anticipating, not just the one agent in front of him today.

**4. Groundedness/relevance/retrieval scoring with root-cause trace view.**
The hallucination example (score of 26, missing load-bearing claim absent from retrieved context) held his attention through to the fix-suggestion step, with no confusion.

---

## What could have gone better / gaps surfaced

**1. No way to hand AgentScore a batch of test prompts/scenarios and run them on demand.**
Khadim asked this twice, in different words: "I can give a data set of... 10 to 15 prompts... and it will automatically run all those things, or one by one I have to give the prompts?" and then, more directly, "where do I have to give the test cases prompts and everything?" Andrew's answer both times was no - AgentScore only extracts and scores traces from real, organic agent interactions; there's no mechanism to supply a defined prompt/scenario set and have it executed. This is the same scenario-bank/simulation gap Meta raised twice ("define scenarios, run them, see how the agent responds") - separates passive grading of production traffic from active, on-demand test-case execution, which is exactly the manual step (run a prompt, check the result) Khadim is trying to eliminate.

**2. Standalone vs. AI Workspace access is gated behind an admin team.**
Paul Wagner surfaced that L'Oreal already has AI Workspace purchased with 1M+ credits, but Andrew was clear that AgentScore can only ingest from an existing Workspace tenant once Workspace itself has been configured for it by the admin team (Charles Henry's team). Khadim's response was to route around this and trial AgentScore standalone himself first, looping in Workspace access separately later through Rosie. This is the same shape of complaint Wolters Kluwer raised - a central admin team gating self-service access - now surfacing at a second account that has already paid for Workspace.

**3. No public trial access yet.**
Khadim pushed on this repeatedly ("if I have to try this out, I have to wait for the week"). The public-facing signup site is targeted for "next week," not available on the call itself.

**4. Existing collateral (PPT, YouTube demo) judged too basic for his purpose.**
Khadim said directly that the PPT "does not have those things" and the public YouTube video is "very basic... not detailed" compared to the live walkthrough on this call. He wants the detailed version to show his manager (based in Singapore, different time zone) ahead of their next call.

**5. Messaging on standalone vs. Workspace modes took several exchanges to land.**
Not a product gap, but it took multiple back-and-forths - and Khadim screen-sharing his own dashboard - before the two-line OTel/API-key model and the standalone-vs-Workspace distinction were clear. Worth tightening for this kind of technical-but-not-yet-hands-on audience.

---

## Follow-ups Andrew committed to

1. **Send a written follow-up** recapping the call.
2. **Send the detailed demo recording/walkthrough** (not the existing basic PPT/YouTube asset) so Khadim can share it with his Singapore-based manager before their next call.
3. **Notify Khadim when the public trial site launches** (targeted next week) so he can start his standalone POC with provisioned AI credits.
4. **Offer a more dedicated/technical walkthrough and setup help** if wanted.

---

## Recommended next steps

1. **Flag the scenario-bank/on-demand test-execution gap as recurring, not one-off.** This is now Meta (x2) plus L'Oreal asking for the same missing capability - define a set of prompts/scenarios and have AgentScore run them, rather than only scoring organic traffic. Worth surfacing to roadmap as a pattern, not a single account's ask.
2. **Prioritize getting Khadim the detailed demo recording** - he named this explicitly as the one asset blocking him from looping in his manager before the next call.
3. **Flag the AI Workspace onboarding-bottleneck pattern to whoever owns RBAC/self-service roadmap.** Two accounts now (Wolters Kluwer, L'Oreal) have hit this; L'Oreal already has a paid Workspace seat and credits and is choosing to route around it rather than wait on an internal admin team.
4. **Confirm the public trial/signup site ships on schedule next week** - the single item Khadim is explicitly waiting on to start his POC.
5. **Loop in Khadim's manager (Singapore-based) on the next call**, per his stated plan. Expect a proof-of-concept-for-internal-buy-in conversation, not a purchase decision - track alongside BearingPoint and Tritusa as another account building an internal pitch off of AgentScore.
