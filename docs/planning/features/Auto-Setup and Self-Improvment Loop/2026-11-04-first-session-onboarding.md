# First-session onboarding

Redesign of the current first session. Same places: sign in, Home, Integrations, the connect card, the coding agent, My Agents, and the agent's Score tab. The session ends when the person reads one score and one verdict for an agent they already run.

They can open a project in Cursor, or another coding agent, and run an agent that already makes real model or tool calls. They decide whether that agent can ship. They do not know OpenTelemetry, traces, evals, profiles, or instrumentation, and this session does not teach those words. On-screen sentences below are for that person. Notes about the current product are for us.

Custom evals, profile editing, publishing, and the improvement loop stay out. So do simulation, synthetic users, guardrails, self-host, and SSO.

## The current process

This is the path the product runs today.

1. Sign in with a Tosca Cloud account. Land on Home. Home offers Take a tour and example agents, and it has no connect action.
2. Open Integrations in the sidebar. The page has Coding assistants and Trace ingestion, plus Manage permissions, and a line that names the tenant and region. The card is Connect a coding agent (MCP).
3. Pick a client tab: Claude Code, Cursor, Codex, Claude apps, or Another client. Claude Code also asks who the connection is for.
4. Add the server. Copy the URL, or follow that tab's command, file, or Add to Cursor button. Paste the URL whole. The query string is the tenant. There is no API key on this card.
5. Sign in. The browser opens, the person clicks Allow, then finishes in the client (Cursor: Customize, then MCP).
6. The tab ends on Check it works, with this sentence: "Use agent-score to check my agent connection." The answer lists ingest keys and whether anything arrived in the last hour. The agent is not set up yet, so this check is early.
7. The Claude Code tab then adds a second ask: create an Agent Score ingest key and write the exporter settings to `.env`. No tab tells them to name the agent. The docs and the welcome email use a different order, and a different sentence: "Set this agent up to send its traces to Agent Score. Name it checkout-agent." Then the check sentence.
8. My Agents offers a second way in. Connect agent opens a dialog with an API key and exporter variables to paste. The empty list says to create an agent inside a tenant.
9. After activity arrives, the agent row reads Setting up, then Learning your agent with a count of n of 20 traces, then Building the scorecard, Ready for its first score, or Scoring now. The Score tab with no run says "No scores yet" and "Score now to see results." Scheduled scoring has a 60-minute minimum cadence.
10. The result is split. Purpose is on the Agent Card. The fitted profile, Why this profile, and The bar are on the Profile tab. The bar says Review required, Block recommended, and Block. The score and the verdict are on the Score tab, which says Needs work and Don't ship (recommended). My Agents can show a plain Ship badge for a Ship with note score. Home counts Review and Block.

## 1. Happy path

Ten human actions. The count is at the end of the step list.

**1. Sign in.** About a minute. Home.

The human signs in with a Tosca Cloud account.

Today Home starts a tour and shows example agents. Remove both from the first visit. Home's first visit has one action, and it opens the connect card that already lives on Integrations.

On screen: "Sign in with your Tosca Cloud account." After sign-in: "Connect the coding agent you already use." Button: "Connect."

The coding agent does nothing.

**2. Answer two questions, then copy the paste.** Under a minute. A window on the page they are already on.

Connect opens that window. It asks which coding agent they use, then what to name the agent they already run. The name is the agent they have, not a new one to build. The window then shows the paste, with that name and that client filled in, and Copy beside it. The address is inside the paste. There is no server-URL field, and no client tabs to hunt through.

Today the connect card is titled Connect a coding agent (MCP). The page around it is Coding assistants, Trace ingestion, Manage permissions, and the tenant-and-region line, and the URL sits above the client tabs. This session does not open that page. Trace ingestion, Manage permissions, and the region line stay in the product for a later visit.

On screen, in order: "Which coding agent are you using?" Then "What do you want to name this agent?" Then "Paste this into Cursor." with the block and Copy. The last line of the window says that when the browser opens, they click Allow. The button that closes the window is "I've pasted it."

The coding agent does nothing until the paste arrives.

**3. Paste it into the coding agent.** Under a minute. The project they already have open.

The human pastes the copied block into the coding agent.

Today each tab is a short manual: a scope choice, a command, a file, and a second way to do the same thing, and the paste block comes after that. This session leads with the paste. Add to Cursor, the command, and the connector form are not the first action. Another client is removed from this session.

The coding agent stores the address.

**4. Allow.** A few seconds. The browser step the card already opens.

The human clicks Allow.

Today the card then tells them how to finish inside the client, with a different path per product. Replace that list with the button they are already looking at.

On screen: "Agent Score wants to use your Tosca Cloud account." Button: "Allow."

The coding agent is signed in as them.

**5. The coding agent connects the project.** One to three minutes, almost all of it the coding agent working.

The setup sentence was already in the paste from step 2. The human does not copy a second setup prompt.

