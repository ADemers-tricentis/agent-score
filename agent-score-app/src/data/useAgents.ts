import { useSyncExternalStore } from "react";
import { subscribeAgents, getAgentsSnapshot } from "./mock";
import type { Agent } from "../types";

/** Live-subscribes to the mock agent store so simulateTraces() re-renders consumers. */
export function useAgents(): Agent[] {
  return useSyncExternalStore(subscribeAgents, getAgentsSnapshot);
}

export function useAgent(agentId: string): Agent | null {
  const agents = useAgents();
  return agents.find((a) => a.agent_id === agentId) ?? null;
}
