# AgentScore Evals and Dimensions in Plain Language

**Status: draft for review.** Descriptions are written from each eval's slug and its standard industry definition (the library evals follow the DeepEval-style metrics). They were **not** checked against the actual rubrics in the Back Office, so confirm each one with the eval owner before it goes in customer material.

**Source of the list:** the 41-eval catalog exported from the Back Office on 2026-10-06, as recorded in `docs/planning/features/Eval Failure Cost Function/eval-harm-category-mapping.md`. The grouping into dimensions below is my own mapping from eval to the 11 shipped dimensions, because the export only carries dimension IDs, not names.

Each entry has three parts:
- **What it checks:** one sentence a non-technical buyer can follow.
- **Fails when:** a concrete example of a bad result.
- **Needs:** anything the eval requires beyond a normal trace (a reference answer, retrieved context, tool calls).

---

## Part 1: The 11 dimensions

A dimension is one category your agent is measured on. Each one rolls up several evals into a single bar on the scorecard.

| Dimension | One-line description | The question it answers |
| --- | --- | --- |
| **Correctness** | Getting the right answer | Is what the agent said actually right? |
| **Groundedness** | Sticking to the facts it was given | Did the agent make things up, or stay with the information it had? |
| **Relevance** | Staying on-topic | Did the agent answer what was asked? |
| **Retrieval (RAG)** | Finding the right information | When the agent looked things up, did it pull back the right material? |
| **Agentic / Tool-use** | Making smart decisions and using tools well | Did the agent pick the right tools, use them properly, and finish the job? |
| **Conversational** | Holding a natural conversation | Over a whole chat, did the agent stay in character, remember things, and reach the user's goal? |
| **Quality / Efficiency** | Cost and speed | Did the agent get there without wasting words, steps, or money? |
| **Safety** | Avoiding harmful output | Did the agent avoid toxic, biased, private, or out-of-bounds responses? |
| **Reliability** | Behaving the same way run after run | If you ask the same thing twice, do you get a dependable result? |
| **Attribution** | Citing its sources | Can you tell where the agent's claims came from? |
| **Custom** | Whatever you define | Anything specific to your business that the built-in dimensions don't cover. |

**Notes for the reviewer:**
- Reliability, Attribution, and Custom have no obvious evals in the current 41-eval catalog. They exist as dimensions, but I could not tie any catalog eval to Reliability or Attribution from the slugs. Confirm whether they are empty today or whether some evals below belong there.
- The "Correctness & relevance" family in the harm-category doc is split here into the Correctness and Relevance dimensions.

---

## Part 2: The 41 evals

### Safety dimension

| Eval | What it checks | Fails when | Needs |
| --- | --- | --- | --- |
| **Bias** (`bias`) | Whether the answer treats people unfairly based on things like gender, race, age, religion, or nationality. | The agent recommends a different loan product to two otherwise identical applicants because of their names. | Output |
| **Toxicity** (`toxicity`) | Whether the answer contains rude, hateful, threatening, or abusive language. | The agent snaps back at a frustrated customer with an insult. | Output |
| **PII Leakage** (`pii_leakage`) | Whether the agent exposes personal or confidential information it should not (names, emails, account numbers, health details). | The agent reads one customer's address back to a different customer. | Output |
| **Non-Advice** (`non_advice`) | Whether the agent avoids giving regulated advice it is not allowed to give, such as specific financial, medical, or legal advice. | A banking chatbot tells a user which stocks to buy. | Output |
| **Misuse** (`misuse`) | Whether the agent stays inside the job it was built for instead of being used for unrelated things. | A customer-support agent for a telecom writes someone's essay or debugs their code. | Output, and the agent's intended domain |
| **Role Violation** (`role_violation`) | Whether the agent breaks the role or rules it was assigned. | An agent told to act only as a billing assistant starts acting as a legal counsel. | Output, and the agent's assigned role |

### Groundedness dimension

| Eval | What it checks | Fails when | Needs |
| --- | --- | --- | --- |
| **Hallucination** (`hallucination`) | Whether the agent states things as fact that are not supported by the information it was given. | The agent cites a return policy that is not in the company's documents. | Output and context |
| **Faithfulness** (`faithfulness`) | Whether every claim in the answer can be traced back to the retrieved material. The positive framing of hallucination. | The retrieved page says "30 days" and the agent says "60 days". | Output and retrieved context |
| **Turn Faithfulness** (`turn_faithfulness`) | The same check as Faithfulness, applied to each reply in a conversation separately. | Turn 3 of a chat invents a detail that no document supports, even though turns 1 and 2 were fine. | Conversation and retrieved context |

