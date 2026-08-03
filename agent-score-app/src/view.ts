import type { AgentTab } from "./views/agent-overview/AgentTabBar";

export type View =
  | { name: "home" }
  | { name: "add-agent" }
  | { name: "agent-overview"; agentId: string; tab?: AgentTab }
  | { name: "run-detail"; agentId: string; runId: string }
  | { name: "session-detail"; agentId: string; runId: string; sessionId: string };
