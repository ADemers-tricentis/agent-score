1. User logs in with Tosca account. The top bar shows `Tosca Cloud`, their AI credits (e.g. `AI credits: 1,000.000 / 1,000.000`) and their account menu. The left rail has a Workspace / Assistant switch and links to Home, My Agents, Evals, Usage, Integrations, Settings and Docs. This flow only uses Home, My Agents and Integrations.
2. The Home page, titled `Home`, shows one card:
    - A `Next step` chip
    - `Connect the coding agent you already use`
    - `Agent Score scores an agent you already run and tells you whether it can ship. Your coding agent does the setup.`
    - A `Connect` button. It opens the Integrations page for the MCP with the Connect popup from step 3 already open.

    Before setup starts, the Integrations page itself, titled `Integrations`, shows one card, `Connect a coding agent (MCP)`, with a `Connect` button that opens the same popup.
3. The Connect popup is titled `Connect` and has a close button. It shows:
    AgentScore scores an agent you already run and tells you whether it can ship. Your coding agent does the setup.
    1. Connect the coding agent you already use to AgentScore via MCP
    2. Use the agent as you normally would
    3. Come back to read its score and verdict, along with improvement steps

    A `Continue` button takes them to step 4.
    The close button, here and on the popups in steps 4 and 5, closes the popup and leaves the user on the Integrations page.
4. The next popup is titled `Which coding agent are you using?`, has a close button, and gives five choices:
    1. Claude code
    2. Cursor
    3. Codex
    4. Claude desktop
    5. Another client

    It has `Back` (to step 3) and `Continue`. `Continue` stays disabled until a choice is picked. Claude desktop and Another client skip step 5 and go straight to their "set it up myself" instructions in step 6.
5. The next popup is titled with the chosen client's name, has a close button, and gives two options:
    1. Have my coding agent set it up
    2. Set it up myself (advanced)

    Picking either one goes straight to step 6; there is no `Continue`. `Back` returns to step 4.
