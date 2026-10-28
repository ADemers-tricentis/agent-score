# AgentScore Trace Sending: User Flow

Companion to [agentscore-trace-legal.md](agentscore-trace-legal.md). Covers how a tenant opts in to trace sending in AIWS, how traces get sent, and how sending stops.

## Flow

```mermaid
flowchart TD
    subgraph OPTIN["1. Opt-in (AIWS, once per tenant)"]
        A([Customer user opens AgentScore in AIWS]) --> B{Tenant has already consented?}
        B -- Yes --> F
        B -- No --> C[AIWS shows trace-sending consent]
        C --> D{Accepts?}
        D -- No --> E([Trace sending stays off])
        D -- Yes --> D2[Consent record stored<br/>kept 7 years, never purged]
        D2 --> D3[Trace-sending flag enabled for tenant]
    end

    D3 --> F

    subgraph SEND["2. Sending"]
        F{Where does the agent run?}
        F -- AI Workspace --> F0[AI Workspace agent telemetry<br/>already stored in Better Stack - third party]
        F0 --> F1[AgentScore Better Stack stream runner pulls spans<br/>per env:region source, forwards to internal ingest<br/>NOT yet enabled in prod - planned]
        F1 --> F2{Tenant consented?<br/>consent check on this path to be confirmed}
        F2 -- No --> F3([Spans dropped])
        F2 -- Yes --> F4[Auto-ingested, no key or exporter setup]
        F -- External agent --> G[Customer creates a tenant API key<br/>and configures OpenTelemetry exporter]
        G --> G2[Agent sends traces to the ingest endpoint]
        F4 --> H([Traces reach AgentScore])
        G2 --> H
    end

    subgraph STORE["3. Storage and use (Tricentis, TAIS on AWS)"]
        H --> I[Trace and spans stored<br/>Postgres RDS + S3, tenant's Tosca region]
        I --> J[Used only to score the customer's agents<br/>evals, Agent Cards, Improve advice, workspace assistant]
        J --> K[Payloads deleted after 12 months<br/>395-day bucket backstop, audit event per tenant]
    end

    subgraph STOP["4. Ways sending stops"]
        S1[Customer disables or rotates API key] --> X
        S2[AgentScore trial ends<br/>flag auto-disabled - proposed] --> X
        S3[Customer submits opt-out request] --> S4[Tricentis admin disables trace sending<br/>proposed] --> X
        X([Ingest no longer accepts traces])
    end

    H -.-> S1
    D3 -.-> S2
    D3 -.-> S3
```

## Notes

- **Consent scope:** once per tenant. When admins are introduced, an admin can accept on behalf of the tenant, or individual users can accept.
- **Consent vs sending:** consent turns the capability on. For agents in AI Workspace, traces then flow automatically. For external agents, traces only flow when the customer's agent sends them with a tenant API key (the legal doc's "separate act").
- **Legal doc mismatch:** `agentscore-trace-legal.md` describes only the API-key path ("Who opts in") and says there is "no third-party trace vendor" ("Where it runs"). Once the Better Stack stream is enabled in prod, both need updating for AI Workspace users: sending is no longer a separate act, and Better Stack becomes a third party holding their traces.
- **No self-serve opt-out** is planned. The two proposed off-ramps are trial-end auto-disable and a request-based disable by a Tricentis admin (steps S2 to S4).
- **Not in this flow (gaps from the legal doc):** customers cannot delete traces themselves, there is no DSAR job, and there is no automatic PII redaction or flagging.

## Open questions

- What does the ingest endpoint do if a key is valid but the tenant has not consented (reject, or accept silently)? The legal doc does not say, so the diagram assumes the flag gates ingest.
- Does disabling the flag also stop ingest immediately, or only on the next key check?
- **Consent on the Better Stack path:** the stream runner reads by `env:region` source and service name, not by tenant. Where are non-consented tenants' spans filtered out? The diagram shows a consent check, but I have not found one in the code for this path.
- The "API key disabled" off-ramp does not apply to AI Workspace traces, so the consent flag would be the only control.
- **Better Stack as a third party:** AI Workspace spans sit in Better Stack before AgentScore pulls them. Its retention and region for those spans are not documented in the repo, and a tenant purge in AgentScore would not delete them there.
- Is enabling the stream in prod the intended long-term mechanism? The architecture notes call it an "interim supply line", and it is off by default behind a default-deny environment allow-list.
