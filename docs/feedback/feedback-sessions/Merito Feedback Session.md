# AgentScore Demo Debrief - Merito Feedback Session

**Date of session:** 2026-10-06 (per the External Interest tracker; the transcript carries no date)
**Source:** WebVTT call transcript (speaker-labeled)
**Format:** Introductions, short slide overview of the problem, live screen-share demo of AgentScore, open Q&A and beta next steps (~22 minutes)
**Analyst:** Lead PM review

## Room composition

- **Tricentis side:** Andrew Demers (presenter/PM, lead PM for Agentic evaluations).
- **Merito side:**
  - **Louis Tadman** - Chief Technology Officer. Looks at new technologies and tools, enables the team, and makes sure customers get return on their tool investments. Drove the conversation and asked all the questions.
  - **Andrew Carpenter** - Director of Professional Services (resourcing and project coordination, "the steward of our time and the investment our consultants can make"). Brought in so he understands what AgentScore is and what the team can commit. Spoke only at sign-off.
- **Not on the call:** Chris Carpenter, the Merito team member who signed up through Tricentis Labs (Louis named him when Andrew could not see the submitter in the Labs system).

*(The auto-diarized transcript mis-hears "Louis" as "Lewis" and "Merito" as "Meritos". Merito's director of professional services is labeled "Andrew Carpenter" on the final line only; Louis refers to him as "our Andrew". This debrief corrects the names.)*

---

## Why Merito is here (important context)

Merito is a long-time Tricentis partner: a partner of QA Symphony before the acquisition, and today it touches "everything in the Tricentis ecosystem." It was part of the Rapid Innovation Program Team (RIPT) when AI Workspace first shipped, got alpha and beta access, and gave feedback. Louis's pitch for Merito is that it likes new products, wants to partner, iterate, and give feedback.

Merito is not an agent-evaluation pull yet. Louis said they are not actively developing production-ready agents and have no customer-facing agent such as a support bot. They do build agentic solutions and have "a bunch of Claude-certified architects," so building a test agent is "not a skill gap." The open question for them is the evaluation side and understanding what kinds of agents are generally used. This is a partner and consultancy lens, the same family as BearingPoint and Tritusa, but without a live agent behind it.

---

## What landed

**1. Zero-setup evaluation with a verdict.**
The auto-built profile, 0-100 score, ship / ship-with-notes / don't-ship verdict, and root-cause attribution to the trace and span drew no objections. Louis's reaction: "there's a lot of benefit to this."

**2. Configurable metrics.**
Louis's first question, during the intro, was whether the AgentScore metrics are configurable. Andrew's answer: yes, but the point is that you do not have to configure them. The demo then showed per-eval thresholds that auto-fail a dimension and the ability to edit the profile.

**3. Product feel.**
Louis, unprompted: "it's nice to see the Tricentis product feel to this. It looks like it's an original product."

**4. Staging and production monitoring.**
Louis asked whether this is a pre-ship check or proactive monitoring of agents in production. Andrew answered both: test in staging, then monitor continuously in production for drift or a new model release. Louis: "That's helpful, thank you."

**5. Cost view and the upcoming MCP.**
The cost view (token cost by trace and span, tiered so users are not buried in spans) and the upcoming MCP interface (ask your own agent how your agents are doing, human in the loop optional) were shown. Louis responded "Cool" without follow-up questions.

**6. Clear intent to try it.**
Louis, after the beta offer: "number one, yes, we're absolutely interested... We learn by doing," and Merito is happy to say what is great and what could be improved. He will onboard the team and send feedback.

---

## What could have gone better / gaps surfaced

**1. The onboarding and licensing question was not answered.**
Louis asked whether access is a seat license or whether he can just invite the team, and whether Merito's partner not-for-resale Tosca Cloud tenant is tied to the auth, since that was a requirement for the RIPT AI Workspace platform. Andrew said he would send onboarding instructions and did not address either point on the call. **Open follow-up, and it determines how quickly Merito can start.**

**2. No agent to score yet.**
Merito has nothing in production and nothing in test that Louis named. The only idea was a joke-but-real test agent: a fantasy football analysis agent, where recommending a retired player would be the failure to flag. Nobody discussed what real use case or agent shape Merito's consultants would build or bring from a client.

**3. Time and capacity are the constraint.**
Louis set expectations: no immediate dive-in, it needs "backlog activities" planning, "a couple weeks" to get a test agent running, and he does not want to promise "10 guys on this next week and 20 agents." Andrew Carpenter was on the call specifically so he understands the ask. This is a slow-burn lead on Merito's timeline, not a quick trial.

**4. Active testing is still exploratory.**
Andrew said adversarial or red-team testing, with simulations and scenarios that provoke the agent, is being looked into. He also said AgentScore deliberately has no interaction with the agent today: it only receives what is pushed to it. Louis did not ask for adversarial testing, so this is not counted as a Merito ask.

**5. Cost view status needs checking.**
Andrew demoed the cost view from his test environment. The Customer Feedback Log still records the cost/token report as not available in the customer-facing app, so what Merito will actually see in a beta tenant needs to be confirmed before the follow-up.

**6. Account-level visibility gap in Labs.**
Andrew could not see which Merito person signed up when he looked in the Labs system, and had to be told "Chris." Minor, but the intake record did not tie the signup to the demo contact.

---

## Follow-ups Andrew committed to

1. **Send a follow-up email with onboarding instructions.**
2. **Offer a guided setup** if Merito has a use case, and **example use cases** if they want them, then leave it with Merito to start when ready.
3. **Set up another session** once Merito is onboarded and has feedback (Louis's suggestion, Andrew agreed).

---

## Recommended next steps

1. **Answer the licensing and auth question before sending the instructions.** Find out whether a partner NFR Tosca Cloud tenant is needed or whether Merito can be invited as a team, and put the answer in the onboarding email.
2. **Confirm what the cost view looks like in a beta tenant** so the follow-up does not repeat the expectation mismatch from the Tritusa and Meta calls.
3. **Suggest a concrete first agent.** The fantasy-football agent is a fine low-stakes start; also offer two or three example use cases so the team has something to build against in a couple of weeks.
4. **Treat Merito as a low-pressure design-partner candidate,** not a time-boxed trial. Louis explicitly wants to give product feedback, and Merito's Claude-certified architects can build varied test agents quickly once they have time.
5. **Keep the partner angle open.** As a long-standing partner and consultancy, Merito may later want to evaluate agents for its clients. Do not raise it before they have used the product, but track co-sell or partner-motion asks (see Tritusa).
