# Stories: Automatic tenant setup for new users

Source: no PRD exists. Derived from the request "improve onboarding - set up a tenant for new users automatically" and the current flow in the Beta Welcome Email (docs/feedback/email automation/Beta Welcome Email Draft.md).

## Current state (what this replaces)

- A new user signs in with Tosca Cloud, then emails the team their Tosca Cloud tenant name. The AgentScore team creates the workspace (tenant) by hand. Tenants cannot be created from the app by the end user.
- Everyone signing in from that Tosca Cloud tenant then gets access.
- The user creates an ingest key (`tk_...`) in Integrations, then points their OTel exporter at AgentScore.
- AI Workspace agents already auto-create a tenant on first trace ingestion, but the user still needs the team to grant access.
- A tenant and agent provisioning saga already exists (roadmap-annotated-2026-07-20.md), so this work should reuse it rather than build a second path.

## Assumptions to confirm

1. The sign-in token carries a stable Tosca Cloud tenant identifier that can be mapped 1:1 to an AgentScore tenant.
2. The existing provisioning saga can be called from the sign-in path and is safe to retry.
3. Beta access is still gated. Auto-setup must not turn the beta into open signup unless that is decided. Epic 1 includes an eligibility gate for this reason.
4. Where a user belongs to no Tosca Cloud tenant, they are sent to the Tosca Cloud trial signup as today.

---

## Epic 1: Automatic tenant provisioning

**Ask:** When an eligible user signs in for the first time, AgentScore creates their workspace and grants access with no manual step by the AgentScore team. This removes the slowest and most error-prone step in beta onboarding.

**Acceptance Criteria:**

1. A first-time eligible user reaches a working workspace in the same sign-in session, with no email to the team.
2. Provisioning is safe to repeat and safe under concurrent sign-ins from the same Tosca Cloud tenant.
3. Users who are not eligible, or whose provisioning fails, see a clear message and the team is told.

**Priority:** P0
**Dependencies:** none

### Tosca Cloud tenant to AgentScore tenant mapping

Problem to solve: There is no defined rule linking a signed-in user's Tosca Cloud tenant to an AgentScore tenant, so the team does it by hand from an emailed name.

AC:

1. The identity claim used to identify the Tosca Cloud tenant is documented and read from the sign-in token, not typed by the user.
2. Each Tosca Cloud tenant maps to at most one AgentScore tenant, enforced by a uniqueness constraint.
3. Lookup by Tosca Cloud tenant identifier returns the existing AgentScore tenant when one exists.
4. A user with no resolvable Tosca Cloud tenant is routed to the existing trial signup guidance.

**Priority:** P0
**Estimate:** M
**Dependencies:** none

### Idempotent tenant creation on first sign-in

Problem to solve: Tenant creation only happens through manual team action or AI Workspace ingestion, so new users wait for a person before they can use the product.

AC:

1. On first sign-in with no mapped tenant, the system calls the existing provisioning saga and creates the tenant.
2. The user is added as a member of the new tenant before the app loads.
3. Two users from the same Tosca Cloud tenant signing in at the same moment produce exactly one tenant.
4. Repeating the call for an already-provisioned tenant returns the existing tenant and makes no changes.
5. If any saga step fails, partial state is rolled back or the saga is resumable, and the user can retry without creating duplicates.

**Priority:** P0
**Estimate:** L
**Dependencies:** Tosca Cloud tenant to AgentScore tenant mapping

### Membership for later users of an existing tenant

Problem to solve: Today the team grants access once per customer tenant; additional colleagues signing in later must get access automatically or the manual step simply moves.

AC:

1. A user signing in from a Tosca Cloud tenant that already has an AgentScore tenant is added as a member automatically.
2. The user lands in the existing tenant and sees the same agents and keys as colleagues.
3. Membership is created once per user; repeat sign-ins do not create duplicates.

**Priority:** P0
**Estimate:** M
**Dependencies:** Idempotent tenant creation on first sign-in

### Eligibility gate for beta access

Problem to solve: Automatic creation would let any Tosca Cloud user create a workspace, which conflicts with the invite-only beta and with cost and support capacity.

AC:

1. Auto-provisioning runs only for Tosca Cloud tenants or email domains on a configurable allowlist.
2. Ineligible users see a waitlist or request-access message and no tenant is created.
3. The allowlist can be changed by an admin without a deploy.
4. A single setting turns the gate off to allow open signup later.

**Priority:** P0
**Estimate:** M
**Dependencies:** Tosca Cloud tenant to AgentScore tenant mapping

### Reconciliation with AI Workspace auto-created tenants

Problem to solve: AI Workspace already creates tenants on first trace ingestion, so a user could end up with two tenants for one Tosca Cloud tenant.

AC:

1. A tenant created by AI Workspace ingestion is recorded against its Tosca Cloud tenant identifier.
2. Signing in from that Tosca Cloud tenant joins the existing tenant instead of creating a second one.
3. Ingestion arriving for a tenant that sign-in already created reuses it.
4. A test covers both orderings (sign-in first, ingestion first).

**Priority:** P0
**Estimate:** M
**Dependencies:** Idempotent tenant creation on first sign-in

### Provisioning failure handling

Problem to solve: If setup fails midway, the user is stuck at the exact moment the manual process used to catch problems.

AC:

1. A failed provisioning shows the user a plain-language message with a retry action and a support contact.
2. The failure is logged with tenant identifier, user, and failing step.
3. The AgentScore team is alerted on provisioning failure (channel to be decided).
4. Retry after a failure completes without duplicate tenants or memberships.

**Priority:** P1
**Estimate:** S
**Dependencies:** Idempotent tenant creation on first sign-in

---

## Out of scope for this cut

Epics 2 to 4 from the earlier draft (first-run experience, provisioning visibility, rollout and migration) are not included. Epic 1 still needs these before it can ship safely, so they must be decided separately:

- **Backfill:** existing manually created tenants have no stored Tosca Cloud tenant identifier, so the first sign-in after launch would create a duplicate. Either backfill them or treat it as a launch blocker.
- **Isolation testing:** nothing here proves a user can never land in another customer's tenant. Treat a cross-tenant test as a launch condition.
- **Feature flag:** no story controls staged enablement. The eligibility gate is the only control.

## Flagged items

- **Idempotent tenant creation on first sign-in** is the largest story (L). If the saga cannot be called safely from the sign-in path, split into a saga refactor enabler and the sign-in integration.
- **Eligibility gate** needs a product decision on whether the beta stays invite-only. Without it, that story is blocked on policy, not engineering.
- **Billing and cost:** automatic tenants may carry trace storage and LLM judge cost. No story covers per-tenant limits; consider one if the gate is opened.

## Suggested sprint ordering

**Sprint 1:** Tosca Cloud tenant to AgentScore tenant mapping, Eligibility gate for beta access, Idempotent tenant creation on first sign-in (start).

**Sprint 2:** Idempotent tenant creation (finish), Membership for later users of an existing tenant, Reconciliation with AI Workspace auto-created tenants, Provisioning failure handling.
