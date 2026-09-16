/** Walks a version's `baseVersionId` chain (spec S14a §2 "edit is New version
 *  from this" / §3 `VersionDetailPage.tsx`).
 *
 * Depth-capped at 50 — the same cap the backend applies to the identical
 * walk, since a cyclical `baseVersionId` chain would be a database bug, not a
 * legitimate deep lineage. Cycle-safe via a visited set independent of the
 * depth cap, so a short cycle is still caught before 50 hops.
 */

import type { components } from "@/shared/api/generated";

type AgentVersionRead = components["schemas"]["AgentVersionRead"];

const MAX_DEPTH = 50;

export function buildLineage(
  versionId: string,
  byId: ReadonlyMap<string, AgentVersionRead>,
): { chain: AgentVersionRead[]; terminatesGlobal: boolean; truncated: boolean } {
  const chain: AgentVersionRead[] = [];
  const visited = new Set<string>();
  let truncated = false;
  let current: string | null = versionId;

  while (current !== null) {
    if (chain.length >= MAX_DEPTH || visited.has(current)) {
      truncated = true;
      break;
    }
    visited.add(current);
    const version = byId.get(current);
    if (!version) {
      truncated = true;
      break;
    }
    chain.push(version);
    current = version.baseVersionId;
  }

  // A truncated walk (missing link or depth cap) never asserts either way —
  // the last *resolved* row is not the end of the real chain, so treating it
  // as such would let a merely-cut-short chain render as a from-scratch
  // (global-terminated) lineage.
  const last = chain[chain.length - 1];
  return {
    chain,
    terminatesGlobal: !truncated && last !== undefined && last.tenantId === null,
    truncated,
  };
}
