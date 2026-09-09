Last Updated: 09/09/2026
Description: Comparison of AgentScore to the agentic eval marketplace

## Market Map
The space is split into several camps. Most have overlap but they can be separated into the following categories:
1. Observability/tracing-first: Focus on capturing traces, then add evals on top. Market leaders:
    - [Langfuse](https://langfuse.com)
    - [LangSmith](https://www.langchain.com/langsmith)
    - [Arize](https://arize.com)
    - [W&B Weave](https://wandb.ai/site/weave/)
2. Eval/scoring-first: Quality gates and judge models are the main offering. Market leaders:
    - [Braintrust](https://www.braintrust.dev)
    - [Galileo](https://galileo.ai)
    - [Confident AI/DeepEval](https://www.confident-ai.com)
    - [Comet Opik](https://www.comet.com/site/products/opik/)
3. Simulation-first: Generate synthetic users/scenarios to stress-test before prod. Market leaders:
    - [Arato](https://arato.ai)
    - [Patronus](https://www.patronus.ai)
    - [Maxim](https://www.getmaxim.ai)
4. AI TRiSM/runtime guardrails: Intercept and gate agent outputs at runtime rather than grade behavior. Market leaders:
    - [int4 TrustGate](https://int4.com/int4-trustgate/)
    - [NeuralTrust](https://neuraltrust.ai)
    - [Guardrails AI](https://guardrailsai.com)

## Where AgentScore fits
AgentScore is different than most existing products. AgentScore seeks to automatically grade agent performance and behavior - no SDK, no test authoring, no labeled data required (it is optional). OTel-in, one defensible 0 - 100 score out. Closest neighbors are Galileo (continuous production scoring) and Braintrust (eval-as-verdict), but neither leads with "zero-setup automatic grading."

## Competitor Profiles

### Langfuse
- **Value prop:** Open-source (MIT) AI engineering platform: tracing, evals, prompt management, playground, datasets. The de facto open-source LangSmith alternative.
- **Buyer:** AI/platform engineers who want open-source + self-hosting, no per-seat lock-in. Developer-led.
- **Pricing:** Hobby free (50k units/mo); Core $29/mo; Pro $199/mo; Enterprise $2,499/mo (SCIM, audit logs, project RBAC). SSO gated behind a Teams add-on. Self-hosted MIT core is uncapped (pay infra only). Unit-metered (traces+observations+scores).
- **Eval/scoring:** Session tracking + scores (human, user-signal, automated). LLM-as-judge, code evaluators, annotation queues, experiments - all MIT-open since Jun 2025.
- **Auth:** Project-level RBAC (paid); SSO/SAML on Teams/Enterprise; SCIM + audit logs at Enterprise.
- **Integrations:** Python, JS/TS SDKs; OTel-native; 100+ integrations (OpenAI, LangChain, LlamaIndex, LiteLLM).
- **Signals:** ~$4.5M raised (seed, Lightspeed/YC W23). Acquired by ClickHouse Jan 2026.

### Braintrust
- **Value prop:** Eval-first observability. Capture prod traces, score with built-in/custom scorers, turn failures into CI test cases.
- **Buyer:** Enterprise AI product/eng teams shipping AI features; premium AI-native logo base.
- **Pricing:** Starter free (1GB/10k scores); Pro $249/mo; Enterprise custom (SSO, advanced RBAC, self-host license).
- **Eval/scoring:** Real-time + batch scoring on live traffic or datasets; configurable LLM-as-judge; "Loop" AI assistant proposes better prompts/scorers/datasets. Proprietary Brainstore trace DB.
- **Auth:** Advanced RBAC + SSO/SAML (Enterprise). SOC 2 Type II, HIPAA, GDPR.
- **Integrations:** Widest SDK set - Python, TS, Go, Ruby, C#, Java. 13+ frameworks; OTel via span processor.
- **Signals:** $36M Series A (a16z, 2024); $80M Series B (ICONIQ, Feb 2026) at ~$800M. Customers: Notion, Stripe, Vercel, Airtable, Instacart, Zapier, Ramp, Coursera, Dropbox, KeyBank.

### Arize AI (Phoenix + Arize AX)
- **Value prop:** AI observability + eval on OpenTelemetry/OpenInference. Phoenix (OSS, dev) + Arize AX (enterprise managed).
- **Buyer:** ML/AI platform + enterprise GenAI teams. Phoenix for OSS adoption, AX for production monitoring/drift/compliance.
- **Pricing:** Phoenix free (Elastic License 2.0). AX Free ($0, 25k spans/mo); AX Pro $50/mo; AX Enterprise custom (in-VPC).
- **Eval/scoring:** Session + span tracing, full tool-call logging; LLM-as-judge; "Alyx" debugging assistant; drift detection; PagerDuty/Slack alerts.
- **Auth:** Fine-grained RBAC, SAML/SSO, audit trails, in-VPC (Enterprise).
- **Integrations:** OpenInference + OTel. Auto-instrumentation Python/TS/Java; LangChain, LangGraph, LlamaIndex, CrewAI, DSPy, Vercel AI SDK, OpenAI Agents SDK, Claude Agent SDK.
- **Signals:** $70M Series C (Feb 2025, Adams Street; strategic M12, Datadog, PagerDuty). ~$131M total. Customers: Uber, Duolingo, PepsiCo.

### Galileo
- **Value prop:** GenAI eval, observability, and real-time guardrails. Differentiator: proprietary **Luna-2 SLM judges** powering 20+ metrics at sub-200ms, ~98% cheaper than frontier LLM-as-judge, enabling 100% traffic coverage + inline "Protect" guardrails.
- **Buyer:** Enterprise / Fortune 500 AI platform teams, full agent lifecycle.
- **Pricing:** Free (5k traces/mo); Pro $100/mo (50k traces, standard RBAC); Enterprise custom.
- **Eval/scoring:** Continuous production scoring; LLM-as-judge **plus** own SLM judges; built-in retrieval/agent/safety/security metrics.
- **Auth:** RBAC from Pro up; SSO on Enterprise. SaaS/VPC/on-prem.
- **Integrations:** Python, TS SDKs; LangChain, CrewAI, OpenAI Agents, OTel/OpenInference.
- **Signals:** ~$68M raised ($45M Series B, Scale VP, Oct 2024; Databricks/Amex/Citi/ServiceNow strategics). **Acquired by Cisco (May 2026) → Splunk Observability.** Customers: Verizon, Comcast, HP, NTT, Reddit, Twilio.

### LangSmith (LangChain)
- **Value prop:** Commercial tracing/eval/monitoring, lowest-friction for LangChain/LangGraph teams (framework-agnostic but deepest there).
- **Buyer:** Developers/AI eng teams, strongest for existing LangChain users; scales to enterprise.
- **Pricing:** Developer free (5k traces/mo, 1 seat); Plus $39/seat/mo (10k traces, ~$2.50/1k overage); Enterprise custom (~$2-5k/mo reported) adds SSO/SAML, RBAC, self-host, data residency.
- **Eval/scoring:** Full tracing + eval all paid tiers; LLM-as-judge; custom dashboards.
- **Auth:** RBAC + SSO/SAML at Enterprise.
- **Integrations:** Python, JS/TS (Go/Java reported); LangChain, LlamaIndex, 50+ frameworks; OTel ingest.
- **Signals:** Parent LangChain $125M Series B (IVP, Oct 2025) at $1.25B, ~$260M total, ~$16M ARR. Customers: Klarna, Elastic, Cloudflare, Replit, Vanta, Rippling.

### Weights & Biases Weave
- **Value prop:** LLM/agent observability + eval from the experiment-tracking pioneer. Incremental: add `@weave.op` to instrument, no rewrite.
- **Buyer:** Existing W&B ML teams + enterprises adding GenAI; developers wanting drop-in tracing + structured eval.
- **Pricing:** Free (individual/academic); Pro ~$60/mo metered (storage ~$0.03/GB, ingestion ~$0.10/MB); Enterprise custom (SSO, RBAC, private cloud).
- **Eval/scoring:** Auto-traces LLM/tool/retrieval calls as Weave Calls; `weave.Evaluation` datasets+scorers; prompt-based LLM-as-judge scorers; CI eval.
- **Auth:** RBAC + SSO at Enterprise.
- **Integrations:** Python, TS SDKs; OpenAI/Anthropic/Bedrock; LangChain, LlamaIndex, DSPy, 50+; OTLP ingest.
- **Signals:** Acquired by **CoreWeave (~$1.7B, May 2025)**. ~1M developers, 1,400+ enterprises at acquisition.

### Arato
- **Value prop:** Simulation-first testing. Learns your agent's behavior, generates tens of thousands of synthetic-user multi-turn scenarios to surface hallucinations, accuracy, tone, and compliance risk pre-prod.
- **Buyer:** Mid-market to enterprise conversational-agent teams (AI/ML eng, product, QA).
- **Pricing:** Not public; first simulation free, sales-led.
- **Eval/scoring:** Synthetic Users, multi-turn simulation at scale, Arato Studio (prompt/model A/B), Arato Observe (session replay + topology). Session-level via simulation + Observe. LLM-as-judge/RBAC/SSO specifics not published. Claims EU AI Act / ISO 42001 / SOC 2 / GDPR alignment.
- **Integrations:** "Any LLM stack" with low integration; API + SDK; text/voice/image/business-data.
- **Signals:** Founded 2024 (Israel). $10M seed (Jun 2026, TLV Partners). Customers: HiBob, Panorays, Cisco, HoneyBook, Gainsight.

### Patronus AI
- **Value prop:** Automated eval + stress-testing on proprietary judge models, plus (late 2025) simulated "digital worlds" for agent stress-testing.
- **Buyer:** Enterprise AI/platform teams deploying agents in production; regulated buyers.
- **Pricing:** Public usage-based: $10/1k small evaluator calls, $20/1k large, $10/1k explanations. Enterprise/self-host available.
- **Eval/scoring:** Proprietary judges **Lynx** (hallucination) + **GLIDER** (general judge); **Percival** agent debugger (20+ failure modes); Experiments; prod Logs & Traces; digital-world RL simulators.
- **Auth:** IdP integration via vouch-proxy (OIDC/OAuth2 SSO); self-hosting documented. Explicit SAML/RBAC naming thin.
- **Integrations:** Python, TS, Java SDKs; managed OTLP endpoint; LangChain, LlamaIndex, DSPy, Vercel AI SDK, OpenAI Agents, Bedrock, Anthropic.
- **Signals:** ~$70M total ($50M Series B Jun 2026, Greenfield; strategics Datadog, Samsung). Percival + world-model research line.

### int4 TrustGate (adjacent - AI TRiSM, not a head-to-head evaluator)
- **Company:** int4 AG, Swiss (Zug), founded ~2010, ~41 staff, bootstrapped (~$4.5M ARR est.). Known for **SAP integration testing** (Int4 Suite: APITester, Messenger, Shield). SAP Silver Partner, ISO 27001. Customers (Suite, not TrustGate): Glencore, Panalpina, Panasonic, Glenmark.
- **What it is:** "First AI TRiSM solution for SAP ecosystems." A runtime guardrail proxy at the ERP integration border that intercepts **write payloads** from AI agents (SAP Joule, Agentforce), predicts/risk-scores their backend impact, and gates them **before they commit to SAP**. Tagline: validates the *document*, not the prompt - catching "technically valid but commercially wrong" transactions.
- **Buyer:** SAP enterprises giving agents **write access** to core S/4HANA/ECC (orders, invoices, journal entries, master data). Explicitly out of scope: read-only/reporting agents. Personas: SAP integration/basis, ERP risk & controls.
- **Pricing:** Not public (contact sales).
- **Scoring/eval:** Document-level **deviation scoring** against historical ERP patterns, **deterministic** (a four-step "Gating Kernel" using vectorized SAP Business Data Cloud data) - **not** LLM-as-judge, not conversation/trace scoring. Three modes: **Prove** (pre-go-live replay → signed "Go-Live Clearance"), **Mirror** (post-go-live read-only Agent Trust Reports), **Live** (inline pre-posting gating), with an L0→L3 autonomy ladder.
- **Auth (RBAC/SSO/SAML):** Not stated publicly.
- **Integrations:** SAP-centric, **no general SDK/framework/OTel** play. Plugs into S/4HANA & ECC, SAP Joule, Agentforce, the ERP integration layer (as proxy), n8n / SAP Build Process Automation, SAP Business Data Cloud.
- **Signals:** Launch ~H2 2026 (page cites Gartner Aug 2026 AI Governance Hype Cycle). No funding, no TrustGate-specific customers public yet.
- **Where it competes with us:** Narrow. Its **Prove** (pre-go-live certification replay) and **Mirror** (ongoing agent trust reports) modes resemble automated agent grading, and it shares the "ship / don't-ship confidence" framing. But it scores the *resulting SAP document's business correctness deterministically against ERP history*, not the agent's reasoning/task quality via a judge, and only for SAP write-back. It is a runtime **guardian/gateway**, we are a behavior **grader**. **Real overlap only where a Tricentis customer is grading SAP-writing agents** - and there it is more a potential integration surface than a direct rival. Worth watching because it plants an "AI trust for SAP" flag in enterprise accounts Tricentis also sells into.

### Also-competing (watch list)
- **Comet / Opik** - OSS (Apache-2.0, 20k+ stars) trace + eval, 40+ metrics, LLM-as-judge suite; 2026 Agent Optimizer + Cost Intelligence. Developer-first.
- **Maxim AI** - end-to-end experimentation → eval → observability with strong **agent simulation** across personas/scenarios. Overlaps Arato + Patronus.
- **Confident AI / DeepEval** - OSS eval framework (50+ metrics, Pytest/CI-native) + cloud (no-code HTTP testing). Public pricing: $200/mo Starter, $2k/mo Team, $1/GB-mo.

## Compare & Contrast

Legend: ✅ shipped / mature · 🟡 partial, gated, or in progress · ❌ absent · n/p not public

| Dimension | **AgentScore** | Langfuse | Braintrust | Arize | Galileo | LangSmith | W&B Weave | Arato | Patronus | int4 TrustGate† |
|---|---|---|---|---|---|---|---|---|---|---|
| **Core stance** | Auto-grade real behavior, zero setup | OSS observability | Eval-first + CI | Observability + eval | Continuous scoring + guardrails | Tracing for LangChain | Drop-in trace + eval | Sim-first testing | Judge models + sim | SAP write-txn guardrail |
| **Trace/run scoring** | ✅ (20-trace floor) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (sim) | ✅ | 🟡 document-level, not trace |
| **Session-based scoring** | ✅ | ✅ | ✅ | ✅ (session-level) | ✅ | ✅ | ✅ | ✅ (multi-turn) | ✅ | ❌ |
| **LLM-as-judge** | ✅ (G-Eval, Hybrid) | ✅ | ✅ | ✅ | ✅ + SLM judges | ✅ | ✅ | 🟡 n/p | ✅ (Lynx/GLIDER) | ❌ deterministic |
| **Multi-model judge catalog** | ✅ 7 models (Bedrock) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | n/p | ✅ | ❌ (n/a) |
| **Customer-selectable judge** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | n/p | ✅ | ❌ (n/a) |
| **RBAC** | ❌ not built | 🟡 paid | ✅ Ent | ✅ Ent | ✅ Pro+ | 🟡 Ent | 🟡 Ent | n/p | 🟡 | n/p |
| **SSO/SAML** | ❌ not built | 🟡 add-on | ✅ Ent | ✅ Ent | ✅ Ent | ✅ Ent | ✅ Ent | n/p | 🟡 OIDC | n/p |
| **API key mgmt** | 🟡 ingest keys only | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | n/p | ✅ | n/p |
| **SDK breadth** | ❌ none (OTel only); Read API reserved | Py, JS | 6 langs | Py/TS/Java | Py/TS | Py/JS(+) | Py/TS | API+SDK | Py/TS/Java | ❌ SAP-only, no SDK |
| **OTel-native ingest** | ✅ (only path) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 | ✅ | ❌ (SAP proxy) |
| **Zero-config / auto-profile** | ✅ **differentiated** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 🟡 | ❌ | ❌ |
| **Simulation / synthetic users** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | 🟡 prod replay (Prove) |
| **Guardrails / runtime protect** | ❌ | ❌ | 🟡 | 🟡 | ✅ | ❌ | ❌ | ❌ | 🟡 | ✅ **core** |
| **Self-host / on-prem** | ❌ cloud-only (VPN-gated) | ✅ | ✅ Ent | ✅ | ✅ | ✅ Ent | ✅ Ent | n/p | ✅ | n/p (in-line ERP proxy) |
| **Deployment maturity** | 🟡 internal beta, 0 ext customers | GA | GA | GA | GA | GA | GA | early | GA | 🟡 new (~H2 2026) |
| **Ecosystem hook** | ✅ **AI Workspace, any OTel-compatible agent** | LangChain-agnostic | broad | broad | Splunk/Cisco | LangChain | W&B/CoreWeave | any stack | Datadog | ✅ SAP (Joule/Agentforce) |

**Update:** † int4 TrustGate is a different category (AI TRiSM / runtime guardrail for SAP write-transactions), not a general agent-quality evaluator. Most rows read ❌/n/a because it isn't trying to do them - it competes with us only on the narrow "certify a SAP-writing agent before/after go-live" surface. Included for completeness, not as a like-for-like rival. (Also, their website is clearly vibe-coded)

## Capability Gaps
### Where AgentScore is behind
1. No enterprise auth: RBAC and SSO/SAML are basic requirements for most enterprise customers. While there is a separate superadmin and customer but these are extremely limited and do not allow true RBAC. For a Tricentis-branded enterprise product this is table stakes we cannot sell without.
2. Cloud-only: Langfuse, Arize, Galileo, Braintrust, Patronus all offer self-host/VPC/on-prem. A good portion of our users will require on-prem or self-host capabilities. 
3. No SDK/read API: OTel-only ingest is elegant for zero-setup, but the reserved `ck_` Read API/Python SDK is unimplemented. Competitors expose programmatic read/eval. Limits CI and data-out use cases.
4. No simulation capability: The hottest adjacent subsegment (Arato, Patronus, Maxim) generates synthetic users to test pre-prod. We only grade what already happened. Not our lane today, but a strategic hole if buyers consolidate "test + grade.
5. No runtime guardrails: alileo's inline Protect and its SLM judges (sub-200ms, ~98% cheaper) set a cost/latency bar our frontier-Bedrock judges do not meet for high-volume scoring.
6. Maturity: internal alpha→beta, no live external customers; new agentic judge cutover incomplete (PRs 2-3 pending, validation gate re-defined same-day to pass); chat assistant and recommendations are built-but-dark. Everyone in the table is GA.

Some of these gaps can be fairly easily solved - RBAC is easy to implement once SSO (which will be done soon with Tosca) has been implemented, most capabilites could be exposed via API/SDK/CLI with minimal effort, and the product will mature quickly once we start onboarding users. 

Others, like on-prem hosting and user simulation can be implemented, but would require significant work. 

Runtime guardrails may be much more involved and is not recommend to pursue at the current time.

### Where AgentScore Differentiates Itself
1. 