### Retrieval (RAG) dimension

These check the search step that happens before the agent answers. A weak result here usually explains a weak answer later.

| Eval | What it checks | Fails when | Needs |
| --- | --- | --- | --- |
| **Contextual Precision** (`contextual_precision`) | Whether the most useful search results are ranked at the top. | The one document that answers the question is buried at position 8. | Retrieved context, and a reference answer |
| **Contextual Recall** (`contextual_recall`) | Whether the search found everything needed to answer fully. | The answer needs three policy pages and the search returned only one. | Retrieved context, and a reference answer |
| **Contextual Relevancy** (`contextual_relevancy`) | Whether what the search returned is actually about the question, rather than noise. | A question about refunds pulls back pages about shipping and careers. | Retrieved context |
| **Turn Contextual Precision** (`turn_contextual_precision`) | Contextual Precision, checked per reply in a conversation. | A single turn ranks the useful result low. | Conversation and retrieved context |
| **Turn Contextual Recall** (`turn_contextual_recall`) | Contextual Recall, checked per reply in a conversation. | A single turn misses information needed for that reply. | Conversation and retrieved context |
| **Turn Contextual Relevancy** (`turn_contextual_relevancy`) | Contextual Relevancy, checked per reply in a conversation. | A single turn retrieves off-topic material. | Conversation and retrieved context |

### Correctness dimension

| Eval | What it checks | Fails when | Needs |
| --- | --- | --- | --- |
| **Answer Correctness** (`answer_correctness`) | Whether the answer matches the known right answer. | The agent says a premium plan costs $49 when the correct price is $59. | A reference ("golden") answer |
| **Summarization** (`summarization`) | Whether a summary is accurate and keeps the important points without adding or distorting anything. | A summary of a contract leaves out the termination clause, or claims something the contract never says. | The source text and the summary |

### Relevance dimension

| Eval | What it checks | Fails when | Needs |
| --- | --- | --- | --- |
| **Answer Relevancy** (`answer_relevancy`) | Whether the answer actually addresses the question that was asked. | The user asks how to reset a password and the agent explains how to create an account. | Input and output |
| **Turn Relevancy** (`turn_relevancy`) | Whether each reply in a conversation is relevant to what the user just said. | The user asks a follow-up and the agent answers the previous question again. | Conversation |
| **Conversation Relevancy** (`conversation_relevancy`) | Whether the conversation as a whole stays on topic from start to finish. | The agent drifts away from the user's problem over several turns. | Conversation |
| **Prompt Alignment** (`prompt_alignment`) | Whether the agent follows the instructions in its own system prompt. | The prompt says "always reply in two sentences" and the agent writes four paragraphs. | Output, and the agent's instructions |

### Agentic / Tool-use dimension

| Eval | What it checks | Fails when | Needs |
| --- | --- | --- | --- |
| **Tool Use** (`tool_use`) | Overall quality of how the agent uses its tools: picking the right one and using it sensibly. | The agent calls a "delete record" tool when it should have called "look up record". | Tool calls |
| **Argument Correctness** (`argument_correctness`) | Whether the agent filled in the tool's inputs correctly. Right tool, right details. | The agent calls "send payment" with the wrong amount or the wrong recipient. | Tool calls |
| **Task Completion** (`task_completion`) | Whether the agent actually finished the job the user gave it. | The user asks to book a flight and the agent stops after searching. | Full trace |
| **MCP Task Completion** (`mcp_task_completion`) | Task Completion for jobs done through MCP tools, within a single turn. | An MCP-connected agent never completes the request it was given. | Trace with MCP tool calls |
| **MCP Use** (`mcp_use`) | How well the agent uses MCP tools in one turn: the right tool, with sensible inputs. | The agent ignores an available MCP tool and guesses an answer instead. | Trace with MCP tool calls |
| **Multi-Turn MCP Use** (`multi_turn_mcp_use`) | How well the agent uses MCP tools across a whole conversation. | The agent uses tools correctly at first, then forgets to use them later in the chat. | Conversation with MCP tool calls |
| **Plan Quality** (`plan_quality`) | Whether the plan the agent made is sensible, complete, and efficient. | The plan has steps in the wrong order or leaves out a step needed to reach the goal. | Trace showing the plan |
| **Plan Adherence** (`plan_adherence`) | Whether the agent actually followed the plan it made. | The plan says "verify identity, then refund", and the agent refunds without verifying. | Trace showing the plan and the steps taken |
| **Step Efficiency** (`step_efficiency`) | Whether the agent reached the goal without wasted steps. | The agent makes the same lookup five times or takes a long detour. | Full trace |

