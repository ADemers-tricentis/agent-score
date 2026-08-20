# Roadmap - AgentScore (Annotated Draft)

**Base document:** [Roadmap - AgentScore](https://tricentis.atlassian.net/wiki/spaces/~71202081f3d00466214c728a250abf55f9bcf3/pages/3489661020) (Confluence, v11, last updated 6/30/2026)
**This draft:** adds a "why" to every item that didn't already carry one, and audits the roadmap against the [PRD](https://tricentis.atlassian.net/wiki/spaces/~71202081f3d00466214c728a250abf55f9bcf3/pages/3466952809) (v21) and the current state of [Tricentis-AI/agent-score](https://github.com/Tricentis-AI/agent-score) to find what's missing.
**Status:** draft for your review - nothing has been pushed to Confluence.

---

## Audit Findings (new, 2026-07-20)

### A. PRD requirements not tracked anywhere in the current roadmap

The Roadmap's gap table covers most MVP requirements, but these fell through:

- **REQ-065/066/067/068** (Agent Overview page, tab bar, agent header, "keep sending traces" banner). Not listed as built or as a gap. This is frontend-shell work - and it looks like it's actually been happening, just in a different repo (`ADemers-tricentis/agent-score`, not `Tricentis-AI/agent-score`), which this backend-focused roadmap doesn't cross-reference. Worth confirming whether that prototype work is meant to land in the canonical repo, and reconciling status either way.
- **REQ-069/070/071** ("Describe agent" - the plain-language profile-matching and diff-against-current-profile flow). This is a real feature, not a small one, and it's absent from both the built table and the gap table. Given the amount of design detail the PRD puts into it (two input modes, confidence scoring, diff view), it needs an explicit status.
- **REQ-072** (plain-language dimension labels with eval-slug tooltips). Minor, but unaddressed.
- **REQ-046/047/048/050** (Agent Settings: Archive/Remove danger zone, provenance display, Langfuse provisioning status, Ship/Hold/Reject decision log). None of these appear in the gap table, even though REQ-051 (export sessions as calibration cases) - which lives in the same part of the PRD - is flagged. Worth checking whether Settings tab work stopped partway through this requirement cluster.
- **REQ-029/031/032** (profile sharing across agents of the same type, profile-adoption activity feed, profile card display of thresholds/eval counts). Adjacent to "Eval catalog with versioned profiles: Complete" in the built table, but not verified individually - the built table might be over-crediting this area.

**Why this matters:** every one of these is a PRD requirement someone will eventually ask about. Right now the roadmap would answer "not sure" for all of them, which is a worse answer than "not started."

### B. Signals from the repo/Jira not reflected in this doc

- **Two open PRs are stale.** [#17 - Snyk SCA/SAST](https://github.com/Tricentis-AI/agent-score/pull/17) (open since 7/7) is the actual fix for the "standard CI/CD pipeline templates" security must-have below - but the roadmap's security checklist doesn't point to it, so there's no way to tell from this doc that the fix already exists and just needs merging. [#18 - session trace retrieval spec](https://github.com/Tricentis-AI/agent-score/pull/18) (open since 7/8) is in the same state.
- **The TAIS migration and the TICE migration are two different efforts living in two different docs.** This roadmap's "Later" section mentions TICE migration (moving the *validated* pipeline once AWS is proven out). The separate [Path to Beta Release](https://tricentis.atlassian.net/wiki/spaces/~71202081f3d00466214c728a250abf55f9bcf3/pages/3545039027) doc tracks a *TAIS* migration (Helm charts, API Gateway registration, deploy workflows, Backoffice frontend - [AI-10604](https://tricentis.atlassian.net/browse/AI-10604) through [AI-10607](https://tricentis.atlassian.net/browse/AI-10607)) with none of those four tickets assigned yet. These are easy to conflate and probably shouldn't be tracked in two separate places.
- **The ingestion-capacity target has passed with no update.** Open Question #8 below gives a target of 2026-07-04 for the span-filtering fix. This doc is dated 6/30 and hasn't been revisited since - the target is now 16 days overdue as of today, with no note on whether it's resolved, slipped, or still blocking.

**Why this matters:** a roadmap that doesn't reflect in-flight fixes or blown deadlines will get worse, not better, the longer it goes un-updated.

### C. A mechanics gap, not a content gap

Almost nothing in this doc links to a Jira ticket or names an owner beyond "Lior" / "the research team" at the section level. The Path to Beta doc, by contrast, links every line item to a ticket. Without that here, checking progress means re-reading the codebase every time - which is how B above happened.

---

## What's Already Built

| Area | Status | Why it matters |
| --- | --- | --- |
| OTel ingest (write-once buffer, Langfuse forward) | Complete | Sole ingestion path in Phase 1 (REQ-017) - everything downstream depends on it. |
| Tenant + Agent provisioning saga | Complete | Backs the identity model (REQ-044/045/067) and is the thing the agent-hierarchy open question (#9) will restructure. |
| Scoring pipeline (runner, judge, aggregate, attribution) | Complete | This is the core loop the whole product exists to run (REQ-001/003/033-036/049). |
| Eval catalog with versioned profiles | Complete | Profiles are the unit practitioners configure and share (REQ-028) - see Audit A for what's unverified underneath this. |
| Back-office admin UI (full operator portal) | Complete | Currently the *only* usable UI - see Open Question #1. It's standing in for the missing customer UI, not complementing it. |
| Labeling / calibration flow | Complete | Substrate the Research Team's human-in-the-loop methodology and judge-validation work (below) both build on. |
| Audit log + tenant isolation (CI-asserted) | Complete | Security must-have - keeps tenant data separated before any external customer data can flow through. |
| AWS deploy (ECS Fargate + release pipeline) | Complete | Current home while the TAIS/TICE migration decision plays out (see Audit B). |

---

## Gaps by PRD Requirement

### Critical for Phase 1 ("internal only - now")

| REQ | Description | Status | Why it matters |
| --- | --- | --- | --- |
| REQ-042 | Multi-step onboarding wizard | Not started | The entry point for every new user - without it, nobody can get an agent scoring without hand-holding (Open Q1). |
| REQ-037/038/039 | Runtime Guard - endpoint, 4 signals, 3 rules | Not started - no guard endpoint exists | Listed as an MVP requirement but is a missing subsystem, not a missing panel (Open Q2). Also the thing that forces FAIL verdicts on critical signals (REQ-014). |
| REQ-040/041 | Guard log UI + safety override surfacing | Not started | Without it, guard decisions are invisible - a verdict silently forced to FAIL looks identical to one that failed on quality. |
| REQ-023/024 | Measurement recommendation after 20 shadow sessions + human gate | Not started | The feature that makes AgentScore self-seeding instead of a blank-page tool (Open Q4). Every downstream eval-design item depends on this spec existing. |
| REQ-054/055/056/057/058 | Home dashboard | Not started - customer FE is a skeleton | The only cross-agent view a Team Lead has; without it there's no way to answer "how are my agents doing" without opening each one. |
| REQ-061 | Client Read API | All routes return 501 | Blocks AIWS integration and is the most direct unblocker for the customer dashboard, SDKs, and comparison view (Open Q6). |
| REQ-006/007 | 20-session minimum + Preliminary label | Needs verification | Below 20 sessions, variance is too high for a meaningful grade (PRD C2/C3) - shipping a score without this risks trust in a number built on 3 traces. |
| REQ-002 | A-F grade assignment | Scoring pipeline exists; not confirmed end-to-end | The single interpretable signal the whole PRD is built around (O1) - if grading isn't verified, every downstream verdict is unverified too. |
| REQ-011 | Verdict bands (Ship/Review/Block) | Needs verification | Connects the score to the actual ship/hold decision (O5) - wrong thresholds mean wrong calls, and recalibrating trust after that is expensive. |
| REQ-008 | Pass^k reliability metric | Not implemented | A reliability signal distinct from mean score - matters most for correctness-critical ATA agents where flakiness itself is the defect. |
| REQ-010 | Confidence interval on composite score | Not implemented | Pairs with the 20-session minimum - without it, a score built on 21 sessions looks as certain as one built on 200. |
| REQ-005 | Efficiency delta vs. prior run | Not confirmed | Half of "detect regressions before they reach production" (O2) - without a delta, a cost regression is invisible until someone manually compares runs. |
| REQ-020/021 | Per-agent trace sampling, 100% on errors | Not confirmed | The cost lever for scaling ingestion once the volume blocker (Open Q8) clears; the always-100%-on-error rule is what keeps Attribution fed on the sessions that matter. |
| REQ-030 | Auto re-evaluate on profile update | Not implemented | Without it, trend data silently stops being comparable the moment a profile changes (Open Q5) - and the fan-out itself needs a queue design first. |
| REQ-052/053 | Run comparison + significance indicator | Not confirmed | The concrete "did the change help" workflow (Scenario 3, Aisha) - without a significance indicator, practitioners can't tell signal from noise. |
| REQ-059 | Python + TypeScript SDKs | Not started | Correctly sequenced behind API stability (Open Q3) - there's nothing to wrap in an SDK while the Read API returns 501. |
| REQ-060 | MCP server | Not started | Same dependency as above - API stability first. |
| REQ-025/026/027 | Eval design modes, scenario taxonomy, question bank | Not implemented - research dependency | Each gates the next: taxonomy must stabilize before the question bank starts, and both feed the measurement-recommendation algorithm (REQ-023). |
| REQ-051 | Export sessions as calibration cases | Not implemented | Closes the loop between "a session failed" and "that failure becomes future ground truth" - without it every failure is reviewed once and never feeds calibration. |

### Newly surfaced gaps (see Audit A)

| REQ | Description | Status | Why it matters |
| --- | --- | --- | --- |
| REQ-065/066/067/068 | Agent Overview page, tab bar, agent header, trace-count banner | Untracked here - may exist in the frontend prototype repo | Reconcile before assuming this is either done or not started. |
| REQ-069/070/071 | "Describe agent" - plain-language profile matching + diff view | Untracked | Sizable feature with no status; needs one. |
| REQ-072 | Plain-language dimension labels with tooltips | Untracked | Small, but unaddressed. |
| REQ-046/047/048/050 | Agent Settings: danger zone, provenance, Langfuse status, decision log | Untracked | Same part of the PRD as REQ-051, which *is* tracked - check whether Settings work stalled here. |
| REQ-029/031/032 | Profile sharing, adoption feed, profile card display | Untracked, adjacent to a "Complete" row above | The built table may be over-crediting this area. |

### Phase 2 (correctly deferred)

REQ-062 (CI/CD connectors), REQ-063 (Tosca/qTest integrations), REQ-064 (OTLP metrics view) - not implemented, appropriate.

---

## Team Roadmaps

### Lior - Backend + Portal

#### Immediate (unblocked now)

1. **Re-engineer the ingestion pipeline for real trace volume.**
   *Why:* current pipeline can't absorb observed staging volume (~1,270 spans/sec vs. ~5/sec target); this gates all downstream ingestion and scoring, including Gershon's already-routed traces. *(See Audit B - target date has passed with no status update.)*
2. **Wire the Client Read API.**
   *Why:* routes exist and return 501; this is the most direct unblocker for the customer-facing dashboard, SDKs, and comparison view.
3. **A-F grading + verdict bands.**
   *Why:* verify Ship/Review/Block thresholds and the 20-session gate are wired end-to-end - this is the number practitioners will act on; get it wrong once and recalibrating trust is harder than getting it right.
4. **Pass^k metric.**
   *Why:* adds a reliability signal the composite score alone can't express.
5. **Efficiency delta.**
   *Why:* makes cost regressions visible without a manual side-by-side.
6. **Confidence interval.**
   *Why:* keeps early, low-session scores from looking as certain as mature ones.

#### Near-term (after Read API is live)

1. **Adopt the tenant > agent family > agent instance hierarchy.**
   *Why:* the flat structure is hard to extend; this enables per-family profiles and cleaner UI slicing. Locking it before the vendor-naming research (Andrew, this week) answers whether a family has multiple distinct instances per tenant risks a painful migration.
2. **Onboarding wizard (REQ-042).**
   *Why:* the entry point for every new user - see Open Q1.
3. **Runtime Guard.**
   *Why:* MVP requirement with no implementation today - see Open Q2.
4. **Guard Log UI.**
   *Why:* without it, guard decisions are a black box even once the guard itself exists.
5. **Safety override visual surfacing.**
   *Why:* practitioners need an at-a-glance signal that a safety issue - not a quality issue - is behind a bad verdict.
6. **Per-agent trace sampling.**
   *Why:* cost control lever for scaling ingestion once the volume blocker clears.
7. **Auto re-evaluate on profile update.**
   *Why:* keeps trend data comparable across profile versions - see Open Q5 on the fan-out design this needs first.
8. **Run comparison view.**
   *Why:* the concrete workflow a Team Lead uses to decide whether a change helped (Scenario 3).
9. **Export sessions as calibration cases.**
   *Why:* closes the failure-to-ground-truth loop.

#### Later (before Phase 2)

1. **Python SDK.**
   *Why:* external-developer surface; correctly sequenced after the Read API is stable (Open Q3).
2. **TypeScript SDK.**
   *Why:* same dependency.
3. **MCP server.**
   *Why:* depends on API stability first.
4. **TICE migration.**
   *Why:* validate the pipeline in AWS end-to-end first, then migrate, to avoid heavy lifting on an unproven system. Non-blocking and parallel until then; gated on the SSO/auth decision (Open Q10). *(See Audit B - don't conflate this with the separate TAIS migration tracked in the Path to Beta doc.)*

### Research Team

*The items below already state their own rationale inline (each includes a "Method," "decision," and consequence) - no changes made here beyond the note that Audit A/B items above aren't yet reflected in this section either.*

Immediate: measurement-recommendation algorithm (REQ-023), Guided/Expert eval design modes (REQ-025), calibration scenario taxonomy (REQ-026), question bank (REQ-027).

Near-term: PRD weight validation, Pass^k parameter validation, statistical significance thresholds (REQ-053), guard signal definitions (REQ-038), 3-dimension model validation on real Tricentis agents.

New workstream - methodology validation: human-in-the-loop labeling methodology, LLM judge validation against human reviewers, trajectory-level scoring method, ground-truth-free scoring for open-ended outputs, construct-validity check on the composite score, agent failure-mode taxonomy.

*(Full detail for each item is unchanged from the source roadmap - see the linked Confluence page.)*

---

## Security Requirements - Pre-TAIS Integration

Security review completed 6/29/2026. All must-haves below must be resolved before TAIS integration proceeds.

### Must-Haves Before TAIS Integration

- [ ] **SSO via Microsoft OAuth for the back-office.**
  *Why:* staff auth via custom email/password is a weaker control than SSO, and TAIS Backoffice already has Microsoft OAuth wired - the fix is cheap relative to the risk it removes.
- [ ] **HMAC enforcement on AIWS ingest - always on.**
  *Why:* a code path that disables verification at startup on environment-signal failure is a live bypass waiting for a misconfiguration, not a hardening nice-to-have.
- [ ] **Remove pg-sync-to-laptop.yml.**
  *Why:* this currently lets anyone with repo access download a full production DB dump as a GitHub Actions artifact - an active data-exfiltration path, not a theoretical one.
- [ ] **Fernet key rotation - documented procedure + migration script.**
  *Why:* the same key covers both agent credentials and judge API keys; with no rotation plan, one leaked key compromises both indefinitely.
- [ ] **Restrict Langfuse to internal CIDRs.**
  *Why:* currently exposed to the open internet over plain HTTP while the application database already carries this restriction - an inconsistent boundary on the service holding raw trace data.

### TAIS Infrastructure Alignment

- [ ] **Route traffic through the TAIS API Gateway.**
  *Why:* the current custom ingest gateway has no WAF, rate limiting, or auth controls - ingestion is the least-protected surface in the system today.
- [ ] **Use shared Terraform modules.**
  *Why:* custom IaC is where encryption, segmentation, and security-group controls typically get missed; the shared module removes that as a source of human error.
- [ ] **Use standard CI/CD pipeline templates (Snyk SCA/SAST + secret scanning).**
  *Why:* this is the literal fix behind PR #17 / AI-9786, open and unmerged since 7/7 - without it the repo is non-compliant with org policy today, not just at some future TAIS integration point.
- [ ] **IAM roles for AWS service access (Bedrock).**
  *Why:* AWS access keys currently live in the database; a stored long-lived credential is a bigger blast radius than a scoped ECS task role.

### Recommendations (Non-Blocking for Internal)

- [ ] **Consider the existing TAIS OpenTelemetry collector instead of a custom one.**
  *Why:* a custom collector duplicates a component that's already vetted for compliance - one less thing to security-review independently.

---

## Open Questions and Concerns

*(Unchanged from the source roadmap - each question already states the concern and its consequence, which functions as the "why." Numbers below match the source doc for cross-reference.)*

1. The Domain Practitioner has no UI today.
2. The guard system is entirely absent.
3. SDK + MCP (REQ-059/060) feel misplaced in Phase 1.
4. The measurement recommendation workflow is undefined.
5. Profile fan-out on update needs a queue strategy.
6. AIWS Read API is returning 501 - blocking AIWS integration.
7. Default ATA weights need validation before first scores go live.
8. Ingestion pipeline capacity is the current critical blocker. **Target was 2026-07-04 - now overdue; needs a status update (see Audit B).**
9. Agent hierarchy is not yet locked.
10. SSO / auth for the TICE environment is unresolved.
11. Per-family scoring formulas may diverge.

*(Full text for each - unchanged from the source roadmap.)*
