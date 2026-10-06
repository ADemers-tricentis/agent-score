# Eval-to-Harm-Category Mapping (Draft v0)

Step 1 of the risk cost function. Tags each eval with the harm it protects against and a default severity, so a failed check can be priced instead of only scored. See `risk-cost-function-mock.html` for how this would surface, and `docs/research/ai-risk-cost-function-research.md` for the FAIR / NIST background.

**Status: proposal.** Categories and severities below are my judgment calls, not validated with customers or risk/legal owners. Nothing here is wired into the product.

## Source

The mapping covers the **real 41-eval catalog** exported from the Back Office on 2026-10-06 (all 41 are `active`). Rows are keyed by catalog slug. The export carries dimension IDs only (no names), so the Family column is my own grouping, not the product's dimensions. The customer docs (`EvalCatalog.tsx`) and the frontend fixtures describe different evals and should not be used as the source of truth. See "Catalog drift" below.

## Harm categories

| Code | Category | What it covers |
| --- | --- | --- |
| REG | Regulatory | Fines, enforcement, license or conduct breaches, discrimination law |
| PRIV | Data privacy | Exposure of personal or confidential data (breach notification, GDPR/CCPA). Kept separate from REG because it is the most common trigger and has its own per-record cost model |
| REP | Reputational | Brand damage, lost trust, escalations, PR response |
| FIN | Financial | Direct monetary loss: wrong amounts, wrong actions, bad decisions acted on |
| OPS | Operational | Rework, failed workflows, wasted spend, degraded service. No external incident |

## Severity tiers (default)

| Tier | Meaning |
| --- | --- |
| 5 | Reportable incident or enforcement-grade breach. Caps the verdict at Don't ship |
| 4 | Serious: likely customer-visible, legal or privacy review triggered |
| 3 | Material: real customer or money impact, contained |
| 2 | Minor: friction, rework, small errors |
| 1 | Cosmetic or cost-only |

Severity is a default for the eval in a typical customer-facing deployment. The customer's risk profile (Financial Services, Healthcare, etc.) changes the weight per category, and a customer can override severity per agent.

## Mapping

Signal rows are detection evals about the user, not failures of the agent, so they carry no cost of their own. Template rows inherit from the eval they were derived from.

