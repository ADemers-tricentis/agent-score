# Tenant & Agent Setup — Internal Engineering Runbook

Audience: Tricentis engineers/operators. This documents the real, current
mechanism in `agent-score`, verified against live code — not the design
intent of the `agentscore-frontend` demo mock, which is aspirational (see
**Known drift** at the end).

## 1. What a tenant actually is

Model: `packages/common/src/agent_score_common/models/tenant.py:27-81`

`Tenant` table: `id` (ULID), `name`, `kind` (`'external'|'internal'` —
CheckConstraint line 31-33), `env`, `region`, `metadata` (JSONB),
`created_by_user_id` (nullable — NULL only for machine-discovered tenants),
`deleted_at`. Unique index on `(kind, lower(name))` where `deleted_at IS NULL`
(line 34-40).

`kind` is exactly the internal/external split used everywhere else in this
doc: `internal` = Tricentis-built agents (e.g. a "quality-agent") and AI
Workspace agents, never created by a customer; `external` = anything else —
a tenant whose agents send traces to an ingest endpoint.

There is **no customer-facing "provider" entity** in the backend. "Provider"
only ever means: (a) the LLM vendor behind Agent Score's own judge/scoring
calls — a superadmin-only global catalog (`model_prices`, `llm_inferences`;
`services/platform/src/agent_score_platform/api/admin/llm_prices.py:1-13`,
`.../admin/llm_inferences.py`), keyed on `(provider, model_id,
effective_from)`; or (b) `RuntimeAgentVersion.model_provider` for
Tricentis-internal AI Workspace runtime agents (`docs/01-architecture.md:945`,
`endpoints.py` refusing non-`bedrock` providers, `docs/01-architecture.md:867`).
Customers never choose or see a provider.

## 2. Creating a tenant — three real paths

### A. Admin/operator (superadmin-gated)

`POST /admin/tenants` —
`services/platform/src/agent_score_platform/api/admin/tenants.py:218-223`.
Body: `CreateTenantRequest{name, kind: "external"|"internal", env, region,
metadata}` (line 66-71). Calls `provision_tenant` (line 241). This is what
the now-removed frontend "Tenants" admin UI called — the endpoint is still
live, it just has no UI in front of it anymore.

### B. Customer self-serve (approval-free, but still an explicit action)

`POST /customer/v1/tenants` —
`services/platform/src/agent_score_platform/api/customer/tenant_provisioning.py:80-84`.
Requires an authenticated user (`CurrentUserDep`) but **no operator
approval** — line 86: "instantly, no approval gate." Always `kind="external"`.
Server derives a unique slug from `display_name` (`_slugify` + ULID suffix,
lines 70-72, 107).

Deliberately a **plain INSERT**, not the shared `provision_tenant` helper —
the docstring (lines 21-37) explains: the `request`-role DB session
(RLS-policed) can't take the `FOR UPDATE` lock `provision_tenant`'s
conflict-safe insert needs, and resolving to a same-name-collision tenant
would be a real bug, so the two paths are deliberately kept separate rather
than sharing code.

### C. Internal auto-mint (zero human involved)

`provision_tenant()` in
`packages/common/src/agent_score_common/provisioning/tenant.py:64-89`,
called with `created_by_user_id=None` from the internal-ingest forward path
(§4). Docstring line 77-80: "`created_by_user_id` is `None` for the
internal-ingest auto-mint caller… A machine-discovered tenant has no human
creator." Gated by `_can_auto_mint_tenant`
(`services/ingest/src/agent_score_ingest/assembly/internal_promote.py:186`).

**Summary:** tenant creation didn't disappear — external tenants require a
logged-in customer to explicitly create one (just with no approval wait
anymore); internal tenants auto-mint from telemetry with zero human step,
gated by rate limits and a name allow-list.

## 3. Agent registration — internal vs external are genuinely different code paths

### External (customer) agents — fingerprint-based auto-discovery

`services/ingest/src/agent_score_ingest/drain/registry.py:1-26` — a 4-step
cascade run by a background "drain" sweeper (not the ingest request itself):

1. `strong_id` exact match
2. exact `(prompt_sha256, toolset_hash)` match
3. `toolset_hash` block + Jaccard similarity ≥ `tau_high` → match
4. else **mint** a brand-new `Agent` via `provision_agent()` (line 340-347),
   name derived from trace content (`derive_agent_name`), rate-limited per
   tenant (`MintRateLimiter`, line 70-90), collision-guarded
   (`_disambiguate_name_collision`, line 385-461)

Zero customer action beyond having sent traces under their tenant key.

### Internal (Tricentis) agents — direct name-based mint, config-gated

`services/ingest/src/agent_score_ingest/assembly/internal_promote.py:20-23`
resolves the `kind='internal'` tenant, then resolves/mints the `Agent`
directly **by name** — no fingerprinting — gated by
`_can_auto_mint_tenant`/`_can_auto_mint_agent` (lines 186-192) and a
per-service rate limiter (line 328).

Identity comes from either:
- a statically configured `INGEST_INTERNAL_PRODUCERS` credential's
  `tenant_name`/`service_names`
  (`services/ingest/src/agent_score_ingest/config.py:20-38`, documented in
  `docs/internal-producer-auth.md`), or
- span-content tenant-identity keys when no scoped producer token is used
  (the loopback aggregator case).

