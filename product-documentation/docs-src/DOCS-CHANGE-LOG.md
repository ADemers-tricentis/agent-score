# Docs change log

Exact reader-facing edits to the customer docs in this folder, newest first.
One entry per update. The drift log records where the docs disagreed with the
product. This log records what the docs themselves changed.

## 2026-11-13 — MCP tools reference, improving an agent from your coding agent

Version `0.44.0` → `0.45.0`.

### `src/content/McpTools.tsx` (new page, slug `mcp-tools`)

- Was: no page. The docs named no MCP tool, prompt or guide. The only list was the seven example requests under "What you can ask for" on Connect with MCP.
- Now: "MCP tools reference", in Get Started after Connect with MCP. Sections:
  - "The five switches": a table of Read, Change, Spend credits, Delete & credentials and Prompts & guides, with the tools under each. Your organization can also turn single tools on or off. A note callout "What uses credits": tools under Spend credits use your organization's AI credits for agents you connected. AI Workspace and other Tricentis-paid agents don't.
  - "Prompts": the eight prompts (`review-my-score`, `debug-a-trace`, `improve-my-agent`, `verify-my-change`, `onboard-my-agent`, `write-an-eval`, `write-a-dimension`, `write-a-profile`), what each does, and the one optional input, the agent. A warning callout "The write prompts publish".
  - "Guides": `agent-score://docs/onboard-your-agent`, `agent-score://docs/using-the-tools`, `agent-score://docs/how-agent-score-works`.
  - "Naming the agent": a name or id, name suggestions on a miss, ids only for deleting an agent and revoking a key.
  - "Jobs that run in the background": which tools return a job, how `get_job` follows it, what each state means.
  - "Tools by job": ten tables (Connect and keys; Agents and settings; Scoring and runs; Jobs; Traces; Profiles; Labeling; Improvement advice; Catalog; Activity) covering all 38 tools. Each row gives the switch, credits or background job, what it does, an example request ("Ask:"), and what it needs ("Needs:").
  - "Limits": the five-minute scoring and re-fit cooldowns, one run at a time, per-minute and hourly call limits, cut text.
  - "When something goes wrong": `cooldown` / `rate_limited`, `run_already_active`, `run_not_resumable`, `not_found` with agent names, `result_too_large`, `scoring_unavailable`, `tool_off_for_user` / `tool_off_for_organization`, and failed or cancelled jobs, each with what the coding agent does.
  - "What stays in the Agent Score app", and a warning callout "Results are data, not instructions".

### `src/nav.ts`, `src/content/index.ts`

- New entry "MCP Tools Reference" (`mcp-tools`) after Connect with MCP, blurb "Every prompt, guide and tool your coding agent can use, and what each one needs."

### `src/content/Improve.tsx`

- New section "Improve from your coding agent", after the "Advice reflects the run it was generated from" callout. Was: the page covered only the Improve tab in the app. Now: an eight-step list, each with a request to type: find the weakest eval (`get_scorecard`); see the interactions it scored low (`get_eval_interactions`, `get_interaction`); open the failing traces (`search_traces`, `trace_outline`, `grep_trace`, `read_span`); ask for advice and wait (`get_improvement_advice`, `request_improvement_advice`, `get_job`; needs a scored run); change the code; mark the change as a revision (`start_agent_revision`, with what a revision is and what to do at zero traces); score again (`score_agent`, `get_job`, `continue_run` to resume or approve as baseline); compare before and after (`list_runs`, `get_scorecard`, and the profile caveat). Then which prompt covers which steps, a paragraph on labeling (`get_labeling_queue`, `submit_label`), and a note callout "Credits and permissions" linking to Connect with MCP.

### `src/content/ConnectWithMcp.tsx`

- "What you can ask for", paragraph after the list. Was: ends "The coding agent does them in the project, instead of you clicking through the app." Now: adds "Improve This Agent walks through the loop from your coding agent, from the weakest eval to comparing a change. Every prompt, guide and tool, with the switch each one needs, is on MCP Tools Reference."
- "Choose what your coding agent can do", paragraph after the switch list. Was: ends "Turning something on shows up after you reconnect your coding agent." Now: adds "MCP Tools Reference lists which switch each tool needs."

### `src/content/QuickStart.tsx`