Today that sentence is missing from the card. Check it works comes first, and the Claude Code tab then asks for an ingest key and exporter settings. Replace both with the paste block at the top of the card.

While the coding agent works, the thread shows its own progress. When the human clicks "I've pasted it," Agent Score opens a page titled Waiting for traces. That page does not exist today. The collecting state is a chip on the agent row.

The coding agent uses the name they typed, creates the secret, and writes it into the project's environment file. It does not print the secret. It does not ask the human to copy anything, and it does not ask them to choose what gets measured.

**6. Approve that change.** A few seconds. The coding agent's own approval.

The human approves the one change.

On screen, in the coding agent: "Connect `<agent name>` to Agent Score."

The coding agent writes the change after that approval.

**7. Use the agent once, the way they already do.** As long as one real request takes.

The human restarts it if it was already running, then sends one real request. A ping, a hello, or a hand-picked example does not count.

Today nothing in the product says this, and the check in step 6 of the current process runs before any real request. Waiting for traces says it: use the agent the way they already do, and a test does not count. The confirm sentence is on that page, so they do not have to remember it from the window.

**8. Paste the confirm sentence.** A few seconds once activity has arrived. Same thread.

The human pastes the confirm sentence from section 2, with the same name.

Today the sentence has no name, and the tool answer is keys plus counts for the last hour. The redesigned sentence includes the name. The reply the human reads is one line: "`<agent name>` is connected. Activity from it is coming in. Keep using it as you already do. The score appears on this agent after about 20 real runs. You can leave."

The coding agent calls the existing connection check with that agent name. Success is activity accepted for that name. The reply does not read out a secret, a key list, or a drop count.

**9. Come back and read the verdict.** Under a minute, once a score exists. My Agents, then the agent's Score tab.

The human opens the agent from My Agents. The Score tab is the tab they land on. It already shows the score and the verdict. This session adds two things that already exist on other tabs of the same agent: the purpose from the Agent Card, and the fitted profile name from the Profile tab.

On the Score tab:

```
<agent name>
82
Ship with note

Ship is 85 to 100. Ship with note is 70 to 84. Needs work is 55 to 69. Don't ship recommended is 40 to 54. Don't ship is 0 to 39.

What this agent is for
<the purpose already written from the agent's runs>
Agent Score wrote this from the agent's real runs.

Scored as
<the fitted profile name, for example Tool Caller>
Agent Score chose this from what the agent did.
```

The score, and each part of it, uses the link the Score tab already has. That link opens the run that produced the number: what the agent was asked, what it did, and what it answered.

The human reads the verdict and opens one number. The session ends.

They do not open the Agent Card, the Profile tab, Improve, Settings, or Traces. Those tabs stay in the product. They are not part of this visit. The Profile tab's Create an eval, Create a profile, schedule, and The bar stay where they are, off this path.

**Human actions: 10.** Sign in. Choose the coding agent. Name the agent they already run. Copy the paste. Paste it into the coding agent. Allow. Approve the change. Use the agent once. Paste the confirm sentence. Open the score and read it.

## 2. The two sentences

The window prints the connect sentence, with the name they typed. Waiting for traces prints the confirm sentence, with the same name.

Connect:

```
Set this agent up to send what it does to Agent Score. Name it <agent name>.
```

Confirm:

```
Check my agent connection for <agent name>.
```

No other prompt. The current check sentence, and the Claude Code follow-up about creating an ingest key, come off the card.

## 3. The wait

After they paste, they land on a page titled Waiting for traces. The score does not finish while they watch. They can leave the page open. The heading stays Waiting for traces until the score exists. Then the same page says the score is ready and offers one button, Read the score, which opens the Score tab.

Today that page does not exist. The same moments are a chip on the My Agents row: Setting up, Learning your agent, Building the scorecard, Scoring now, Scored, Needs attention. The words below replace the chip text on this page.

| Current stage | Current words | Waiting for traces |
| --- | --- | --- |
| connecting | Setting up | "Nothing from `<agent name>` yet. Use it the way you already do. A score needs about 20 traces. A test does not count. You can leave this page open." |
| collecting | Learning your agent — n of 20 traces | "12 of about 20 traces from `<agent name>`. Keep using it the way you already do. A test does not count. You can leave this page open." |
| awaiting_fit, fitting | Building the scorecard | "Enough traces are in from `<agent name>`. Agent Score is writing what this agent is for, then the score. You can leave this page open." |
| scoring | Scoring now… | Same sentence as the row above. |
| up_to_date | Scored | "The score is ready." The verdict name, and the score. Read the score opens the Score tab in step 9. |
| needs_attention, nothing scored | Needs attention — last scoring run found nothing to score | "Something arrived from `<agent name>`, and none of it can be scored. A test does not count. Use it on a real request." |

Ready for its first score, and the Score tab's "Score now", are the gap in section 6. This session does not use them.

## 4. Failure states

Each one already has a place. Each one keeps a single next action.

