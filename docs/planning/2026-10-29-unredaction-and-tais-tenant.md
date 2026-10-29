# Unredaction, then the tais tenant

Date: 2026-10-29
Tickets: [AI-15552](https://tricentis.atlassian.net/browse/AI-15552), [AI-15712](https://tricentis.atlassian.net/browse/AI-15712)
Status: Both pull requests are merged. Jira marks both Production. The database wipe is still open.

Times are US Central. Sources: GitHub, the two Jira tickets read on 2026-10-29, the Oct 27–28 sync notes, and Slack threads with Tim Danner from Oct 16 to Oct 28 (#agent-score-internal, #operations-tais, and DMs). Jira's development panels were cached (`isStale: true`), so the production timestamps are the panel's last cache, not a live cluster check.

Unredacted spans stay inside Tricentis only if internal agents do not land in a customer tenant. Tenant routing stayed behind the collector change for that reason. Traces already written to origin tenants still have to come out. Lior owns the wipe, Saturday–Sunday, with the system back before Monday morning so demos can be prepped.

| | |
|---|---|
| AI-15552 unredaction | In prod. Jira status still In Review. |
| AI-15712 tenant map | In prod. Jira status still To Do. |
| Database wipe | This weekend (Oct 31 – Nov 1). |
| Assignee | Tim Danner, both tickets. |

## Steps

| When | Step | What had to be true |
|---|---|---|
| Oct 16, 8:56 AM | Pick where redaction happens | `autonomous-service` redacted model input, output, and tool info before the collector, so Agent Score had nothing to score. Tim proposed redacting at the collector on the Better Stack output only, and reverting the service-side redaction. Henry Fieglein said the long-term answer is an OTel pipeline with per-destination filters, middle to late Q1. Tim opened [tais-argocd #1728](https://github.com/Tricentis-Infrastructure/tais-argocd/pull/1728) and [autonomous-service #1205](https://github.com/Tricentis-AI/autonomous-service/pull/1205) as the interim fix. |
| Oct 16, 10:42 AM | Clear security review on #1728 | Coury Caldwell first flagged PII risk to Better Stack. Matthew Zimmerman explained the concern is customer data such as agent prompts, and that #1728 adds redaction at the collector. Coury approved. It deployed to dev and staging. |
| Oct 16, 3:03 PM | Capture the content | [hub-service #498](https://github.com/Tricentis-AI/hub-service/pull/498) (AI-15393) merged. LiteLLM can put `gen_ai.input.messages` and `gen_ai.output.messages` on the chat span when the capture flag and env vars are on. |
| Oct 19, 4:16 PM | Close the allowlist shortcut | Dor closed [tais-argocd #1772](https://github.com/Tricentis-Infrastructure/tais-argocd/pull/1772), which only added litellm to the old `agents_score` allowlist. AI-15552 was filed the same minute. |
| Oct 19, 5:08 PM | Open the collector policy | Tim opened [tais-argocd #1774](https://github.com/Tricentis-Infrastructure/tais-argocd/pull/1774). One ingest pipeline fans out to Better Stack, EvalClaw, and Agent Score. litellm joins the agent-service list so its spans reach Agent Score raw. |
| Oct 20, 10:54 AM | Gate ingest on the Terms of Service | Tim proposed dropping a tenant's traces at ingest until some user in that tenant accepts the ToS. Agent Score auto-creates tenants when traces arrive, so without a gate it ingests for tenants nobody has opened. |
| Oct 20, 12:20 PM | Split internal from customer agents | David Colwell and Andrew clarified scope in #agent-score-internal: only Tricentis traces from Tricentis-built agents need to arrive unredacted. Tim noted redacted traces carry only tokens, latency, and turn counts, which Agent Score cannot score. After a call with Andrew (1:03 PM), Tim restated it as three kinds of agent: internal (autonomous, quality), customer (AI WS), and external. AI WS scores are for the customer and stay in the customer tenant. Internal scores are for Tricentis and go to one Tricentis tenant. Tim wrote the plan into AI-15712. |
| Oct 22, 3:13 PM | Make `tais` callable in every region | Lan created `tais` shadow tenants in tosca-cloud for ap-southeast-1 and ap-southeast-2, matching eu-west-3. The real `tais` tenant lives in us-east-1. AI Hub calls as `tais` now work in those regions. |
| Oct 23, 10:47 AM | Re-review #1774 | A merge conflict needed another commit. Tim bumped the thread several times. Coury's later reply says Alind approved and it merged, but GitHub shows Amrit's approval on Oct 27 (see below). Coury asked to be DMed for US-hours reviews in future. |
| Oct 26, 3:24 PM | Unblock autonomous-service | Henry gave architecture sign-off on the redaction change that morning. [autonomous-service #1205](https://github.com/Tricentis-AI/autonomous-service/pull/1205) still needed Alex Tabisz's approval. It merged at 5:25 PM (AI-15395), so `autonomous-service` now sends unredacted spans to the collector. At 3:26 PM Tim told David and Andrew the other internal agents were sending traces, but to their customer tenants, and opened #854 to move them to `tais`. |
| Oct 26, 6:03 PM | Fix the service names | Andrew saw only one `quality-agent` trace in the past 24 hours (5:12 PM), and Tim traced it to the forwarding filter. Same PR: add `quality-agent-worker`, and match the gateway by `Tricentis.AI.API.Gateway.Service` instead of the Kubernetes name `api-gateway-service`. Those spans never arrive under the Kubernetes name. |
| Oct 26, 10:48 PM | Block the hard-coded tenant map | Lior rejected the first AI-15712 commit on [agent-score #854](https://github.com/Tricentis-AI/agent-score/pull/854). Two settings (`relic-service` keeps its tenant, everything else goes to `tais`) are not enough. The map has to be editable in the back office. The branch also had to come off [#853](https://github.com/Tricentis-AI/agent-score/pull/853). |
| Oct 27, 5:51 AM | Redact Better Stack for other services | [tais-argocd #1882](https://github.com/Tricentis-Infrastructure/tais-argocd/pull/1882) (AI-16041) merged. It redacts LLM payload keys from services that are off the agent list. |
| Oct 27, 11:16 AM | Merge unredaction | [#853](https://github.com/Tricentis-AI/agent-score/pull/853) merged. Five minutes later Amrit approved #1774 and it merged (11:21 AM). EvalClaw's four services stay on their own pipeline. Agent Score keeps an allowlist. |
| Oct 27, 1:45 PM | Wait on the collector deploy | Tim told Andrew all the unredaction PRs were approved and merged, and #1774 was in dev, waiting on staging and production. |
| Oct 27, 5:26 PM | Rewrite tenant routing as data | Tim replaced the two constants with route rules on `ingestion_controls`. Migration `0010` seeds `*` → fixed `tais` and `relic-service` → keep. A routed trace is never re-decided. Origin stays on `routed_trace_signatures.tenant_name`. |
| Oct 27, 5:58 PM | Catch the Better Stack gap | Alex checked dev after #1774. `apt-assistant-agent`, `tosca-agent`, and `Tricentis.AI.Hub.Service` write payload keys and were off the agent list, so Better Stack stored them raw. |
| Oct 28, 3:15 AM | Ship redaction with the collector change | [tais-argocd #1890](https://github.com/Tricentis-Infrastructure/tais-argocd/pull/1890) merged. Every span on `traces/betterstack` is redacted. It had to go out with #1774. The latest release before that was v1.39.5 on Oct 26, so staging and production had not picked up #1774 yet. |
| Oct 28, 7:10 AM | Unredaction marked in production | Jira's development panel on AI-15552 shows Production deployed. The Oct 28 sync, about 10:04 AM, treated unredaction as already deployed through production. |
| Oct 28, 8:02 AM | Merge the tenant map | Lior approved #854 at 7:36 AM once the type error on forwarded origins was fixed. Merged at 8:02 AM. Live proof in the PR was a local stack: `billing-service` landed under `tais` with its origin kept, `relic-service` with a claim stayed on that tenant, and `relic-service` with no claim was held. |
| Oct 28, 11:26 AM | Tenant mapping marked in production | Jira's development panel on AI-15712 shows Production deployed. The morning sync said the tenant change went well and that internal-agent data had stopped flowing into customer tenants. |
| Oct 28, 12:40 PM | Check who pays for scoring | Tim found AgentScore credit usage in OpenMeter, 100% under `tenant = tais`. In Power BI it shows as module "AgentScore" only with `IsInternal = 1`. Every scoring run for an internal agent, AI WS included, sends `X-Tenant-Name: tais` to AI Hub. Only external agents consume customer credits. Tim can browse OpenMeter but cannot create an API token. |
| Oct 28, 1:01 PM | Bill AI WS to the customer, then reverse | Tim offered to let the route rules set the billing tenant too, so AI WS scores bill the customer and ATA, ATC, and the rest bill `tais`. Andrew agreed (1:11 PM) and Tim filed AI-16210. Reviewing it at 2:18 PM, Tim flagged that this would start charging every AI WS user, not just tenants that chose to send traces. Andrew: only users signed up for AgentScore should use credits. |
| Oct 28, 3:07 PM | Define "signed up" | Andrew: a user in the tenant has logged in once and agreed to the terms. Tim asked whether there needs to be a way to un-sign-up. Andrew: probably, but it does not exist yet. |
| Oct 28, 3:32 PM | Route AI WS for tenants not signed up | Tim's options: (1) keep them in the origin tenant with no credits, as today, so history is waiting at signup; (2) drop them at ingest; (3) store them in `tais` and use them for validation like ATA and ATC. Andrew asked whether option 3 can switch to the customer tenant once they sign up. Tim: yes, for traces that arrive after that point. Andrew chose option 3. Tim saw no drawback and will flag anything that comes up during the plumbing. |
| Oct 31 – Nov 1 | Wipe the mis-filed traces | Still open. Internal agents minted before the rules exist once under the origin tenant and once under `tais`. The Oct 28 sync chose a full database wipe, back before Monday Nov 2 morning US time, so the two active customers never open the product onto an empty agent. If an environment is outside that wipe, `scripts/purge_internal_agents.py` on dev, then staging, then prod is the step in `docs/04-infra.md`. |
| After the wipe | Prove it on a real environment | A LiteLLM request shows the full prompt and response in Agent Score and stays redacted in Better Stack. `relic-service` stays on the customer tenant. Every other internal-pipe service lands in `tais`, with the origin visible under Ingestion → Internal. Customer tenants hold no internal-agent traces. |

## What unredaction shipped

[tais-argocd #1774](https://github.com/Tricentis-Infrastructure/tais-argocd/pull/1774), merged Oct 27, plus the Better Stack close in [#1890](https://github.com/Tricentis-Infrastructure/tais-argocd/pull/1890). There are no AI-15552 commits in the agent-score repo.

Agent Score receives this list raw: `autonomous-service`, `chatbot-agent-service`, `performance-agent`, `quality-agent`, `quality-agent-worker`, `litellm`, `relic-service`, and `Tricentis.AI.API.Gateway.Service`. EvalClaw stays on its own four services plus `quality-agent-worker`. Better Stack redacts every span on `traces/betterstack`.

## What the tenant map shipped

[agent-score #854](https://github.com/Tricentis-AI/agent-score/pull/854), merge `ed9aa95a8` on `main`, Oct 28 at 8:02 AM.

Ingest decides the tenant when it commits the trace. The seed is `*` → fixed `tais`, and `relic-service` → keep, so AI Workspace stays on the customer tenant. Operators edit rules under Ingestion → Internal → Routing. A missing `*` row defers every unrouted internal trace. The first trace into `tais` stamps `env` and `region`. Those values are first-trace stamps on an aggregate tenant.

[agent-score #871](https://github.com/Tricentis-AI/agent-score/pull/871) (AI-16210) is a later, closed pull request about billing an internal tenant's AI Hub work to the customer after signup. It is not part of this merge.

## What changes next for AI WS

The shipped seed keeps `relic-service` on the customer tenant for every tenant. The Oct 28 DM between Tim and Andrew changed that plan:

- A tenant counts as signed up once a user there has logged in and agreed to the terms.
- Until then, AI WS traces go to `tais`, are scored on `tais` credits, and serve as validation data like ATA and ATC.
- After signup, new AI WS traces route to the customer tenant and bill that tenant's credits. Earlier traces stay in `tais`, so the customer starts with no AI WS history.
- There is no way to un-sign-up yet.

This is not built. The route rules have no signup condition today, and billing still sends `X-Tenant-Name: tais` for every internal-pipe agent. Tim owns the plumbing.

On Oct 27 Tim also confirmed, for the legal opt-in questions, that AI Hub routes requests to the right provider and does accounting, with no extra retention of its own.

## Still to do before Monday, Nov 2

| Check | Owner | Why it is still open |
|---|---|---|
| Wipe dev, staging, and production, and restore before Monday morning | Lior | Internal-agent rows already sit in customer tenants. Those customers have not logged in. Waiting adds real customer data the wipe would destroy. |
| If any environment is outside that wipe, run `scripts/purge_internal_agents.py` there | Tim, per `docs/04-infra.md` in agent-score | Nothing backfills on deploy. Each internal agent otherwise exists under its origin tenant and again under `tais`. |
| LiteLLM prompt and response visible in Agent Score, redacted in Better Stack | Open on #1774 | The collector test plan checked this for a local otelcol run. It was not checked after the dev sync. |
| `relic-service` stays on the customer tenant; other internal services land in `tais` with origin shown | Open on #854 | The five-trace proof ran on a local stack. Production routing is the deploy mark plus the morning sync. |
| Route AI WS by signup status and bill signed-up tenants | Tim | Agreed Oct 28 (option 3 above). The `relic-service` → keep rule still sends unsigned tenants' AI WS traces to the customer tenant. |
| Move AI-15552 off In Review and AI-15712 off To Do | Board hygiene | The development panels already show merged pulls and a production deploy for both. AI-15552 shows three merged pulls. AI-15712 shows one. |