Names like "quality-agent" aren't bootstrapped anywhere special — they're
just names an `INGEST_INTERNAL_PRODUCERS` entry authorizes
(`packages/common/src/agent_score_common/routing/rules.py:86`,
`router.py:146`).

## 4. Ingest endpoints

**External:** `POST /external/otel/v1/traces` —
`services/ingest/src/agent_score_ingest/endpoints/external.py:44-72,156-172`.
Auth: `Authorization: Bearer tk_<token>`, `sha256(token)` looked up in
`tenant_api_keys.tk_hash` (active-only) → resolves **tenant only**, never an
agent (`agent_resolver.py:133-136`: "No provisioning step exists on this
path"). Standard OTLP/protobuf, gzip supported.

**Internal:** `POST /internal/otel/v1/traces` —
`services/ingest/src/agent_score_ingest/endpoints/internal.py`. Auth is
either a scoped `InternalProducer` bearer token (env-configured, sha256
matched, scoped to one `tenant_name` + explicit `service_names` —
`internal_auth.py:17-39`), or the in-process loopback stream-aggregator
capability (`X-Ingest-Aggregator-Token`, generated at boot, never
distributed). No customer can reach this endpoint.

## 5. API keys

Model: `packages/common/src/agent_score_common/models/tenant_api_key.py:28-87`
— `tenant_id` FK, `tk_hash` (sha256), `tk_display` (masked, last 4 chars),
`disabled_at`, `rotated_at`, `created_by_user_id` (NOT NULL — every key has a
human creator).

Generation:
`packages/common/src/agent_score_common/crypto/tokens.py:11-20` —
`generate_tenant_key() = "tk_" + secrets.token_urlsafe(32)`, sha256 hashed.
Plaintext shown once, never stored.

Issuance:
- Customer self-serve: `POST /customer/v1/tenants/{tenant_id}/api-keys` —
  `.../api/customer/tenant_api_keys.py:269-274`, capped at 20 keys/tenant.
- Admin: `.../api/admin/tenant_api_keys.py:168-173`, uncapped, for account
  recovery.

Validation: `services/ingest/src/agent_score_ingest/agent_resolver.py:103-177`
— positive-only TTL cache (300s), SQL re-check on miss, instant invalidation
on disable/rotate via Postgres LISTEN/NOTIFY.

## 6. Step-by-step: stand up a local test tenant end-to-end

1. `make dev` — boots the local compose stack (Postgres, MinIO, certs;
   `Makefile:153`).
2. Provision DB rows only (no real traces):
   `uv run scripts/seed_demo/seed.py [agent-name]` —
   calls `provision_tenant(kind="external", ...)` then `provision_agent()`
   per a hardcoded roster (`scripts/seed_demo/seed.py:50-92`). Note its own
   docstring (lines 13-16): this seeder no longer sends real traces, it only
   provisions rows — "populate traces out-of-band."
3. For a true end-to-end test with real traces: mint a `tk_` key via the
   admin or customer API above, then `POST` OTLP to
   `/external/otel/v1/traces` with `Authorization: Bearer tk_<key>` — or
   point `clients/claude-code-otel-hook` at your local ingest URL (see
   **Known drift** below — that client's README is stale on auth).
4. For internal-path testing: configure an `INGEST_INTERNAL_PRODUCERS` entry
   (see `docs/internal-producer-auth.md`) and `POST` to
   `/internal/otel/v1/traces` with that producer's bearer token.

## 7. Known drift — flagged, not silently fixed

- **`clients/claude-code-otel-hook/README.md` is stale**: lines 13, 29, 36
  describe an `sk_...` "Agent-bound key… minted by Platform's admin API" and
  an "AIWS HMAC routing claim" auth scheme. No `sk_`-prefixed key issuance
  exists anywhere in `services/` or `packages/` — the real path for this
  client is the plain `tk_` bearer scheme in `endpoints/external.py`. Left
  behind from an older design (commit `58e7ea7f` updated adjacent
  Langfuse-forwarding language but not this).
- **The live customer docs page (`ConnectYourAgent.tsx` in
  `agent-score-marketing/docs-src`) says tenant setup is "set up by the Agent
  Score team on your behalf, not a self-serve signup form."** That contradicts
  §2.B above — a working, approval-free self-serve endpoint exists. Whichever
  is true in production (endpoint exists in code vs. exposed to customers)
  needs confirming with the team that owns customer docs before this doc's
  companion customer-facing guide is trusted as current.
- **`ConnectYourAgent.tsx` describes internal-agent ingestion via BetterStack
  pull** (Back Office App → Ingestion → Stream → Configuration → Services),
  not the `/internal/otel/v1/traces` push path with `InternalProducer` tokens
  found in code (§4). These may be two genuinely different, both-live
  mechanisms (BetterStack for legacy/other internal services, the push
  endpoint for newer ones) — not verified here since it's outside
  `agent-score`'s own code; flagging rather than guessing.
- **The `agentscore-frontend` demo mock's "tenant is auto-resolved via Tosca
  login, no create/picker flow"** (per `agentscore-frontend/DECISIONS.md`,
  2026-09-18 entry) is a **design target for a future beta**, explicitly
  requested to keep the initial beta minimal — it is not implemented backend
  behavior today. The real backend still requires an explicit (if
  approval-free) customer action to create a tenant.
- The demo mock also shows a fake, per-agent "LLM provider" form field
  (Provider/Model/API key/Endpoint URL) — this is UI-only fake state; no such
  customer-configurable entity exists in the real backend (see §1).
