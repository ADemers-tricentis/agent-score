# AgentScore Demo Debrief - Workday Feedback Session

**Date of session:** 2026-07-24
**Source:** `2026_07_24_10_01_38_en_annotated.txt` (recorded call transcript)
**Format:** Slides-only intro (no live demo - engineering issues flagged upfront)
**Analyst:** Lead PM review

## Room composition

Two personas, very different lenses:

- **Tricentis side:** Greg (account/sales, SPEAKER_00), SPEAKER_02 (intro/host), Andrew Demers (presenter/PM, SPEAKER_05).
- **Workday side (the buyers):** Rushi / delivery director owning agent delivery (SPEAKER_04), Pradeep - senior QA with agent testing + automation experience (SPEAKER_01/03). They run **Workday agents and Salesforce Agentforce agents** against external Data Cloud + RAG.

That QA-and-delivery lens shaped the entire Q&A.

---

## What landed

**1. "Knowing what to measure" as the core wedge.**
The strongest, clearest part of the pitch. Andrew's closer nailed it: evals are largely a solved problem, but knowing you need to add a ground-truth source, a correctness metric, or a prompt-compliance eval is the hard part. Differentiated and defensible - the one message that survived the whole call intact.

**2. Zero-integration, OTel-native positioning.**
"Add two lines to your OTel exporter, any agent anywhere" consistently resonated as low-friction. Andrew had a clean, repeatable answer for Agentforce, Workday agents, LangChain/LangGraph, and custom loops. The "single pane of glass for every agent" angle is a real enterprise hook for a multi-stack shop.

**3. Reliability signals as a maturity marker.**
Confidence intervals, pass@k, and minimum-sample gating (20 traces before a score) read as credible to a technical QA audience and separate AgentScore from "LLM-judge-in-a-box" tools.

**4. Root-cause attribution.**
The "wrong tool -> bad data -> bad answer, here's the span and a recommended fix" walkthrough was the most compelling capability narrative. The audience engaged with it directly (retriever-failure and polite-decline scenarios).

---

## What looked promising (features worth leaning into)

- **Root-cause + evidence chain + recommended fix** - the hero feature. It answers "so what do I do now," which most eval tools don't.
- **Admin override -> golden-dataset curation loop.** A human flags a missed interaction type, it re-baselines, and it builds toward a golden set. Genuinely strong, but surfaced only reactively under questioning. It is buried; it should be a headline.
- **Safety override / hard-fail on PII** regardless of composite score. Clean and enterprise-legible; mentioned once and dropped.
- **Packaging instinct is sound:** free ingestion, meter on the scoring run scaled by number of judges, unlimited seats. Aligns cost with value.

---

## What could have gone better

**1. The dominant problem: "Is this a testing tool or not?" never got resolved.**
Raised at least four times. The QA persona left visibly unconvinced ("so I think it's not really a testing tool"; "where are the tests in the demo?"). Root cause is a persona-language mismatch: to a Tosca/QA audience, "testing" means *author cases -> invoke the agent -> assert outcomes.* AgentScore does passive trace evaluation, which reads to them as observability. Andrew's rebuttals ("no, it does test") kept colliding with their mental model instead of reframing it.
- **Fix:** stop fighting the word. Name the category explicitly: AgentScore does not generate or drive tests - it is automated evaluation/grading of the agent's real behavior. Pair it with a test driver (Tosca, scripts) that supplies the inputs. One boundary picture: **Driver -> Agent -> Traces -> AgentScore grades.** The buyers derived this themselves; hand it to them.

**2. "Supplementary, not a replacement" was said too many times and diluted the value prop.**
Not a replacement for observability, not for your accuracy testing if you are thorough, not UI testing. By the end the audience could not state what AgentScore *definitively owns.* Positioning by negation is a red flag.
- **Fix:** lead with one owned job - continuous, dimension-scored grading of production agent behavior with root-cause - then add adjacencies as bonuses, not caveats.

**3. The accuracy question got a weak answer.**
"There's a response, no error - how do you know it's accurate?" is the single most important question a QA buyer asks, and the answer wandered (LLM judge -> golden dataset over time -> "probably not a replacement if you're thorough"). That last hedge undercut confidence at the worst moment.
- **Fix:** a crisp tiered answer - (1) deterministic/hybrid checks where ground truth exists, (2) LLM-judge with confidence intervals where it does not, (3) golden-dataset comparison once curated. Show the correctness dimension resolving a case-summary example end to end. Rehearsed set piece, not improvised.

**4. "LLM judging an LLM - why trust the judge?"**
A credibility question that recurs with every technical buyer. The recovery (deterministic scoring, hybrid evals, confidence intervals, decision trees) was good but arrived late and defensively. Pre-empt it in the deck.

**5. No live demo + engineering caveat upfront** set an "early/not ready" tone the Q&A never fully overcame. With no artifact to anchor on, the audience filled the vacuum with skepticism. The root-cause walkthrough in particular needs to be seen, not narrated.

**6. Known gaps - fine to admit, track as objections:** no Agentforce/Salesforce-native integration yet, responses-only (no UI testing), on-prem needs an update.

---

## Recommended next steps

1. **Reorder the deck** around one owned job + a driver-vs-grader boundary slide. Kill the serial "not a replacement" framing. (See `slide-order-proposal.md`.)
2. **Ship the promised live demo** with root-cause attribution as the centerpiece.
3. **Build a rehearsed accuracy answer** (deterministic -> judge+CI -> golden set) and a pre-emptive "why trust the judge" slide.
4. **Add an Agentforce-specific follow-up** for this account - they mapped every question onto Agentforce + Data Cloud + RAG.
5. **Elevate golden-dataset curation and the safety hard-fail** from buried Q&A answers to named features.
