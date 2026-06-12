import { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import AuraTabPanel from "@tricentis/aura/components/TabPanel.js";
import ChipStatus from "@tricentis/aura/components/ChipStatus.js";
import ChipSubtle from "@tricentis/aura/components/ChipSubtle.js";
import Tag from "@tricentis/aura/components/Tag.js";

function StatusDot({ connected }: { connected: boolean }) {
  return (
    <Box
      sx={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        bgcolor: connected ? "success.main" : "text.disabled",
        flexShrink: 0,
        mt: "1px",
      }}
    />
  );
}

function IntegrationCard({
  title,
  subtitle,
  status,
  statusLabel,
  children,
  actions,
}: {
  title: string;
  subtitle: string;
  status: "connected" | "disconnected" | "beta" | "active";
  statusLabel: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const statusEl =
    status === "connected" || status === "active" ? (
      <ChipStatus status="Active" />
    ) : status === "beta" ? (
      <Tag
        label="beta"
        sx={{ height: 20, fontSize: "0.65rem", fontWeight: 700, bgcolor: "primary.dark", "& .MuiChip-label": { color: "primary.light" } }}
      />
    ) : (
      <ChipSubtle label={statusLabel} color="default" sx={{ fontSize: "0.65rem" }} />
    );

  return (
    <Paper sx={{ p: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <StatusDot connected={status === "connected" || status === "active"} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
        </Box>
        {statusEl}
      </Box>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: children ? 2 : 0 }}>
        {subtitle}
      </Typography>
      {children}
      {actions && (
        <>
          <Divider sx={{ mt: 2, mb: 1.5 }} />
          <Box sx={{ display: "flex", gap: 1 }}>
            {actions}
          </Box>
        </>
      )}
    </Paper>
  );
}

function MetricRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", py: 0.5 }}>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {label}
      </Typography>
      <Box sx={{ textAlign: "right" }}>
        <Typography variant="caption" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
          {value}
        </Typography>
        {sub && (
          <Typography variant="caption" sx={{ color: "text.disabled", display: "block", fontSize: "0.62rem" }}>
            {sub}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export default function IntegrationsView() {
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ p: 3, maxWidth: 1100 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
          Integrations
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Connect AgentScore to Tricentis products, CI/CD pipelines, and developer tooling.
        </Typography>
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v: number) => setTab(v)}
        sx={{ borderBottom: "1px solid", borderColor: "divider", mb: 3 }}
      >
        <Tab label="Tricentis" />
        <Tab label="CI / CD" />
        <Tab label="SDK & API" />
      </Tabs>

      <AuraTabPanel value={tab} index={0} sx={{ p: 0 }}>
        <TricentisTab />
      </AuraTabPanel>
      <AuraTabPanel value={tab} index={1} sx={{ p: 0 }}>
        <CiCdTab />
      </AuraTabPanel>
      <AuraTabPanel value={tab} index={2} sx={{ p: 0 }}>
        <SdkTab />
      </AuraTabPanel>
    </Box>
  );
}

