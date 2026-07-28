# ClickHouse vs. MongoDB Atlas for Trace Ingestion

**Date:** 2026-07-27
**Scope:** Analysis of the live AgentScore storage-engine evaluation (LangFuse replacement), grounded in Confluence/Jira source docs.
**Related:** [Jira AI-10954](https://tricentis.atlassian.net/browse/AI-10954), [Storage Engine Evaluation - Running Doc](https://tricentis.atlassian.net/wiki/spaces/AI/pages/3570598031/Agent+Score+Storage+Engine+Evaluation+Running+Doc+Updated+July+24+2026)

## Clarifying what "Atlas" means here

There's no ClickHouse-vs-Atlas comparison baked into the AgentScore codebase itself, but the current storage-engine evaluation (Confluence, updated 2026-07-24, owned by Sohil Shah, tracked in Jira AI-10954) is actively comparing **MongoDB Atlas** against ClickHouse (plus DynamoDB and Timestream) as the replacement for LangFuse's trace persistence layer. This document answers against that live decision.

## Where the decision actually stands (and a discrepancy worth flagging)

The two source documents disagree on live status, and both are current:

- **Jira AI-10954** (description, locked scope): candidates are **DynamoDB + S3** and **Timestream + S3** only. Constraint: "managed AWS services only."
- **Confluence running doc** (same ticket referenced, updated 3 days later): candidate table shows **Atlas + S3 Federation = Active/Primary**, ClickHouse + S3 = benched, DynamoDB + S3 = removed.

The comment thread explains the drift: Lior Nabat noted mid-evaluation that Atlas is "already proven and running" internally, Sohil Shah agreed to evaluate it conditional on one architectural requirement (see below), and it displaced DynamoDB as primary within a day. Nobody went back and updated the Jira ticket's locked scope or its "managed AWS services only" constraint - and neither MongoDB Atlas nor ClickHouse Cloud is an AWS-native managed service, so that constraint is either quietly abandoned or being interpreted loosely as "runs in our AWS environment." Worth confirming with Sohil/Lior before this goes further, since it's the kind of gap that surfaces late as a compliance or procurement objection.

## The actual technical difference driving the decision

This isn't really "columnar vs. document store." Sohil's evaluation methodology explicitly found the trace/observation/score schema is **fixed, not dynamic** (confirmed from `traces.py`/`langfuse_scores.py`), which is the stated reason document stores were eliminated as a *class*. Atlas survived that elimination only because of one specific feature:

**Atlas Data Federation** - a query engine layered on top of S3, not a separate storage engine. Atlas holds index/metadata only; the actual trace payload lives in S3 from day one. This matters because Sohil's core design constraint is: *whatever sits in front of S3 today must not create a migration when a Phase 2 analytics layer shows up later.* Federation satisfies that by construction - Phase 2 queries S3 directly, no `$out` export, no sync job.

**ClickHouse + S3** is architecturally compatible too (there's a concrete DDL sketch in the methodology doc: `MergeTree`, `PARTITION BY toYYYYMM(timestamp)`, `ORDER BY (project_id, timestamp, trace_id)`), but it's on the bench, not primary. The stated re-entry condition is "if all candidates fail" - it's the fallback, not a rejected option.

## Technical limitations of each

### ClickHouse

- MergeTree's sparse primary index is built for range scans, not single-row point lookups or in-place updates. Sohil's doc flags **Score upsert semantics** as one of two unresolved design risks (Observation↔Score cardinality isn't even confirmed from code yet) - ClickHouse handles this worse than Atlas/DynamoDB by default, since mutations are async `ALTER UPDATE` operations, not transactional row writes. This is a real limitation for a workload where scores get revised after the fact.
- No AWS-native managed offering. ClickHouse Cloud is a third-party managed service; self-hosting reintroduces exactly the SRE burden the team is trying to shed - the 2026-07-21 sync explicitly named "LangFuse ships as a full stack (ClickHouse, Postgres, 3 node services) - lots of moving parts and SRE maintenance burden" as the reason to replace LangFuse at all. Picking ClickHouse again as the replacement would partially defeat the purpose.
- It's already proven at this exact task (LangFuse itself uses ClickHouse for traces post-v3), so the query patterns aren't a risk - the operational cost is.

### MongoDB Atlas

- No production numbers exist yet. The only benchmarks in the doc are on the **M0 free tier** (shared, throttled), explicitly caveated as non-representative: write throughput hit 51/sec against a 5K-10K/sec target (~1% of target), and point-lookup p99 latency degraded from 545ms to 1,826ms as concurrency rose from 10 to 50 threads, against a 50ms target - a 15-36x gap. Time-range scan p99 was more stable (448-654ms) but still 4-6x over the 100ms target. None of this is a real ceiling - M0 queues rather than rejects requests under load, so the true limit is unknown until Tricentis's paid Atlas cluster access comes through (service-desk ticket still pending as of the doc).
- Its core technical strength - flexible/dynamic schema - isn't actually needed here, since the data is fixed-schema. It's being chosen for "already proven and running internally" plus the Federation architecture fit, not because the document model is the best technical match.
- Federation billing is per-byte-scanned for queries; if time-range scans over large windows become common, that cost is unbounded in a way a fixed-tier cluster isn't. The doc notes cost isn't being weighed for Phase 1 (migration risk is the deciding factor), so this hasn't been stress-tested yet.

## Cost at 5,000-10,000 traces

One important unit mismatch first: the production requirement in both docs is **5K-10K events/sec system-wide** (spans, not traces) - a sustained throughput target, roughly two orders of magnitude larger than a batch of 5k-10k total traces. This section answers the volume asked for (5k-10k traces as a dataset, e.g., a beta cohort or a month of a single tenant), not the throughput target.

No confirmed average trace payload size exists from this analysis (`traces.py` lives in the private `Tricentis-AI/agent-score` repo, not in the local checkout used for this analysis). Assuming ~10-50KB per trace including observations - typical for LLM agent traces with tool-call inputs/outputs - 5,000-10,000 traces totals **~50-500MB**. Practical implication: at this volume, storage/compute cost is not a differentiator between candidates - it's a rounding error, dominated by whichever service's fixed monthly floor you're paying, not by data volume.

| | Fixed monthly floor | Storage for 50-500MB | Notes |
|---|---|---|---|
| **MongoDB Atlas M10** (dedicated cluster route) | ~$57-75/mo (M10, $0.08/hr, 10GB included) | Negligible, well under 10GB cap | Simplest to reason about; ignores Federation |
| **Atlas Data Federation** (the actual chosen architecture) | Small metadata-cluster tier (~$60-75/mo) + near-zero S3 storage (~$0.01/mo) | Per-byte-scanned query fees, likely a few dollars/mo at this volume and low query rate | Cheapest *if* query volume stays low; cost grows with scan-heavy access patterns |
| **ClickHouse Cloud** (Basic tier, always-on) | ~$150-190/mo for a minimal 8GiB/2vCPU node run 24/7 | ~$25.30/TB-month, negligible | 2-3x Atlas's floor at this volume - Cloud's minimum viable "always on" tier is pricier than Atlas's entry dedicated tier |
| **Self-hosted ClickHouse** (e.g., small EC2) | ~$30-40/mo | Negligible | Cheapest option on paper, but violates "managed services only" and reintroduces the SRE burden the LangFuse replacement is meant to eliminate |

Bottom line on cost: **Atlas (via Federation) is the cheaper floor at this volume**, mainly because the payload sits in S3 (essentially free at this scale) and only the thin metadata layer is paid, versus ClickHouse Cloud's higher always-on compute minimum. Self-hosted ClickHouse would undercut both but was already ruled out on operational-burden grounds. None of these numbers are load-tested against the real 5K-10K spans/sec production target yet - both candidates are pre-production-benchmark, so treat this table as directional, not a quote.

## Sources

- [Cluster Configuration Costs - Atlas - MongoDB Docs](https://www.mongodb.com/docs/atlas/billing/cluster-configuration-costs/)
- [MongoDB Atlas Pricing 2026: Cluster, Search, Negotiation](https://atonementlicensing.com/blog/mongodb-atlas-pricing-and-negotiation/)
- [ClickHouse Pricing Teardown 2026 - DEV Community](https://dev.to/beton/clickhouse-pricing-teardown-2026-209h)
- [ClickHouse Pricing 2026: Cloud vs Self-Hosted TCO Guide](https://improvado.io/blog/clickhouse-warehousing-pricing)
