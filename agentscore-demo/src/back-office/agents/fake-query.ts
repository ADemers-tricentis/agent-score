// Minimal drop-in replacement for the slice of @tanstack/react-query's API
// this app's components use (useQuery/useMutation/useQueryClient), backed by
// local fake data instead of HTTP. Kept API-shape-compatible so component
// bodies didn't need rewriting beyond swapping the import source.
import { useCallback, useEffect, useRef, useState } from "react";

type QueryFn<T> = () => T | Promise<T>;

interface FakeQueryOptions<T> {
  queryKey: readonly unknown[];
  queryFn: QueryFn<T>;
  enabled?: boolean;
  staleTime?: number;
  retry?: boolean | number;
  refetchInterval?:
    | number
    | false
    | ((query: { state: { data: T | undefined } }) => number | false);
}

export interface FakeQueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  dataUpdatedAt: number;
  refetch: () => void;
}

let globalGen = 0;
const listeners = new Set<() => void>();

/** Fake cache-invalidation signal — ignores the queryKey filter entirely
 * (every fake query just re-runs its queryFn) since there's no real cache to
 * target selectively. */
function bumpGeneration() {
  globalGen++;
  listeners.forEach((l) => l());
}

export function useFakeQuery<T>(opts: FakeQueryOptions<T>): FakeQueryResult<T> {
  const enabled = opts.enabled ?? true;
  const [state, setState] = useState<{
    data: T | undefined;
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
    error: unknown;
    dataUpdatedAt: number;
  }>({ data: undefined, isLoading: enabled, isFetching: enabled, isError: false, error: null, dataUpdatedAt: 0 });
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const mountedRef = useRef(true);

  const run = useCallback(() => {
    if (!optsRef.current.enabled && optsRef.current.enabled !== undefined) return;
    setState((s) => ({ ...s, isFetching: true }));
    try {
      const result = optsRef.current.queryFn();
      const settle = (data: T) => {
        if (!mountedRef.current) return;
        setState({ data, isLoading: false, isFetching: false, isError: false, error: null, dataUpdatedAt: Date.now() });
      };
      if (result instanceof Promise) {
        result.then(settle).catch((err: unknown) => {
          if (!mountedRef.current) return;
          setState((s) => ({ ...s, isLoading: false, isFetching: false, isError: true, error: err }));
        });
      } else {
        settle(result);
      }
    } catch (err) {
      setState((s) => ({ ...s, isLoading: false, isFetching: false, isError: true, error: err }));
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) run();
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...opts.queryKey]);

  useEffect(() => {
    const listener = () => run();
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, [run]);

  useEffect(() => {
    const interval = opts.refetchInterval;
    const ms = typeof interval === "function" ? interval({ state: { data: state.data } }) : interval;
    if (!ms) return;
    const t = window.setInterval(run, ms);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.refetchInterval, state.data, run]);

  return { ...state, refetch: run };
}

interface FakeMutationOptions<TVars, TData> {
  mutationFn: (vars: TVars) => TData | Promise<TData>;
  onSuccess?: (data: TData, vars: TVars) => void;
  onError?: (err: Error, vars: TVars) => void;
}

interface FakeMutateCallOptions<TVars, TData> {
  onSuccess?: (data: TData, vars: TVars) => void;
  onError?: (err: Error, vars: TVars) => void;
}

export interface FakeMutationResult<TVars, TData> {
  mutate: (vars?: TVars, callOpts?: FakeMutateCallOptions<TVars, TData>) => void;
  mutateAsync: (vars?: TVars) => Promise<TData>;
  isPending: boolean;
}

export function useFakeMutation<TVars = void, TData = unknown>(
  opts: FakeMutationOptions<TVars, TData>,
): FakeMutationResult<TVars, TData> {
  const [isPending, setIsPending] = useState(false);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const mutateAsync = useCallback(async (vars?: TVars) => {
    setIsPending(true);
    try {
      const data = await optsRef.current.mutationFn(vars as TVars);
      optsRef.current.onSuccess?.(data, vars as TVars);
      return data;
    } catch (err) {
      optsRef.current.onError?.(err as Error, vars as TVars);
      throw err;
    } finally {
      setIsPending(false);
    }
  }, []);

  // Real react-query's `mutate(vars, { onSuccess, onError })` fires the
  // call-site callbacks IN ADDITION to the hook-level ones - not instead of.
  const mutate = useCallback(
    (vars?: TVars, callOpts?: FakeMutateCallOptions<TVars, TData>) => {
      mutateAsync(vars).then(
        (data) => callOpts?.onSuccess?.(data, vars as TVars),
        (err: unknown) => callOpts?.onError?.(err as Error, vars as TVars),
      );
    },
    [mutateAsync],
  );

  return { mutate, mutateAsync, isPending };
}

export function useFakeQueryClient() {
  return { invalidateQueries: (_opts?: unknown) => bumpGeneration() };
}

export function getGeneration() {
  return globalGen;
}
