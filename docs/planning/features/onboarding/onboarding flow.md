1. User logs in with Tosca account
2. User is presented with the box saying `Connect` on the home page. This brings them to the Integrations page for the MCP.
3. Clicking connect shows a popup with the following:
    AgentScore scores an agent you already run and tells you whether it can ship. Your coding agent does the setup.
    1. Connect the coding agent you already use to AgentScore via MCP
    2. Use the agent as you normally would
    3. Come back to read its score and verdict, along with improvement steps
4. User is presented with four choices of their coding environment and the following message:
    `Which coding agent are you using?`
    Then they are given four chocies along with the following:
    1. Claude code
    Copy and paste the below to your coding agent:
    ```Add the Agent Score MCP server to Claude Code.
    Run exactly: claude mcp add --transport http --scope local agent-score "https://api-eu-west-3.ai.tricentis.com/agent-score/customer/v1/mcp?tenant_name=tais&product_name=tosca-cloud"
    Use the URL as given, including everything after the ?. Do not add headers, tokens or an API key: it signs in through the browser.
    When it is added, tell m e to run /mcp, choose agent-score and pick Authenticate.
    ```
    2. Cursor
     Copy and paste the below to your coding agent:
    ```Add the Agent Score MCP server to Cursor.
    In .cursor/mcp.json, add this entry under "mcpServers", keeping any servers already there:
    "agent-score": { "url": "https://api-eu-west-3.ai.tricentis.com/agent-score/customer/v1/mcp?tenant_name=tais&product_name=tosca-cloud" }
    Use the URL as given, including everything after the ?. Do not add headers, tokens or an API key: it signs in through the browser.
    Then tell me to open Customize, go to MCP, select agent-score and sign in.
    ```
    3. Codex
     Copy and paste the below to your coding agent:
    ```Add the Agent Score MCP server to Codex.
    In ~/.codex/config.toml, add this section, or replace an existing [mcp_servers.agent-score] section, keeping everything else:
    [mcp_servers.agent-score]
    url = "https://api-eu-west-3.ai.tricentis.com/agent-score/customer/v1/mcp?tenant_name=tais&product_name=tosca-cloud"
    Use the URL as given, including everything after the ?. Do not add headers, tokens or an API key: it signs in through the browser.
    The file is outside this project; ask me to approve the change if needed.
    Then tell me to restart Codex and authenticate agent-score.
    ```
    4. Claude desktop
    ``` 
    ```
5. Below this box shows `Advanced`:


