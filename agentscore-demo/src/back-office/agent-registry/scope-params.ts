/** Agent Registry page `?tenant={tenantId}` scope param (spec S14a §2 "How is
 *  scope carried in the URL?").
 *
 * Absent, empty, or non-string `tenant` normalizes to the key being absent —
 * Global scope. Mirrors the `llm-catalog/tab-params.ts` convention: shared by
 * the route's `validateSearch` and this file's own test so the two cannot
 * drift.
 */

export interface RegistryScopeSearch {
  tenant?: string;
}

export function parseRegistryScopeSearch(raw: unknown): RegistryScopeSearch {
  // Idempotent: TanStack Router re-runs `validateSearch` against the already
  // normalized search object (not just the raw URL string), so re-parsing a
  // well-formed `{ tenant }` must yield the same result.
  if (raw === null || typeof raw !== "object") return {};
  const { tenant } = raw as { tenant?: unknown };
  if (typeof tenant !== "string" || tenant.length === 0) return {};
  return { tenant };
}
