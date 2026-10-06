# Competitor Intel - 2026-10-05

_Dedup baseline: 2026-09-29 digest. This is a catch-up run: the scheduled job did not fire Sept 30 - Oct 4, so the window covers the full week. Checked all 12 tracked/watch-list competitors. Braintrust, Arize AI, Galileo, W&B Weave, Arato, Patronus AI, int4 TrustGate, Maxim AI had nothing new beyond what is in the 09-23, 09-28 or 09-29 digests. Customer-sentiment and usage searches mostly returned vendor-adjacent roundups and aggregator reviews, so only items naming a specific feature or workflow are included._

## Langfuse
- **Update:** v4.49.0 to v4.51.0 shipped Oct 1-5, 2026. v4.51.0 adds decision-model evaluators and direct annotation from experiment comparison grids; v4.50.0 adds seven-day execution-health metrics per evaluator; v4.49.0 adds org-level ingestion overview and analytics. ([GitHub releases](https://github.com/langfuse/langfuse/releases))
- **Update:** "Experiments as a First-Class Concept" (about Sept 22, 2026): experiments now sit beside Datasets as their own top-level feature, runnable with or without a dataset, comparable across runs. Boolean LLM-as-a-Judge scores landed about a week earlier. ([Langfuse changelog](https://langfuse.com/changelog))

## LangSmith (LangChain)
- **Update:** Sept 14-21, 2026 release notes cover dataset improvements, evaluator validation enhancements, and trajectory evaluation refinements; the Sept 7-14 notes add longer retention limits. ([LangSmith changelog](https://docs.langchain.com/langsmith/changelog))
- **Customers love:** The trace view, described as giving a clear picture of the full execution path including retrieval, prompts, model responses and tool calls; common complaints are pricing for small teams and the interface slowing under many experiments. ([G2 reviews](https://www.g2.com/products/langsmith/reviews))

## Comet / Opik
- **Update:** Opik 2.2.88 to 2.2.90 (Oct 1-5, 2026): annotation queue automation on by default, free-form SQL row policies for traces and spans, experiment comparison now shows prompt versions. Routine point releases, listed for completeness. ([GitHub releases](https://github.com/comet-ml/opik/releases))

## Confident AI / DeepEval
- **Update:** DeepEval python-v4.2.4 (Sept 22, 2026) integrates TypeSafe AI's "Jev" judge model, which maps verdicts to probabilities through fixed thresholds to cut flakiness, and adds categorical LLM-as-a-judge classifiers for closed-set labels. ([GitHub releases](https://github.com/confident-ai/deepeval/releases))
- **Using it for:** DeepEval as the local/CI test layer with Confident AI as the production scoring layer, applying the same 50+ metrics to every trace; one June 2026 hands-on review ran it on a RAG support agent. ([Techsy review](https://techsy.io/en/blog/confident-ai-review))

## So what for AgentScore
Both Langfuse (decision-model evaluators, boolean judge scores, experiments as a top-level object) and DeepEval (probability-mapped verdicts with fixed thresholds) are pushing toward discrete, repeatable pass/fail outputs from LLM judges. That is the same direction as AgentScore's 0-100 score plus verdict, and the DeepEval framing around judge flakiness is worth reading against our determinism work. Neither ships a ship/don't-ship verdict for a whole agent yet.