6. The popup closes and the Integrations page shows one card for the chosen client:
    - Two chips: the client name, and the setup choice (`Have my coding agent set it up`, `Set it up myself (advanced)`, or `Set it up myself` for Claude desktop and Another client).
    - The client name as a heading.
    - The instructions below for that client and choice.
    - A notice: `Once the connection is complete, this page will update automatically.`
    - A `Choose a different coding agent` button, which reopens step 4.

    Every code box has a `Copy` button. After a click it reads `Copied` with a check mark.

    a. Claude code + have my coding agent set it up
    Copy and paste the below to your coding agent:
    ```
    Add the Agent Score MCP server to Claude Code.
    Run exactly: claude mcp add --transport http --scope local agent-score "https://api-eu-west-3.ai.tricentis.com/agent-score/customer/v1/mcp?tenant_name=tais&product_name=tosca-cloud"
    Use the URL as given, including everything after the ?. Do not add headers, tokens or an API key: it signs in through the browser.
    When it is added, tell me to run /mcp, choose agent-score and pick Authenticate.
    ```
    a2. Claude code + set it up myself
    1. Add the server
    Run in a terminal, in your project folder:
    ```
    claude mcp add --transport http --scope local agent-score "https://api-eu-west-3.ai.tricentis.com/agent-score/customer/v1/mcp?tenant_name=tais&product_name=tosca-cloud"
    ```
    2. Sign in
    In Claude Code, run `/mcp`, choose `agent-score`, then `Authenticate`. Or run:
    ```
    claude mcp login agent-score
    ```
    Your browser opens Agent Score. Sign in to Tosca Cloud if asked, check the request, and click Allow.
    3. Check it works
    Ask Claude Code: `Use agent-score to check my agent connection.` It answers with your ingest keys and whether traces arrived in the last hour.
    Next, ask it to `create an Agent Score ingest key for this project and write the exporter settings to .env`.
    b. Cursor + have my coding agent set it up
    Copy and paste the below to your coding agent:
    ```
    Add the Agent Score MCP server to Cursor.
    In .cursor/mcp.json, add this entry under "mcpServers", keeping any servers already there:
    "agent-score": { "url": "https://api-eu-west-3.ai.tricentis.com/agent-score/customer/v1/mcp?tenant_name=tais&product_name=tosca-cloud" }
    Use the URL as given, including everything after the ?. Do not add headers, tokens or an API key: it signs in through the browser.
    Then tell me to open Customize, go to MCP, select agent-score and sign in.
    ```
    b2. Cursor + set it up myself
    1. Add the server
    Click `Add to Cursor`. It opens Cursor and asks you to confirm. (An `Add to Cursor` button sits under this line. After a click it shows a check mark.)
    2. Sign in
    Open `Customize` in the sidebar, go to `MCP`, select `agent-score` and sign in. Allow the request in the browser.
    3. Check it works
    Ask Cursor's agent: `Use agent-score to check my agent connection.` It answers with your ingest keys and whether traces arrived in the last hour.
    c. Codex + have my coding agent set it up
    Copy and paste the below to your coding agent:
    ```
    Add the Agent Score MCP server to Codex.
    In ~/.codex/config.toml, add this section, or replace an existing [mcp_servers.agent-score] section, keeping everything else:
    [mcp_servers.agent-score]
    url = "https://api-eu-west-3.ai.tricentis.com/agent-score/customer/v1/mcp?tenant_name=tais&product_name=tosca-cloud"
    Use the URL as given, including everything after the ?. Do not add headers, tokens or an API key: it signs in through the browser.
    The file is outside this project; ask me to approve the change if needed.
    Then tell me to restart Codex and authenticate agent-score.
    ```
    c2. Codex + set it up myself
    1. Add the server
    `Where do you use Codex?` with the caption `They share one configuration, so adding it once covers all three.` Below it, a toggle of three options, one selected at a time, with ChatGPT desktop app selected by default:
        - ChatGPT desktop app
        - Codex IDE extension
        - Codex CLI

    Steps 1 and 2 show the text for the selected option only:
        - ChatGPT desktop app: In the ChatGPT desktop app: **Settings → MCP servers → Add server**. Name `agent-score`, choose **Streamable HTTP**, paste this URL, **Save**, then **Restart**.
        `https://api-eu-west-3.ai.tricentis.com/agent-score/customer/v1/mcp?tenant_name=tais&product_name=tosca-cloud`
        - Codex IDE extension: In the Codex panel of your editor: **gear menu → MCP servers → Add server**. Name `agent-score`, choose **Streamable HTTP**, paste this URL, **Save**, then **Restart extension**.
        `https://api-eu-west-3.ai.tricentis.com/agent-score/customer/v1/mcp?tenant_name=tais&product_name=tosca-cloud`
        - Codex CLI: Run in a terminal:
        ```
        codex mcp add agent-score --url "https://api-eu-west-3.ai.tricentis.com/agent-score/customer/v1/mcp?tenant_name=tais&product_name=tosca-cloud"
        ```
    2. Sign in
        - ChatGPT desktop app: In **Settings → MCP servers**, click **Authenticate** beside agent-score and Allow the request in the browser.
        - Codex IDE extension: In **MCP servers**, click **Authenticate** beside agent-score and Allow the request in the browser.
        - Codex CLI:
        ```
        codex mcp login agent-score
        ```
        Allow the request in the browser, then start a new Codex session so it loads the server.
    3. Check it works (the same for all three)
    Confirm agent-score is listed: type `/mcp` in the ChatGPT desktop app or the CLI, or open **MCP servers** in the IDE extension. Then ask:
    ```
    Use agent-score to check my agent connection.
    ```
    It answers with your ingest keys and whether traces arrived in the last hour.
    d. Claude desktop + set it up myself
    There is no copy-paste prompt. The coding agent can't add a Claude desktop connector.
    1. Add the connector
    Free, Pro and Max: in Claude (desktop app or claude.ai), open Customize → Connectors and choose Add custom connector.
    Team and Enterprise: an owner adds it once in Organization settings → Connectors → Add → Custom → Web. Members then find it under Customize → Connectors, marked Custom, and click Connect.
    Fill in the form with these values, then click Add:
        - Name: `Agent Score`
        - Remote MCP server URL: paste it whole, including the part after `?`. `https://api-eu-west-3.ai.tricentis.com/agent-score/customer/v1/mcp?tenant_name=tais&product_name=tosca-cloud`
        - Advanced settings, OAuth client ID and client secret: leave both empty. Claude registers itself when you sign in.
    2. Sign in
    Click Connect on the connector and Allow the request in the browser. If asked, choose Sign in now and keep the default OAuth client or choose Register automatically. These settings cannot be changed later; to change them, remove the connector and add it again. The Claude apps add connectors only through these settings, so there is no prompt to paste.
    3. Check it works
    In a chat, click + → Connectors and turn on Agent Score, then ask: `Use Agent Score to check my agent connection.` It answers with your ingest keys and whether traces arrived in the last hour.
    e. Another client + set it up myself
    Any MCP client that supports remote servers with browser sign-in and registers itself.
    1. Add the server
    Enter these values:
        - Server name: `agent-score` (any name works)
        - URL: paste it whole. The client must keep the part after `?` when it looks up the sign-in service. `https://api-eu-west-3.ai.tricentis.com/agent-score/customer/v1/mcp?tenant_name=tais&product_name=tosca-cloud`
        - Transport: Streamable HTTP
        - Sign-in: OAuth with dynamic client registration. The client finds the sign-in service from the URL.
        - Headers, API key, token, client ID: none. A client that insists on a client ID cannot connect.
        - Callback address: the client's own localhost, `127.0.0.1` or `[::1]` address. Other web callbacks are refused.
    2. Sign in
    Start sign-in from the client and allow the request in your browser.
    3. Check it works
    Ask your coding agent: `Use agent-score to check my agent connection.` It answers with your ingest keys and whether traces arrived in the last hour.