**Not signed in.** The sign-in screen, or the browser step that never opens. "Sign in with your Tosca Cloud account." Next action: sign in.

**Coding agent not connected.** The client asks them to authenticate, or the setup sentence comes back with no Agent Score tools. Today the card's failure section is a list: 401, start the sign-in again, invalid redirect, a blocked network, signing out client by client. Replace that list, for this session, with one line on the card: "Agent Score isn't connected to your coding agent yet. Copy the address, paste it whole, then click Allow." Next action: copy the address, paste it whole, click Allow.

**Connection check returns nothing for that name.** The confirm reply. Today the check reports keys and a last-hour count, often for the whole tenant. The reply becomes: "`<agent name>` hasn't sent anything yet. Use it the way you already do, then check again." Next action: use the agent on a real request, then paste the confirm sentence again.

**Activity arrived, and none of it can be scored.** The needs_attention row in section 3. Next action: use the agent on a real request, then paste the confirm sentence again.

**Score still being written.** The building and scoring rows in section 3. Next action: close the page and come back to this agent.

**Score ready.** The Score tab in step 9. Next action: read the verdict and open one number.

## 5. Cut list

Removed from this session. The current process includes the first group today.

- Take a tour, and the example agents on Home
- Trace ingestion, Manage permissions, and the region line on the first visit to Integrations
- The client scope choice, the second add method on each tab, and the Another client tab
- Check it works before the agent is set up
- "Create an Agent Score ingest key and write the exporter settings to .env"
- Connect agent on My Agents, and the dialog that shows an API key and exporter variables
- Score now on an agent that has no score yet
- The Agent Card, Profile, Improve, Settings, and Traces tabs as places they must open
- Create an eval, Create a profile, the schedule, and The bar
- Install an SDK or add a package
- Create, copy, or paste an API key
- Pick a profile, a dimension, or a verdict threshold
- Write or approve an eval
- Label data, or supply example answers
- Build a sample agent
- Set a scoring schedule
- Generate advice, or regenerate the description
- Invite a teammate, explain credits, or open Usage
- Ask them to manufacture 20 examples while they wait

## 6. Gaps

These are the places the redesigned process still breaks on the current product.

**Home cannot open the connect card.** The first visit offers Take a tour and nothing that leads to Integrations. Step 1's Connect button is not on Home. Until it is, the path still includes finding Integrations in the sidebar.

**The connect card still teaches the old order.** Every client tab ends on Check it works and "Use agent-score to check my agent connection." The Claude Code tab then tells them to create an ingest key and write exporter settings to `.env`. The setup sentence is not on the card. The card also cannot hide Trace ingestion, Manage permissions, or the region line for a first visit. Those are the page.

**The connection check still returns the secret's neighbors.** `check_agent_connection` returns live ingest keys, last used, and received, accepted, and dropped counts. It defaults to the last hour, and it is tenant-wide unless the coding agent passes `agent_name`. The confirm sentence only works if the coding agent passes the name and does not read the keys out loud. `create_ingest_key` returns the secret to the coding agent. The instruction says not to print it. Nothing in the product stops the reply from printing it, and Connect agent on My Agents still shows a key.

**The confirm reply cannot say how close the score is.** The check reports whether activity was accepted. It does not report n of 20, and it does not say a verdict exists. The leave sentence in step 8 can be said from that reply. The "12 of about 20" sentence exists only on the agent row, after they open My Agents.

**"Ready for its first score" is a stop.** That stage means a profile is bound and the agent has never been scored. The Score tab then says "No scores yet" and "Score now to see results." Scheduled scoring waits at least 60 minutes. Relabeling the chip does not start the score. This session needs the first score to start on its own once about 20 real runs have arrived. The product does not say that, and Score now asks for a click this session does not have.

**The 20-count does not say what failed to count.** The chip is "n of 20 traces." It does not say a test ping will not move it. A later Needs attention reason says "this profile needs example answers to score," which sends them into labeled examples. The operator string "Nothing scoreable in the trace" never appears as the one-line customer state in section 3.

**The Score tab does not hold the verdict they are here to read.** The purpose is on the Agent Card, marked synthesized and draft, with Regenerate. On at least one agent the purpose text includes raw model markup. The fitted name is on the Profile tab, beside Create an eval, Create a profile, and The bar. The bar uses Review required, Block recommended, and Block. The Score tab uses Needs work and Don't ship (recommended). My Agents can show Ship for a Ship with note score. Home counts Review and Block. Putting the purpose and the fitted name on the Score tab, and using one set of verdict names on Home, My Agents, the Score tab, and The bar, is a change to those existing views. It is not done.

**The number does not open the run that produced it.** From a score, the interaction panel opens off-screen. The trace link looks like plain text. The trace opens on the root, with the part that produced the number unmarked. The reason on the score is judge output, and the check names are slugs. Step 9 needs the existing link to open that run in plain language. It does not.