### Conversational dimension

| Eval | What it checks | Fails when | Needs |
| --- | --- | --- | --- |
| **Goal Accuracy** (`goal_accuracy`) | Whether the conversation ended with the user's goal met. | The user wanted to change their address and leaves without it changed. | Conversation |
| **Conversation Completeness** (`conversation_completeness`) | Whether every request the user made during the chat was handled. | The user asked two things and only one got answered. | Conversation |
| **Role Adherence** (`role_adherence`) | Whether the agent keeps its persona across the whole conversation. | A friendly assistant slowly turns curt and robotic. Softer than Role Violation, which is about breaking the rules outright. | Conversation, and the assigned role |
| **Topic Adherence** (`topic_adherence`) | Whether the agent sticks to the topics it is meant to discuss and avoids the ones it should not. | A product-support agent starts debating politics. | Conversation, and the allowed topics |
| **Knowledge Retention** (`knowledge_retention`) | Whether the agent remembers what the user already told it. | The user gives their order number, and three turns later the agent asks for it again. | Conversation |

### Quality / Efficiency dimension

| Eval | What it checks | Fails when | Needs |
| --- | --- | --- | --- |
| **Conciseness** (`conciseness`) | Whether the answer is as short as it can be while still complete. | A one-line answer arrives wrapped in three paragraphs of filler. | Output |

### User signals (not scored as agent failures)

These three read the *user*, not the agent. A hit does not mean the agent did something wrong, so they carry no cost of their own. They are useful context: a frustrated user alongside a failure is a bigger deal than the failure alone.

| Eval | What it checks | Fires when | Needs |
| --- | --- | --- | --- |
| **User Distress** (`user_distress`) | Whether the user sounds upset, anxious, or frustrated. | The user writes "this is the third time I've asked and nobody is helping." | Conversation |
| **User Disagreement** (`user_disagreement`) | Whether the user pushes back on or contradicts what the agent said. | The user replies "no, that's wrong." | Conversation |
| **Out-of-Scope Request** (`out_of_scope_request`) | Whether the user asked for something outside what the agent is supposed to handle. | A user of an HR agent asks it for stock tips. | Conversation, and the agent's scope |

### Starter templates

Two ready-made evals a customer can clone and tweak. Each behaves like the eval it was built from.

| Template | What it checks | Based on |
| --- | --- | --- |
| **Template: Safe, Non-Toxic Output** (`template-safe-output`) | The reply is free of harmful or abusive language. | Toxicity |
| **Template: Helpful, On-Point Answer** (`template-helpful-answer`) | The reply is useful and addresses the question. | Answer Relevancy |

---

## Part 3: Open items before this is customer-ready

1. **Verify against real rubrics.** The descriptions are inferred. Pull each eval's rubric and threshold from the Back Office and correct any that differ.
2. **Confirm the dimension assignment.** The export had IDs only. Match each eval to its real dimension, and settle whether Reliability and Attribution have any evals today.
3. **Fix the existing docs.** The customer page `EvalCatalog.tsx` names evals that are not in the catalog (JSON Correctness, Exact / Pattern Match, Tool Correctness, Trajectory Efficiency) and omits many that are. Its screenshot caption also says 62 evals while the text says 41.
4. **Decide how to handle the per-turn twins.** Six evals have a `turn_` or whole-conversation version of another eval. A buyer will ask why both exist. A one-line explanation may belong in the customer page: "Turn versions grade each reply on its own, so one bad turn can't hide inside a good conversation."
5. **Tone check.** The "Fails when" examples are mine. Swap in real examples from customer traces where you have them.
