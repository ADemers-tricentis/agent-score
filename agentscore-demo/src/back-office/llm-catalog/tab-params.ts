/** LLM Catalog page `?tab={tab}` + usage-log view params (build-plan S9).
 *
 * `tab` selects the Catalog vs Usage log vs Pricing vs Routing tab. An
 * unknown or absent value normalizes to `"catalog"`. Mirrors
 * `ingestion/tab-params.ts` and `debug-logs/tab-params.ts`.
 *
 * The Usage log's filters, window and search term ride along via
 * `parseUsageViewSearch` — they are kept even while `tab === "catalog"`, the
 * same way `agents/view-params.ts` round-trips `by` while `view === "list"`:
 * the tab strip itself drops them (its `onChange` writes `{ tab }` only), so
 * carrying them here costs nothing and is what lets the per-call detail
 * sub-page hand a filtered view back.
 *
 * This pure normalizer is shared by the route's `validateSearch`
 * (router.tsx) and its tests so the two cannot drift.
 *
 * A selected usage-log call is no longer a search param here: the payload
 * detail is its own route (`/llm-catalog/usage/$callId`,
 * `UsageCallDetailPage`), so the call id is a path param and the old `?call=`
 * deep link has no reader.
 */
import {
  parseUsageViewSearch,
  type UsageViewSearch,
} from "@/back-office/llm-catalog/usage-view-params";

export const LLM_CATALOG_TABS = ["catalog", "usage", "pricing", "routing"] as const;

export type LLMCatalogTab = (typeof LLM_CATALOG_TABS)[number];

export interface LLMCatalogSearch extends UsageViewSearch {
  tab: LLMCatalogTab;
}

export function parseLLMCatalogSearch(raw: unknown): LLMCatalogSearch {
  // Idempotent: TanStack Router re-runs `validateSearch` against the already
  // normalized search object (not just the raw URL string), so re-parsing a
  // well-formed `{ tab, ...view }` must yield the same result.
  if (raw === null || typeof raw !== "object") return { tab: "catalog" };
  const { tab } = raw as { tab?: unknown };
  const validTab =
    typeof tab === "string" && LLM_CATALOG_TABS.includes(tab as LLMCatalogTab)
      ? (tab as LLMCatalogTab)
      : "catalog";
  return { tab: validTab, ...parseUsageViewSearch(raw) };
}
