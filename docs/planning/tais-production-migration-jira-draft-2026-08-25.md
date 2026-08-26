# TAIS Production Migration — Draft Jira Epics & Stories

Source: identity/TAIS-deployment planning meeting, 2026-08-25.
Status: created in Jira 2026-08-25. Epic key mapping:

| Epic | Key |
|---|---|
| 1 — Identity: Replace DB Password Auth with Okta | AI-12369 |
| 2 — Commercialization / Monetization Integration | AI-12370 |
| 3 — AI Hub Integration | AI-12371 |
| 4 — Consent Service Integration | AI-12372 |
| 5 — TAIS Production Deployment: Infrastructure & Operations | AI-12373 |
| 6 — Postgres → RDS Migration Completion | AI-12374 |
| 7 — [Flagged] Split AgentScore Monorepo into Per-Service Repos | AI-12375 |
| 8 — Internal Beta Rollout & Feedback | AI-12376 |

Stories: AI-12377–AI-12414 (38 total), linked as children of their epics via `parent`. Issue link created: AI-12373 is blocked by AI-12374 (infra deployment gated by RDS migration).

Terminology note: transcript said "TICE" throughout; this is a known transcription error for **TAIS**. Speaker names normalized to **Lior**, **Sohil**, **Andrew** (see AgentScore team memory).

## Context

Matt is pushing for AgentScore production delivery, which means deployment into TAIS (backend + frontend), replacing the current hashed-password DB auth with the existing Okta identity provider tied to the customer's Tosca Cloud tenant (Keycloak ruled out — not production-ready). Work splits into two parallel tracks:

- **Product/core track (Lior)** — identity (Okta/Tosca Cloud SSO), commercialization/monetization service, AI Hub integration, consent service. Lior owns this because of prior experience (Relic service); not delegable to Sohil yet.
- **Operational/infra track (Sohil)** — finish the Postgres→RDS migration, then move the current AWS-sandbox stack (2 front ends, 3 back-end services) into TAIS: Helm charts, ArgoCD, ECR image publishing, S3/CloudFront for the front ends, Ocelot API gateway route exposure. Sohil is new to TAIS conventions and needs an onboarding session from Dor and/or Ulrich.

A hard architectural conflict was flagged and deferred: AgentScore's services live in a single monorepo, but TAIS standard is one repo per microservice. Not blocking the initial deployment, but needs a follow-up decision.

Separately and in parallel: the current AWS-sandbox deployment is being rolled out to internal users this week to collect feedback — that track continues regardless of TAIS migration progress.

---

## Epic 1 — Identity: Replace DB Password Auth with Okta (Tosca Cloud SSO)
**Owner:** Lior · **Blocking dependency for TAIS production deployment**

Preserve the existing Tosca Cloud tenant → Okta → token flow (same pattern already used by the Relic service).

- Design tenant-entry flow (tenant name/URL) → Okta redirect for AgentScore front end
- Implement Okta OIDC token exchange in AgentScore front end
- Validate TAIS-issued Okta tokens in AgentScore back-end services via TAIS API gateway
- Retire hashed-password DB auth path
- Route AgentScore back-end services through TAIS API gateway with Okta token validation
- E2E test: tenant login → Okta → token → authenticated API calls
- Update onboarding docs (password login → Okta login)

## Epic 2 — Commercialization / Monetization Integration
**Owner:** Lior

- Integrate with TAIS usage/metering service (token- or output-based reporting)
- Implement credit balance check/deduction against provisioned AI credits (Salesforce → TAIS licensing)
- Handle insufficient-credit states in UI/API
- Validate margin calc matches TAIS commercialization contract
- E2E test: license provisioned → usage reported → credits deducted correctly

## Epic 3 — AI Hub Integration
**Owner:** Lior

Current eval library is already built to plug into AI Hub — this is mostly verification/wiring, not net-new work.

- Audit current LLM call paths; confirm what already routes through AI Hub
- Wire remaining calls through AI Hub (reference Relic service's Python implementation)
- Verify bring-your-own-LLM routing
- Verify SAP AI routing (Solex customers)
- Regression-test scoring pipeline against AI Hub-routed calls

## Epic 4 — Consent Service Integration
**Owner:** Lior

- Integrate front end with TAIS consent service (scroll-to-bottom terms + accept)
- Block AI feature usage until consent captured
- Verify consent persistence for compliance/audit evidence
- QA consent gate for new and existing users

## Epic 5 — TAIS Production Deployment: Infrastructure & Operations
**Owner:** Sohil (onboarded by Dor/Ulrich) · **Depends on Epic 6**

Moves the current AWS-sandbox stack (2 front ends, 3 back-end services) into TAIS.

- Schedule onboarding session(s) with Dor/Ulrich on Helm/Ocelot/ArgoCD conventions
- Build/adapt Helm charts for the 5 services
- Set up CI/CD pipeline to publish images to TAIS ECR
- Deploy front-end static assets to S3 + CloudFront
- Configure Ocelot API gateway routes to externally expose back-end services
- Verify ArgoCD auto-deploys on image/chart changes
- Expose under the AgentScore TAIS subdomain; verify external routing E2E
- Set up observability per TAIS SRE conventions

## Epic 6 — Postgres → RDS Migration Completion
**Owner:** Sohil · **Gates Epic 5**

- Close remaining RDS migration checklist items
- Validate S3 + RDS fully functional (Langfuse fully removed, per Aug 24 update)
- Sign off as complete/unblocking

## Epic 7 — [Flagged] Split AgentScore Monorepo into Per-Service Repos
**Owner:** Lior · deferred — not blocking initial deployment, but flagged as a hard architectural conflict with TAIS standards

- Document current monorepo structure and shared-code dependencies
- Follow-up architecture discussion: repo-split approach (published packages vs. submodules)
- Plan/execute migration once approach is agreed

## Epic 8 — Internal Beta Rollout & Feedback
**Owner:** Andrew · runs in parallel, not blocked by TAIS migration work

- Roll out current AgentScore build to internal users (this week)
- Collect and triage internal feedback
- Feed prioritized feedback into backlog ahead of GA/beta release

---

## Open questions / follow-ups from the meeting
- Monorepo vs. per-service repo split — follow-up discussion scheduled for the next day.
- No internal user feedback exists yet on the current AWS deployment; rollout was "planned this week" as of 2026-08-25.