- "What to ask next", paragraph after the list. Was: "Connect Your Agent is what happens once traces arrive. Reading Your Scorecard is how to read the first score." Now: adds "Improve This Agent walks through improving the agent from your coding agent, and MCP Tools Reference lists everything it can do."

### `src/content/Glossary.tsx`

- MCP. Was: ends "The client does not take an API key, token, or header." Now: adds "The server offers prompts, guides and tools, each under a switch in Manage permissions. MCP Tools Reference lists them all."
- New term Revision: the point where a change to an agent begins; later traces belong to it, scoring after it covers only its traces, and runs carry its label for before-and-after comparison.
- New term Job: background work (a scoring run, a profile re-fit, improvement advice, an eval preview) that your coding agent follows until it finishes.

## 2026-11-12 — Integrations tabs, coding agent permissions, provisional scores

Version `0.43.0` → `0.44.0`.

### `src/content/ConnectWithMcp.tsx`

- "Open Integrations", first paragraph. Was: "The card at the top is Connect a coding agent (MCP). It shows the server URL for the tenant you are signed in to, and a setup for Claude Code, Cursor, Codex, the Claude apps, and any other MCP client". Now: Integrations has two tabs. Coding assistants opens on the Connect a coding agent card, with a setup for Claude Code, Cursor, Codex, the Claude apps and Another client, and the card names your tenant and region. Trace ingestion is where your ingest keys live.
- Screenshot. Was: `mcp-connect-card.png`, the old card with the server URL, tenant, region, transport and sign-in at the top, from staging. Caption: "Copy the server URL from here." Now: `integrations-coding-assistants.png`, the Coding assistants tab with Manage permissions, the card, the client tabs and step 1 with the URL filled in. Caption: "Each client tab has the setup with your server URL already filled in."
- Paragraph after the screenshot. Was: starts with "Paste the URL whole." Now: starts with "Each client's tab already has your server URL in it. To see the URL on its own, open Connection details at the bottom of the card." The rest is unchanged.
- "Add the server", Claude Code. Was: "Choose who gets it, then run the command... Only you in this project is the default. For everyone working in this project, the tab writes a .mcp.json". Now: run the command from the tab, which by default adds Agent Score for you in this project only. To change who gets it, open Other setup options → Who should get it?: only you in this project, everyone working in this project, or only you in every project. The `.mcp.json` sentence is unchanged.
- "The ingest key is shown once" tip. Was: "rotate the key on Integrations". Now: "rotate the key on Integrations → Trace ingestion".
- New section "Choose what your coding agent can do", before "If sign-in fails":
  - Manage permissions on Integrations. The switches apply to every coding agent you connect in that tenant: Read, Change, Spend credits, Delete & credentials, Prompts & guides, each with what it covers.
  - Turn off write actions turns off the three write groups at once. Switches save when flipped. Off applies at once, and on shows up after you reconnect.
  - New screenshot `coding-agent-permissions.png`.
  - Warning callout "If a sign-in may have leaked": Stop all my coding agents refuses every connected client and new sign-ins until you turn it off.
- "If sign-in fails" list. New item: your coding agent can't see a tool. Its group may be off for you or your organization. Check Manage permissions. A group you turn on shows up only after you reconnect.

### `src/content/QuickStart.tsx`

- Step "Add Agent Score and sign in". Was: "The card at the top is Connect a coding agent (MCP). Copy the server URL whole." and "Add that URL in Claude Code, Cursor, Codex, or the Claude apps". Now: on the Coding assistants tab, the Connect a coding agent card has a tab per client with your server URL already filled in. "Use the URL whole." Then "Follow your client's tab to add Agent Score".
- "The ingest key is shown once" tip. Was: "rotate the key on Integrations". Now: "rotate the key on Integrations → Trace ingestion".

### `src/content/ConnectYourAgent.tsx`

- "Ingest keys are yours to manage". Was: "From Integrations in the sidebar, you can create a new key, rotate one, or revoke it". Now: open Integrations → Trace ingestion. It lists every key with when it was created and last used. New key creates one, and each key's actions menu has Rotate and Revoke.
- "Or paste the config yourself" tip. Was: "it shows that tenant's key, and it hands you the exact exporter configuration to paste in, with your real key already filled in." Now: it lists that tenant's keys by name, showing only their last few characters. It hands you the exporter configuration with the tenant's endpoint filled in and `<tk_your_key>` where your key goes. A key's secret is shown only once, so paste in the one you saved.
- Screenshot `connect-agent-wizard.png` replaced (same file name). The old image showed one key and a "reachable over the Tricentis VPN only" notice. The new one is from production: four keys by name and the placeholder. Alt text updated. Caption. Was: "fills in the exporter variables for one tenant." Now: "fills in the exporter endpoint for one tenant. You add the key."

