# "Eval Players" slide vs AgentScore: Competitive Teardown

_Last updated: 2026-11-04_

Baseline: [competitive-analysis-report.md](competitive-analysis-report.md) (2026-09-09) and the weekly digests in [competitive-intel/](competitive-intel/) through 2026-11-02. Items already in those digests are cited back to the digest, not re-reported. Pages with no published date are marked "undated, retrieved 2026-11-04."

**Scope:** all twelve names on the Eval Players slide. The image is the one from the prompt-drafting session the same morning.

## AgentScore baseline, and what the repo changes

The working sentence holds, with three corrections from the repo:

- **Five verdict bands, not three.** Ship, Ship with note, Needs work, Don't ship (recommended), Don't ship. Built-in profiles set the cut points at 85, 70, 55, 40; below the last band is Block. (`agent-score-marketing/docs-src/src/content/Glossary.tsx`, `CustomProfiles.tsx`)
- **Trace floor is 20 traces.** (`ConnectYourAgent.tsx`, `QuickStart.tsx`)
- **MCP is now a connection path.** The hosted MCP server went live in production on 2026-11-02, so an agent can connect itself. Ingest is still OpenTelemetry only. (`docs/updates/2026-11-02 Update.md`)
- Custom evals and custom profiles can now be authored. That is optional; the default path still needs no authoring. (`CustomEvals.tsx`, `CustomProfiles.tsx`)
- Enterprise status: customer-facing Okta sign-in through Tricentis identity is live (`docs/updates/September Updates/2026-09-17 Update.md`). RBAC is still a stated requirement, not a feature (`docs/updates/TAIS Migration Update.md`). On-prem for Accenture was declined on 2026-10-27 (`docs/planning/roadmap/2026-11-03-recommended-roadmap-items.md`). Production was reset on 2026-11-02 and customer invites started that day.

---

## 1. Name resolution

