Last Updated: 09/09/2026
Description: Comparison of AgentScore to the agentic eval marketplace

## Market Map
The space is split into several camps. Most have overlap but they can be separated into the following categories:
1. Observability/tracing-first: Focus on capturing traces, then add evals on top. Market leaders:
    - [Langfuse](https://langfuse.com) - Open-source (MIT) tracing, evals, prompt management, and datasets platform.
    - [LangSmith](https://www.langchain.com/langsmith) - Commercial tracing/eval/monitoring, tightest fit for LangChain/LangGraph teams.
    - [Arize](https://arize.com) - AI observability + eval on OpenTelemetry/OpenInference (Phoenix OSS + Arize AX enterprise).
    - [W&B Weave](https://wandb.ai/site/weave/) - Drop-in LLM/agent observability + eval from the experiment-tracking pioneer.
2. Eval/scoring-first: Quality gates and judge models are the main offering. Market leaders:
    - [Braintrust](https://www.braintrust.dev) - Eval-first observability; capture traces, score with built-in/custom scorers, turn failures into CI tests.
    - [Galileo](https://galileo.ai) - GenAI eval, observability, and real-time guardrails powered by proprietary SLM judges.
    - [Confident AI/DeepEval](https://www.confident-ai.com) - OSS eval framework (50+ metrics, Pytest/CI-native) plus a no-code cloud offering.
    - [Comet Opik](https://www.comet.com/site/products/opik/) - OSS trace + eval platform (40+ metrics, LLM-as-judge suite), developer-first.
3. Simulation-first: Generate synthetic users/scenarios to stress-test before prod. Market leaders:
    - [Arato](https://arato.ai) - Learns agent behavior and generates synthetic-user multi-turn scenarios to surface risk pre-prod.
    - [Patronus](https://www.patronus.ai) - Automated eval + stress-testing on proprietary judge models, plus simulated "digital worlds."
    - [Maxim](https://www.getmaxim.ai) - End-to-end experimentation → eval → observability with strong agent simulation across personas.
4. AI TRiSM/runtime guardrails: Intercept and gate agent outputs at runtime rather than grade behavior. Market leaders:
    - [int4 TrustGate](https://int4.com/int4-trustgate/) - Runtime guardrail proxy gating AI agent write-transactions into SAP before they commit.
    - [NeuralTrust](https://neuraltrust.ai) - Runtime security gateway detecting and blocking prompt injection, data leakage, and unsafe agent behavior.
    - [Guardrails AI](https://guardrailsai.com) - OSS Python framework for validating and enforcing structured guardrails on LLM inputs/outputs.

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
| **Failure attribution / root-cause diagnosis** | ✅ score decomposes to dimension → eval → evidence | n/p | 🟡 "Loop" assistant | ✅ "Alyx" debugging assistant | n/p | n/p | n/p | n/p | ✅ "Percival" debugger (20+ failure modes) | ❌ (n/a) |
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
1. **No enterprise auth:** RBAC and SSO/SAML are basic requirements for most enterprise customers. While there is a separate superadmin and customer but these are extremely limited and do not allow true RBAC. For a Tricentis-branded enterprise product this is table stakes we cannot sell without.
2. **Cloud-only:** Langfuse, Arize, Galileo, Braintrust, Patronus all offer self-host/VPC/on-prem. A good portion of our users will require on-prem or self-host capabilities. 
3. **No SDK/read API:** OTel-only ingest is elegant for zero-setup, but the reserved `ck_` Read API/Python SDK is unimplemented. Competitors expose programmatic read/eval. Limits CI and data-out use cases.
4. **No simulation capability:** The hottest adjacent subsegment (Arato, Patronus, Maxim) generates synthetic users to test pre-prod. We only grade what already happened. Not our lane today, but a strategic hole if buyers consolidate "test + grade.
5. **No runtime guardrails:** alileo's inline Protect and its SLM judges (sub-200ms, ~98% cheaper) set a cost/latency bar our frontier-Bedrock judges do not meet for high-volume scoring.
6. **Maturity:** internal alpha→beta, no live external customers; new agentic judge cutover incomplete (PRs 2-3 pending, validation gate re-defined same-day to pass); chat assistant and recommendations are built-but-dark. Everyone in the table is GA.

### Effort & Sequencing

**Low effort - near-term:**
- **RBAC (Gap 1):** Mechanically straightforward once identity is unified. Blocked on Tosca SSO landing; once org/role claims exist in the token, RBAC becomes a policy-enforcement layer on endpoints we already have, not new architecture.
- **SDK / Read API (Gap 3):** The `ck_` Read API and SDK surface are reserved, not missing. Most of the work is documentation, client generation, and auth scoping on capabilities that already exist internally - low engineering risk, mostly a packaging and prioritization decision.
- **Maturity (Gap 6):** Not a feature gap so much as an execution one. It resolves naturally as design partners onboard and the agentic judge cutover, chat assistant, and recommendations move from built-but-dark to live. Needs product discipline (finish the pending PRs, stop re-defining the validation gate) more than net-new engineering.

**Medium/high effort - roadmap items:**
- **On-prem / self-host (Gap 2):** Every cloud-only capability today (auto-profiling, judge orchestration, large-trace fetch) would need to run disconnected from Tricentis-hosted infra, plus a supportable deployment/upgrade story. Langfuse, Arize, Braintrust, and Galileo all ship this, so it's provably buildable, but it's a multi-quarter infra investment, not a toggle.
- **User/synthetic simulation (Gap 4):** Requires building or licensing a scenario-generation engine (cf. Arato, Patronus, Maxim) - a genuinely different capability from grading what already happened. Feasible, but it's a strategic expansion of scope rather than an extension of the current scorer.

**Not recommended now:**
- **Runtime guardrails (Gap 5):** Only viable at guardrail latency/cost with sub-200ms inline judges (Galileo's SLM approach); our frontier-Bedrock judge stack isn't built for that regime. Pursuing this now would mean standing up a second, cheaper judge tier just to compete on a dimension that isn't our differentiator. Revisit only if customer demand or a cheap-judge capability emerges organically.

**Net sequencing:** ship RBAC and API/SDK exposure opportunistically as SSO lands, treat maturity as an execution problem to close out this quarter, and hold on-prem and simulation as deliberate roadmap decisions rather than reactive moves - they're real gaps, but the wrong ones to rush.

### Where AgentScore Differentiates Itself
1. **Zero-setup automatic grading:** No SDK, no labeled data, no test authoring, <u>no AI expertise needed</u>. AgentScore offers auto agent recognition plus automatic profile-fitting. None of the other competitors found offer this - all require either instrumentation choices, dataset curation, scorer configuration, or some combo of all.
2. **One defensible answer *with evidence*:** Single 0 - 100 score + 5 band ship/review/don't ship verdict with confidence interval - every number evidence-backed. This is a decision-maker artifact, not a dashboard.
3. **Large-trace grading:** Agentic orchestrator grades very large (30 - 50 MB) traces that would normally exceed an LLM's context window by fetching only the relevant parts (~0.2% of data in testing). A concrete, demoable edge none of the profiled products advertise.
4. **TAIS/AIW ecosystem hook:** AIW agents auto-provision a tenant and get graded with zero setup This is a distribution channel inside Tricentis that no external vendor can replicate, making AgentScore an extremely powerful moat that no other vendor can replicate.
5. **Rich eval taxonomy:** AgentScore offers four kinds of evals (Library, G-Eval, DAG, and Hybrid). We offer 60+ evals, 11 dimensions, and 9 profiles out of the box. Also, immutable versioning and confidence-gated auto-fit. This depth is competitive with the best offerings evaluated and often exceeds what many products offer.

## Positioning Assessment and Recommendations

### Where AgentScore Sits
AgentScore is different than most existing products. AgentScore seeks to automatically grade agent performance and behavior - no SDK, no test authoring, no labeled data required (it is optional). OTel-in, one defensible 0 - 100 score out. Closest neighbors are Galileo (continuous production scoring) and Braintrust (eval-as-verdict), but neither leads with "zero-setup automatic grading."

On the core scoring loop the technology is credible and in some ways differentiated (zero-setup, large-trace, evidence-backed verdicts, an ingest-to-fix-recommendation pipeline neither Arize nor Patronus is documented to close end-to-end). But with no external customers, no enterprise auth, cloud-only VPN-gated access, and no public pricing, AgentScore is **not yet a market participant** - it is a strong internal alpha with a defensible wedge. The competitors are funded ($50-125M rounds), acquired (ClickHouse, Cisco, CoreWeave), and GA with marquee logos. We do not win a feature-checklist war today. We win by being the grading layer no one else is, delivered where no one else can reach (inside TAIS).

### Stategic Recommendations
1. **Lead with the features competitors can't easily copy:** "Automatic grading with zero setup (inside your Tricentis stack)." No other competitors offer these features. We should *not* position ourselves as another observability/eval dashboard - we will almost certainly lose that comparison to incumbents. We should position ourselves as the *verdict layer* (ship/don't ship + evidence) that plugs direclty into AI Workspace with no insturementation *and* allows scoring/evaluation of company's existing/external agents. Make large trace grading and the evidence-backed 0 - 100 score the demo centerpiece.
2. **Knowing *what* to measure is the hardest part of evals:** There are a ton of open source eval frameworks and tools out there. The actual evaluation of the agent is not hard - it is knowing *what* actually needs to be evaluated and ensure that all relevant aspects of an agent are measured. This gives our users the confidence to know their agent is actually ready to ship.
3. **Make a call on simulation and guardrails capabilties:** Simulation testing is a quickly growing market capability and where AgentScore has a serious gap - only agents already in production can be tested and only traces that real users are emitting can actually be graded. This leaves a gap where specific situations are incredibly difficult to test, as well as knowing that all aspects of the desired agent's behavior has been tested. Deciding to tackle this problem ensures AgentScore is a well-rounded, complete AI agent testing platform.
4. **MCP capabilities:** Don't build MCP server conformance testing - this is an already served niche (MCP Inspector, CLIs, etc) with no real product moat. Since MCP tool calls are just tool-call spans on an OTel trace, we should ensure ingestion can recognize and lavel MCP traces so a customer's report can show "how well did the agent use MCP tools" as a first-class view. This is generally low-effort and fits our zero-setup stroy, but is not a differentiator by itself. Our moat would come from pairing this with the AIW hook (AIW agents calling out to MCP tools get graded automatically) rather than from MCP-awareness on its own.
5. **Fix enterprise readiness:** RBAC, SSO/SAML, and non-VPN access. These three are actual blockers to any external design partner converting. While we can certainly offer demos and closed betas in the current state, these features are table stakes for any long-term engagement.
6. **Failure attribution and improvement recommendations:** Failure attribution alone isn't unique - Arize's Alyx and Patronus's Percival already do it. What's harder to copy is the pipeline it sits inside: ingest → auto-evaluate → auto-score → failure attribution → improvement recommendations, running end-to-end on zero-setup OTel traces with no instrumentation, dataset curation, or scorer authoring required to get there. Competitors hand you an explanation only after you've done that setup work; we hand you the explanation - and a concrete next step to fix it - as a byproduct of the same zero-touch ingestion that produced the score. Neither Alyx nor Percival is documented to close the loop from "why it failed" to "what to do about it." Make the full pipeline the center of the story, not attribution in isolation - "we don't just tell you it's broken, we tell you how to fix it" is a claim none of the profiled competitors can make.

**Watch item - the SAP/enterprise-app angle (int4 TrustGate).** int4 is not a head-to-head evaluator, but it's the first to plant an "AI trust for SAP" flag - runtime guardrails on agents writing to S/4HANA - inside enterprise accounts Tricentis already sells Tosca into. It validates the *business outcome* (the SAP document), which is a framing our behavior-grading doesn't cover, and it lands right where Tosca's SAP testing strength lives. Two implications: (a) it's a plausible **integration/partner** surface (grade the agent's behavior + gate its write) more than a rival, and (b) if enterprise buyers start expecting "AI trust for my ERP agents," we should decide whether AgentScore's verdict layer plugs into that story via Tosca rather than ceding the SAP-agent conversation. Low urgency (they're brand-new, bootstrapped, unproven), but it's the most Tricentis-adjacent move in the field - flag it for the Tosca/SAP GTM folks.