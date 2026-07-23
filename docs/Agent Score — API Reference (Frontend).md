 

All routes are served by the **Platform Service**. The base URL in dev is `http://localhost:8000`.

  

Interactive docs (Swagger UI) are available at `/docs` when the service is running.

  

---

  

## Auth conventions

  

All API routes (except `POST /auth/login`) require a valid session. Auth is cookie-based — `POST /auth/login` sets an httponly `session` cookie that is sent automatically by the browser on subsequent requests.

  

**Access tiers:**

- `superadmin` — can call all routes

- `tenant member` — can call routes scoped to tenants they belong to

- `any user` — any authenticated user (no tenant membership required)

  

---

  

## Auth

  

| Method | Path | Auth | Description |

|--------|------|------|-------------|

| `POST` | `/auth/login` | public | Login with `{email, password}`. Sets session cookie. Returns `UserProfile`. |

| `POST` | `/auth/logout` | session | Clears session cookie and revokes the server-side session. |

| `GET` | `/auth/me` | any user | Returns the current `UserProfile` with tenant memberships. |

  

**`UserProfile` shape:**

```json

{

"user_id": "...",

"email": "...",

"is_superadmin": true,

"tenants": [{ "tenant_id": "...", "name": "..." }],

"created_at": "..."

}

```

  

---

  

## Health

  

| Method | Path | Auth | Description |

|--------|------|------|-------------|

| `GET` | `/health` | public | Service liveness. Returns `{ok, service, version, git_sha, built_at}`. |

  

---

  

## Users `/admin/users`

  

All user management routes require **superadmin**.

  

| Method | Path | Description |

|--------|------|-------------|

| `POST` | `/admin/users` | Create user. Body: `{email, password, is_superadmin, tenant_ids[]}`. |

| `GET` | `/admin/users` | List users. Query: `limit`, `offset`, `include_deleted`, `q` (email search). |

| `GET` | `/admin/users/{user_id}` | Get user by ID. |

| `PATCH` | `/admin/users/{user_id}` | Update user. Body: `{email?, is_superadmin?}`. |

| `DELETE` | `/admin/users/{user_id}` | Soft-delete user (also revokes sessions). |

| `POST` | `/admin/users/{user_id}/restore` | Restore a soft-deleted user. |

| `POST` | `/admin/users/{user_id}/password` | Admin password reset. Body: `{password}`. |

| `POST` | `/admin/users/{user_id}/sessions/revoke` | Revoke all active sessions. Returns `{revoked: N}`. |

| `POST` | `/admin/users/{user_id}/tenants/{tenant_id}` | Add tenant membership. |

| `DELETE` | `/admin/users/{user_id}/tenants/{tenant_id}` | Remove tenant membership. |

  

---

  

## Tenants `/admin/tenants`

  

All tenant management routes require **superadmin**.

  

| Method | Path | Description |

|--------|------|-------------|

| `POST` | `/admin/tenants` | Create tenant. Body: `{name, kind: "external"|"internal", env?, region?, metadata?}`. |

| `GET` | `/admin/tenants` | List tenants. Query: `limit`, `offset`, `include_deleted`, `q`. |

| `GET` | `/admin/tenants/{tenant_id}` | Get tenant by ID. |

| `PATCH` | `/admin/tenants/{tenant_id}` | Rename tenant. Body: `{name}`. |

| `DELETE` | `/admin/tenants/{tenant_id}` | Soft-delete tenant. |

| `POST` | `/admin/tenants/{tenant_id}/restore` | Restore a soft-deleted tenant. |

| `POST` | `/admin/tenants/{tenant_id}/purge` | Hard-delete. Tenant must be soft-deleted first. Deletes Langfuse org. |

  

**`TenantProfile` shape:**

```json

{

"tenant_id": "...",

"name": "...",

"langfuse_org_id": "...",

"kind": "external",

"env": null,

"region": null,

"metadata": null,

"created_by_user_id": "...",

"created_at": "...",

"updated_at": "...",

"deleted_at": null

}

```

  

---

  

## Tenant API Keys `/admin/tenants/{tenant_id}/api_keys`

  

Requires **superadmin**. Only available on `kind='external'` tenants. The `tk_` secret is returned only on create and rotate — never again.

  

| Method | Path | Description |