function TricentisTab() {
  return (
    <Box>
      <Typography variant="overline" sx={{ color: "text.disabled", letterSpacing: "0.08em", display: "block", mb: 1.5 }}>
        Tosca
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 3 }}>
        <IntegrationCard
          title="Tosca Test API"
          subtitle="Submit Tosca test sessions directly for AgentScore evaluation. Verdict and dimension scores are written back to the session record."
          status="connected"
          statusLabel="Connected"
          actions={
            <>
              <Button size="small" variant="outlined" color="inherit" sx={{ color: "text.secondary" }}>
                Configure
              </Button>
              <Button size="small" variant="outlined" color="error">
                Disconnect
              </Button>
            </>
          }
        >
          <Box sx={{ bgcolor: "action.hover", borderRadius: 1, p: 1.5 }}>
            <MetricRow label="Endpoint" value="https://tosca-api.internal/score" />
            <MetricRow label="Auth method" value="Bearer token" />
            <MetricRow label="Sessions scored today" value="14" />
            <MetricRow label="Last sync" value="2 min ago" sub="2026-06-12T09:47:00Z" />
          </Box>
        </IntegrationCard>

        <IntegrationCard
          title="Tosca Cloud Review Panel"
          subtitle="Surfaces AgentScore verdict inline in the Tosca Cloud test review panel. Reviewers see PASS / PARTIAL / FAIL with dimension breakdown without leaving Tosca."
          status="beta"
          statusLabel="Beta"
          actions={
            <>
              <Button size="small" variant="contained" color="primary">
                Enable
              </Button>
              <Button size="small" variant="outlined" color="inherit" sx={{ color: "text.secondary" }}>
                Preview
              </Button>
            </>
          }
        >
          <Box
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
              p: 1.5,
              bgcolor: "action.hover",
              fontFamily: "monospace",
              fontSize: "0.7rem",
              color: "text.secondary",
            }}
          >
            <Typography variant="caption" sx={{ color: "primary.light", display: "block", fontWeight: 600, mb: 0.5, fontFamily: "monospace" }}>
              ▸ Tosca Cloud · Test Review
            </Typography>
            <Box sx={{ pl: 1, borderLeft: "2px solid", borderColor: "primary.dark" }}>
              <Typography variant="caption" sx={{ display: "block", fontFamily: "monospace" }}>AgentScore  <Box component="span" sx={{ color: "success.light", fontWeight: 700 }}>PASS · 87/100 · A</Box></Typography>
              <Typography variant="caption" sx={{ display: "block", fontFamily: "monospace", color: "text.disabled" }}>BP 88 · VE 82 · UX 79 · Harmony 86</Typography>
            </Box>
          </Box>
        </IntegrationCard>
      </Box>

      <Typography variant="overline" sx={{ color: "text.disabled", letterSpacing: "0.08em", display: "block", mb: 1.5 }}>
        AI Workspace
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 3 }}>
        <IntegrationCard
          title="AI Workspace Live Monitoring"
          subtitle="Stream live session events from AI Workspace agents into AgentScore. Sessions are scored in real time as they complete."
          status="active"
          statusLabel="Active"
          actions={
            <Button size="small" variant="outlined" color="inherit" sx={{ color: "text.secondary" }}>
              Configure stream
            </Button>
          }
        >
          <Box sx={{ bgcolor: "action.hover", borderRadius: 1, p: 1.5 }}>
            <MetricRow label="Streaming project" value="AI Workspace Agent" />
            <MetricRow label="Active sessions" value="3" />
            <MetricRow label="Sessions scored today" value="28" />
            <MetricRow label="Avg score today" value="87 · B+" />
          </Box>
        </IntegrationCard>

        <IntegrationCard
          title="AI Workspace Version Scoring"
          subtitle="Automatically run AgentScore on each AI Workspace model upgrade. Compare A–F grades across versions to gate model changes."
          status="active"
          statusLabel="Active"
          actions={
            <Button size="small" variant="outlined" color="inherit" sx={{ color: "text.secondary" }}>
              View comparisons
            </Button>
          }
        >
          <Box sx={{ bgcolor: "action.hover", borderRadius: 1, p: 1.5 }}>
            <MetricRow label="Tracked project" value="AI Workspace Agent" />
            <MetricRow label="Current model" value="Sonnet 4.6" />
            <MetricRow label="Sonnet 4.6 grade" value="A · 88/100" />
            <MetricRow label="Sonnet 4.5 grade" value="B · 81/100" sub="+7 pts vs. prior model" />
          </Box>
        </IntegrationCard>
      </Box>

      <Typography variant="overline" sx={{ color: "text.disabled", letterSpacing: "0.08em", display: "block", mb: 1.5 }}>
        qTest
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        <IntegrationCard
          title="qTest AI Chat Inline Verdict"
          subtitle="Embeds AgentScore verdict directly in the qTest AI Chat interface. QA engineers see PASS / PARTIAL / FAIL with grade and top failing dimension without leaving qTest."
          status="beta"
          statusLabel="Beta"
          actions={
            <>
              <Button size="small" variant="contained" color="primary">
                Enable
              </Button>
              <Button size="small" variant="outlined" color="inherit" sx={{ color: "text.secondary" }}>
                Preview
              </Button>
            </>
          }
        >
          <Box
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
              p: 1.5,
              bgcolor: "action.hover",
            }}
          >
            <Typography variant="caption" sx={{ color: "text.disabled", display: "block", mb: 0.75, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.6rem" }}>
              Inline verdict preview
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1, border: "1px solid", borderColor: "divider", borderRadius: 1, bgcolor: "background.paper" }}>
              <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: "#14532d", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography sx={{ fontWeight: 800, color: "#4ade80", fontSize: "0.9rem" }}>A</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, display: "block" }}>
                  87/100 · PASS — Ship
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.65rem" }}>
                  BP 88 · VE 82 · UX 79
                </Typography>
              </Box>
              <ChipStatus status="Passed" sx={{ ml: "auto" }} />
            </Box>
          </Box>
        </IntegrationCard>

        <IntegrationCard
          title="Deterministic Oracles"
          subtitle="Per-agent fast ground-truth checks that run before LLM judges. Zero-latency assertion layer for known-correct outputs."
          status="disconnected"
          statusLabel="Not configured"
          actions={
            <Button size="small" variant="contained" color="primary">
              Configure oracles
            </Button>
          }
        >
          <Alert severity="info" sx={{ fontSize: "0.75rem", py: 0.5 }}>
            No oracles configured for any project. Add deterministic checks to reduce LLM judge load on simple assertions.
          </Alert>
        </IntegrationCard>
      </Box>
    </Box>
  );
}