7. Below the client instructions, two collapsible sections, both closed by default:
    Connection details
    - Server URL: `https://api-eu-west-3.ai.tricentis.com/agent-score/customer/v1/mcp?tenant_name=tais&product_name=tosca-cloud`, with a Copy button.
    Paste it whole. The part after `?` names your tenant and product; a client that drops it cannot sign in.
    - Tenant: `tais`
    The Tosca Cloud tenant you are signed in to. Each tenant has its own URL; to connect another, sign in to it here and copy its URL.
    - Region: `Europe (Paris) (eu-west-3)`
    Where your tenant's data lives.
    - Transport: `Streamable HTTP`
    Some clients call it "HTTP" or "remote".
    - Sign-in: `Your Tosca Cloud account, in the browser`
    No API key, token, header or client ID. The client registers itself.

    Troubleshooting. Each issue is its own collapsible row, closed by default.
    1. The client says it needs authentication, or shows 401
    The server is added but you have not signed in yet, or the sign-in expired. Do the "Sign in" step for your client again. A sign-in lasts as long as your organization's Tosca Cloud session policy allows.
    2. "Start the sign-in again" or "This sign-in can't be finished"
    A sign-in must finish in the browser tab that started it, within ten minutes, and works once. Start it again from your client and keep that tab open until you are back in the client.
    3. The client reports "invalid redirect" or cannot register
    The client uses a callback address Agent Score does not accept. The clients listed above are supported; another client must sign in through a localhost callback.
    4. Claude says "Couldn't reach the MCP server"
    The Claude apps connect from Anthropic's cloud, not from your computer. Check the Server URL is pasted whole. If it is, contact your Tricentis contact: the connection from Anthropic's network may be blocked.
    5. My agent can't see a tool
    The group that holds it may be off, for you or for your organization. Check Manage permissions. A group you turn on shows up only after you reconnect your coding agent; a group you turn off applies at once.
    6. I want to disconnect a client
    Signing out of Agent Score does not disconnect a client; each client holds its own sign-in.
        - Claude Code: `claude mcp logout agent-score`, or Clear authentication in `/mcp`. Removing a project-wide server removes it for every teammate.
        - Cursor: sign out of agent-score in Customize → MCP. Cloud agents keep their own sign-in; sign out on the server's Cloud row too.
        - Claude apps: disconnect the connector in Customize → Connectors.
        - Codex: `codex mcp logout agent-score` from a terminal.
    These stop the client using its sign-in. To revoke it everywhere, ask your Tosca Cloud administrator to end your sessions.
