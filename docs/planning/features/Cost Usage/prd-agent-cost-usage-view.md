# 📄 Product Requirements Document — `Per-Agent Usage & Cost View (Customer-Facing)`

> 💡 *Draft PRD - no One Pager exists yet for this feature. Written directly from a working session; expand as design/eng feasibility firms up.*

---

## 📋 Document Summary

| Field | Details |
| --- | --- |
| 📌 **Title** | Per-Agent Usage & Cost View |
| ✍️ **Author** | A. Demers |
| 🔖 **Status** | Draft |
| 📅 **Created** | 2026-09-24 |
| 🔄 **Last Updated** | 2026-09-24 |
| 🗂️ **Jira Initiative** | TBD |
| 🎫 **Jira Epic** | TBD |
| 🚀 **Target Release** | TBD |
| 💬 **Short Summary** | A standalone "Usage & Cost" page listing every agent, with per-agent drill-down. Shows agent usage (AI credits for AIW-hosted agents, configurable-rate cost for external agents, rate set on a new "Cost" tab on the agent's Settings page) alongside AgentScore's own usage against that agent (eval results, scoring runs, profile fits, agent card generations, total cost in AI credits). Exportable to Excel. |

---

## 👥 Team

| Role | Name | Responsibilities |
| --- | --- | --- |
| 🧭 **PM Lead** | A. Demers | Owns the PRD, drives prioritization, stakeholder alignment |
| ⚙️ **Engineering Lead** | TBD | Confirm whether a metering backend exists and is extensible |
| 🎨 **UX Lead** | TBD | Placement and layout of the new view |
| 🏗️ **Architect** | TBD | Data source for token usage/cost (see Technical Considerations) |
| ✍️ **Tech Writing Lead** | TBD | — |
| ✅ **Approvers / Sign-off** | TBD | — |

---

## 📝 Change History

| Version | Date | Author | Summary of Changes |
| --- | --- | --- | --- |
| v1.0 | 2026-09-24 | A. Demers | Initial draft |
| v1.1 | 2026-09-24 | A. Demers | Reframed primary goal: track usage of the customer's own agent (AIW and external). AgentScore's own evaluation cost breakdown demoted from primary to bonus/secondary. |
| v1.2 | 2026-09-24 | A. Demers | Dropped "bonus" framing per prototype review - AgentScore's own evaluation cost is now one view with agent usage, simplified to scoring-run count, profile-fit count, and total cost in AI credits (dropped the Agent card count and the per-category $ breakdown). |
| v1.3 | 2026-09-24 | A. Demers | Restored eval results and agent card generation counts (back to 4 counts total). Renamed "AgentScore evaluation cost" to "AgentScore evaluation." Added Export to Excel as in-scope. Resolved placement: standalone "Usage & Cost" page listing all agents (not an Agent Detail tab). Resolved rate config: edited inline on the agent's Usage & Cost view via an "Edit rate" control, not a separate agent settings page. |
| v1.4 | 2026-09-24 | A. Demers | Reversed the v1.3 rate-config decision: rate is set on a new "Cost" tab on the agent's Settings page, not inline on the Usage & Cost view. Usage & Cost view still displays the resulting cost, read-only, with a link to that Settings tab. No other change. |

---

## 🔭 Overview

AgentScore customers today have no way to see how much their own agent is being used, or what that usage costs them - whether the agent runs in AI Workspace (AIW) or externally. This PRD scopes a customer-facing "Usage & Cost" page: a standalone list of every agent in the tenant, drilling into a per-agent view of token usage and cost for running the agent itself, with different cost handling for AIW-hosted agents (AI credits) versus externally-hosted agents (cost from a customer-configured token rate, set on a new "Cost" tab on the agent's Settings page). The same view also surfaces, per agent, how much AgentScore itself has been used against that agent - eval results, scoring runs, profile fits, and agent card generations, plus their total cost in AI credits. Both the aggregate list and the per-agent drill-down can be exported to Excel.

---

## 🔍 Problem

Customers have no per-agent visibility into their own agent's usage today. An AIW-hosted agent burns AI credits every time it runs; an externally-hosted agent incurs a token cost the customer configures themselves - but neither is visible per-agent anywhere in the product. Customers can't answer "how much is this agent actually costing me to run" or "is my configured rate for this external agent even right."

A related but distinct cost layer already has a partial internal precedent: `UsageReportTab.tsx` and `TenantUsageDetailPage.tsx` show AgentScore's *own* evaluation cost (Total cost split into Scoring / Profile fit / Agent card / Other, plus avg cost per result/fit/card) - but scoped to a tenant, staff-only, and per `report-fixtures.ts`'s own header comment, unwired to a real backend: *"Fake data for the Reports section ... no backend. Shapes mirror the real `UsageReport`/`UsageReportTenantRow`/`UsageReportAgentRow` wire types closely enough for the cloned UI to render unmodified."* This feature surfaces a simplified customer-facing version of that same idea on the same view (see Objectives), but it answers a different question than the primary one - it's the cost of *evaluating* an agent, not the cost of *running* it.

---

## 🎯 Objectives

1. **(Primary)** Give customers visibility into their own agent's usage - token usage and cost - for both AIW-hosted and externally-hosted agents.
2. **(Primary)** Handle the two hosting models differently: AIW-hosted agents show AI credit cost; external agents show cost computed from a customer-configured token rate.
3. **(Primary)** On the same view, show per agent how much AgentScore itself has been used against it: eval results, scoring runs, profile fits, and agent card generations, plus their total cost in AI credits.
4. Let customers drill from an aggregate view into individual runs to explain a usage or cost spike, not just see a total.
5. Let customers export both the aggregate agent list and any per-agent drill-down to Excel.

---

## 🚧 Constraints

1. **No confirmed backend for either layer.** Agent-level usage tracking has no known existing data source yet - needs discovery. The AgentScore evaluation-cost layer has a UI precedent but no backend: `report-fixtures.ts` states it's mock data, with wire types (`UsageReport*`) that may or may not be backed by a real API.
2. **No rate-config field exists yet.** The Agent Settings View spec (`docs/planning/AgentScore-PRD.md`, requirement R5) covers scoring profile, LLM judge, eval toggles, verdict bands, and trace sampling rate - not a billing/token rate. Adding a new "Cost" tab with input/output token rate fields for external agents is new scope, not a re-skin.
3. **Scoring cost model is unresolved elsewhere.** An earlier update (2026-08-24) flags judge-model billing as unresolved company-wide - it "may piggyback on however AI Workspace resolves bring-your-own-LLM billing." This PRD can't finalize what "Scoring" cost means until that's settled.

---

## 👤 Personas

| Persona | Description | Priority |
| --- | --- | --- |
| Tenant admin/owner | Tracks how much their own agent is being used and what that usage costs; needs to explain usage/cost spikes per agent | 🥇 Primary |
| External-agent owner | Configures their own agent's input/output token rate; needs to see cost reflect that rate | Secondary |
| Tricentis support/CS | References the same numbers the customer sees, to answer billing questions without backoffice access | Secondary |

---

## 🎬 Use Cases & Scenarios

### Scenario 1 — Monthly usage review (primary)

A tenant admin opens the new standalone "Usage & Cost" page, sees every agent in the tenant listed with this month's traces, tokens, and usage cost, and clicks into one agent for the full breakdown - AI credit cost if it's AIW-hosted, or cost from the configured token rate if it's external.

### Scenario 2 — Explaining a spike (primary)

The same admin notices this agent's usage jumped overnight. They drill from the aggregate view into a per-run log (timestamp, tokens in/out, cost) to find the runs responsible.

### Scenario 3 — Setting an external rate (primary)

An external-agent owner opens that agent's Settings page, sets input/output token rates on the new "Cost" tab, and sees the Usage & Cost view immediately reflect cost calculated from those rates instead of a Tricentis AI-credit rate.

### Scenario 4 — Checking AgentScore's own overhead

The same admin, on the same view, also sees how many eval results, scoring runs, profile fits, and agent card generations AgentScore has performed against this agent, and their total cost in AI credits - on top of what it costs to run the agent itself.

### Scenario 5 — Exporting for a stakeholder

The same admin exports either the full agent list or one agent's drill-down to Excel to share usage/cost data with a stakeholder who doesn't have product access.

---

## ✅ Features In

> **[MVP]** = Minimum viable experience required for this release.

### 🟢 Agent usage

* **[MVP]** A standalone "Usage & Cost" page listing every agent in the tenant, over a selectable time window
* **[MVP]** Per agent: traces ingested, tokens in/out, and usage cost for running the agent itself
* **[MVP]** AIW-hosted agents: usage cost shown as AI credit cost
* **[MVP]** External agents: usage cost shown as cost computed from that agent's configured input/output token rate
* **[MVP]** New rate-configuration fields (input $/1M tokens, output $/1M tokens - matches how most providers price), set on a new "Cost" tab on the agent's Settings page
* **[MVP]** Per-run drill-down of the agent's own usage: timestamp, tokens in/out, cost

### 🟢 AgentScore usage

* **[MVP]** Count of eval results, scoring runs, profile fits, and agent card generations performed against the agent
* **[MVP]** Total AgentScore cost for evaluating the agent, shown in AI credits
* **[MVP]** Per-run drill-down for evaluation cost, alongside the agent usage drill-down

### 🟢 Shared

* Time-window filter shared across the agent usage and AgentScore usage sections
* Export to Excel, from both the aggregate agent list and any per-agent drill-down

---

## 🚫 Features Out

* Tenant-level rollup in the customer-facing app - stays backoffice-only for now (`agentscore-frontend/DECISIONS.md:297`: "may return later, tucked into Advanced for staff debugging")
* Alerting or budget thresholds on usage or cost
* Billing/invoicing integration - this view is informational only

---

## 🎨 Design

No production wireframes yet, but a working prototype exists: `docs/planning/features/prd-agent-cost-usage-view-prototype.html`. Placement is resolved as a standalone "Usage & Cost" page (its own nav entry) listing every agent, not a tab on the existing Agent Detail page - see the prototype and the Q&A / Decision Log.

---

## ⚙️ Technical Considerations

* Confirm whether the `openmeter-tais` integration (configured, zero references found in this repo) is the intended source for agent usage/token data (primary), or whether this needs a new data source.
* Confirm whether the `UsageReport` / `UsageReportTenantRow` / `UsageReportAgentRow` wire types referenced in `report-fixtures.ts` are real production types that can be extended for the AgentScore usage layer, or mock-only artifacts.
* New rate-config fields on the agent settings page need validation and must feed the external-agent usage cost calculation live.
* Usage data and AgentScore usage data may come from two different sources - don't assume one backend serves both.
* Export to Excel needs a backend export endpoint for both the aggregate list and the per-agent drill-down, not just a client-side CSV dump, if the underlying data set can exceed what's rendered on screen.

---

## 📐 Success Metrics

| Metric | Baseline | Target | Measurement Method |
| --- | --- | --- | --- |
| % of tenants that view the Usage & Cost page for at least one agent | 0% (feature doesn't exist) | TBD | Product analytics on page view |
| % of external-agent owners who set a custom token rate | 0% (feature doesn't exist) | TBD | Agent settings usage analytics |
| Support tickets tagged "usage/billing confusion" | TBD - need current count | Decreasing trend post-launch | Support ticket tagging |

---

## 📣 GTM Approach

Not scoped yet - this is a transparency/trust feature for existing customers rather than a standalone launch. Revisit once design is settled.

---

## ❓ Open Issues

1. **Is the backend real?** `report-fixtures.ts` says the internal report has no backend. Need engineering to confirm whether the referenced wire types are backed by a live API anywhere, or need to be built.
2. **Is `openmeter-tais` the metering source?** Zero references found in-repo; confirm with eng/platform.
3. **Scoring cost model.** Judge-model billing is unresolved company-wide (2026-08-24 update) - this PRD depends on that being settled to define "Scoring" cost precisely.
4. **Visibility scope.** Should this be visible to any user on the tenant, or admin-only?
5. **Export data volume.** Should export be limited to the selected time window's rendered rows, or support a larger range than what's displayed on screen?

---

## 💬 Q&A / Decision Log

| Asked By | Question | Decision / Answer |
| --- | --- | --- |
| A. Demers | Classic PRD or OST-style? | Classic PRD - solution direction (extend the existing cost-report pattern) is clear enough to specify. |
| A. Demers | Where does the view live? | Customer-facing app (not backoffice-only, as originally framed). Standalone "Usage & Cost" page listing every agent, not an Agent Detail tab - resolved via prototype review. |
| A. Demers | Per-run or aggregated? | Both - aggregate summary with per-run drill-down. |
| A. Demers | Audience? | Customer-facing (scope expanded from the original backoffice-only ask). |
| A. Demers | What's the primary goal? | Let customers track usage of their own agent (AIW and external) - AgentScore's own evaluation cost breakdown is a bonus, secondary layer, not the primary goal. |
| A. Demers | Should the evaluation-cost layer stay a separate "bonus" tier from agent usage? | No - per prototype review, dropped the bonus/primary split. Both live on the same view. Evaluation cost simplified to: count of scoring runs, count of profile fits, total cost in AI credits (dropped the Agent card count and per-category $ breakdown). |
| A. Demers | Should eval results and agent card generations come back as counts? | Yes - restored both. AgentScore usage now shows four counts (eval results, scoring runs, profile fits, agent card generations) plus total cost in AI credits. |
| A. Demers | Where does rate config for external agents live? | A new "Cost" tab on the agent's Settings page - not inline on the Usage & Cost view. |
| A. Demers | Is export in scope? | Yes - Export to Excel for both the aggregate agent list and any per-agent drill-down, moved from Features Out to MVP. |
| A. Demers | Keep "cost" in the "AgentScore evaluation cost" label? | No - shortened to "AgentScore usage" / "AgentScore evaluation" throughout, to match the prototype. |

---

## 🗓️ Feature Timeline & Phasing

| Feature / Milestone | Status | Target Date | Owner |
| --- | --- | --- | --- |
| Confirm agent usage data source (primary) | 🔲 Backlog | TBD | TBD |
| Inline rate-config control on Usage & Cost view | 🔲 Backlog | TBD | TBD |
| Standalone Usage & Cost page (agent list) + per-agent drill-down (primary) | 🔲 Backlog | TBD | TBD |
| Confirm AgentScore usage backend | 🔲 Backlog | TBD | TBD |
| AgentScore usage view (eval results, scoring runs, profile fits, agent card generations, total credits) | 🔲 Backlog | TBD | TBD |
| Export to Excel (agent list + per-agent drill-down) | 🔲 Backlog | TBD | TBD |

---

## ✔️ PRD Checklist

| # | Topic | Status |
| --- | --- | --- |
| 1 | Title & document summary | Done |
| 2 | Author & team | Partial - eng/UX/architect owners TBD |
| 3 | Change history | Done |
| 4 | Overview & problem | Done |
| 5 | Objectives & constraints | Done |
| 6 | Personas | Done |
| 7 | Use cases / scenarios | Done |
| 8 | Features In (with [MVP] marked) | Done |
| 9 | Features Out | Done |
| 10 | Design links | Backlog - no wireframes yet |
| 11 | Technical considerations | Partial - open questions logged |
| 12 | Success metrics | Partial - baselines TBD |
| 13 | GTM approach | Backlog |
| 14 | Open issues | Done |
| 15 | Q&A / decision log | Done |
| 16 | Feature timeline | Backlog - dates/owners TBD |

---

## 📎 References

* **Prototype:** `docs/planning/features/prd-agent-cost-usage-view-prototype.html`
* **Jira story:** [AI-13987](https://tricentis.atlassian.net/browse/AI-13987)
* **Existing internal report (UI, mocked):** `agentscore-frontend/src/back-office/reports/UsageReportTab.tsx`, `agentscore-frontend/src/back-office/reports/TenantUsageDetailPage.tsx`, `agentscore-frontend/src/back-office/reports/report-fixtures.ts`
* **Agent Settings View spec:** `docs/planning/AgentScore-PRD.md` (requirement R5)
* **Backoffice scope decision:** `agentscore-frontend/DECISIONS.md:297`
* **Unresolved judge-model billing:** `docs/updates/August Updates/2026-08-24 Update.md`
