# Demo Usability Decision Log

Tracks changes made to `agentscore-demo` specifically to improve usability for non-technical users: what changed, who it's for, and why. Does not track feature/build-out work (cloning screens, wiring fixture data, matching production feature parity) unless the change itself was made for a usability reason.

Every entry is checked against the live source in `agentscore-demo/src` before being logged - not just commit messages, which can describe a change that was intended but never actually landed.

---

## 2026-09-16 - Renamed "Agents" nav item/page to "My Agents"

**Change:** Renamed the "Agents" label to "My Agents" in the sidebar nav (`MinimalShell.tsx`), the list page header (`AgentsSearchPage.tsx`), the agent-detail breadcrumb (`agent-shell.tsx`), and the still-unwired `sidebar-nav.ts` (kept in sync to avoid drift). Left the tenant-scoped "Agents" tab (`tenant-shell.tsx`) and stat card (`TenantOverviewPage.tsx`) unchanged - those refer to a specific tenant's agents, not the global list, and "My Agents" wouldn't fit that context. This diverges from production, which still labels this "Agents" (verified in `agent-score/frontend/src/shared/components/sidebar-nav.ts`).

**Who it's for:** Non-technical admins navigating the demo - "My Agents" reads as more personally relevant/less abstract than "Agents" for a first-time viewer.

**Why:** Requested directly by the user (2026-09-16). Also resolves part of the "Agent" naming collision flagged in the initial usability audit - distinguishing the user-facing agent list from the more technical "Agent Registry" section.

---

## Template for new entries

```
## YYYY-MM-DD - <short title>

**Change:** what was changed, in concrete terms (files/components/behavior).

**Who it's for:** the audience or user this serves (e.g. non-technical demo viewers, sales presenters, a specific persona from the audit).

**Why:** the rationale - what usability problem it solves or which audit finding it responds to.
```
