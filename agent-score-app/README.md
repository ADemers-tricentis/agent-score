# AgentScore App

**The simplified AgentScore frontend, built for domain practitioners.**

This is a new frontend for AgentScore aimed at the **Domain Practitioner** persona — a
tester, legal reviewer, or other domain expert who knows what good output looks like in
their field but has no AI/LLM background. It's a companion to `../agent-score/`, which is
an AI-engineer-facing "back office" prototype; this app abstracts the same underlying
capabilities into plain language (see `../docs/AgentScore-PRD.md`'s REQ-072 and the
Confluence PRD linked there for the product spec this follows).

Currently implemented: the **Home dashboard** and the **Agent Overview** tab, backed by
in-memory mock data. See `../plans/2026-08-03-agent-score-app-home-overview.md` for the
full scope and what's intentionally deferred (onboarding, the other four Agent Overview
tabs, Describe-agent, run comparison, a real backend connection, etc).

---

## Prerequisites

- Node.js and [pnpm](https://pnpm.io).
- The `aura-ui` design system checked out as a **sibling** repo, i.e. at
  `../../aura-ui` relative to this folder (so `/Users/you/dev/Tricentis/aura-ui` if this
  repo is at `/Users/you/dev/Tricentis/AgentScore`). `aura-ui` must be built (its
  `components/`, `constants/` output directories present at its repo root) — `vite.config.ts`
  and `tsconfig.json` here alias `@tricentis/aura/*` straight to that checkout instead of
  installing the package from npm.

## Run it

```bash
pnpm install
pnpm dev
```

Then open the printed local URL (typically `http://localhost:5173`). Toggle light/dark
mode from the sun/moon icon in the top bar.

Other scripts:

```bash
pnpm build     # production build
pnpm preview   # preview a production build locally
```

## What you'll see

- **Home** — KPI cards, an agents-needing-attention table (click a row to expand its
  per-dimension breakdown inline), a verdict distribution panel with a 7-day trend, and a
  recent-scoring-runs table across all agents.
- **Agent Overview** — open any agent from the sidebar's "Agent" switcher or by clicking
  through from Home. Agents below the 20-trace scoring threshold show a locked score ring,
  locked stat cards, and a "Keep sending traces" banner with a **Simulate traces** button —
  click it to watch the agent unlock live (no page reload). The Traces / Scoring /
  Labeling / Settings tabs currently render a "coming soon" placeholder.

## Data

All data is served from an in-memory mock module (`src/data/mock.ts`) seeded with six
agents spanning every agent type and score state (locked, preliminary, Ship, Review with
a safety warning, Block with a critical safety override). Nothing persists across a page
reload. The mock functions are async and shaped like a real API client
(`listAgents()`, `getAgent(id)`, `listAgentTraces(id, opts)`, etc.), so swapping in real
HTTP calls later should only require changes inside that one file.
