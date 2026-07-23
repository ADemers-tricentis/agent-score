# Agent Score Skills

Claude Code skills for configuring OpenTelemetry tracing to export to [Tricentis Agent Score](https://agent-score.product.tricentis.com).

## What this skill does

When invoked, the `/agent-score` skill will:

1. Detect your language and framework (Python, Node.js/TypeScript, etc.)
2. Install the required OTEL packages
3. Add the exporter configuration pointing to Agent Score
4. Guide you to set your API key (obtained from Agent Score UI -> Settings -> API Keys)

The only thing you need to provide is an **Agent Score API key**.

## Usage

Install this skill in Claude Code, then run:

```
/agent-score
```

Claude will assess your project and configure OTEL tracing to send to:

```
https://agent-score-ingest.product.tricentis.com/internal/otel/v1/traces
```

## Skill structure

```
skills/
  agent-score/
    SKILL.md                  - Main skill instructions
    references/
      python.md               - Python setup (opentelemetry-sdk)
      nodejs.md               - Node.js / TypeScript setup
      env-vars.md             - Environment-variable-only approach
```

## Supported stacks

| Language | Frameworks |
|---|---|
| Python | OpenAI SDK, LangChain, LlamaIndex, OpenAI Agents SDK, raw OTEL |
| Node.js / TypeScript | Vercel AI SDK, OpenAI SDK, raw OTEL |
| Any | Environment variables only (zero code changes) |

## Installation

```bash
claude mcp add https://github.com/your-org/agent-score-skill
```

Or clone locally and point Claude Code at the directory.