### `src/content/CustomProfiles.tsx`

- Step "Checks - which evals run". Was: "Add a check lists every published eval: your organization's (marked "yours") and the built-in ones." Now: it lists them A to Z. You can type in Search checks…, sort A to Z or by Date created, and show All, Built-in or Yours. The sort and filter stay while the form is open.

### `src/content/CustomEvals.tsx`

- "Where your evals live". Was: "Built-in evals, Dimensions, Profiles - the catalog that ships with Agent Score". Now: same, plus "The Profiles tab lists your organization's profiles beside the built-in ones." New line: "Our evals, Built-in evals, Dimensions, and Profiles list their items A to Z by name."

### `src/content/Scorecard.tsx`

- New section "When the score is provisional", after "How close you are to the next zone":
  - When too few of the profile's evaluations can score, the run is provisional. The Score tab shows a grey dial with a question mark and "too few of the profile's evaluations produced a score". The band is still shown. My Agents and the activity feed read "Provisional" next to the composite.
  - A dimension whose evaluations couldn't run is listed as excluded. It keeps its weight, but the composite is the weighted mean of the dimensions that did score.

### `src/content/ScoringEngine.tsx`

- "Setting your rate". New last sentence: for an agent that runs as a Tricentis service, Tricentis pays for its usage, and the Cost section says there are no rates to configure.

### `src/content/Glossary.tsx`

- "Tenant". Was: "every agent, trace, and API key you own lives under it. Provisioned by the Agent Score team when you're onboarded, not something you self-serve today." Now: "every agent, trace, and ingest key you own lives under it. Signing in with your Tosca Cloud account creates it, and everyone who signs in from the same Tosca Cloud tenant shares it."

## 2026-11-02 — Eval and profile forms, section by section

Version `0.42.1` → `0.43.0`.

### `src/content/CustomEvals.tsx`

