# AgentScore - What We Offer, Pipeline Status, and Signup Funnel (Outline)

**As of:** 2026-10-02
**Sources:** `docs/go to market/agentscore-business-case-deck-outline.md`, `docs/go to market/one-pager-agentscore-business-case.md`, `docs/feedback/External Interest.md`, the feedback-session debriefs, the Labs shared inbox (`Inbox/Responded/AgentScore` plus the live `Inbox`), and the personal `AgentScore` folder and Sent Items.
**Format note:** Content only, no visual design. Section 1 is the one-page offer and UVP. Sections 2 to 4 are the status update. Section 5 is the signup and response-time data.

---

## 1. What We Offer and the UVP (one page)

**UVP:** Point AgentScore at an agent's OTel trace and get back a defensible answer to "can this go to production?" A 0-100 score, a ship/warn/block verdict, and the span-level root cause with a suggested fix. No setup and no data-science skills.

**Positioning spine:** "Apple for agent evaluation." Easy to start, smart defaults, works for most teams. Not the top-tier data-science scorer.

**The problem it answers:** Teams do not know what to test, how, or whether it is enough. Fear leads to ship paralysis, and other tools tell them to go learn to be data scientists.

**What you get**

- **Zero setup.** It picks the right evals from 40+ for the trace you give it.
- **A verdict, not a pass/fail.** Ship/warn/block is the call leadership can act on.
- **Root-cause attribution.** The failing span plus a suggested fix. This is the most consistently praised capability across every session.
- **Audit-ready evidence.** Deterministic checks, a judge with confidence intervals, and golden-dataset back-testing.
- **Any agent, any vendor.** AI Workspace, GitHub Copilot, Copilot Studio, homegrown frameworks, and MCP servers, scored side by side.

**Why Tricentis wins**

- We already own the gatekeepers (QA and quality leaders, AI program owners) who decide whether an agent ships. No one serves them with a tool.
- It completes the quality loop. Tosca and qTest cover code, AgentScore extends the same trust to the agents that code powers.
- Competitors prove the demand but serve expert eval engineers, not the people who sign off on production.

**Why now (3 numbers):** 5% to 40% of enterprise apps get task-specific agents (2025 to end of 2026). 1 in 5 companies has a mature agent governance model. 40%+ of agentic AI projects will be canceled by 2027.

---

## 2. Status Update: Where the Pipeline Stands

