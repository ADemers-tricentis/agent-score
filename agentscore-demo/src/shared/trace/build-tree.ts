/** buildTree — assembles the trace-detail waterfall, made *total*: every
 * observation id appears exactly once in `flat` even when the real trace root
 * was never captured (the root can live in a non-agent service
 * that is not forwarded). The attachment set is the reachability *complement*
 * (everything the real-root walk didn't reach), which — unlike a "parent is
 * absent" predicate — also covers mutual cycles and self-parents. Empty
 * complement returns the unchanged (byte-identical) normal-trace shape.
 *
 * Lifted from `back-office/agents/buildTree.ts` for Phase 7 of the
 * customer-parity effort — deferred out of Phase 0 deliberately (there was
 * no customer observation type yet to check the generic shape against).
 * Generic over the observation shape rather than importing either app's
 * `ObservationNode` type, so this module couples to neither.
 */

export const SYNTHETIC_ROOT_ID = "__synthetic_root__";

export interface TraceObservation {
  observation_id: string;
  parent_observation_id?: string | null;
  start_time: string;
}

/** Minimal sentinel — no backing observation. Callers MUST branch on
 * `observation_id === SYNTHETIC_ROOT_ID` before reading any other field. */
function syntheticRoot<T extends TraceObservation>(): T {
  return {
    observation_id: SYNTHETIC_ROOT_ID,
    parent_observation_id: null,
    start_time: "",
  } as T;
}

export type Incompleteness =
  | null
  | { kind: "no_root" | "partial_orphans"; reRootedCount: number; total: number };

export interface TreeNode<T extends TraceObservation> {
  node: T;
  depth: number;
}

export interface BuildTreeResult<T extends TraceObservation> {
  /** Real roots only (may be empty). */
  roots: T[];
  /** ALL observations, plus the synthetic root when the complement is non-empty. */
  flat: TreeNode<T>[];
  incompleteness: Incompleteness;
}

export function buildTree<T extends TraceObservation>(
  observations: T[],
): BuildTreeResult<T> {
  const byParent = new Map<string | null, T[]>();
  for (const obs of observations) {
    const parent = obs.parent_observation_id ?? null;
    const list = byParent.get(parent) ?? [];
    list.push(obs);
    byParent.set(parent, list);
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => a.start_time.localeCompare(b.start_time));
  }

  const roots = byParent.get(null) ?? [];
  const flat: TreeNode<T>[] = [];
  const visited = new Set<string>();

  const walk = (n: T, depth: number) => {
    if (visited.has(n.observation_id)) return;
    visited.add(n.observation_id);
    flat.push({ node: n, depth });
    const children = byParent.get(n.observation_id) ?? [];
    for (const c of children) walk(c, depth + 1);
  };
  for (const r of roots) walk(r, 0);

  const complement = observations.filter((o) => !visited.has(o.observation_id));
  if (complement.length === 0) {
    return { roots, flat, incompleteness: null };
  }

  const complementIds = new Set(complement.map((o) => o.observation_id));
  // Attach as a direct child anything whose parent is absent or outside the
  // complement; interior nodes (parent in the complement) are reached by the
  // recursion. The `stillUnvisited` pass then catches pure cycles / self-parents,
  // which have no such entry point — that pass is what makes attachment total.
  const directChildren = complement.filter((o) => {
    const parent = o.parent_observation_id ?? null;
    return parent === null || !complementIds.has(parent);
  });

  flat.push({ node: syntheticRoot<T>(), depth: 0 });

  const attachSorted = (nodes: T[]) => {
    const sorted = [...nodes].sort((a, b) => {
      const byTime = a.start_time.localeCompare(b.start_time);
      if (byTime !== 0) return byTime;
      return a.observation_id.localeCompare(b.observation_id);
    });
    for (const n of sorted) walk(n, 1);
  };

  attachSorted(directChildren);
  const stillUnvisited = complement.filter((o) => !visited.has(o.observation_id));
  attachSorted(stillUnvisited);

  const kind: "no_root" | "partial_orphans" =
    roots.length === 0 ? "no_root" : "partial_orphans";

  return {
    roots,
    flat,
    incompleteness: {
      kind,
      reRootedCount: complement.length,
      total: observations.length,
    },
  };
}
