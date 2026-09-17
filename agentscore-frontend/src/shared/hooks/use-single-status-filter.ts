import { useState } from "react";

interface SingleStatusFilter<T extends string> {
  /** Selection array driving a {@link FacetedFilter} (always 0 or 1 entry). */
  statusFilter: string[];
  /**
   * FacetedFilter `onChange` handler. The status facet is single-select (the
   * BE accepts one status), so this collapses the toggled array to the
   * newly-added value — the chip never reads "2 selected".
   */
  setStatusSingle: (next: string[]) => void;
  /** The single server-query value: the picked status, or `initial` when cleared. */
  status: T;
}

/**
 * Drives a single-value status facet through {@link FacetedFilter}'s
 * multi-select array API. The catalog list endpoints filter to exactly one
 * status, so the array is collapsed to the last-picked value and defaults to
 * `initial` when cleared.
 */
export function useSingleStatusFilter<T extends string = string>(
  initial: T = "active" as T,
): SingleStatusFilter<T> {
  const [statusFilter, setStatusFilter] = useState<string[]>([initial]);

  const setStatusSingle = (next: string[]): void => {
    setStatusFilter(next.filter((v) => !statusFilter.includes(v)).slice(-1));
  };

  const status = (statusFilter[0] ?? initial) as T;

  return { statusFilter, setStatusSingle, status };
}
