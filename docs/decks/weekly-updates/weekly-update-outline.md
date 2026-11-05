# AgentScore weekly
Window: 2026-10-29 to 2026-11-04
Beta Cohorts as of: 2026-11-04 (docs/feedback/Beta Cohorts.md)
External Interest counts as of: 2026-11-04 (docs/feedback/External Interest.md)
Wolters Kluwer: tracker still says no sign-in. Stated 2026-11-04: logged in, no action.

## Who is using it

### External
Signed in: 1 of 6 companies (cohort 1, invite 2026-10-12); 0 of 3 companies (cohort 2, invite 2026-11-02) (docs/feedback/Beta Cohorts.md, as of 2026-11-04)
Invited to beta: 9 cumulative, 8 still at that stage (docs/feedback/External Interest.md, as of 2026-11-04)
Actively using: 1, Tritusa (docs/feedback/External Interest.md, as of 2026-11-04)
Earlier stage: Pending beta 1 (Accenture). Demo scheduled 3, demo held and no follow-up: PG&E, Meta Platforms, Inc., Love's Travel Stops (docs/feedback/External Interest.md, as of 2026-11-04)
- Tritusa Consulting (AU) — first sign-in 2026-11-04 (docs/feedback/Beta Cohorts.md). Live.
- Wolters Kluwer United States Inc. — first sign-in: not yet (docs/feedback/Beta Cohorts.md, as of 2026-11-04). Stated 2026-11-04: logged in, no action.
- Merito Solutions — first sign-in: not yet (no sign-in reported) (docs/feedback/Beta Cohorts.md, as of 2026-11-04)
- L'OREAL — first sign-in: not yet (docs/feedback/Beta Cohorts.md, as of 2026-11-04)
- Aptiv Global Operations Limited — first sign-in: not yet (docs/feedback/Beta Cohorts.md, as of 2026-11-04)
- New Vision Software Inc. — first sign-in: not yet (docs/feedback/Beta Cohorts.md, as of 2026-11-04)
- Eaton — first sign-in: not yet (docs/feedback/Beta Cohorts.md, as of 2026-11-04)
- BearingPoint GmbH (DE) - HQ — first sign-in: not yet (docs/feedback/Beta Cohorts.md, as of 2026-11-04)
- Workday, Inc. — first sign-in: not yet (docs/feedback/Beta Cohorts.md, as of 2026-11-04)

### Internal
- Tosca agent (ATA) — scoring (docs/updates/2026-11-03 Update.md, 2026-11-03)
- Performance Agent — not scoring; `service.name` is not set (docs/updates/2026-11-03 Update.md, 2026-11-03)
- Quality Agent — not scoring (docs/updates/2026-11-02 Update.md, 2026-11-02; docs/updates/2026-11-03 Update.md, 2026-11-03)
- AI chat and the chatbot — not scoring; "fail to line up" (docs/updates/2026-11-03 Update.md, 2026-11-03)

## What is stopping onboarding
Trial blockers, not the full High list:
- On-prem — Love's (2026-10-02): cloud only, "we probably can't do much with it currently." Meta POC is gated on self-hosted in their AWS. Engineering said self-hosted was a go on 2026-09-23. Customers were still told it is cloud only (docs/feedback/Customer Feedback Log.md, Resolved row).
- CI/CD gate — Eaton will not judge a trial favorably without it. Not shipped (docs/feedback/Customer Feedback Log.md, open High, session 2026-10-01).
- Workflow evaluation — Wolters Kluwer will not try AgentScore until it exists. Not shipped (docs/updates/2026-11-03 Update.md).
Continuation:
- Lack of signups — 140 dated Labs rows, 19 Aug–30 Oct. 77 of 140 (55%) are the three Transform peak days. Average 1.9 a day.
- No response — 113 interested, 95 no reply, 18 replied, 5 no demo, 13 demo scheduled, 3 demo held with no follow-up, 1 pending (Accenture), 9 invited. Of the 9: Tritusa live, Wolters Kluwer logged in with no action, 7 no response.

## Feedback from people using it
No in-product feedback this week (as of 2026-11-04).
- Wolters Kluwer — Paul DiGrazia, September demo: "trying to do this on an agent-by-agent basis wouldn't be possible... interesting but not useful." 3 Nov: will not try until workflow evaluation exists. 4 Nov: logged in, no action. Tracker still says no sign-in.
- Tritusa — 11 Sep demo asks: compliance checks for bank and pharma clients, alerting, export of traces and scores. 2 Nov, Jawahar Govindaraj: they will send an update and set up follow-up calls this week. The full email body is not in the sources.

## What non-users said
- Wolters Kluwer — "will not try AgentScore until workflow evaluation exists" (docs/updates/2026-11-03 Update.md, 2026-11-03). Stated 2026-11-04: logged in, no action.
- Eaton — "they will not judge a trial favorably without it" (docs/feedback/Customer Feedback Log.md, open High row, session 2026-10-01)
- PG&E — "We are looking for solutions/tools to test the chatbot during the implementation stage, looks like AgentScore tool assists with chatbot performance in QA/PROD (quality of the responses etc.) post implementation" (docs/feedback/Customer Feedback Log.md, open High row, chat 2026-10-13)

## What is next
Subtitle: Draft. (docs/planning/roadmap/2026-11-04-agentscore-beta-roadmap.md, 2026-11-04)

### Now
- Improved onboarding — one next action from sign-in to a first score (Now). Addresses the path from sign-in to a score. Does not address the no-sign-in wall for the other 7 invited companies.
- Tricentis identity — Trident replaces Tosca Cloud sign-in (Now). Does not address a current wall.
- Workflow management — a multi-agent flow shown as one workflow (Now). Does not address the Wolters Kluwer workflow-evaluation wall. This theme is grouping, not scoring.
- Internal Tricentis agents — every internal agent scored; no product work expected (Now). Addresses Performance Agent, Quality Agent, and the chatbot not scoring. Does not move a named invited company to a sign-in.

### Next
- Stimulation testing — profile, test, and score without waiting for organic traces (Next). Does not address a current wall.
- App usability — progress on long actions, and plain-language eval names (Next). Does not address a current wall.
- JEV / decision model — hybrid scorer to cut scoring time and cost (Next). Does not address a current wall.
- Session grouping — one agent's traces scored as a task (Next). Does not address a current wall.

### Later
- Trace data protection — redact sensitive data from stored traces (Later). Does not address a current wall.
- AIWS integration — score and ship decision inside AI Workspace (Later). Does not address a current wall.
- Quantitative cost function — a dollar or risk value on each improvement (Later). Does not address a current wall.
- Tenant-wide agent reporting — one report for every agent in the tenant (Later). Does not address a current wall.
