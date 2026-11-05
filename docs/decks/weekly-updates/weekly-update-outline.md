# AgentScore weekly
Window: 2026-10-29 to 2026-11-04
Last week's deck: none (first deck in this format)
This week's deck: docs/decks/weekly-updates/AgentScore weekly.pptx
Beta Cohorts as of: 2026-11-04. External Interest counts as of: 2026-11-04.

## 1. Title
Week of: November 9, 2026
Footer: Beta Cohorts and External Interest as of Nov 4, 2026. (docs/feedback/Beta Cohorts.md, docs/feedback/External Interest.md, as of 2026-11-04)

## 2. This week in four answers
### Who is using it
Headline: 1 customer live, 1 internal agent scoring
- External: Tritusa is live and using the product. Wolters Kluwer reported logged in, nothing run yet. (docs/feedback/Beta Cohorts.md, as of 2026-11-04; docs/updates/2026-11-03 Update.md, 2026-11-03)
- Internal: Tosca agent (ATA) is scoring. Performance Agent, Quality Agent and the chatbot are in progress. (docs/updates/2026-11-03 Update.md, 2026-11-03)
### What is stopping onboarding
Headline: Most invites go unanswered
- Lack of customers: Invites go largely ignored: 7 of 9 invited accounts have no sign-in reported. (docs/feedback/Beta Cohorts.md, as of 2026-11-04)
- On-prem requirement: Eaton and Merito need an on-prem answer before they can start. (docs/feedback/Customer Feedback Log.md, open rows)
- Suspected onboarding difficulty: Wolters Kluwer signed in but has not run anything. (docs/updates/2026-11-03 Update.md, 2026-11-03)
### Feedback from people using it
Headline: Users ask what comes after the score
- Tritusa scored well: Ran its agents with proper traces. Now wants training on how scores are built and how to find failures. (user, Tritusa email, 2026-11-05)
- Top asks across accounts: Simulation testing (6 accounts) and scoring a group of agents (5). (docs/feedback/Customer Feedback Log.md, Recurring asks)
- Note: From Tritusa's email and the Customer Feedback Log.
### What is next
Headline: Get every user to a first score
- Simpler onboarding: Make it incredibly simple and easy to get a first score. (docs/planning/roadmap/2026-11-04-agentscore-beta-roadmap.md, 2026-11-04)
- Every internal agent: Onboard every internal Tricentis agent. (same roadmap)
- Spikes: JEV / decision models and stimulation testing. (same roadmap)
Sources: Beta Cohorts and External Interest, Nov 4. Working sessions Oct 29, Nov 2, Nov 3. Customer Feedback Log. Roadmap Nov 4 (draft).

## 3. Who is using it
Subtitle: 2 external accounts signed in, 1 internal agent scoring. As of Nov 4
### External customers
- Tritusa | status: Live. Use reported Nov 4. In the product by Oct 22. | Use case: Evaluate the agents they build for clients, and run their assurance practice. They showed a Copilot Studio agent and an AI Workspace agent, each turning a requirements document into Tosca. | Still open: Compliance checks for bank and pharma clients. Alerting when an agent degrades. An export of traces and scores. (docs/feedback/Beta Cohorts.md, as of 2026-11-04; docs/feedback/Customer Feedback Log.md, 2026-09-11 session)
- Wolters Kluwer | status: Reported logged in Nov 4. Nothing run yet. | Use case: Score agents outside Tricentis, on their FAB platform and in GitHub Copilot, and use the scores to steer people to sanctioned tools. | Status: Reported Nov 4 as signed in with nothing run. Beta Cohorts still says no sign-in, so the tracker needs the date. (docs/feedback/Customer Feedback Log.md, 2026-09 session; docs/feedback/Beta Cohorts.md, as of 2026-11-04)
### Internal Tricentis agents
- Tosca agent (ATA) | status: Onboarded and scoring. | Why it works: Its service was instrumented on purpose, so traces attribute to the agent and the score comes out as designed. | Next: Improving the evaluations and results, auditing/comparing with an AI Engineer's evaluations (docs/updates/2026-11-03 Update.md, 2026-11-03; user, 2026-11-05)
- Not scoring yet | status: No instrumentation guide for the owning teams yet. (docs/updates/2026-11-03 Update.md, 2026-11-03)
  - Performance Agent: service.name is not set, so the agent never appears. (docs/updates/2026-11-03 Update.md, 2026-11-03)
  - Quality Agent: Not one agent. Its pieces are called by the chatbot graph. (docs/updates/2026-11-02 Update.md, 2026-11-02; docs/updates/2026-11-03 Update.md, 2026-11-03)
  - AI chat and the chatbot: Traces do not line up with the service list. (docs/updates/2026-11-03 Update.md, 2026-11-03)
  - Smith (TAIS): Live in dev only. Tim is checking its traces carry the attributes AgentScore needs. (docs/updates/2026-11-03 Update.md, 2026-11-03)
