# On-Prem Deployment Details — Accenture Beta

**Status as of:** 2026-09-23
**Purpose:** Consolidate everything discussed across engineering syncs, customer feedback sessions, and the External Interest tracker about deploying AgentScore on-prem for Accenture, and flag what's still unresolved before that deployment can happen.

---

## Context

Accenture is not the end customer — they're the delivery/SI partner scoping and running a beta **on behalf of Meta** (Sri's autonomous supply chain program). Meta's DMZ policy blocks anything outside it, cloud included, which is why on-prem was Meta's stated #1 requirement and dealbreaker in the initial 2026-08-11 session. Accenture picked up that requirement directly: per Jigish Belani's Labs submission (in progress since 2026-08-20, most advanced of five Accenture-affiliated submitters), Accenture needs an on-prem/private-AWS instance to run the evaluation. The 2026-09-11 POC-scoping call with the delivery partner is the same engagement.

Related coopetition note (not on-prem specific, but relevant to the relationship): Sri is separately tasking both HCL and Accenture — both Tricentis partners — to build a competing in-house framework. This was named on the 2026-08-11 call but never resolved with a partner-channel story.

**Sources:** [Meta Feedback Session](../feedback/feedback-sessions/Meta%20Feedback%20Session.md), [Meta POC Scoping Feedback Session](../feedback/feedback-sessions/Meta%20POC%20Scoping%20Feedback%20Session.md), [External Interest — Accenture entries](../feedback/External%20Interest.md), [Customer Feedback Log](../feedback/Customer%20Feedback%20Log.md), updates dated 2026-09-09, 09-10, 09-15, 09-16, 09-17, 09-22, 09-23.

---

## Deployment architecture

- **Confirmed feasible with engineering (2026-09-23):** self-hosted deployment in the customer's own AWS/EC2 is a go.
- **Delivery mechanism:** a docker-compose / Kubernetes manifest deployment package, so components (e.g. the Postgres database) can be updated while customer data persists (2026-09-22 sync).
- **Playbook:** Lior finished the deployment playbook for a new on-premise/AWS customer instance on 2026-09-17 — ready to run as soon as a go decision and AWS account/access land.
- **Who deploys it:** the plan (confirmed 2026-09-23) is for the Tricentis engineer to travel on-site to Accenture and run the deployment directly — based on prior experience this takes 1–2 days and avoids Israel/US time-zone back-and-forth. Accenture separately requested an embedded/deployed engineer, so this lines up with what they asked for.
- **Container hand-off:** Accenture prefers Tricentis push images to a registry they provide (or SFTP/repo, push-only, tag latest) rather than handing over the raw container (2026-09-22 sync).
- **AWS account:** Accenture will provide their own AWS account for the deployment. Tricentis will push images to a place (registry) on that account rather than hosting it themselves. This supersedes the earlier framing floated on 2026-09-16 (a separate AWS account under Tricentis's own control).

---

## Licensing & kill-switch (legal requirement)

Legal needs a way to cut off access after a beta window.

- **Options discussed (2026-09-22):**
  a. Encrypted license file with an expiry date.
  b. "Call-home" license server on Tricentis's side that can shut the deployment down on demand — was engineering's preferred approach at the time.
  c. Embedding the kill-switch inside the container — **rejected**, since Python is trivially reverse-engineered.
- **Decision:** moving forward with the license file. Still needs legal approval, then confirmation with Accenture.

---

## IP protection

- Matt Zimmerman's original position was "absolutely not" to handing over an uncontrolled container, citing IP-loss risk.
- Accenture's preferred path — push-only access to a registry they provide — is technically feasible and doesn't require handing over the raw image, but Andrew still needs to close this out with Matt.

---

## Legal & compliance gates

- **Beta agreement (click-through):** customer must accept terms; Tricentis needs proof they signed it. Since Accenture's deployment is on-prem (not visible to Tricentis's own back office by default), we need to ask Accenture whether we can have a send-home/API/whatever mechanism so their acceptance gets reported back to us — not yet asked.
- **No established precedent:** this has only been done in Tosca so far; AgentScore is building its own process.
- **Labs' "single gate":** Labs is reportedly working on one program-wide acceptance gate, but with no known timeline — AgentScore is proceeding with its own solution independently rather than waiting.
- **On-prem license file:** a separate, Accenture-on-prem-specific legal requirement (see licensing section above), distinct from the general click-through beta agreement.
- **Dependency / OSS license list:** an already-audited open-source/license list (originally prepared for Derek) is being reused for Accenture's legal review, pulled from `release.yaml` and `compose.yaml`. Engineering will flag any major dependency change or license change going forward (rare; a non-Apache-2.0/permissive package would be built in-house rather than adopted).
- **ProdSec evaluation:** the last gating item before production deploy. Matt's position is that once ProdSec's report on AgentScore comes back satisfactory, the team can push to prod.

---

## Timeline / status (as of 2026-09-23)

- Staging is fully resolved and running (the Tosca Cloud dependency that blocked customer access is fixed).
- Billing/AI-credits functionality is in active development, expected substantially done ~2026-09-24.
- A click-through session to work out beta-agreement mechanics was scheduled for 2026-09-24.
- The engineer who will run the on-site deployment is out for roughly the next two weeks (starting the week after 2026-09-23); the plan is for the PM to clear legal/ProdSec/Matt approvals during that window so on-site deployment can start immediately once he's back.
- Once approvals land, the expectation is AgentScore ships to Accenture "fairly soon" (2026-09-22 framing).

---

## Open questions

1. **Send-home mechanism for proof of acceptance** — need to ask Accenture whether we can have a send-home/API/whatever mechanism so we get proof back that they signed the beta click-through. Not yet asked.
2. **License-file legal sign-off** — the license file approach needs legal approval, then confirmation with Accenture. Not yet closed.
3. **ProdSec evaluation outcome** — report hadn't come back as of 2026-09-23; production push is gated on a satisfactory result.
4. **Accenture's own environment details** — target agents to evaluate and deployment preferences are expected to come out of a scoping meeting with Accenture that, as of 2026-09-23, hadn't been scheduled yet (blocked on the legal/ProdSec approvals above).
5. **Where to deploy the container/compose file to** — we need to know the actual target for the on-prem deployment (which host/environment/path within Accenture's AWS account the docker-compose/Kubernetes manifest package should be deployed to). Not yet specified.
6. **Does this general plan work for Accenture?** Not having the license file or beta agreement will complicate things a lot.
7. **Can login stay cloud-based?** — can authentication for the on-prem instance be done against Tricentis's cloud identity service instead of running fully self-contained on Accenture's side? If not, this needs its own approval (separate from the on-prem/container approach approvals already in flight).
