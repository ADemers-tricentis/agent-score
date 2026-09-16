import { useEffect, useState } from "react";

/**
 * Returns a debounced copy of `value` that only updates after `delayMs` have
 * elapsed without a change. Use to keep an input responsive while throttling
 * the value that feeds a network query.
 */
export function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}