| Family | Eval (slug) | Kind | Primary | Secondary | Default sev | Rationale | Reference anchor |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Safety | `bias` | library | REG | REP | 4 | Discriminatory outputs create legal exposure and press risk | EU AI Act Art. 15 and anti-discrimination law; NIST AI 600-1 (harmful bias) |
| Safety | `toxicity` | library | REP | REG | 3 | Mostly brand harm; regulatory only in harassment or consumer-protection contexts | NIST AI 600-1 (harmful content) |
| Safety | `pii_leakage` | library | PRIV | REG | 4 | Triggers breach notification and fines; priced per exposed record | OWASP LLM02; GDPR Art. 33 |
| Safety | `non_advice` | library | REG | FIN | 5 | Agent gives regulated financial, medical or legal advice it should not. The natural severity-5 verdict cap | OWASP LLM06; sector licensing rules (outside the four anchors) |
| Safety | `misuse` | library | REG | REP | 3 | Agent used outside its intended domain. Re-rated from 4 because the catalog definition is out-of-domain use, not illegal use | OWASP LLM06 |
| Safety | `role_violation` | library | REP | REG | 3 | Agent breaks its assigned role or persona constraints | OWASP LLM06 |
| Groundedness & RAG | `hallucination` | library | FIN | REP | 3 | Fabricated facts acted on cause direct loss; raise to 4 in regulated domains | OWASP LLM09; NIST AI 600-1 (confabulation) |
| Groundedness & RAG | `faithfulness` | library | FIN | REP | 3 | Answer not supported by retrieved context, same exposure as hallucination | OWASP LLM09 |
| Groundedness & RAG | `turn_faithfulness` | library | FIN | REP | 3 | Per-turn version of faithfulness for conversations | OWASP LLM09 |
| Groundedness & RAG | `contextual_precision` | library | OPS | none | 1 | Retrieval ranking quality, degrades answers indirectly | n/a |
| Groundedness & RAG | `contextual_recall` | library | OPS | FIN | 2 | Retrieved context misses the answer, leads to incomplete answers | n/a |
| Groundedness & RAG | `contextual_relevancy` | library | OPS | none | 1 | Noisy retrieval, mostly cost and latency | n/a |
| Groundedness & RAG | `turn_contextual_precision` | library | OPS | none | 1 | Per-turn version of contextual precision | n/a |
| Groundedness & RAG | `turn_contextual_recall` | library | OPS | FIN | 2 | Per-turn version of contextual recall | n/a |
| Groundedness & RAG | `turn_contextual_relevancy` | library | OPS | none | 1 | Per-turn version of contextual relevancy | n/a |
| Correctness & relevance | `answer_correctness` | library | FIN | REP | 3 | Wrong answers acted on; the "$50K-$2.1M per incident" case in the business case. Needs a golden answer | EU AI Act Art. 15 (accuracy) |
| Correctness & relevance | `answer_relevancy` | library | OPS | REP | 2 | Off-target answers, friction and escalations | n/a |
| Correctness & relevance | `turn_relevancy` | library | OPS | REP | 2 | Per-turn relevancy of the reply | n/a |
| Correctness & relevance | `conversation_relevancy` | library | OPS | REP | 2 | Relevancy across the whole conversation | n/a |
| Correctness & relevance | `prompt_alignment` | library | OPS | REG | 2 | Agent follows the instructions in its prompt. Becomes REG, sev 3+, if the prompt encodes compliance rules | n/a |
| Correctness & relevance | `summarization` | library | FIN | REP | 2 | Lossy or distorted summaries feed decisions | OWASP LLM09 |
| Agentic & tool-use | `tool_use` | library | FIN | OPS | 2 | Overall tool usage quality; wrong tool calls perform real actions | OWASP LLM06 |
| Agentic & tool-use | `argument_correctness` | library | FIN | OPS | 3 | Right tool, wrong parameters (amount, recipient, record) | OWASP LLM06 |
| Agentic & tool-use | `task_completion` | library | OPS | FIN | 2 | Failed workflows, rework, unresolved requests | n/a |
| Agentic & tool-use | `mcp_task_completion` | library | OPS | FIN | 2 | Single-turn task completion through MCP tools | n/a |
| Agentic & tool-use | `mcp_use` | library | OPS | FIN | 2 | Quality of MCP tool use in a turn | OWASP LLM06 |
| Agentic & tool-use | `multi_turn_mcp_use` | library | OPS | FIN | 2 | Quality of MCP tool use across a conversation | OWASP LLM06 |
| Agentic & tool-use | `plan_quality` | library | OPS | none | 1 | Coherence and efficiency of the plan | n/a |
| Agentic & tool-use | `plan_adherence` | library | OPS | REG | 2 | Skipped steps; becomes REG if the skipped step is a required control or escalation | EU AI Act Art. 14 (oversight) |
| Agentic & tool-use | `step_efficiency` | library | OPS | FIN | 1 | Unnecessary steps and tokens, no incident (the 40-60% wasted-token figure) | OWASP LLM10 (loose) |
| Conversational | `goal_accuracy` | library | OPS | REP | 2 | Conversation does not reach the user's goal | n/a |
| Conversational | `conversation_completeness` | library | OPS | REP | 2 | Not all user intentions satisfied | n/a |
| Conversational | `role_adherence` | library | REP | OPS | 2 | Persona drift across the conversation (softer than role_violation) | n/a |
| Conversational | `topic_adherence` | library | REP | REG | 2 | Agent wanders into topics it should avoid; relevant topics are set per profile | OWASP LLM06 (loose) |
| Conversational | `knowledge_retention` | library | OPS | REP | 2 | Customer repeats themselves, drop in experience | n/a |
| Quality & efficiency | `conciseness` | g_eval | OPS | none | 1 | Cost and readability only | OWASP LLM10 (loose) |
| User signals | `user_distress` | g_eval | Signal | none | - | Detects distress or frustration in the user. Not an agent failure, so no cost. Candidate severity multiplier when it co-occurs with another failure | n/a |
| User signals | `user_disagreement` | g_eval | Signal | none | - | Detects user pushback. Not an agent failure. Possible leading indicator of REP risk | n/a |
| User signals | `out_of_scope_request` | g_eval | Signal | none | - | Detects requests outside the agent's remit. Not a failure, but a useful exposure-volume input for misuse | n/a |
| Templates | `template-safe-output` | library | as toxicity |  | as toxicity | Starter template. A clone inherits the toxicity mapping | as toxicity |
| Templates | `template-helpful-answer` | g_eval | as answer_relevancy |  | as answer_relevancy | Starter template. A clone inherits the answer_relevancy mapping | as answer_relevancy |

