# Docs change log

Exact reader-facing edits to the customer docs in this folder, newest first.
One entry per update. The drift log records where the docs disagreed with the
product. This log records what the docs themselves changed.

## 2026-10-29 — Scoring Engine Settings, Usage & cost is one page

Version `0.41.2` → `0.41.3`.

### `src/content/ScoringEngine.tsx`

- Usage & cost paragraph. Was: "Every agent's Usage & cost page shows what it used and what Agent Score spent evaluating it, over a window you choose (up to 90 days)". Now: "Usage & cost in the sidebar lists every agent in a tenant, one row each, with what it used and what Agent Score spent evaluating it, over a window you choose (up to 90 days, or dates from a calendar)". The list of columns and the Excel export line are unchanged.

## 2026-10-29 — Connect with MCP, name the agent and list each client

Version `0.41.1` → `0.41.2`.

### `src/content/ConnectWithMcp.tsx`

- Dek. Was: the coding agent signs in, creates the ingest key, and checks that traces arrived. Now: in the project you have open, you name the agent you want scored, and the coding agent writes the ingest key and starts the traces.
- Heading. Was: "Add it, sign in, then check". Now: "Add it, sign in, then send traces".
- Step "Add the server". Was one paragraph that named Claude Code, Cursor, Codex, the Claude apps, and another client in sequence. Now a list, one item per client. Each item keeps the same instructions: Claude Code scope (only you in this project, or a committed `.mcp.json` for everyone), Cursor Add or `.cursor/mcp.json`, Codex covering the desktop app, IDE, and CLI, Claude apps custom connector with an empty OAuth client, Team and Enterprise owner path, and Streamable HTTP for another client.
- Step "Sign in". Was one paragraph. Now a short shared sign-in line, then one item per client: Claude Code `/mcp` or `claude mcp login agent-score`, Cursor Customize → MCP, Codex Authenticate, Claude apps Connect.
- Step "Check that it works" renamed "Send this agent's traces". Was: ask `Use agent-score to check my agent connection.`, which reports keys and whether traces arrived in the last hour, then ask the coding agent to create an ingest key and write exporter settings. Now the first ask is `Set this agent up to send its traces to Agent Score. Name it checkout-agent.` (`checkout-agent` is an example). That ask creates the key, writes the ignored env file, and sets `OTEL_SERVICE_NAME` to the name. Restart the agent and run it once. The check sentence comes second and confirms traces for that name. Scoring starts after about 20 traces. An agent that already runs in AI Workspace sends traces when it runs, with no ingest key.

### `src/content/Welcome.tsx`

- Connect step. Was: the coding agent signs in, creates the ingest key, and checks that traces arrived. Now: in the project you have open, ask it to send that agent's traces under a name you choose. It signs in and writes the ingest key. AI Workspace agents are still picked up on their own.

### Layout

- `Step` now renders its body in a `div.step-body` so a step can hold a list or a code block. Copy inside other steps is unchanged.
- Prompt boxes wrap long lines, so the copy button no longer covers the end of the sentence.