function CiCdTab() {
  return (
    <Box>
      <Typography variant="overline" sx={{ color: "text.disabled", letterSpacing: "0.08em", display: "block", mb: 1.5 }}>
        Pipeline integrations
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 3 }}>
        <IntegrationCard
          title="GitHub Actions"
          subtitle="Add an AgentScore PR check to your CI pipeline. Blocks merges when verdict is FAIL; posts grade and dimension breakdown as a PR comment."
          status="connected"
          statusLabel="Connected"
          actions={
            <Button size="small" variant="outlined" color="inherit" sx={{ color: "text.secondary" }}>
              View config
            </Button>
          }
        >
          <Box sx={{ bgcolor: "action.hover", borderRadius: 1, p: 1.5 }}>
            <MetricRow label="Repository" value="tricentis/autonomous-service" />
            <MetricRow label="Trigger" value="Pull request" />
            <MetricRow label="Block on" value="FAIL verdict" />
            <MetricRow label="Last check" value="1 hr ago · PASS" />
          </Box>
        </IntegrationCard>

        <IntegrationCard
          title="Azure DevOps"
          subtitle="Run AgentScore as a pipeline step in Azure DevOps. Verdict gates the deployment stage."
          status="disconnected"
          statusLabel="Not connected"
          actions={
            <Button size="small" variant="contained" color="primary">
              Connect
            </Button>
          }
        >
          <Box sx={{ bgcolor: "action.hover", borderRadius: 1, p: 1.5, fontFamily: "monospace", fontSize: "0.7rem" }}>
            <Typography variant="caption" sx={{ color: "text.disabled", display: "block", mb: 0.5, fontFamily: "monospace" }}>
              # azure-pipelines.yml
            </Typography>
            <Typography component="pre" sx={{ m: 0, fontFamily: "monospace", fontSize: "0.68rem", color: "text.secondary", whiteSpace: "pre" }}>
              {`- task: AgentScore@1\n  inputs:\n    project: $(PROJECT_ID)\n    failOn: FAIL`}
            </Typography>
          </Box>
        </IntegrationCard>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        <IntegrationCard
          title="Jenkins"
          subtitle="AgentScore plugin for Jenkins pipelines. Post-build step that scores the agent session from the build and marks the build unstable on PARTIAL or failed on FAIL."
          status="disconnected"
          statusLabel="Not connected"
          actions={
            <Button size="small" variant="contained" color="primary">
              View plugin
            </Button>
          }
        >
          <Box sx={{ bgcolor: "action.hover", borderRadius: 1, p: 1.5 }}>
            <Typography component="pre" sx={{ m: 0, fontFamily: "monospace", fontSize: "0.68rem", color: "text.secondary", whiteSpace: "pre" }}>
              {`agentScore(\n  projectId: env.AS_PROJECT_ID,\n  runId: env.BUILD_TAG,\n  failBuildOn: 'FAIL'\n)`}
            </Typography>
          </Box>
        </IntegrationCard>

        <IntegrationCard
          title="Cross-Cloud Routing"
          subtitle="Route scoring traffic across AWS CloudWatch, Azure Foundry, and GCP Vertex AI based on latency and cost signals."
          status="disconnected"
          statusLabel="Not configured"
          actions={
            <>
              <Button size="small" variant="contained" color="primary">
                Configure routing
              </Button>
              <Tag
                label="Phase 3"
                sx={{ height: 24, fontSize: "0.65rem", color: "text.disabled" }}
              />
            </>
          }
        >
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <ChipSubtle label="AWS CloudWatch" color="default" />
            <ChipSubtle label="Azure Foundry" color="default" />
            <ChipSubtle label="GCP Vertex AI" color="default" />
          </Box>
        </IntegrationCard>
      </Box>
    </Box>
  );
}