8. As soon as the connection is detected, a popup opens over the Integrations page:
    - Title: `Connection detected. Name your agent.`, with a close button.
    - A text box labeled `What do you want to name your agent?`
    - A `Submit` button. Pressing Enter in the text box also submits. Submitting an empty name shows `Enter a name.` under the text box.

    Once the user submits a name, we take them to My Agents/{{agent-name}}.

    The agent page, here and in steps 9–12, has:
    - A breadcrumb: `My Agents / {{agent-name}}`.
    - A header with {{agent-name}}, an `Active` status, a status chip, and the caption `tais · external`. The status chip reads `Waiting for real requests`, then `12 of about 20` (step 9), `20 of about 20` (step 10) and `Scored` once scored.
    - Header actions: `Ask the assistant`, a refresh button, and `Score now`. `Score now` is disabled until the agent is scored.
    - Tabs: Score, Improve, Agent Card, Traces, Profile, Labeling, Settings. Score is open by default. Improve and Traces are disabled until the agent is scored. Profile is disabled until step 10. Agent Card, Labeling and Settings are not part of this flow and stay disabled in the mock. The Traces tab lists the agent's traces in a table with three columns, Trace, Started and First message, and each row opens that trace.

    The My Agents page, titled `My Agents`, lists one row per agent with three columns: Agent, Status (the same status chip) and Score (`—` until scored, then the score and verdict, e.g. `66` `Needs work`). Clicking the row opens the agent page. With no agents, the table shows `No agents yet.`

    On the Score tab, we show, with an hourglass icon:
    - `Waiting for real requests`
    - `Nothing from {{agent-name}} yet. Restart {{agent-name}} if it was running, then use it the way you already do. A score needs about 20 real requests to {{agent-name}}. A hello or a made-up request does not count. You can close this page; the score will be on {{agent-name}} in My Agents.`

    Below it, a card with the instructions to paste to their coding agent:

    `Paste the following into your coding agent. It will update your current agent to properly send traces to AgentScore:`

    ```
    Set this agent up to send its traces to Agent Score. Name it {{agent-name}}.
    ```

9. Once the first trace is received, the setup paste box from step 8 goes away and we show, with the same hourglass icon:
    - `Request received. Keep using your agent.`
    - `12 of about 20 real requests to {{agent-name}}. Keep using it the way you already do. A hello or a made-up request does not count. You can close this page; the score will be on {{agent-name}} in My Agents.`
    - A progress bar.
    - A card: `Paste the following into your coding agent to check the status of AgentScore at any time:` followed by a code box and a Copy button, containing:

    ```
    Use agent-score to check my agent connection.
    ```

10. Once the agent has enough real requests, we show a popup over the agent page:
    - Title: `Agent Score has enough to go on.`, with a close button.
    - `It will analyze {{agent-name}}, write the evaluations, and then score it. You can close this page. The score will be on {{agent-name}} in My Agents.`
    - A `Close` button.

    The page has:
    - A progress bar with the caption `20 of about 20 real requests`
    - A notice: `This page will update automatically once your first scoring run is complete.`
    - A link, `Show me what evals were chosen for {{agent-name}} and why.` It opens the Profile tab of {{agent-name}}, which shows the profile Agent Score chose (e.g. `Tool Caller`), why it chose it (e.g. `Agent Score chose this profile because the agent answers by using tools.`), and an Evals table with three columns, Eval, Threshold and Weight (e.g. `Task completion` `0.80` `50`, `Tool use` `0.70` `30`, `Refund eligibility` `0.90` `20`).
    - `Want to know what Agent Score thinks this agent is for? Paste this into your coding agent:` followed by a code box and a Copy button, containing:

    ```
    Use agent-score to tell me what {{agent-name}} is for.
    ```

    Once scoring finishes, we show the normal score page: the Score tab of {{agent-name}}, with its score and verdict visible. The status chip reads `Scored`, and `Score now`, Improve and Traces become available. It has:
    - A score gauge (e.g. `66 / 100`) and the verdict (e.g. `Needs work`).
    - A line explaining the verdict band, e.g. `66 out of 100. Needs work is 55 to 69.`
    - A `Score breakdown` card, e.g. `These three parts weight to 66.`, with one row per part showing its name, a bar, its score and its weight (e.g. `Task completion` `60` `Weight 50`, `Tool use` `70` `Weight 30`, `Refund eligibility` `75` `Weight 20`).

    Everything from here on happens only after that score exists.