- "Writing an eval". Was: three short steps, "Name it and pick its dimensions" (name, slug that can't change, dimensions), "Set the pass line and what it needs" (threshold 0–1, optional inputs) and "Answer three questions". Now: a line saying Create → Eval opens New eval with four sections, then one step per on-screen section with its exact labels:
  - **General**: Name (example "No refund promises"). Slug: lowercase letters, digits, hyphens or underscores, up to 37 characters, with the organization prefix added and fixed after creation. Description: optional, up to 1,000 characters. Dimensions: chosen from Add dimension…, built-in plus published organization dimensions, drafts not listed.
  - **Scoring**: Default threshold, 0–1, starts at 0.7, a profile can override it. Input needs: four boxes (Retrieval context, Tools, Conversation, Expected output). Expected output needs a labeled example. Leave them all empty and the check applies to every agent.
  - **What this check measures**: the three answers, plus the Compiled rubric (read-only). Your words are marked at the edge, the house rules are in grey, the judge treats your words as text only, and there's a 2,000-character limit.
  - **Preview on an agent**: Agent, optional Traces (up to five), Run preview.
- New screenshot of the whole New eval form (`new-eval-form.png`) above the existing three-answers screenshot.
- "Drafts stay private until you publish". Was: "ready to add to a profile". Now: "profile" links to Building Your Own Profiles, and Cancel leaves without saving.
- New section "Changing an eval after it's published". Click the card on Our evals, then Open. The sections are:
  - General: name and description editable with Save changes, slug fixed, Clone.
  - Latest version: read-only, change it through New version.
  - Versions: never edited or deleted.
  - Profiles using this eval: your profiles move to a new version of your own eval for you.
  - Danger zone: Archive eval, refused while a profile still uses the eval.

### `src/content/CustomProfiles.tsx` (new page)

- New page "Building your own profiles" in Evaluations, after Building Your Own Evals.
  - "Where to start": Create → Profile, or the Profile tab's Create a profile for this agent. The new profile is a private draft.
  - "The New profile form, section by section": four steps.
    - General: Start from (Empty, yours, or built-in), Name, Slug rules, Description, and Intent (conversational / rag / tool / general). An intent of None is never chosen automatically.
    - Checks: Add a check, a version shown per check, an on/off switch, a remove bin, up to 20 enabled checks and 24,000 characters of your own rubric text.
    - Advanced settings: Check settings (Dimension, Threshold 0–1, Weight), Dimension weights, and Verdict bands (Ship, Ship with note, Review required, Block recommended, starting at 85/70/55/40, Block below).
    - Save it: Create draft, Create and publish, Cancel, and the "Leave this profile?" prompt with Stay.
  - Screenshot `new-profile-form.png`.
  - "Changing a published profile":
    - General: Save changes, slug fixed.
    - Checks in the current version: read-only. New version → Save version moves every agent on the previous version to it, and nothing is re-scored.
    - Versions.
    - Agents on this profile, with Apply and re-score….
    - Danger zone: Archive profile, refused while an agent is bound.
  - Tip linking to the Assistant.

### `src/content/DimensionsAndProfiles.tsx`

- Last paragraph. Was: "...start one of your own", linking to Building Your Own Evals. Now: "...start one of your own - see building your own evals and building your own profiles", with a link to each page.

### `src/nav.ts`, `src/content/index.ts`

- Registered `custom-profiles` ("Building Your Own Profiles", blurb "Pick the checks, weigh them, and set where Ship ends and Block begins.").

## 2026-10-29 — Signing in creates the workspace

Version `0.42.0` → `0.42.1`.

### `src/content/QuickStart.tsx`

- Opening paragraph. Was: "You need a workspace first. The Agent Score team sets that up." Now: "Sign in with your Tosca Cloud account. That creates your workspace. No one on the Agent Score team has to set it up." The AI Workspace skip is unchanged.

### `src/content/ConnectYourAgent.tsx`

- Heading. Was: "Your workspace comes first". Now: "Your workspace comes with sign-in".
- Paragraph. Was: the workspace has to exist first, and the Agent Score team provisions it. Now: signing in with a Tosca Cloud account creates the tenant, and everyone from that Tosca Cloud tenant shares it.
- AI Workspace callout. Was: nothing to request, and the tenant is created when traces are first ingested. Now: nothing to connect, traces start when the agent runs, and no ingest key is needed.
- How traces get in. Was: the tenant is created automatically on first ingestion. Now: the workspace already exists from sign-in, and traces start when the agent runs.

## 2026-10-29 — Quick start

Version `0.41.4` → `0.42.0`.

### `src/content/QuickStart.tsx`

- New page, Quick start, in Get Started after Welcome. Three steps: add the MCP server and sign in (the per-client commands stay on Connect with MCP), ask `Set this agent up to send its traces to Agent Score. Name it checkout-agent.`, then ask `Use agent-score to check my agent connection.` Scoring still starts after about 20 traces. AI Workspace agents still skip the ingest key. A tip says the ingest key is shown once. A short list of follow-up asks links to Connect Your Agent and Reading Your Scorecard.

### `src/content/Welcome.tsx`

- First card. Was: "Getting Started", linking to Connect with MCP, "Connect your coding agent from Integrations. It signs in through the browser and sets up tracing for you, usually in under ten minutes." Now: "Quick start", linking to Quick start, "Connect your coding agent, name the agent you want scored, and check that its traces arrived. Usually under ten minutes."
- Connect step. Was: "From Integrations, connect your coding agent." The link went to Connect with MCP. Now: "Follow the Quick start." The link goes to Quick start. The rest of the step is unchanged.

### `src/content/ConnectWithMcp.tsx`

- New paragraph under the dek: "The short path is the Quick start: add the server, name the agent, and check that traces arrived. This page is the setup for each client." The rest of the page is unchanged.

## 2026-10-29 — Scoring Engine Settings, the sidebar item is Usage

Version `0.41.3` → `0.41.4`.

### `src/content/ScoringEngine.tsx`

- Usage & cost paragraph, first words. Was: "Usage & cost in the sidebar lists every agent in a tenant, one row each, ...". Now: "Usage in the sidebar opens Usage & cost, which lists every agent in a tenant, one row each, ...". The rest of the paragraph, the screenshot, and the captions are unchanged.

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