|--------|------|-------------|

| `POST` | `/admin/tenants/{tenant_id}/api_keys` | Create key. Body: `{name}`. Returns `{api_key, tk}` — save `tk` now. |

| `GET` | `/admin/tenants/{tenant_id}/api_keys` | List keys (no secrets). |

| `GET` | `/admin/tenants/{tenant_id}/api_keys/{api_key_id}` | Get key metadata. |

| `PATCH` | `/admin/tenants/{tenant_id}/api_keys/{api_key_id}` | Rename or enable/disable. Body: `{name?, disabled?}`. |

| `POST` | `/admin/tenants/{tenant_id}/api_keys/{api_key_id}/rotate` | Rotate secret. Returns `{api_key, tk}`. |

| `DELETE` | `/admin/tenants/{tenant_id}/api_keys/{api_key_id}` | Revoke (hard delete). |

  

---

  

## Agents `/admin/tenants/{tenant_id}/agents`

  

Requires **tenant member** or superadmin (all per-tenant routes). The flat search is **superadmin** only.

  

| Method | Path | Description |

|--------|------|-------------|

| `POST` | `/admin/tenants/{tenant_id}/agents` | Create agent. Body: `{name, kind, aiws_tenant_name?, aiws_env?}`. Returns `{agent}`. |

| `GET` | `/admin/tenants/{tenant_id}/agents` | List agents. Query: `limit`, `offset`, `include_deleted`, `q`, `kind`. |

| `GET` | `/admin/tenants/{tenant_id}/agents/{agent_id}` | Get agent by ID. |

| `DELETE` | `/admin/tenants/{tenant_id}/agents/{agent_id}` | Soft-delete agent. |

| `POST` | `/admin/tenants/{tenant_id}/agents/{agent_id}/restore` | Restore a soft-deleted agent. |

| `POST` | `/admin/tenants/{tenant_id}/agents/{agent_id}/purge` | Hard-delete (must be soft-deleted first). |

| `GET` | `/admin/agents` | **Superadmin.** Cross-tenant flat search. Query: `tenant_id?`, `kind?`, `q`, `include_deleted`, `limit`, `offset`. |

  

**`AgentProfile` shape:**

```json

{

"agent_id": "...",

"tenant_id": "...",

"name": "...",

"kind": "external",

"langfuse_project_id": "...",

"provisioning_status": "active",

"aiws_tenant_name": null,

"aiws_env": null,

"failure_reason": null,

"created_by_user_id": "...",

"created_at": "...",

"updated_at": "...",

"deleted_at": null

}

```

  

---

  

## Traces `/admin/tenants/{tenant_id}/agents/{agent_id}/traces`

  

Requires **tenant member** or superadmin. Reads from Langfuse — scoped to the agent's project.

  

| Method | Path | Description |

|--------|------|-------------|

| `GET` | `/admin/tenants/{tenant_id}/agents/{agent_id}/traces` | List traces. Query: `page` (0-indexed), `limit` (max 100), `from`, `to`, `search`, `search_mode` (`ids`\|`full_text`). |

| `GET` | `/admin/tenants/{tenant_id}/agents/{agent_id}/traces/{trace_id}` | Trace detail with observation tree and scores. Query: `timestamp` (required — ISO 8601, from list row). |

| `GET` | `/admin/tenants/{tenant_id}/agents/{agent_id}/traces/{trace_id}/observations/{observation_id}` | Single observation with full `input`/`output`. Query: `start_time` (required — ISO 8601, from trace detail). Lazy-load on span expand. |

  

---

  

## Scoring `/admin/tenants/{tenant_id}/agents/{agent_id}/scoring`

  

Requires **tenant member** or superadmin.

  

### Readiness

  

| Method | Path | Description |

|--------|------|-------------|

| `GET` | `.../scoring/readiness` | Returns `{captured, threshold, ready}`. |

  

### Benchmark (scoring profile configuration)

  

| Method | Path | Description |

|--------|------|-------------|

| `GET` | `.../scoring/benchmark` | Get the agent's current benchmark config + adopted profile. |

| `PUT` | `.../scoring/benchmark/profile` | Pin a profile version. Body: `{profile_version_id, judge_id?, sample_size_cap?, min_sample_for_verdict?}`. |