**Funnel (External Interest tracker):** 73 interested companies, 14 replied, 12 demos, 5 pending betas, 0 active betas (tracker updated with the Eaton demo on 2026-10-01 and the Love's demo on 2026-10-02).

**Honest read:** Zero active betas and zero paying customers. The signal is strong inbound and consistent praise for root cause. The named blockers (below) are what stand between this pipeline and signed contracts.

---

## 3. Customers: Use Case, When We Talked, Reaction

### Pending beta

- **Wolters Kluwer**
  - *Use case:* Score agents outside the Tricentis ecosystem (their internal "FAB" platform, GitHub Copilot) to steer people to sanctioned tooling.
  - *When:* Signed up 2026-08-20. Welcome email the same day. Meeting booked 2026-08-31. Demo in early September (exact date not logged).
  - *Reaction:* LLM before/after benchmarking and the dual access model (embedded in AI Workspace plus standalone) landed strongly. Per-agent scoring is "a proof of concept, not the product they need," so they want fleet-level scoring. RBAC/SSO is a "big concern."
  - *Waiting on:* A pilot tenant (their top priority) and a date for bulk/fleet scoring, which they targeted for end of September.
- **Tritusa (AU, gold-sponsor partner)**
  - *Use case:* Evaluate client-built agents (a Copilot Studio agent and an AI Workspace MCP+A2A agent) and arm their evals-and-assurance advisory practice.
  - *When:* Signed up 2026-08-24. Welcome email 2026-08-25. Scheduling took until the 2026-09-11 demo, with a 9-day gap on our side (2026-08-31 to 2026-09-09).
  - *Reaction:* Strong. They presented an autonomous QA agent at Transatlantic 26 Singapore the week of 2026-09-15 and expected trust and compliance questions.
  - *Open:* Compliance flagging for bank/pharma clients, alerting, bulk export, and a partner co-sell answer. On 2026-09-24 we told them select beta is "the next week or two."
- **Aptiv**
  - *Use case:* Streamline a manual eval practice for agents on Copilot Studio, Azure Foundry, and Gemini/ADK. Multi-persona call (Tricentis tool owner plus the data and AI team).
  - *When:* Signed up 2026-09-23. Welcome email 2 hours later. Demo 2026-09-25.
  - *Reaction:* Two-line OTel, tool-call-level root cause, golden-dataset regression, and the three-tier eval model all landed. Hard wall: Gemini Enterprise/Dialogflow agents and Google-managed NL2SQL agents expose no traces at all, which we acknowledged as a likely gap.
  - *Waiting on:* Us. They need onboarding requirements for their architecture review board before a POC. Our reply on 2026-10-01 said we are "wrapping up a few final items."
- **L'Oreal**
  - *Use case:* Replace manual evaluation of a live ELK reconciliation agent, then run a self-driven POC to build an internal pitch. Signed up after the Transform Singapore event.
  - *When:* Signed up 2026-09-17. Welcome email 18 hours later. They replied 2026-09-23 (6 days later). Demo 2026-09-24.
  - *Reaction:* Positive on replacing the manual process. Asked for on-demand batch test prompts (we said no, we only score organic traces), self-service access for Workspace agents, and faster trial access.
  - *Waiting on:* Us, for a short how-it-works video for their manager.
- **Accenture (5 contacts across entities)**
  - *Use case:* Extend their quality engineering practice into agentic-AI testing for clients. Also the SI delivering the Meta POC.
  - *When:* Form submissions 2026-08-20 to 2026-09-22. Meta POC thread since 2026-09-10; we confirmed moving forward on 2026-09-15, and a call was set for the following Monday.
  - *Reaction:* Engaged on the Meta POC (asked about install steps, team needed, and the business use case). No separate demo logged.
  - *Risk:* HCL and Accenture are both partners separately tasked by Meta to build a competing framework.

### Active conversations (demo done or scheduled)

- **Meta** (sales-sourced; POC scoping)
  - *Use case:* Test 4-5 production agents in the autonomous supply chain (order management is the flagship).
  - *When:* Demo 2026-08-11. POC scoping call 2026-09-11 via a delivery partner.
  - *Reaction:* Urgent need and strong pull. Gated by self-hosted deployment in Meta's AWS, pointing the judge at Meta's internal LLMs, and scenario-bank simulation. Legal review of making Labs software downloadable is in progress (thread started 2026-09-18).
  - *Risk:* Gating items are overdue against the partner's own target of about 2026-09-18, and another partner is circling the account.
- **BearingPoint**
  - *Use case:* Run AgentScore on their own QTest ATC test-generation agent, and have an answer for clients who ask "how do you know the agent works."
  - *When:* Signed up 2026-09-14. Welcome email 2026-09-17. Demo 2026-09-23.
  - *Reaction:* Matches the partner/SI lens. The wall: Tricentis's own agents are not visible in AgentScore for IP reasons.
  - *Waiting on:* Their manager's decision on bringing agents into the beta (slides sent 2026-09-25).
- **Workday**
  - *Use case:* Validate Workday and Salesforce Agentforce agents (delivery director plus senior QA).
  - *When:* Log records a 2026-07-24 demo, but the form signup was 2026-08-28 and the welcome email 2026-08-31. The dates do not line up; see caveats.
  - *Reaction:* Mixed. "Knowing what to measure" and root cause landed. The QA persona never accepted it as a "testing tool" (raised four times).
  - *Waiting on:* Us. No next call committed, and we need to fix positioning and the demo first. Workday is also building its own Agent Passport.
- **Freddie Mac** (sales-sourced; replied)
  - *Use case:* Audit the quality of internally built agents. The product team and the AI accelerator team build overlapping agents with no shared yardstick.
  - *When:* Sales conversation 2026-08-28.
  - *Reaction:* The ship/warn/block verdict is what they reacted to most directly.
- **Eaton** (internal referral; demo held 2026-10-01)
  - *Use case:* Establish quality engineering practices for custom AI built mostly on Azure AI Foundry and Palantir Foundry. The headline requirement is automated testing as a CI/CD quality gate, so nothing ships unless it clears a score threshold. Three agent classes (RAG, workflow, research) each need their own definition of "good."
  - *When:* Invite 2026-09-21 (they first heard of AgentScore at Transform in Singapore). Demo 2026-10-01 with the quality lead and a technical stakeholder.
  - *Reaction:* Editable success criteria and profiles, weighted dimensions ("that is something that I was looking for"), tool-use/MCP/agent-to-agent scoring, version-tagged runs, and golden-dataset-from-real-traces all landed. Gaps: CI/CD gate is in progress (the deciding item), cloud hosting only, no upfront golden-dataset upload, no project/release grouping, adversarial testing is roadmap only. Palantir Foundry compatibility was never answered. We pitched a design-partner role and the open beta.
  - *Waiting on:* Us. A data-handling answer (what goes to the LLM judge, PII redaction, whether telemetry stays in-boundary), overview collateral, and a comparison against Azure AI Foundry's built-in evals. No beta date set.
- **Love's Travel Stops** (form signup; demo held 2026-10-02)
  - *Use case:* Not an agent-evaluation pull yet. They run on-prem Tosca and are testing the Tosca on-prem MCP with Claude on a test box. They evaluate no other AI agents today.
  - *When:* Signed up 2026-08-20. Booked a slot 2026-09-24 (after the follow-up). Demo 2026-10-02.
  - *Reaction:* Genuinely interested ("it is interesting, though") but the blocker was plain: AgentScore is cloud only and Love's is on-prem, so "we probably can't do much with it currently." A customer-run container with a customer-configured judge LLM might be an option.
  - *Waiting on:* Us. A follow-up describing what an on-prem or container deployment would look like.
- **New Vision Software** (Tosca partner; demo 2026-10-08) and **Merito Solutions** (partner; demo 2026-10-06 with Louis Tadman). Likely resale or an extension of their QA offering to clients.
- **Stanza** (replied). An AI-agent vendor, likely QA of their own agents.

### Demo done, not yet in beta: what each is waiting on

| Company | Waiting on | Main blocker or gap |
| --- | --- | --- |
| Meta | Accenture's evaluation (the SI delivering the Meta POC) | Self-hosted deployment in Meta's AWS, judge on Meta's internal LLMs, scenario-bank simulation |
| Eaton | Us: data-handling answer, overview collateral, comparison vs Azure AI Foundry evals | CI/CD quality gate (deciding item, in progress), cloud-only hosting, no upfront golden-dataset upload, Palantir Foundry unconfirmed |
| BearingPoint | Their manager's decision on bringing agents into the beta (slides sent 9/25) | Tricentis's own agents (QTest ATC) are not visible in AgentScore for IP reasons |
| Workday | Us: no next call committed; fix positioning and the demo first | QA persona does not see it as a testing tool; Agentforce integration gap; building its own Agent Passport |
| Love's | Us: follow-up describing an on-prem or container deployment | Cloud-only vs their on-prem Tosca; no agents to evaluate yet |
| Freddie Mac | No next step logged; no beta scheduled | None logged. Reacted most to the ship/warn/block verdict |

### Other interest

About 45 more companies are at "email sent" or "follow-up sent" (2026-09-24), including Merck, Regeneron, McKesson, Boeing, Capgemini, Cummins, Home Depot, HP, Cargill, and Dominion Energy. Their use cases are inferred from public information, not confirmed.

---

## 4. Needs by Theme

1. **Ship/no-ship verdict and root cause** (Workday, Wolters Kluwer, Aptiv, L'Oreal). Closest to sellable today.
2. **Fleet-level governance** (Freddie Mac, Wolters Kluwer, Meta). Fleet-level scoring is not built yet.
3. **SI and partner evidence for client agents** (Tritusa, BearingPoint, Accenture). They want RBAC/SSO and co-sell collateral.
4. **Blockers across accounts:** on-prem (Meta, Love's), RBAC/SSO (Wolters Kluwer), compliance and PII validation (Tritusa), scenario-bank simulation (Meta, L'Oreal, Tritusa), and agents with no exportable traces (Aptiv).

**Most requested features by account count** (source: Customer Feedback Log, distinct accounts per ask)

| Feature | Accounts | Count |
| --- | --- | --- |
| Scenario bank / simulation testing | Meta, L'Oreal, Tritusa, Eaton | 4 |
| Evaluate a group or fleet of agents | Meta, Wolters Kluwer, Aptiv, Eaton | 4 |
| On-prem / self-hosted deployment | Meta, Eaton, Love's | 3 |
| Cost and token report per agent | L'Oreal, Tritusa, Meta | 3 |
| RBAC / self-service onboarding | Wolters Kluwer, L'Oreal | 2 |
| Bulk export of traces and scores | Wolters Kluwer, Tritusa | 2 |
| Alerting when an agent degrades | Tritusa, Aptiv | 2 |

Ten more asks came from one account each, including CI/CD quality gate (Eaton), compliance validation (Tritusa), and judge on internal LLMs (Meta). On-prem is marked resolved in the feedback log (engineering confirmed a self-hosted go on 9/23), but customers were given different answers.

---

## 5. Signup Funnel: Counts by Date, Response Time, Time to Demo

**Method:** Counts come from the "New Tricentis Labs Submission for AI Agent Testing and Evaluation" notification emails (Labs shared inbox, `Inbox/Responded/AgentScore`, 98 emails, plus 8 more in the live Inbox that have not been answered). All times are UTC. Response time is the notification timestamp to the first "Welcome to the AgentScore Beta" email in Sent Items.

### 5a. Signups per day (AI Agent Testing and Evaluation form)

- **Average per day:** about 2.3 (104 signups over 45 days, Aug 19 to Oct 2 UTC).
- **Average per week:** about 15 (104 signups over 7 calendar weeks, Monday start; the last week is partial).
- Averages include the Aug 20 spike (35 signups in about 3 minutes). The per-day chart stays in the deck.
- **Total:** 104, which is 96 in the Responded folder plus 8 in the live Inbox.

**By week (Monday start):** Aug 17: 45. Aug 24: 11. Aug 31: 2. Sep 7: 6. Sep 14: 26. Sep 21: 10. Sep 28: 4 so far.

**Not counted:** 3 emails for other Labs products (Release Risk Intelligence x2, Test Specification Manager x1).

**Cleanup:** At least 3 are Tricentis internal or brand accounts (Tricentis, Tricentis (US), Neotys, plus two Tricentis GmbH). BearingPoint (4 extra), PVH (1 extra), and one other contact (1 extra) submitted more than once. Distinct external people are roughly 90.

### 5b. Time to first response (company response to your welcome email)

**Definition:** Time from your "Welcome to the AgentScore Beta" email to the company's first response, either a written reply or booking a slot on your bookings page. Times are UTC.

| Company | Welcome sent | First response | Time to respond | How |
| --- | --- | --- | --- | --- |
| Aptiv | 09-23 21:17 | 09-24 06:49 | 9.5 hours | Booked a slot |
| BearingPoint | 09-17 20:07 | 09-18 08:32 | 12.4 hours | Booked a slot |
| Tritusa | 08-25 16:42 | 08-26 06:57 | 14.3 hours | Replied (asked whether Workspace or third-party agents are in scope) |
| L'Oreal | 09-17 20:07 | 09-23 13:54 | 5.7 days | Replied (asked how to access the beta) |
| Wolters Kluwer | 08-20 19:22 | 08-31 14:01 | 10.8 days | Booked a slot |
| New Vision | 08-25 16:42 | 09-28 08:30 | 33.7 days | Booked a slot |
| Love's | 08-20 19:26 | 09-24 15:17 | 34.8 days | Booked a slot; demo held 10-02 |
| Stanza | 08-20 19:29 | 09-24 17:23 | 34.9 days | Replied 28 minutes after the 09-24 follow-up |
| Merito | 08-20 19:22 | 09-24 14:52 | 35.0 days | Replied to the 09-24 follow-up |

**Summary stats**

- 9 of roughly 70 form-sourced companies (13%) have responded to your welcome email.
- Median time to respond is about 10.8 days. Three of nine responded within 15 hours (Aptiv, BearingPoint, Tritusa). Only four of nine responded in under a week.
- Four of nine (New Vision, Love's, Stanza, Merito) responded only after the 09-24 follow-up round, 33 to 35 days after the welcome email. The follow-up produced as many responses as the first email did.
- Not matched: Workday (no reply or booking found in the mailbox) and Accenture (engaged through the Meta thread, not the welcome email).
- Not counted: Meta, Freddie Mac, and Eaton, which came from Sales or a referral, not from the welcome email. Eaton is tracked below under time to demo.

### 5b-2. Our outbound lag (signup to your first email)

Secondary measure, kept because it affects the numbers above. Every first email was a batched mail merge (six batches in 34 days; 08-20 19:22, 08-25 16:42, 08-31 17:25, 09-09 21:42, 09-17 20:07, 09-23). Matched 82 of 96 form notifications to a welcome email.

| Bucket | Signups |
| --- | --- |
| Under 5 hours | 36 |
| 5 to 24 hours | 22 |
| 1 to 3 days | 9 |
| 3 to 8 days | 15 |
| Still waiting | 6 real (oldest 8.5 days): Hugo Boss, Skygen USA, TCS India, Singapore Airlines, Sogeti, Singapore Pools (second contact) |

Median about 13 hours, mean about 30 hours, 71% within 24 hours, slowest 7.3 days.

### 5c. Time to demo

| Account | Signup | Company responded | Demo | Signup to demo | Response to demo |
| --- | --- | --- | --- | --- | --- |
| Aptiv | 09-23 | 09-24 (booked) | 09-25 | 2 days | 1 day |
| L'Oreal | 09-17 | 09-23 (replied) | 09-24 | 7 days | 1 day |
| BearingPoint | 09-14 | 09-18 (booked) | 09-23 | 9 days | 5 days |
| Wolters Kluwer | 08-20 | 08-31 (booked) | early Sept (date not logged) | about 12 days | not logged |
| Tritusa | 08-24 | 08-26 (replied) | 09-11 | 18 days | 16 days |
| Love's | 08-20 | 09-24 (booked) | 10-02 | 43 days | 8 days |
| New Vision | 08-20 | 09-28 (booked) | 10-08 (scheduled) | 49 days | 10 days |
| Eaton (referral) | n/a | invite 09-21 | 10-01 | 10 days from invite | n/a |

Median signup to demo across the six held demos from form signups: about 10 days (2, 7, 9, 12, 18, 43). Median from the company's response to the demo: about 5 days (1, 1, 5, 8, 16). Eaton is referral-sourced, so it is measured from the invite. Once a company responds, the demo follows within about a week. The lag is in getting the response.

**Our reply latency after a prospect writes back (examples):** Tritusa waited 9 days for a reply (2026-08-31 to 2026-09-09). Aptiv has waited since the 2026-09-25 demo for onboarding requirements, and we replied 2026-10-01.

### 5d. Conversion

| Step | Count | Rate |
| --- | --- | --- |
| Companies interested | 73 | |
| Replied | 14 | 19% of interested |
| Demo held or scheduled | 12 | 86% of replied |
| Pending beta | 5 | 42% of demos |
| Active beta | 0 | |

---

## 6. Caveats

- The Responded folder holds the signup notifications, not our replies. Our send times came from Sent Items. Company response times came from the inbox and your bookings-page confirmations. I did not find a welcome email for Accenture's later form contacts (handled through the Meta thread).
- Tritusa's response time (14.3 hours) was read from the quoted header in your 08-26 reply, assuming that header uses your Central time. Verify if the exact number matters.
- Older replies from Wolters Kluwer, Workday, and BearingPoint are not in the mailbox search, so for those the bookings-page confirmation stands in for the reply.
- The 09-24 follow-up went out in more than one wave, and I only scanned the newest 25 follow-up sends, so I cannot tell whether Merito and Love's got theirs before or after they responded.
- The 2026-08-20 burst of 35 signups in under 3 minutes suggests a batch import or launch push. Treat it as one event, not 35 organic signups.
- The Workday demo date (2026-07-24) is before its form signup (2026-08-28). Confirm which is right before quoting a time to demo for Workday.
- The tracker says 92 form submissions as of 2026-09-23, and the inbox has 96 for that period. The gap is probably duplicates and internal entries that the tracker already excluded.
- Wolters Kluwer's exact demo date is not logged. Eaton's reaction and Accenture's reaction are not captured.
- Contact names, emails, and per-person details are deliberately left out of this file.
