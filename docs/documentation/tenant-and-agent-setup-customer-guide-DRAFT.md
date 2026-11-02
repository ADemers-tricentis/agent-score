# Setting Up Your Tenant and Connecting Agents — Customer Guide (DRAFT)

**Status: draft.** The published Quick start and Connect your agent page now
say signing in with a Tosca Cloud account creates the workspace. No one on
the Agent Score team sets it up. The rest of this file is still source
material, not a page to publish as-is.

## What's a tenant?

Your tenant is your workspace in Agent Score — every agent you connect,
every score, every ingest key lives under it. You'll never need more than
one unless you're deliberately separating environments (e.g. staging vs.
production).

## Getting a tenant

**If you're an external customer:** sign in with your Tosca Cloud account.
That creates your workspace. No one on the Agent Score team has to set it up.

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

The published Quick start and Connect your agent page now say signing in
with a Tosca Cloud account creates the workspace. No one on the Agent Score
team sets it up. The older "team provisions it on your behalf" line is gone.

The internal-agent ingestion story is still open: the live page describes a
BetterStack pull-based path; the runbook found a separate push-based
`/internal/otel/v1/traces` endpoint in code. Both may be real for different
services.