11. **Proposed.** The Score tab gets one new control, beside the verdict: a button labeled `Improve`. Apart from that button, the page looks exactly the same as the current Score tab; the mock shows a note saying so and highlights the button.
    - It is the only new control on the Score tab. No banner, second paste box or tour is added.
    - It appears once the score and verdict are visible. Steps 8–10 never show it.
    - Clicking `Improve` opens the Improve tab of {{agent-name}}. If the latest scored run has no advice yet, the click also starts Generate advice for that run. If the run already has advice, the click just opens the tab. Opening the Improve tab directly does the same.
    - The score and verdict stay visible at the top of the Improve tab.

12. The Improve tab of {{agent-name}} looks the same as the current Improve tab, with the changes marked **Proposed** below. The mock shows a note listing the changes, and highlights the score and verdict, the generating message and the paste box.

    Unchanged from today:
    - A card with the heading `Improve this agent`, the line `Generate prioritized recommendations from the latest scored evidence. Existing advice stays visible while a new analysis runs.`, and a `Generate advice` button on the right.
    - Below it, a box for the advice run: when it was generated (e.g. `11/11/2026, 1:57:49 PM`) and a `succeeded` chip, then each recommendation in that run, separated by a divider. Each recommendation shows its title and its rank (`high` in red, `medium` in orange or `low` in grey). The mock's run has three: `Check the refund window before saying a refund was issued` (high), `Finish cancellations instead of stopping after finding the order` (medium) and `Save what the agent looked up along with each reply` (low).

    Changes:
    - **Proposed:** the score and verdict from the Score tab, above the card (e.g. `66 / 100` `Needs work`).
    - **Proposed:** while advice is generating, `Generating advice from the latest scored run of {{agent-name}}.` in place of the advice run. The page updates on its own when it finishes.
    - **Proposed:** every recommendation is written in plain language, for someone who did not build the agent's tracing. No eval names, scores, span ids, tool names or tracing terms in the text. Each one has:
        - What to change, in one or two sentences (e.g. `Before the agent tells a customer their refund is done, have it check how old the order is. If the order is past the 30-day refund window, it should say so and offer what the policy allows instead.`).
        - `What happened:` what the agent did in one conversation, followed by a `View trace {{trace-id}}` link showing the first eight characters of the trace id. For example: `In one conversation, the agent told a customer "Your refund has been issued" for an order placed 47 days ago.` `View trace 4f8c2a91`.
        - `Why it matters:` the effect on the agent's users or the business (e.g. `Customers are being promised refunds the business will not give.`).
    - **Proposed:** each `View trace` link opens that trace on the Traces tab of {{agent-name}}. The trace page shows its id, when it ran, which recommendation cites it (`Cited by "{{recommendation title}}"`), and each step of the conversation labeled `Customer`, `Looked up` or `Agent`, with the step the recommendation points at outlined in red and marked `Cited in advice` in the recommendation's rank color. A `Back to Improve` button returns to the Improve tab. A trace opened from the Traces tab list shows `All traces` instead, which returns to the list. The link works for every trace a recommendation cites; a recommendation never cites a trace that cannot be opened.
    - **Proposed:** under the advice, `Hand the top recommendation to your coding agent. Paste this into it:` followed by a code box and a Copy button, containing:

    ```
    Use agent-score to read the latest improvement advice for {{agent-name}}.
    If that advice is still being generated, wait until it finishes, then read it.
    Take the single highest-priority recommendation. If more than one is ranked high, take the first one listed.
    Tell me in one or two plain sentences what it is and why it matters for {{agent-name}}.
    Then propose that change in this project: show me the edit you would make, and wait for my go-ahead before you apply it.
    Do not ask me to pick a recommendation, open a trace, or tell you the score.
    ```

    The paste box shows as soon as the tab opens, even while advice is still generating, because the coding agent waits for it. Copying it is the person's only next action. The coding agent reads the advice with `get_improvement_advice`, waits on a generation that is still running with `get_job`, and proposes the change in the project already open.

## MCP-only path (proposed)

Some people never come back to the web app once their coding agent is signed in. Using only the MCP is a full path, not a fallback: the coding agent's thread replaces the web screens in steps 8–12, and the coding agent never hands the person off to the web app. The thread is not an Agent Score page. A person on the web path gets these same updates, and either side can be closed. The thread ends with the same paste block as step 12, word for word.