| `POST` | `.../scoring/benchmark/auto-fit` | Re-fit: adopt the best-matching active profile automatically. |

| `POST` | `.../scoring/benchmark/unpin` | Release pin back to auto/default. |

| `POST` | `.../scoring/benchmark/dismiss-drift` | Snooze the drift nudge for 7 days. 204 no body. |

  

### Agent shape

  

| Method | Path | Description |

|--------|------|-------------|

| `GET` | `.../scoring/agent-shape` | Derived 5-boolean shape + ranked profile candidates. |

  

### Scoring runs

  

| Method | Path | Description |

|--------|------|-------------|

| `POST` | `.../scoring/runs` | Trigger a run. Body: `{mode: "production"\|"sandbox", revision_label?, sample_size?}`. Returns `{run_id}`. 202 accepted. |

| `GET` | `.../scoring/runs` | List all runs for this agent. |

| `GET` | `.../scoring/runs/{run_id}` | Get a single run with full metrics. |

| `POST` | `.../scoring/runs/{run_id}/approve` | Approve a complete run as the new baseline. |

| `POST` | `.../scoring/runs/{run_id}/resume` | Resume a `failed` or `partial` run. Returns `{run_id}`. 202. |

| `GET` | `.../scoring/runs/{run_id}/metrics/{eval_slug}/interactions` | Drill-through: per-interaction scores for one eval in a run. |

  

### Trend + versions

  

| Method | Path | Description |

|--------|------|-------------|

| `GET` | `.../scoring/trend` | Composite or per-eval trend. Query: `window` (days, default 90), `limit` (default 100), `eval` (single slug), `evals` (comma-separated slugs). |

| `GET` | `.../scoring/versions` | Per-`revision_label` grade summary. |

  

### Labeling + goldens

  

| Method | Path | Description |

|--------|------|-------------|

| `GET` | `.../scoring/labeling/queue` | Candidate traces for human labeling. Query: `limit` (default 50). |

| `POST` | `.../scoring/labeling` | Submit a label decision. Body: `{trace_id, observation_id?, decision: "confirm"\|"override", verdict?, expected_output?, note?}`. |

| `GET` | `.../scoring/goldens` | List confirmed goldens for this agent. |

  

### Schedule

  

| Method | Path | Description |

|--------|------|-------------|

| `PUT` | `.../scoring/schedule` | Update cadence/lookback overrides. Body: `{refresh_cadence_minutes: int\|null, refresh_lookback_days: int\|null}`. 204 no body. |

  

### Scoring events (activity log)

  

| Method | Path | Description |

|--------|------|-------------|

| `GET` | `/admin/tenants/{tenant_id}/agents/{agent_id}/scoring-events` | Append-only audit log for this agent. Query: `type`, `actor`, `limit` (default 50), `offset`. |

  

---

  

## Revisions `/admin/tenants/{tenant_id}/agents/{agent_id}/revisions`

  

Requires **tenant member** or superadmin.

  

| Method | Path | Description |

|--------|------|-------------|

| `GET` | `.../revisions` | List revisions for this agent. |

| `POST` | `.../revisions` | Create a revision. Body: `{label}`. |

  

---

  

## Audit Log `/admin/tenants/{tenant_id}/audit-events`

  

Requires **tenant member** or superadmin. `actor_user_email` is populated only for superadmins.

  

| Method | Path | Description |

|--------|------|-------------|

| `GET` | `.../audit-events` | Paginated audit log. Query: `limit`, `offset`, `from`, `to`, `event_type[]`, `severity[]`, `q`. |

| `GET` | `.../audit-events/summary` | Ingest throughput rollup by status. Query: `from`, `to`. |

  

---

  

## Judges `/admin/judges`

  

| Method | Path | Auth | Description |

|--------|------|------|-------------|

| `GET` | `/admin/judges/selectable` | any user | Names-only list for profile selectors. No keys. |

| `GET` | `/admin/judges` | superadmin | Full judge catalog. Query: `include_deleted`, `q`. |

| `POST` | `/admin/judges` | superadmin | Create judge. API key encrypted at rest; returned as `key_hint` only. |

| `GET` | `/admin/judges/{judge_id}` | superadmin | Get judge. |

| `PUT` | `/admin/judges/{judge_id}` | superadmin | Update judge. Blank `api_key` keeps the stored key. |

