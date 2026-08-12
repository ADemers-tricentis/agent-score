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