| Confirmed company | Canonical URL | Category | Treatment |
|---|---|---|---|
| Arize AI (acquired by Dynatrace, closed 2026-10-01) | [arize.com](https://arize.com/pricing/) | 1. Head-to-head | Delta |
| Galileo, now sold as **Splunk Agent Observability** (Cisco) | [galileo.ai](https://galileo.ai) (pricing now redirects to Splunk) | 1. Head-to-head | Delta |
| Weights & Biases (Weave), now inside **CoreWeave Forge**, plus the new **CoreWeave Agent Lens** | [wandb.ai/site/weave](https://wandb.ai/site/weave/) | 1. Head-to-head | Delta |
| Avido (Copenhagen). Legal entity name not published on its site. | [avidoai.com](https://avidoai.com/) | 1. Head-to-head | Full profile |
| ImpactAI Corp (San Francisco) and Impact AI GmbH (Linz, FN 511968w) | [impact.ai](https://www.impact.ai/imprint) | 1. Head-to-head | Full profile |
| Runloop AI, Inc. **Winding down.** | [runloop.ai](https://www.runloop.ai/) | 2. Adjacent | Full profile (short) |
| SimSpace Corporation (Orlando, FL). Best fit. No second company matches the spelling. | [simspace.com](https://simspace.com/) | 2. Adjacent | Full profile (short) |
| Giskard AI SAS (Paris, SIREN 904 773 421) | [giskard.ai](https://www.giskard.ai/) | 1. Head-to-head | Full profile |
| HiddenLayer, Inc. | [hiddenlayer.com](https://www.hiddenlayer.com/) | 2. Adjacent | Full profile (short) |
| Inflectra Corporation. The eval product is **SureWire**; Spira is test management. | [inflectra.com/Products/SureWire](https://www.inflectra.com/Products/SureWire/) | 1. Head-to-head | Full profile |
| Synthesized, Inc. (Delaware) and Synthesized Limited (England and Wales, 10903020) | [synthesized.io](https://www.synthesized.io/) | 2. Adjacent | Full profile (short) |
| Harness Inc. No second company in this market fits the bare name. | [harness.io/products/ai-evals](https://www.harness.io/products/ai-evals) | 1. Head-to-head | Full profile |

Legal-name sources: Runloop's [Enterprise Terms](https://www.runloop.ai/terms-of-service) ("Runloop AI, Inc.", undated, retrieved 2026-11-04). SimSpace's [PR Newswire release](https://www.prnewswire.com/news-releases/leading-cybersecurity-software-companies-launch-ai-proving-grounds-consortium-to-help-enterprises-build-trust-in-ai-302790215.html) (filed as "SimSpace Corporation", 2026-06-03). Impact AI's [imprint](https://www.impact.ai/imprint) (undated, retrieved 2026-11-04). Avido's site and docs give no legal entity, and its privacy URL returns 404. PitchBook lists it at Emiliekildevej 40, Copenhagen ([PitchBook](https://pitchbook.com/profiles/company/1034904-97), retrieved 2026-11-04). Giskard AI SAS is named on its [pricing page](https://www.giskard.ai/pricing) and in the French registry ([Pappers](https://www.pappers.fr/entreprise/giskard-ai-904773421), retrieved 2026-11-04). HiddenLayer, Inc. is the filer on its SEC Form D ([EDGAR](https://www.sec.gov/Archives/edgar/data/1931200/0000947871-23-000953.txt), 2023-09-22). Inflectra Corporation is named in its [EULA](https://www.inflectra.com/Purchase/InflectraEULA.htm). Synthesized's two entities are in its [software terms](https://www.synthesized.io/synthesized-software-terms) (updated 2026-10-01). Harness Inc. is the `legalName` on [harness.io](https://www.harness.io/products/ai-evals).

No slide name fell into category 3.

---

## 2. Company sections

### Arize AI (delta since 2026-09-09)

- **Ownership:** Dynatrace closed its acquisition of Arize on 2026-10-01, announced in August at about $915M. Phoenix and AX continue for now. ([Business Wire via Finviz](https://finviz.com/news/398011/dynatrace-completes-acquisition-of-arize-extending-ai-observability-across-the-full-development-lifecycle), 2026-10-01; already in [digest 2026-10-05](competitive-intel/2026-10-05.md))
- **Product:** Alyx 2.0 was repositioned as a planning agent on 2026-10-05 ([Arize](https://arize.com/blog/alyx-2-0-the-ai-agent-that-actually-plans/)). Phoenix v20.19 through v21.0.0 (Oct 1–30) added a DECISION span kind, made authentication the default, and added DECISION and AGENT annotation kinds ([GitHub releases](https://github.com/Arize-ai/phoenix/releases); in digests 2026-10-05 through 2026-10-30). Since v21.0.0 there have been only client, CLI, and MCP patch releases (2026-11-02).
- **Missed by the September report (shipped June 2026, before the cutoff):** Signal reviews production traces and groups failures into issues with root cause and suggested fixes. Managed agents can open pull requests, and Agent-as-a-Judge creates adaptive evals from production behavior. ([Arize blog](https://arize.com/blog/building-ai-factory-self-improving-agents-arize-ax/), June 2026). Signal is included on Free (10 issues/mo) and Pro (25/mo). Bring-your-own-key for the judge model is Enterprise only ([pricing](https://arize.com/pricing/), undated, retrieved 2026-11-04).
- **Pricing, re-checked 2026-11-04:** AX Free $0 (25k spans/mo), AX Pro $50/mo (50k spans), Enterprise custom with self-host, SSO, and audit logs. RBAC is on every tier, scaled by orgs and spaces. ([pricing](https://arize.com/pricing/)) This matches September.
- **Funding:** "$70M Series C, ~$131M total" is superseded by the acquisition. Carried from 2026-09-09, not re-verified.

### Galileo, now Splunk Agent Observability (delta since 2026-09-09)

- **Rebrand (2026-08-07, before the cutoff and missed by the report):** "As of August 7, 2026, Galileo is now Splunk Agent Observability." New customers use [Splunk's docs](https://agent-observability-docs.splunk.com/llms.txt). ([Galileo release notes](https://docs.galileo.ai/release-notes), 2026-08-07)
- **Pricing changed, re-checked 2026-11-04:** [galileo.ai/pricing](https://galileo.ai/pricing) now serves Splunk's pricing page. Splunk Agent Observability starts at $100/month per 1.2M spans, billed annually. It includes 500M Luna tokens and 5 Luna fine-tuning runs a year, and is available in Observability Cloud and self-hosted. The September figures (Free with 5k traces, Pro at $100/mo for 50k traces) no longer appear.
- **2026-10-13:** metric access can be scoped by project and by role ([release notes](https://docs.galileo.ai/release-notes)).
- **2026-10-27:** "decision model metrics" classify and score text "faster and at a much lower cost than LLM-as-a-judge metrics" ([release notes](https://docs.galileo.ai/release-notes)).
- **Judge stack:** Splunk docs now reference Luna-3, not Luna-2. Luna Studio fine-tunes custom evaluators from a custom LLM-as-judge prompt; it is Enterprise tier and deployed into the customer's own cluster or cloud. ([Splunk docs index](https://agent-observability-docs.splunk.com/llms.txt), undated, retrieved 2026-11-04)
- **Enterprise, re-checked:** SAML login endpoints, an SSO integration guide, user roles, and OpenTelemetry distributed tracing are all in the Splunk docs index (same source).
- **Also since 9/9:** Cisco launched Tokenomics in Splunk Agent Observability on 2026-09-15 ([Cisco newsroom](https://newsroom.cisco.com/c/r/newsroom/en/us/a/y2026/m09/cisco-delivers-trusted-ai-at-scale-through-new-splunk-advancements.html); in [digest 2026-09-28](competitive-intel/2026-09-28.md)).
- **Funding/acquisition:** acquired by Cisco, closed 2026-05-22. Carried from the 2026-09-21 digest, not re-verified.

### Weights & Biases Weave and CoreWeave Agent Lens (delta since 2026-09-09)

- **2026-09-30, CoreWeave Forge launch:** W&B Models, Weave, Inference, Sandboxes, ARIA (GA), and a new product, **Agent Lens** (public preview), are now one platform with Free, Pro, and Enterprise editions. MasterClass and Canva are named as building on Forge. ([CoreWeave IR press release](https://investors.coreweave.com/news/news-details/2026/CoreWeave-Forge-Launches-Turning-the-AI-Loop-Production-Run-Into-a-Better-Model-and-Agent/default.aspx), 2026-09-30) The digest covered Forge but not Agent Lens.
- **What Agent Lens does:** it is built on OpenTelemetry and the GenAI semantic conventions and accepts any OTel span, with a documented path that needs no SDK ([CoreWeave docs](https://docs.coreweave.com/products/agent-lens/what-is-agent-lens), undated, retrieved 2026-11-04). It "automatically surfaces semantic clusters of user intents and agent failures, with no configuration necessary." Insights and online LLM judges are free until the end of 2026. It is hosted only for now, with dedicated and on-prem "coming soon" ([CoreWeave blog](https://www.coreweave.com/blog/automate-agent-observability-and-improvement-with-coreweave-agent-lens), 2026-10-02). Evaluations and guardrails still live in Weave, not Agent Lens (docs, same page).
- **Pricing, re-checked 2026-11-04:** Pro "starts at $60/month" and is limited to teams under 50 employees. Weave ingestion is 1.5 GB/mo on Pro, then $0.10/MB; on Enterprise it is $0.20/MB. SSO, custom roles, and audit logs are Enterprise. ([pricing](https://wandb.ai/site/pricing/)) The $60 and $0.10/MB figures match September. The 50-employee cap and the Enterprise $0.20/MB rate are new on the page; when they changed is unknown.
- **Other since 9/9:** W&B Server 0.85.0 links Weave calls and agent spans in both directions ([release](https://github.com/wandb/server/releases/tag/0.85.0), 2026-09-23; in [digest 2026-09-28](competitive-intel/2026-09-28.md)).
- **Acquisition:** CoreWeave, about $1.7B, May 2025. Carried from 2026-09-09, not re-verified.

### Avido (full profile)

- **What it is:** an AI assurance platform that tests, monitors, and audits AI applications for financial institutions and produces evidence for risk teams, regulators, and EU AI Act reviewers ([avidoai.com](https://avidoai.com/), undated, retrieved 2026-11-04). **Buyer:** fintech and bank AI teams, plus their risk, compliance, and domain experts. The homepage says it is "built for" the EU AI Act, DORA, SR 11-7/MRM, and GDPR.
- **Category and overlap:** head-to-head. A buyer picks Avido when the deliverable is regulator-facing evidence: an audit trail of configuration changes, a "System Journal," knowledge-base testing, and issue routing to named owners. AgentScore still answers a question Avido does not, which is a grade on traffic the customer already has with no authored tasks. Avido's scores attach to tasks that are generated from uploaded conversations or written by hand, and its synthetic runs need the customer to expose a webhook ([docs intro](https://docs.avidoai.com/introduction), undated).
- **Eval model:** six eval types. Naturalness, Style, Fact Checker, Recall (RAG), and Custom are judge-based. Output Match is deterministic, "without using an LLM judge" ([Evaluations](https://docs.avidoai.com/evaluations), undated). Human annotation queues exist (API reference in [llms.txt](https://docs.avidoai.com/llms.txt)). Customer choice of judge model is not public; the docs mention only an opt-in for Avido's zero-retention LLMs and EU-hosted Azure OpenAI. **Verdict, not just a dashboard:** each task gets a one-line verdict ("ready to ship" when confidence and stability are both high), a 95% Wilson confidence interval, and a 0–100 Health Score (60% pass rate, 20% confidence, 20% stability) that is hidden when confidence is low. The thresholds cannot be changed ([Metrics](https://docs.avidoai.com/metrics), undated).
- **How data gets in:** Python and TypeScript SDKs, an event-ingest API, webhook-triggered synthetic tests, and OTLP JSON ingest with OpenInference conventions. OTLP was beta in v0.6.0 and gained GenAI semantic-convention extraction in v0.7.0 ([changelog](https://docs.avidoai.com/changelog), undated versions). Not zero-setup: task creation, eval linking, and a webhook come first. The Quickstart shortens this by generating tasks and criteria from uploaded conversations ([docs intro](https://docs.avidoai.com/introduction)).
- **Production vs pre-production:** both. A "Synthetic" tab covers scheduled and manual tests, and a "Monitoring" tab covers real production traffic, reported separately ([Metrics](https://docs.avidoai.com/metrics)). No runtime blocking is documented.
- **Enterprise:** SSO and TOTP 2FA (v0.6.0). The auth endpoint lists Google and Microsoft as providers; SAML is not stated. Owner, admin, and member roles ([llms.txt](https://docs.avidoai.com/llms.txt)). EU hosting, "Bring Your Own Cloud" with zero egress, and SOC 2 Type 2 "in progress" ([avidoai.com](https://avidoai.com/)). Product version is v0.9.1.
- **Pricing:** not public ([avidoai.com/pricing](https://avidoai.com/pricing) returns 404).
- **Proof:**
  - Funding: pre-seed from People Ventures, reported 2026-01-30 ([Nordic9](https://nordic9.com/news/avido-in-a-pre-seed-funding-deal-with-people/)), with the investor publicly welcomed on 2025-12-09 ([LinkedIn](https://www.linkedin.com/posts/lassehyldahl_better-late-than-never-to-share-this-publicly-activity-7404109104022970368-r-cy)).
  - PitchBook lists $554K seed on 2025-02-04, $774K raised to date, five employees, and backers Techstars, Mastercard Lighthouse, and ABN AMRO ([PitchBook](https://pitchbook.com/profiles/company/1034904-97), retrieved 2026-11-04).
  - Customers: Skatteguiden and Kamina, quoted on its homepage (undated). First-party only; no second source found.
- **What changed since 2026-09-09:** no dated change found. The changelog has version numbers but no dates. The last Python SDK release on PyPI is v1.75.0 on 2026-07-18 ([PyPI](https://pypi.org/project/avido/)).

### Impact AI (full profile)

- **What it is:** a no-code "AIProductOps" platform for testing, evaluating, and monitoring GenAI products, aimed at AI product managers ([impact.ai/platform](https://www.impact.ai/platform), undated, retrieved 2026-11-04).
- **Category and overlap:** head-to-head, on what it claims. A buyer would pick it to tie product metrics to business value, and for synthetic personas. Its public material gives no basis for comparing grading depth, so where AgentScore still differs cannot be sourced beyond AgentScore's own trace-based scoring.
- **Eval model:** "off-the-shelf Benchmarks and LLM as Judges," with custom metrics ([platform](https://www.impact.ai/platform)). Its Microsoft listing describes "multi-agent AI judges" and agents that "translate requests and success factors to score-able evals" ([AppSource](https://appsource.microsoft.com/en-us/product/web-apps/impactai1720079580386.impact-ai-platform?tab=overview), undated). It also collects user feedback and expert annotations. Customer choice of judge, and whether the output is a verdict or a dashboard: not public. The site describes a "centralized dashboard."
- **How data gets in:** "one-click syncing" with Azure AI Studio ([AppSource](https://appsource.microsoft.com/en-us/product/web-apps/impactai1720079580386.impact-ai-platform?tab=overview)). No public docs, SDK, or OpenTelemetry information (docs.impact.ai does not resolve).
- **Production vs pre-production:** both are claimed, "before deployment and in production," with simulated personas through "LLM as Users" ([impact.ai](https://www.impact.ai/)).
- **Enterprise:** not public.
- **Pricing:** not public ([impact.ai/pricing](https://www.impact.ai/pricing) returns 404).
- **Proof:**
  - Funding: €1.5M pre-seed, 2023-11-21, from 4u-ventures, mpoweru, angels, and Austrian agencies aws and FFG ([brutkasten](https://brutkasten.com/artikel/impact-ai-finanzierung-2023), [The SaaS News](https://www.thesaasnews.com/news/impact-ai-closes-1-5-million-in-pre-seed-round/)).
  - Customers: none named.
- **What changed since 2026-09-09:** no material change found.

### Runloop (full profile, short)

- **What it is:** sandbox infrastructure ("Devboxes") for running and evaluating AI coding agents, with a hosted benchmark harness (SWE-bench and others) ([runloop.ai](https://www.runloop.ai/), [launch release](https://runloop.ai/media/runloop-launches-public-benchmarks-industry-standard-testing-for-ai-coding-agents) 2025-06-18). **Buyer:** teams building coding agents.
- **Category:** adjacent. The job-to-be-done is giving coding agents an isolated place to run code, plus standard benchmark runs. It does not grade production behavior.
- **Status, the main finding:** "Runloop is winding down its services. Transition support for existing customers continues through November 13, 2026 at 11:59 PM PT." Its docs now carry migration guides to Tensorlake, Modal, and Freestyle and call Benchmarks "legacy" ([transition guides](https://docs.runloop.ai/docs/transitions/overview), undated, retrieved 2026-11-04). A third party quoted the same notice on 2026-10-25 ([Promigence](https://www.promigence.ai/docs/migrate/migrate-from-runloop-to-promigence)). The last changelog entry is dated 2026-08-19 ([changelog](https://docs.runloop.ai/docs/overview/release-notes)).
- **Eval model:** benchmark pass/fail on task suites. Not an LLM-judge product.
- **How data gets in:** Python and TypeScript SDKs, CLI, REST, and MCP for sandbox control ([llms.txt](https://docs.runloop.ai/llms.txt)).
- **Enterprise:** SOC 2, single tenant, and deploy-to-VPC on Enterprise ([runloop.ai](https://www.runloop.ai/)).
- **Pricing:** public but moot. Basic is free plus usage, Pro is $250/mo plus usage, Enterprise is custom ([pricing](https://www.runloop.ai/pricing), retrieved 2026-11-04).
- **Proof:** $7M seed, 2025-07-30, led by The General Partnership ([press release](https://runloop.ai/media/runloop-raises-7m-seed-round-to-bring-enterprise-grade-infrastructure-to-ai-coding-agents), [Tracxn](https://tracxn.com/d/companies/runloop-ai/__ECe7xqHfaLi4T6YxUHt-xbSUyvObBZXTwzJis1wq408/funding-and-investors)).
- **What changed since 2026-09-09:** the wind-down notice. Its exact posting date is unknown, but it was live by 2026-10-25.

### SimSpace (full profile, short)

- **What it is:** a cyber range that replicates a customer's production environment so that SOC teams and security AI agents can be tested against simulated attacks. It brands this as the "AI Proving Grounds" ([simspace.com](https://simspace.com/), undated, retrieved 2026-11-04). **Buyer:** security leaders, SOCs, government, and large enterprises.
- **Category:** adjacent (simulation). The job-to-be-done is proving that security agents and human defenders hold up against adversary emulation before production. It does not grade general agent behavior from traces.
- **Eval model:** readiness measured through range exercises, "agent functionality, governance boundaries, agentic attack surface risk, and financial ROI" ([simspace.com](https://simspace.com/)). The judge type is not public.
- **How data gets in:** the agent runs inside the range against hyper-synthetic data. Not zero-setup.
- **Production vs pre-production:** pre-production simulation only.
- **Enterprise:** SOC 2 Type II, ISO 27001, CMMC Level 2 ([simspace.com](https://simspace.com/)). RBAC, SSO, and self-host: not public.
- **Pricing:** not public.
- **Proof:**
  - Funding: $39M in debt and equity, 2025-10-27 ([SimSpace](https://simspace.com/blog/simspace-secures-39-million-in-new-funding-amid-surging-demand-for-advanced-cyber-ranges/), [PitchBook](https://pitchbook.com/profiles/company/173106-28)). Total raised disagrees between sources: $107M per PitchBook, $85.5M per [CB Insights](https://www.cbinsights.com/company/simspace/financials).
  - Customers: none named. It cites government agencies and the Fortune 100.
- **What changed since 2026-09-09:** EWI Radar launched 2026-10-27, an early-warning capability for testing defenses against active nation-state campaigns ([PR Newswire](https://www.prnewswire.com/news-releases/simspace-introduces-preemptive-capability-built-on-active-nation-state-threat-intelligence-302920725.html)).

### Giskard (full profile)

- **What it is:** a black-box red-teaming and quality platform that probes an agent through its API and returns a deploy-or-fix report ([giskard.ai](https://www.giskard.ai/), undated, retrieved 2026-11-04). **Buyer:** teams shipping text agents and RAG chatbots who need a security and business-risk sign-off. Named on the homepage: Michelin, BNP Paribas BCEF, Decathlon. First-party quotes only.
- **Category and overlap:** head-to-head on the ship decision, from the other direction. A buyer picks Giskard to find attacks and business-rule failures before users do, and to get a "Giskard Label" if the agent passes. AgentScore still grades traffic that already happened. Giskard generates the probes. It says it does not need production data or the agent's internals, only an API endpoint (same page).
- **Eval model:** security probes plus functional scenarios against the customer's requirements. The pricing page lists correctness and groundedness among the RAG metrics, and SSO and RBAC on Enterprise ([pricing](https://www.giskard.ai/pricing), undated). Judge type and whether the customer picks the judge: not public. The output is a verdict: "deploy or fix," with findings ranked by criticality (homepage).
- **How data gets in:** the agent's API. An open-source Python library covers the free tier ([pricing](https://www.giskard.ai/pricing)). Not zero-setup.
- **Production vs pre-production:** both are claimed, as continuous testing before and after deployment (homepage FAQ). The Autonomous Agent Audit also turns successful attacks into a replayable test suite ([AAA](https://www.giskard.ai/knowledge/introducing-the-autonomous-agent-audit-aaa), follows the 2026-10-21 session). A guardrails module for runtime protection is claimed in the homepage FAQ.
- **Enterprise:** RBAC, identity-provider integration, audit trails, EU or US residency, SOC 2 Type II, HIPAA, GDPR, and on-prem for "mission-critical" workloads (homepage). SAML is not named.
- **Pricing:** the open-source library is free. Enterprise is not public ([pricing](https://www.giskard.ai/pricing)).
- **Proof:** PitchBook reports a $4.97M early-stage round on 2025-02-19 and $6.58M raised in total ([PitchBook](https://pitchbook.com/profiles/company/484498-27), retrieved 2026-11-04). No first-party announcement of that round was found. No acquisition.
- **What changed since 2026-09-09:** the Autonomous Agent Audit. A sandboxed agent swarm starts from business harms, attacks, validates findings, and writes the report. Giskard says it found 15 of 16 planted issues on its own Zephyr benchmark, and says it built the target, so the number is not an independent result ([AAA](https://www.giskard.ai/knowledge/introducing-the-autonomous-agent-audit-aaa)).

### HiddenLayer (full profile, short)

- **What it is:** an AI security platform covering discovery, supply-chain scanning, attack simulation, and a runtime firewall for agentic, generative, and predictive AI ([hiddenlayer.com](https://www.hiddenlayer.com/), undated, retrieved 2026-11-04). **Buyer:** CISOs and security teams.
- **Category:** adjacent (AI security). The job-to-be-done is finding and blocking attacks on AI systems. It does not grade whether an agent did the task well.
- **Eval model:** attack simulation and model scanning, not a quality score. Judge type: not its job.
- **How data gets in:** "non-invasive" runtime detection that the company says does not need the customer's model or training data (homepage quote from Doug Merritt). Integrations into CI/CD, MLOps, and SIEM are claimed. Not a trace-scoring ingest.
- **Production vs pre-production:** both. Scanning and simulation before, a firewall at runtime.
- **Enterprise:** not public for RBAC, SSO, or self-host.
- **Pricing:** not public.
- **Proof:** $100M Series B, 2026-09-02, led by Delta-v Capital, with Ten Eleven, Morgan Stanley, M12, and Booz Allen Ventures ([HiddenLayer](https://www.hiddenlayer.com/news/hiddenlayer-100m-series-b-ai-security), [Holland & Knight](https://www.hklaw.com/en/news/pressreleases/2026/09/holland-and-knight-advises-hiddenlayer-on-series-b-funding-round), 2026-09-28). No named deployment was confirmed. The homepage quotes are endorsements, not customer claims.
- **What changed since 2026-09-09:** no material change found. The Series B closed seven days before the cutoff, and it is the round that funded "Agent Harness Security" for coding agents (same HiddenLayer post).

### Inflectra SureWire (full profile)

- **What it is:** a beta QA product that probes chatbots and conversational agents and returns a quality and risk report ([SureWire](https://www.inflectra.com/Products/SureWire/), undated, retrieved 2026-11-04). Inflectra's main business is Spira test management. **Buyer:** QA and engineering teams who already test software and now have an agent. No SureWire customer is named.
- **Category and overlap:** head-to-head, early. A buyer picks SureWire to stress-test an agent from a plain-language description before release, and to get documented pass, fail, or partial findings. AgentScore still scores real traces without a test plan. SureWire does not read production traffic.
- **Eval model:** "Judge Agents" score responses. The customer describes the agent and the concern. A 0–100 quality score is specific to that test plan, and a confidence score reflects variance across runs ([FAQ](https://www.inflectra.com/Ideas/Entry/13-things-sure-can-catch-that-traditional-qa-cant-1990.aspx), 2026-04-13). The beta uses Inflectra's own quality model. Custom criteria and grounding against the customer's documents are described as future, not shipped (same FAQ).
- **How data gets in:** a public API endpoint, or Inflectra's demo agents (same FAQ). The product page's three steps are Describe, Assess, Results. Not zero-setup, and not OpenTelemetry.
- **Production vs pre-production:** pre-production probing, including multi-turn conversations ([SureWire](https://www.inflectra.com/Products/SureWire/)). It does not block runtime actions.
- **Enterprise:** not public for SureWire. Spira's RBAC is a different product ([AWS Marketplace](https://aws.amazon.com/marketplace/pp/prodview-4ve3kml7fi4sm)). On-prem for SureWire is being designed, not offered (FAQ, 2026-04-13).
- **Pricing:** free for the beta, no card required ([SureWire](https://www.inflectra.com/Products/SureWire/)). GA price is not public. Early-access members were promised preferred pricing at GA, then expected late 2026 ([PR Newswire](https://ai-techpark.com/inflectra-launches-free-early-access-for-surewire/), 2026-04-10).
- **Proof:** no funding round found. Inflectra Corporation has sold test management since 2006 ([EULA](https://www.inflectra.com/Purchase/InflectraEULA.htm)).
- **What changed since 2026-09-09:** no material change found. SureWire was announced 2026-03-04 and opened early access 2026-04-08 ([Inflectra](https://www.inflectra.com/Company/Article/introducing-surewire-the-boundary-between-experime-1972.aspx), [press release](https://www.inflectra.com/Company/Article/inflectra-launches-free-early-access-for-surewire--1989.aspx)). It was demoed at STARWEST on 2026-09-24, still as an early look ([event page](https://www.inflectra.com/Company/Event/inflectra-at-starwest-2026-2039.aspx)).

### Synthesized (full profile, short)

- **What it is:** test-data infrastructure that masks, subsets, and generates production-like data inside the customer's environment ([synthesized.io](https://www.synthesized.io/), undated, retrieved 2026-11-04). **Buyer:** enterprise QA, SAP migration, and teams who need a safe dataset before an agent can be tested. Deutsche Bank is named for test-data access on the homepage, and Fortune reports Deutsche Bank as both a customer and an investor ([Fortune](https://fortune.com/2025/09/24/synthesized-series-a-20-million-for-ai-powered-software-testing-qa-redalpine/), 2025-09-24).
- **Category:** adjacent (synthetic data). The job-to-be-done is building the data and system state a test runs against. Synthesized says so directly: "It doesn't score your agent. It builds the environment your evaluation tool scores it in" ([Test Data Agent](https://www.synthesized.io/testdataagent), updated October 2026).
- **Eval model:** not its job.
- **How data gets in:** it connects to the customer's databases, including SAP HANA, and is triggered by REST or CI/CD (homepage, [announcement](https://www.synthesized.io/post/introducing-test-data-agent), 2026-08-18). It also lists Tricentis Tosca as an integration (homepage).
- **Production vs pre-production:** pre-production data only. It does not observe or block production agents.
- **Enterprise:** runs in the customer's cloud tenant or on-prem ([terms](https://www.synthesized.io/synthesized-software-terms), updated 2026-10-01; homepage). RBAC and SSO: not public.
- **Pricing:** not public.
- **Proof:** $20M Series A, 2025-09-24, led by Redalpine, with IQ Capital, Mercia, UBS, Seedcamp, and Deutsche Bank ([Fortune](https://fortune.com/2025/09/24/synthesized-series-a-20-million-for-ai-powered-software-testing-qa-redalpine/), [CB Insights](https://www.cbinsights.com/company/synthesized/financials)).
- **What changed since 2026-09-09:** Test Data Agent is now described as generally available ([product page](https://www.synthesized.io/testdataagent), updated October 2026). On 2026-08-18 it was limited availability, with GA promised later in the quarter ([GlobeNewswire via Yahoo](https://finance.yahoo.com/technology/ai/articles/synthesized-introduces-test-data-agent-060000726.html)).

### Harness AI Evals (full profile)

- **What it is:** a quality gate inside Harness CI/CD that scores an agent against a dataset and can fail the pipeline ([AI Evals](https://www.harness.io/products/ai-evals), undated, retrieved 2026-11-04). **Buyer:** platform and release teams already on Harness. It is in beta, with unnamed design partners. The testimonial on the page is a Harness employee, so it is not a customer proof.
- **Category and overlap:** head-to-head on the release decision. A buyer picks Harness when the score has to block a deploy in the pipeline they already run. AgentScore still produces a verdict from real traces without a golden dataset. Harness's own FAQ says the dataset is the ground truth, curated or synthesized from a description (same page).
- **Eval model:** 50+ metrics across LLM-as-judge, deterministic checks, and semantic similarity, including trajectory (step, tool call, and outcome). The customer writes custom rubrics in English or Python, and LLM-as-judge metrics need a Judge connector, so the judge is the customer's ([docs](https://developer.harness.io/ai-evals/whats-supported), [product FAQ](https://www.harness.io/products/ai-evals)). The gate is pass/fail against a threshold. Analytics are a dashboard of pass rate, cost, and latency.
- **How data gets in:** a prompt target, an HTTP endpoint, or a file of precomputed outputs ([docs](https://developer.harness.io/ai-evals/whats-supported)). The open-source `harness-evals` SDK (Apache 2.0) also imports production traces through OpenTelemetry and Langfuse ([AgentTrace](https://www.harness.io/blog/introducing-agent-trace), published 2026-07-21). Not zero-setup: a dataset and a metric set come first.
- **Production vs pre-production:** both. Offline runs gate the deploy. Online scores a sample of live traffic and can promote a failure into the dataset (product page). The gate blocks a release, not a live agent action.
- **Enterprise:** the product lists RBAC, OPA policy, audit trails, secrets, SSO, and data residency (product page schema). Harness platform SSO is SAML, including Okta ([platform FAQ](https://developer.harness.io/harness-ai/knowledge-base-and-faqs/harness-platform-faqs)). The SDK runs locally. Self-host of the control plane is not stated.
- **Pricing:** not public for AI Evals. The page points at a free Harness platform plan, which is not an AI Evals price.
- **Proof:** no funding round was re-checked for this teardown. The SDK repo was created 2026-04-20 ([GitHub](https://github.com/harness/harness-evals)).
- **What changed since 2026-09-09:** no material product change found. The SDK kept shipping, through v0.28.0 on 2026-10-30, and those release notes are empty ([v0.28.0](https://github.com/harness/harness-evals/releases/tag/v0.28.0)). The product page still says beta.

---

## 3. Comparison matrix

Values: **shipped**, **partial**, **absent**, **not public**, or **not its job**. A blank cell means no source either way. "Carried" means taken from the 2026-09-09 report and not re-verified.

| Row | **AgentScore** | Arize | Galileo / Splunk AO | W&B Weave + Agent Lens | Avido | Impact AI | Giskard | Harness AI Evals | Inflectra SureWire | Runloop | SimSpace | HiddenLayer | Synthesized |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Core stance | Auto-grade real behavior from OTel; verdict | Observability + eval; agent-driven investigation | Observability + eval + guardrails, in Splunk | Trace + eval; auto failure insights (preview) | Assurance evidence for regulated finance | No-code AIProductOps | Black-box red team; deploy or fix | CI quality gate on a dataset | Probe an API from a written test plan | Coding-agent sandboxes; winding down | Cyber range for security agents | AI security across the lifecycle | Safe test data, not a score |
| Trace scoring | shipped | shipped | shipped (carried) | shipped (carried) | shipped | not public | not its job | partial (sampled live traffic) | not its job | not its job | not its job | not its job | not its job |
| Session scoring | shipped | shipped | shipped (multi-turn, 2026-06-23) | shipped (carried) | partial (session grouping; scoring per task) | not public | not its job | partial (trajectory, not a session score) | partial (multi-turn probes) | not its job | not its job | not its job | not its job |
| LLM-as-judge | shipped | shipped | shipped + Luna SLM + decision models | shipped | shipped | shipped (claimed) | not public | shipped | shipped (Judge Agents) | not its job | not public | not its job | not its job |
| Customer-selectable judge | shipped (Bedrock catalog) | partial (BYOK, Enterprise only) | shipped (Luna Studio custom judge, Enterprise) | shipped (carried) | not public | not public | not public | shipped (Judge connector, custom rubrics) | absent (own model; custom criteria planned) | not its job | not public | not its job | not its job |
| Failure attribution | shipped | shipped (Alyx, Signal) | not public | partial (Agent Lens failure clusters, preview) | partial (Inbox clustering, per-eval breakdown) | not public | shipped (ranked findings with evidence) | partial (suite score down to the item) | partial (pass / fail / partial, with why) | not its job | not its job | not its job | not its job |
| RBAC | absent | shipped | shipped (role-scoped metrics 2026-10-13) | shipped (team Pro; custom roles Ent) | partial (owner/admin/member) | not public | shipped | shipped | not public | not public | not public | not public | not public |
| SSO/SAML | partial (Tricentis Okta; no customer IdP) | shipped (Ent) | shipped (SAML) | shipped (Ent) | partial (SSO; SAML not stated) | not public | partial (IdP; SAML not named) | shipped (SAML) | not public | not public | not public | not public | not public |
| SDK breadth | absent (OTel + MCP only) | Py/TS/Java (carried) | Py/TS (carried) | Py/TS + Forge SDK | Py/TS | not public | Python (open source) | Python (`harness-evals`) | not public | Py/TS (sandbox control) | not public | not public | REST / CI trigger |
| OpenTelemetry ingest | shipped (only path) | shipped | shipped | shipped (no SDK needed) | partial (OTLP JSON, labeled beta) | not public | absent (API only) | shipped (SDK importer) | absent | not its job | not its job | not its job | not its job |
| Zero-config auto-profile | shipped | partial (Signal finds issues; no fitted score) | absent (carried) | partial (auto clusters; no score) | partial (Quickstart drafts tasks and criteria) | partial (claimed) | absent | absent (dataset and metrics required) | absent (customer writes the plan) | not its job | not its job | not its job | not its job |
| Simulation | absent | absent (carried) | absent (carried) | absent | shipped (webhook synthetic tests) | shipped (claimed personas) | shipped (generated attacks) | partial (synthesized datasets) | shipped (generated probes) | partial (legacy benchmarks) | shipped | shipped (attack simulation) | shipped (the environment) |
| Runtime guardrails | absent | partial (carried) | shipped | partial (in Weave) | not public | not public | shipped (claimed module) | absent (blocks a release, not a live action) | not its job | not its job | not its job | shipped | not its job |
| Self-host | absent | shipped (Ent) | shipped | partial (Weave private hosting; Agent Lens hosted only) | shipped (BYOC, claimed) | not public | shipped (on-prem) | partial (SDK local; control plane not stated) | absent (being designed) | shipped (VPC, Ent) | not public | not public | shipped |
| Deployment maturity | partial (prod live; invites began 2026-11-02) | GA | GA (Splunk product) | Weave GA; Agent Lens preview | early (v0.9.1; SOC 2 in progress) | early | GA; AAA new 2026-10-21 | beta | beta (since 2026-04-08) | winding down | GA (founded 2015) | GA | GA (Test Data Agent, Oct 2026) |
| Ecosystem hook | AI Workspace + MCP | Dynatrace | Splunk / Cisco | CoreWeave Forge | EU finance regulation; bank accelerators | Azure AI Studio | any API; EU entity | Harness pipelines | Spira / Inflectra QA suite | none | AI Proving Grounds Consortium | SIEM, including Splunk | SAP, and Tricentis Tosca |

---

## 4. So what for AgentScore

Avido, Giskard, Harness AI Evals, and Inflectra SureWire are the names that compete for a ship decision, and each one still needs the customer to author tasks, point at an API, or bring a golden set. The zero-setup gap narrowed only on the observability side, where Agent Lens and Arize Signal cluster failures in traces without fitting a profile or returning a verdict, and it did not narrow for anyone else on the slide. The cheap-judge gap got wider at Galileo, with decision-model metrics on 2026-10-27, and the enterprise-auth gap is unchanged. HiddenLayer, Synthesized, SimSpace, and Runloop are a distraction for the grading buyer: runtime AI security, test data, cyber ranges, and a sandbox vendor winding down on 2026-11-13. Synthesized is the one of those that already shows up next to Tricentis, because its homepage lists Tosca as an integration and it says outright that it does not score the agent.