| `DELETE` | `/admin/judges/{judge_id}` | superadmin | Soft-delete. Rejected if default or in-use by a benchmark. |

| `POST` | `/admin/judges/{judge_id}/restore` | superadmin | Restore soft-deleted judge. |

| `POST` | `/admin/judges/{judge_id}/default` | superadmin | Set as global default. |

| `POST` | `/admin/judges/models` | superadmin | Discover a provider's available models live. Body: `{provider, api_key?, judge_id?, ...}`. |

| `POST` | `/admin/judges/test-connection` | superadmin | Send a test generation. Returns `{ok, code?, message?}` — never raises on provider failure. |

  

---

  

## Eval Catalog `/admin/eval-catalog`

  

All routes require **superadmin**.

  

### Evals

  

| Method | Path | Description |

|--------|------|-------------|

| `GET` | `/admin/eval-catalog/evals` | List all evals. |

| `POST` | `/admin/eval-catalog/evals` | Create eval. |

| `GET` | `/admin/eval-catalog/evals/{eval_id}` | Get eval. |

| `PATCH` | `/admin/eval-catalog/evals/{eval_id}` | Update eval. |

| `POST` | `/admin/eval-catalog/evals/{eval_id}/archive` | Archive eval. |

| `PUT` | `/admin/eval-catalog/evals/{eval_id}/dimensions` | Assign eval to dimensions. |

  

### Dimensions

  

| Method | Path | Description |

|--------|------|-------------|

| `GET` | `/admin/eval-catalog/dimensions` | List all dimensions. |

| `POST` | `/admin/eval-catalog/dimensions` | Create dimension. |

| `PATCH` | `/admin/eval-catalog/dimensions/{dimension_id}` | Update dimension. |

| `PUT` | `/admin/eval-catalog/dimensions/{dimension_id}/reorder-evals` | Reorder evals within a dimension. |

  

### Profiles

  

| Method | Path | Description |

|--------|------|-------------|

| `GET` | `/admin/eval-catalog/profiles` | List all profiles. |

| `POST` | `/admin/eval-catalog/profiles` | Create profile. |

| `GET` | `/admin/eval-catalog/profiles/{profile_id}` | Get profile with versions. |

| `POST` | `/admin/eval-catalog/profiles/{profile_id}/version` | Create a new version of a profile. |

| `PATCH` | `/admin/eval-catalog/profiles/{profile_id}` | Update profile (name/status). |

  

### Utilities

  

| Method | Path | Description |

|--------|------|-------------|

| `POST` | `/admin/eval-catalog/runner-preview` | Dry-run a profile version against sample traces. |

| `POST` | `/admin/eval-catalog/guide-generation` | Generate an eval guide via LLM. |

| `GET` | `/admin/eval-catalog/library-metrics` | Fetch available library metrics from EvalClaw. |

  

---

  

## AIWS Read API `/aiws/v1`

  

Not yet implemented — returns `501`. Planned auth: `ist_aiws_{env}_…` bearer token.

  

## Client Read API `/client/v1`

  

Not yet implemented — returns `501`. Planned auth: `ck_…` bearer token, scoped to one customer tenant.

  

---

  

## Common error shape

  

```json

{ "detail": "human message" }

```

  

Machine-readable errors use a structured variant:

```json

{ "detail": { "code": "run_already_active", "message": "A scoring run is already in progress." } }

```

  

Key error codes the frontend should handle:

| Code | Status | Meaning |

|------|--------|---------|

| `run_already_active` | 409 | Concurrent run in progress |

| `no_profile_adopted` | 422 / 404 | Agent has no scoring profile |

| `no_judge_resolvable` | 422 | No judge configured for an enabled metric |

| `agent_not_ready` | 422 | Agent has no Langfuse project |

| `run_not_complete` | 422 | Trying to approve a non-complete run |

| `inbox_agent_not_scored` | 422 | Default inbox agent is not a valid scoring target |

| `profile_inactive` | 422 | Cannot pin an archived profile |

| `judge_in_use` | 409 | Judge referenced by active benchmarks |

| `not_provisioned` | 404 | Agent's Langfuse project is not provisioned |

| `tenant_not_external` | 422 | API keys only exist on external tenants |