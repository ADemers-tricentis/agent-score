# Setting Up Your Tenant and Connecting Agents — Customer Guide (DRAFT)

**Status: draft, not yet reconciled with the published `ConnectYourAgent.tsx`
page or verified against production UI.** This describes what the
`agent-score` backend code actually supports today. Before this replaces or
merges into the live "Connect your agent" doc page, someone needs to confirm
with engineering whether the self-serve tenant endpoint below is actually
exposed to customers yet, or only exists as a backend API ahead of any UI —
see the flag at the end. Treat this as source material, not a page to
publish as-is.

## What's a tenant?

Your tenant is your workspace in Agent Score — every agent you connect,
every score, every ingest key lives under it. You'll never need more than
one unless you're deliberately separating environments (e.g. staging vs.
production).

## Getting a tenant

**If you're an external customer:** tenant creation is self-serve and
instant — there's no approval queue. Creating one requires being logged in;
give it a display name and it's ready immediately (the backend derives a
unique internal name from what you enter).

**If your agent runs in AI Workspace, or is a Tricentis-internal agent
(e.g. the Quality Agent):** you don't do this at all. These are "internal"
tenants and agents by definition — they're never created by a customer, and
they're provisioned automatically from telemetry the first time that
agent's traces are seen. There's nothing to request or configure on your
end for this category.

## Getting an ingest key

Traces authenticate with an **ingest key** (`tk_...`), not a generic API
key. From your tenant, you can:
- Create a new key
- Rotate a key (old one stops working immediately, no grace period)
- Revoke a key

Keys show their plaintext value once, at creation or rotation — copy it then,
because it isn't shown again. You can hold up to 20 active keys per tenant.

## Connecting agents

### External agents (yours, or any third party's)

Point your OTel exporter at the ingest endpoint with your key as a bearer
token:

```
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=<ingest endpoint>/external/otel/v1/traces
OTEL_EXPORTER_OTLP_TRACES_HEADERS=Authorization=Bearer <your tk_... key>
```

Use the `_TRACES_`-suffixed variables specifically — the unsuffixed
`OTEL_EXPORTER_OTLP_ENDPOINT` form gets `/v1/traces` appended automatically
by most exporters, and since the endpoint above already ends in
`/v1/traces`, using the unsuffixed variable would append that path twice.

There's no separate registration step for the agent itself. Agent Score
reads each trace's toolset, model, and call patterns and works out on its
own whether it's a returning agent or a new one — a returning agent keeps
one identity even if its behavior shifts slightly; a genuinely new toolset
gets a new agent record automatically.

### Internal agents (AI Workspace, Tricentis-built services)

Not something you set up as a customer — these authenticate through a
separate, internal-only mechanism (scoped service credentials Tricentis
configures, not an ingest key), and their tenant/agent records are
auto-provisioned from telemetry the same way. If you're a customer reading
this, this section doesn't apply to you; it's here only to explain why
you'll never see a "create internal tenant" option.

## What happens after you connect

Traces arrive, get matched to the right agent, and scoring begins
automatically once **20 traces** have landed for that agent — no
configuration required before that point. Send real or realistic traffic,
including ordinary failures and edge cases; scoring is only as honest as
what it's given.

---

## Flag for whoever reconciles this with the published docs

The currently live `ConnectYourAgent.tsx` page states tenant setup is
"set up by the Agent Score team on your behalf, not a self-serve signup
form." This draft says the opposite (self-serve, approval-free) based on a
real, working backend endpoint (`POST /customer/v1/tenants` —
see the companion internal runbook,
`agent-score/docs/tenant-and-agent-setup-runbook.md`, §2.B, for the exact
code reference). Before merging this draft in:

1. Confirm whether that self-serve endpoint is actually reachable from the
   customer-facing product UI today, or whether it's backend-only ahead of
   a UI that doesn't exist yet — if the latter, the *live* page describing
   Tricentis-team provisioning may currently be the accurate one from a
   customer's point of view, even though the code disagrees.
2. Reconcile the internal-agent ingestion story: the live page describes a
   BetterStack pull-based path; the runbook found a separate push-based
   `/internal/otel/v1/traces` endpoint in code. Both may be real for
   different services — worth a direct check with the ingestion team rather
   than assuming either doc is simply wrong.

This is exactly the kind of drift `agent-score-docs-sync` is built to catch
against a live production walkthrough — worth running that skill against
this specific page rather than trusting this draft's framing blind.
