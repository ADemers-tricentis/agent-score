# AgentScore Trace Documentation for Legal

## What a trace contains
- Each trace is stored as one object holding the full assembled trace and its spans (trace_store/payload.py).
- Span content is whatever the customer's agent emits through OpenTelemetry. That is typically prompts, model outputs and tool calls, plus any file contents or identifiers the agent puts in them, along with the relevant trace metadata.
- For AI Workspace agents (dev and staging, as seen in the repo and docs):
  - The services that emit are relic-service, autonomous-service, chatbot-agent-service, quality-agent and performance-agent, plus the gateway and usage services, which carry identifiers only.
  - Spans carry identifiers: agent name, tenant name, session id, product name, and the billing session id.
  - autonomous-service emits LLM input and output messages and tool results. It strips base64 screenshots at the source, and nothing else is redacted.
  - Unverified: whether relic-service puts prompt and output text on its spans. Its source is not in this repo.
  - Most relic spans are infrastructure noise (HTTP, cache, Redis, billing and licensing calls). Ingest drops these.
- So yes, it can include customer data and personal data. Nothing in the repo filters it on the way in.
- The only redaction in the repo is a boot-time check on Agent Score's own worker spans. It does not apply to customer traces.
- Auto PII redaction/flagging is on the roadmap, but not currently implemented.

## Where it runs
- It is a Tricentis service. It runs on the TAIS EKS clusters (AWS), with Postgres (RDS) and an S3 bucket we own. There is no third-party trace vendor (architecture §1).
- On TAIS, the judge LLM calls go to the Tricentis AI Hub (hub-service, in-cluster), not to a vendor directly. The AI Hub's own downstream model providers are outside this repo.
- Off TAIS (local dev only), other providers are configurable.
- One PII crossing: for customer-triggered work, the customer user's id and email are sent to the AI Hub for billing. Staff emails never leave Agent Score.
- Back-office error and telemetry data goes to Better Stack.

## How the data is used
- The code uses traces only to score the customer's agents: evals, Agent Cards, Improve advice and the workspace assistant. There is no training or product-improvement pipeline.
- Unverified: whether the AI Hub's model providers retain or train on prompts. That needs confirming with the AI Hub team.

## Storage
- Region: each region has its own database and bucket. Dev and staging run in us-east-1 and eu-west-2, and prod has four regions. A tenant's data stays in its Tosca region.
- Retention:
  - Trace payloads are deleted after 12 months by default (trace_retention_months=12, which is also the maximum).
  - The bucket has a 395-day lifecycle backstop.
  - A retention run records an audit event for each tenant it clears.
- Access:
  - Access is isolated by tenant, using Postgres row-level security and tenant-scoped queries.
  - Customers see only the tenants they are members of.
  - Tricentis staff and superadmins can use the back office.
- Deletion:
  - Customers can't delete traces themselves. In the customer app, as far as I found, there is no delete control.
  - Tricentis staff can hard-purge an agent or a tenant. A tenant purge removes the trace payloads, session snapshots and run transcripts, and writes a purge record.
  - Consent records are kept for 7 years and are never purged.
  - There is no DSAR job (a data-subject access or erasure request tool).

## Who opts in
- Consent would be done once per tenant in AIWS
    - Once we introduce admins, we can have it so the admin can accept on behalf of the tenant or individuals can accept
- Sending traces from an external agent (outside AIWS) is a separate act, because the customer's own agent has to send them to the ingest endpoint using a tenant API key. That key can be disabled or rotated.
- No user-facing opt-out is planned, but we can make it so one of two things happens:
    1. The flag is automatically disabled at the end of the user's AgentScore trial, or
    2. The user can submit a request to opt-out and a Tricentis admin can then disable trace sending