function SdkTab() {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  function CodeBlock({ code, copyKey }: { code: string; copyKey: string }) {
    return (
      <Box sx={{ position: "relative", bgcolor: "action.hover", borderRadius: 1, p: 1.5 }}>
        <Typography
          component="pre"
          sx={{ m: 0, fontFamily: "monospace", fontSize: "0.72rem", color: "text.secondary", whiteSpace: "pre-wrap" }}
        >
          {code}
        </Typography>
        <Button
          size="small"
          sx={{ position: "absolute", top: 6, right: 6, minWidth: 0, fontSize: "0.65rem", py: 0.25, px: 0.75 }}
          onClick={() => copy(code, copyKey)}
        >
          {copied === copyKey ? "Copied!" : "Copy"}
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="overline" sx={{ color: "text.disabled", letterSpacing: "0.08em", display: "block", mb: 1.5 }}>
        SDK
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 3 }}>
        <Paper sx={{ p: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <ChipSubtle label="Python" color="primary" />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Python SDK
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
            Wrap any Python agent with AgentScore in two lines. Compatible with LangGraph, OpenAI Agents SDK, and custom loops.
          </Typography>
          <CodeBlock
            copyKey="pip"
            code={`pip install agentscore\n\nfrom agentscore import evaluate\n\nwith evaluate(project="my-agent") as session:\n    result = my_agent.run(task)`}
          />
        </Paper>

        <Paper sx={{ p: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <ChipSubtle label="TypeScript" color="primary" />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              TypeScript SDK
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
            Native TypeScript client for Node.js agents. First-class support for the Vercel AI SDK and Anthropic SDK tool loops.
          </Typography>
          <CodeBlock
            copyKey="npm"
            code={`npm install @tricentis/agentscore\n\nimport { withScore } from "@tricentis/agentscore";\n\nconst scored = withScore(myAgent, { project: "my-agent" });\nawait scored.run(task);`}
          />
        </Paper>
      </Box>

      <Typography variant="overline" sx={{ color: "text.disabled", letterSpacing: "0.08em", display: "block", mb: 1.5 }}>
        MCP Server
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 3 }}>
        <IntegrationCard
          title="MCP Server"
          subtitle="Expose evaluate_session and guard_tool_call as MCP tools. Any MCP-compatible agent framework can call AgentScore without SDK installation."
          status="active"
          statusLabel="Running"
          actions={
            <Button size="small" variant="outlined" color="inherit" sx={{ color: "text.secondary" }}>
              View tools
            </Button>
          }
        >
          <Box sx={{ bgcolor: "action.hover", borderRadius: 1, p: 1.5 }}>
            <MetricRow label="Server" value="localhost:7432/mcp" />
            <MetricRow label="Tools exposed" value="evaluate_session · guard_tool_call" />
            <MetricRow label="Calls today" value="142" />
          </Box>
        </IntegrationCard>

        <Paper sx={{ p: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            HTTP API
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
            All AgentScore functionality is available over REST. Add to any CI step, shell script, or integration not covered by the SDKs.
          </Typography>
          <Box sx={{ bgcolor: "action.hover", borderRadius: 1, p: 1.5 }}>
            {[
              { method: "POST", path: "/guard/pre-tool-use", desc: "Guard check, <50ms P95" },
              { method: "POST", path: "/guard/post-tool-use", desc: "Record outcome" },
              { method: "POST", path: "/sessions/:id/score", desc: "Re-evaluate session" },
              { method: "GET", path: "/internal/health/is-alive", desc: "Liveness" },
            ].map((ep) => (
              <Box key={ep.path} sx={{ display: "flex", gap: 1.5, mb: 0.75 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: "monospace",
                    fontWeight: 700,
                    color: ep.method === "POST" ? "primary.light" : "success.light",
                    width: 36,
                    flexShrink: 0,
                  }}
                >
                  {ep.method}
                </Typography>
                <Typography variant="caption" sx={{ fontFamily: "monospace", color: "text.primary", flexShrink: 0 }}>
                  {ep.path}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.disabled" }}>
                  {ep.desc}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