## Reference anchors

Four external references back the "Reference anchor" column. Numbering and titles were checked against public sources in October 2026. **Scope note:** these anchors justify why a category exists. They do not prove legal liability for any specific customer, so customer-facing copy should say "relevant exposure", not "required by".

### 1. OWASP Top 10 for LLM Applications (2025)

A community security ranking from the OWASP GenAI Security Project (v2.0, published November 2024) of the top 10 risks specific to LLM apps. It is a security checklist, not a law, but security reviewers already use its vocabulary.

| ID | Name | Used for | Fit |
| --- | --- | --- | --- |
| LLM01 | Prompt Injection | Missing prompt injection eval (see Gaps) | Strong |
| LLM02 | Sensitive Information Disclosure | PII Leakage | Strong |
| LLM05 | Improper Output Handling | No current eval (JSON Correctness is in the docs but not the catalog) | n/a |
| LLM06 | Excessive Agency | Non-Advice, Misuse, Role Violation, Tool Use, Argument Correctness, MCP Use | Strong for the tool evals and Non-Advice, looser for Misuse and Topic Adherence |
| LLM09 | Misinformation | Hallucination, Faithfulness, Turn Faithfulness, Summarization | Strong |
| LLM10 | Unbounded Consumption | Conciseness, Step Efficiency | **Weak.** It covers denial-of-service and runaway cost abuse, not verbosity. Marked "loose" in the table |

How it applies: justifies a category and gives buyers a shared vocabulary. It supplies no severity or dollar figures.

### 2. EU AI Act

The EU's binding AI regulation, with requirements for high-risk AI systems.

| Article | Subject | Used for |
| --- | --- | --- |
| Art. 5 | Prohibited practices | None directly. Catalog Misuse means out-of-domain use, not prohibited use |
| Art. 14 | Human oversight | Plan Adherence, skipped escalation |
| Art. 15 | Accuracy, robustness, cybersecurity | Answer Correctness, Bias, and the missing prompt injection eval |

Caveats:
- **Scope.** Obligations fall on providers of high-risk systems. Many customers are deployers, or their agent is not in a high-risk category.
- **Art. 10 is not used.** It governs training, validation and test data quality, not output bias testing, so it is a weak anchor for the Bias eval. Art. 15 and anti-discrimination law are the more direct hooks.

How it applies: shows regulators treat accuracy, oversight and bias as compliance matters, which supports tagging them Regulatory. Fine amounts come from the customer's actual exposure.

### 3. GDPR Art. 33 (with Art. 83 for fines)

Requires a controller to notify the supervisory authority within 72 hours of becoming aware of a personal data breach, unless the breach is unlikely to risk people's rights. Art. 83 sets the fine tiers, and late notification can be fined independently of the breach.

Used for: PII Leakage (Data privacy, severity 4).

How it applies: the strongest anchor in the set because it gives a hard cost trigger. A leak of personal data starts a notification clock and a per-record cost model. Limits: it only applies to personal data of EU residents, and the leak must meet GDPR's definition of a breach. US customers would instead need state breach laws (CCPA and others), which are not yet listed here.

### 4. NIST AI RMF 1.0 and the Generative AI Profile (AI 600-1)

A voluntary US framework with four functions: Govern, Map, Measure, Manage. The Generative AI Profile (AI 600-1, July 2024) adds 12 GenAI-specific risk categories, including confabulation, harmful bias, data privacy and information security.