Footer: External: 7 of 9 invited have no sign-in reported. Invited Oct 12: Merito, L'Oréal, Aptiv, New Vision. Invited Nov 2: Eaton, BearingPoint, Workday. Pending beta: Accenture. Internal: Nov 2 and Nov 3 working sessions.

## 4. What is stopping onboarding
Subtitle: Three blockers, from this week's working sessions and trackers
### Lack of customers
Headline: Invites go largely ignored
- 7 of 9 invited, no sign-in: Invited Oct 12: Merito, L'Oréal, Aptiv, New Vision. Invited Nov 2: Eaton, BearingPoint, Workday. (docs/feedback/Beta Cohorts.md, as of 2026-11-04)
- Few new signups: Outside the three Transform events, Labs signups come in at about 1 a day. (Labs form submissions, Aug 19 - Oct 30)
- ~11.5% of Labs signups end up in a demo: The majority end up ignored or unresponsive. (docs/feedback/External Interest.md, Cumulative table, as of 2026-11-04: 13 demo scheduled of 113 interested)
### On-prem requirement
Headline: Several customers request OP before they will even look at AgentScore
- No single on-prem answer: Love's, Meta and Eaton got three different answers. Accenture needs private AWS. (docs/feedback/Customer Feedback Log.md, Resolved on-prem row)
- Eaton: Needs a written data-handling answer, logged as likely a gate to any trial. (docs/feedback/Customer Feedback Log.md, open High row)
- Merito: Partner access and the Tosca tenant question. (docs/feedback/Customer Feedback Log.md, open Low row, 2026-10-06 session)
### Suspected onboarding difficulty
Headline: Accounts get in, then stall on what to do next
- Tritusa unsure of next steps: Their agents scored well, then they asked for training on how scores work and how to find failures and improve them. (user, Tritusa email, 2026-11-05)
- Wolters Kluwer: AI Workspace opt-in: Signed in but has not run anything. Scoring their AI Workspace traces, and L'Oréal's, waits on a legal opt-in. (docs/updates/October Updates/2026-10-29 Update.md, 2026-10-29; docs/feedback/Customer Feedback Log.md, L'Oreal 2026-09-24 session)
- Product gaps: Wolters Kluwer waits on workflow scoring, Eaton on a CI/CD release gate, Meta on simulation testing. (docs/updates/2026-11-03 Update.md, 2026-11-03; docs/feedback/Customer Feedback Log.md, open High rows)
Sources: Oct 29 and Nov 2 working sessions. Customer Feedback Log, open High rows. Beta Cohorts, Nov 4. Labs form submissions, Aug 19 - Oct 30.

## 5. Funnel
Title: 7 of 9 invited: no sign-in reported
Kicker: No response. Companies, as of Nov 4
Counts: Interested 113, Replied 18, No reply 95, Demo scheduled 13, No demo 5, No follow-up 4, Invited 9, Live 1, Logged in - nothing run 1, No sign-in reported 7 (docs/feedback/External Interest.md, as of 2026-11-04)
Footer: Of the 9 invited: Tritusa live, Wolters Kluwer reported logged in with nothing run, 7 no sign-in reported (4 invited Oct 12, 3 invited Nov 2).

## 6. Signups
Title: Signups: about 1 a day outside the three Transform events
Subtitle: Lack of signups. Labs form submissions per day (people, not companies), Aug 19 - Oct 30
Data range: Aug 19 - Oct 30. New days since last deck: none (first deck in this format)
Event days: Transform Dallas (Aug 20): 38. Transform Singapore (Sep 17): 15. Transform London (Oct 22): 24. Average outside event days: 0.9 a day. Overall: 1.9 a day.
Footer: 140 dated Labs form submissions. 77 (55%) came on the three event days: 38 on Aug 20, 15 on Sep 17, 24 on Oct 22 (7 more on Oct 21). The other 63 came over 70 days, 0.9 a day. The overall average with the event days is 1.9.

## 7. Feedback from people using it
Subtitle: Tritusa ran its agents and they scored well. What they want now is help using the score.
### Left: Tritusa, email to Andrew
Label: TRITUSA, EMAIL TO ANDREW
Headline: "We evaluated our AI agents today with proper traces, and they scored well in AgentScore."
- They asked for a demo or training session on:
  1. How AgentScore evaluates agents and calculates scores
  2. Guardrails and configuration parameter setup
  3. How to identify failures and improve scores
  4. Best practices for agent evaluation
  5. Report and recommendation generation
Note: Jawahar Govindaraj. Teams are in Australia and India, so they asked for Mon-Thu slots at 8 AM or 8 PM EDT. (user, Tritusa email, 2026-11-05)
### Right: Top asks across accounts
Label: TOP ASKS ACROSS ACCOUNTS
Headline: Simulation testing and multi-agent scoring lead the list
- Simulation testing  6 accounts: Meta, L'Oréal, Tritusa, Eaton, PG&E, Accenture (docs/feedback/Customer Feedback Log.md, open High row)
- Score a group of agents or a workflow  5 accounts: Meta, Wolters Kluwer, Aptiv, Eaton, Accenture (same, open High row)
- Access control and self-service onboarding  3 accounts: Wolters Kluwer, L'Oréal, Accenture (same, open High row)
- Export of traces and scores  3 accounts: Wolters Kluwer, Tritusa, Accenture (same, open High row)
- Cost and token report per agent  3 accounts: L'Oréal, Tritusa, Meta (same, open High row)
- CI/CD release gate  2 accounts: Eaton (headline requirement), Accenture (same, open High row)
Footer: Tritusa email from Jawahar Govindaraj to Andrew. Customer Feedback Log, High-priority feature requests, by number of accounts.

## 8. What is next
Subtitle: The three priorities from the draft roadmap (Nov 4), with this week's actions
### Simpler onboarding
Headline: Get every user to a first score
- Guided first session: Every screen offers one next action until the user reads a score and a verdict. No traces, profiles or evals to set up on the way. (docs/planning/roadmap/2026-11-04-agentscore-beta-roadmap.md, Improved onboarding)
- Gaps still open: Home does not open the connect card, the first score does not start on its own, and verdict names differ by screen. (same roadmap, Improved onboarding)
- This week: Design improved flow and identify gaps. (user, 2026-11-05)
### Every internal agent
Headline: Score every internal Tricentis agent
- Adoption, not product work: Connect and score each internal Tricentis agent. No new AgentScore feature is expected. (same roadmap, Internal Tricentis agents)
- Where it stands: Only the Tosca agent (ATA) scores today. Owning teams need to set an agent-name attribute on their spans. (docs/updates/2026-11-03 Update.md, 2026-11-03)
- This week: Tim pushes the Performance Agent span-attribute PR. Product and Tim meet the agent owners and write a one-page instrumentation guide. (docs/updates/2026-11-03 Update.md, action table)
### Spikes
Headline: JEV / decision models and stimulation testing
- JEV / decision model: A hybrid scorer: the cheaper model where it fits the check, the full judge where it does not. Cuts scoring time and cost. (same roadmap, JEV / decision model)
- Stimulation testing: Profile the agent, run targeted tests, score the results and generate improvements, without waiting for real traces. (same roadmap, Stimulation testing)
- Why now: Simulation testing is the top ask (6 accounts). (docs/feedback/Customer Feedback Log.md, open High row)
Footer: Also this week: Product writes the legal brief on AI Workspace opt-in, plus a charge / no-charge map. Also on Now: workflow grouping. Roadmap Nov 4, draft. Working sessions Oct 29, Nov 2 and Nov 3.

## Changes from last week
None. This is the first deck in this format, so it is the baseline for next week.