They still do steps 1–7 in the web app as written. When the coding agent cannot sign in by itself, the person still clicks Allow in the browser, as in their client's "Sign in" step.

Web screens this person skips:
- Step 8: the naming popup, and the My Agents/{{agent-name}} page with its paste box and `Waiting for real requests`.
- Step 9: the `Request received. Keep using your agent.` page, its progress bar and its status-check paste box.
- Step 10: the `Agent Score has enough to go on.` popup, including its evals link and its "what this agent is for" paste box, and the Score tab.
- Step 11: the `Improve` button.
- Step 12: the Improve tab and its Copy button.

In the thread, each message from the coding agent ends with one next action for the person:

1. Instead of the naming popup in step 8. Once sign-in finishes and the person is back in the thread, the coding agent checks the connection with `check_agent_connection`. With no agent sending traces yet, it asks:

    `What should Agent Score call this agent?`

    Next action: type a name. That name is {{agent-name}} from here on.

2. Instead of the paste box and waiting page in step 8. The coding agent does what the step 8 paste asks, under {{agent-name}}, then says:

    `{{agent-name}} is set up. Nothing from {{agent-name}} yet. Restart {{agent-name}} if it was running, then use it the way you already do. A score needs about 20 real requests. A hello or a made-up request does not count.`

    Next action: use the agent.

3. Instead of step 9. The coding agent keeps watching in the same thread. It calls `check_agent_connection` for {{agent-name}}, waiting on the server each time, and posts a new line whenever the count rises:

    `12 of about 20 real requests to {{agent-name}}. Keep using it the way you already do. A hello or a made-up request does not count.`

    Next action: keep using the agent. If the coding agent's session ends before the score, the person asks in the thread how it is going, and the coding agent picks up from where it left off.

4. Instead of the popup in step 10. Once {{agent-name}} has about 20 real requests:

    `Agent Score has enough to go on. It is analyzing {{agent-name}}, writing the evaluations, and then scoring it. I'll post the score here when it's ready.`

    `Want to see what evals were chosen and why? Ask me: "Show me what evals were chosen for {{agent-name}} and why."`

    Next action, optional: ask that question. The coding agent answers from `get_profile_fit` with the chosen profile, why it was chosen, and each eval with its threshold and weight, then goes back to waiting for the score with `get_scorecard`. For example:

    ```
    Tool Caller. Agent Score chose this profile because the agent answers by using tools.

    Task completion. Threshold 0.80. Weight 50.
    Tool use. Threshold 0.70. Weight 30.
    Refund eligibility. Threshold 0.90. Weight 20.
    ```

5. Instead of the Score tab and steps 11–12. Once `get_scorecard` returns a score and verdict, the coding agent calls `request_improvement_advice` for the latest scored run, which stands in for the `Improve` click, and says:

    `{{agent-name}} scored 66 out of 100. Verdict: Needs work.`

    `Paste this here, or in a new session in this project, to get the top recommendation as a change to your project:`

    followed by the step 12 paste block, unchanged.

    Next action: paste it.

### Change to the MCP server's onboarding guidance (proposed)

Today the MCP server tells the coding agent to stop once traces arrive. Step 6 of `agent-score://docs/onboard-your-agent` ends: "The developer follows the agent's progress in the Agent Score app; nothing more is needed from you." With that sentence in place, the MCP-only path cannot happen.

Replace that sentence with:

```
Do not stop here, and do not send the developer to the Agent Score app. Stay in this thread and follow the agent until it has a score.
Keep calling check_agent_connection with agent_name and wait_seconds 25. Each time traces.accepted rises, tell the developer how many of about 20 real requests have arrived, and to keep using the agent the way they already do.
At about 20, tell the developer Agent Score has enough to go on and is scoring the agent. If they ask what evals were chosen and why, answer from get_profile_fit.
Call get_scorecard until it shows a score and verdict. Report both, call request_improvement_advice for the latest scored run, and show the developer the improvement paste block below, word for word.
If this session ends first, pick up from the same point the next time the developer asks.
```

The resource then carries the step 12 paste block, word for word. The limit in step 5 of the resource, "Do not poll indefinitely", stays: it covers confirming setup when no trace is ever accepted, not following progress after setup works.