Used for: Bias (harmful bias), Toxicity (harmful content), Hallucination (confabulation).

How it applies: it is the organizing frame for the whole exercise: map each failure to a harm, then measure against it. It does not prescribe severities or dollars. Cite the Generative AI Profile for specific evals since it names the risks, and the core RMF only for the overall approach.

### Sources

- [OWASP Top 10 for LLM Applications 2025 summary](https://help.hcl-software.com/appscan/Enterprise/10.10.0/topics/r_owasp_top_10_for_llm.html)
- [EU AI Act Article 10](https://artificialintelligenceact.eu/article/10/)
- [EU AI Act high-risk requirements breakdown](https://www.appliedai-institute.de/assets/files/Content-breakdown-High-Risk-Requirements.pdf)
- [GDPR Art. 33 and the 72-hour rule](https://www.legiscope.com/blog/gdpr-article-33-breach-notification-authority.html)
- [NIST AI RMF overview](https://www.scrut.io/post/nist-ai-risk-management-framework)
- [NIST AI 600-1 Generative AI Profile](https://docs.modulos.ai/frameworks/nist-ai-rmf/generative-ai-profile)

These are secondary summaries. Before anything goes in customer material, confirm article wording against the primary texts (EUR-Lex, OWASP, NIST).

## Catalog drift

The catalog and the customer docs disagree. Worth fixing before a customer sees both:

- **In the docs but not the catalog:** JSON Correctness, Exact / Pattern Match, Tool Correctness, Trajectory Efficiency. The nearest catalog evals are `argument_correctness`, `tool_use` and `step_efficiency`.
- **In the catalog but not the docs:** `non_advice`, `out_of_scope_request`, `user_distress`, `user_disagreement`, the `mcp_*` evals, `plan_quality`, `conversation_completeness`, and the `turn_*` family.
- **Eval count:** the docs say 41 (correct), but the docs screenshot caption says 62 and the frontend fixtures hold 13.

## Gaps this mapping exposes

1. **Prompt injection resistance is still missing (REG, sev 3).** No catalog eval covers it, and the only related fixture eval (`adversarial_robustness`) is archived. OWASP LLM01 is the top item on the standard list, so this is the most conspicuous hole.
2. **Skipped human escalation is still missing (REG, sev 4).** The closest catalog eval is `plan_adherence`, rated 2 here.
3. **Regulated advice is covered.** `non_advice` exists and is the natural severity-5 verdict cap. This closes the gap I flagged in the earlier draft.
4. **The mock uses made-up eval names.** `answer_accuracy`, `regulated_advice` and `prompt_injection_resistance` are not in the catalog. Swap in `answer_correctness` and `non_advice`, and either add a prompt injection eval or drop that row, before showing the mock externally.

## Open questions

- **Is Data privacy its own category?** The earlier research doc filed PII under Regulatory. I split it out because it has a per-record cost model, but it adds a sixth bar to explain. Easy to merge back.
- **Who owns severity?** If AgentScore sets defaults, they are opinion unless anchored to a framework. The reference column is a starting point. Numbers were checked against secondary sources only (see Reference anchors), so confirm against primary texts before this appears in customer material.
- **Static or per-domain severity?** Hallucination is a 3 in retail and a 4 or 5 in healthcare. Profiles can handle this through weights, but severity itself may need a per-domain override table.
- **Multi-category evals.** Secondary category is captured here but the mock only prices the primary. Decide whether secondary adds a fractional cost or is display-only.
- **User signals as multipliers.** Should `user_distress` raise the severity of a co-occurring failure (for example PII leakage to a distressed user)? Interesting, but it needs a co-occurrence model.
- **Per-turn duplicates.** The `turn_*` evals duplicate their whole-answer versions. Decide whether cost counts both or takes the max.

## Next steps

1. Review severities with one risk-literate person, ideally a prospect in financial services or healthcare. Start with the 6 Safety rows, since they carry the cost.
2. Update the mock to use the real eval slugs above.
3. Decide whether to add prompt injection and skipped-escalation evals to the catalog.
4. Confirm the anchor article and item numbers against primary texts.
