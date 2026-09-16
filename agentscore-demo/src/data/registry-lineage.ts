import type { AgentVersion } from "../types";

const MAX_DEPTH = 50;

export interface Lineage {
  chain: AgentVersion[];
  terminatesGlobal: boolean;
  truncated: boolean;
}

/** Walks `baseVersionId` newest -> oldest, mirroring production's `lineage.ts`.
 * Cycle-safe via a `visited` set independent of the depth cap. */
export function buildLineage(versionId: string, byId: ReadonlyMap<string, AgentVersion>): Lineage {
  const chain: AgentVersion[] = [];
  const visited = new Set<string>();
  let truncated = false;
  let currentId: string | null = versionId;

  while (currentId !== null) {
    if (chain.length >= MAX_DEPTH) {
      truncated = true;
      break;
    }
    if (visited.has(currentId)) {
      truncated = true;
      break;
    }
    const version = byId.get(currentId);
    if (!version) {
      truncated = true;
      break;
    }
    visited.add(currentId);
    chain.push(version);
    currentId = version.baseVersionId;
  }

  const last = chain[chain.length - 1];
  const terminatesGlobal = !truncated && last !== undefined && last.tenantId === null;

  return { chain, terminatesGlobal, truncated };
}
