# RAG support agent (AgentScore demo)

A small Claude-based agent that answers questions about AgentScore, grounded
in `docs/faq.md` via a `search_knowledge_base` tool call. Instrumented with
OpenTelemetry per `agent-score-skill`, so real runs show up as AgentScore
traces.

## Setup

```bash
source venv/bin/activate
pip install -r requirements.txt
```

Fill in `.env`:
- `ANTHROPIC_API_KEY` - required to run the real agent.
- `AGENT_SCORE_API_KEY` - from AgentScore UI -> Settings -> API Keys. If left
  blank, traces print to the console instead of being sent.

## Run the real agent

```bash
python rag_agent.py "What are the six dimensions AgentScore scores?"
# or, as a service:
python app.py   # POST /ask {"question": "..."}
```

## Send synthetic traces

For demoing the scoring engine without waiting on live traffic or burning
Anthropic API calls, `send_synthetic_traces.py` fabricates traces shaped like
real agent runs, covering all six dimensions plus deliberate failure modes
(hallucination, empty retrieval answered anyway, off-topic rambling, a
thrashing/inefficient run, a leaked-credential safety violation, a failed
tool call, and an inconsistent-answer pair).

```bash
python send_synthetic_traces.py --list-scenarios
python send_synthetic_traces.py --dry-run --count 20   # preview, no network
python send_synthetic_traces.py --count 32              # send to AgentScore
```

## Attribute conventions (`langfuse_semconv.py`, `genai_semconv.py`)

Every span sets two layers of attributes, grounded in a direct read of
`Tricentis-AI/agent-score`'s scoring source (not guessed):

- `langfuse.observation.*` (Langfuse's own OTel convention) - drives the
  Agent Card and trace rendering in the AgentScore UI.
- `gen_ai.*` / `openinference.*` - drives `has_tools`/`has_retrieval` in
  agent-score's own profile-fit logic (`scoring/runner.py`). Confirmed:
  a `type=="TOOL"` observation (or `gen_ai.operation.name="execute_tool"` +
  `gen_ai.tool.name`) reliably sets `has_tools=True`.

**Known gap:** `has_retrieval` (needed for the RAG Starter profile) requires
Langfuse's own native `toolCalls` column to be populated on an observation -
that parsing happens inside Langfuse's private OTel ingestion, outside the
agent-score repo, and isn't confirmed to work from raw OTel spans like these.
Real retrieved-passage text is attached to the tool span's output regardless
(Faithfulness/Groundedness read it if the eval runs), but don't expect a
guaranteed RAG Starter profile fit from this alone - Tool/Orchestrator
Starter is the realistically achievable target given a confirmed `has_tools`
signal.
