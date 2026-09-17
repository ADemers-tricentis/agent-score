/** Error-envelope accessors for `apiClient` results.
 *
 * `unwrap` and `detail` were module-private in `back-office/agents/api.ts`;
 * both frontends need the same reading of a FastAPI error body, so they live
 * here with their bodies unchanged.
 */

export function unwrap<T>(payload: { data?: T; error?: unknown }, msg: string): T {
  if (payload.error || payload.data == null) throw new Error(msg);
  return payload.data;
}

export function detail(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "detail" in error) {
    const d = (error as { detail?: unknown }).detail;
    if (typeof d === "string") return d;
    // FastAPI request validation (422) returns detail as a list of
    // {loc, msg, type}; surface the human-readable msgs.
    if (Array.isArray(d)) {
      const msgs = d
        .map((e) =>
          e && typeof e === "object" && "msg" in e
            ? String((e as { msg?: unknown }).msg)
            : null,
        )
        .filter((m): m is string => Boolean(m));
      if (msgs.length > 0) return msgs.join("; ");
    }
  }
  return fallback;
}

/** The machine-readable `code` of an object-shaped `{code, message}` detail
 *  envelope, else null.
 *
 * `detail()` understands only a string detail or a 422 validation list, so an
 * object detail falls through to its fallback string and a caller can never
 * branch on the code. A 422 list is also an object to `typeof`, so the string
 * `code` — not the object test — is what discriminates a coded envelope. */
export function detailCode(error: unknown): string | null {
  if (error && typeof error === "object" && "detail" in error) {
    const d = (error as { detail?: unknown }).detail;
    if (d && typeof d === "object") {
      const code = (d as { code?: unknown }).code;
      if (typeof code === "string") return code;
    }
  }
  return null;
}

/** The human-readable `message` of an object-shaped `{code, message}` detail
 *  envelope, else null. Symmetric with `detailCode`: a caller that wants to
 *  show both the code and the server's own text reads them off the same
 *  thrown error with no separate parse. The caller supplies its own fallback
 *  for the null case — this never invents text of its own. */
export function detailMessage(error: unknown): string | null {
  if (error && typeof error === "object" && "detail" in error) {
    const d = (error as { detail?: unknown }).detail;
    if (d && typeof d === "object") {
      const message = (d as { message?: unknown }).message;
      if (typeof message === "string") return message;
    }
  }
  return null;
}

/** The HTTP status a thrown API error carries, or `null` when it carries none.
 *
 *  Read STRUCTURALLY rather than off a class: four feature modules
 *  (`runtime-runs`, `simulation`, `assistant`, `agent-registry`) each declare
 *  their own error type with the same `status?: number` field, and a shared
 *  retry policy must not import one of them and silently ignore the rest. A
 *  `fetch` that never reached the server throws without a status, which is
 *  exactly the transient case that SHOULD still be retried — hence `null`
 *  rather than a number standing in for "unknown".
 */
export function httpStatus(error: unknown): number | null {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status?: unknown }).status;
    if (typeof status === "number") return status;
  }
  return null;
}

/** React Query's `retry` predicate: never re-ask a question the server has
 *  already answered.
 *
 *  A 4xx is a settled fact — "this run has no transcript", "you may not read
 *  this", "that id does not exist" — and retrying it cannot change the answer.
 *  React Query's DEFAULT is three retries with 1s/2s/4s backoff, so a 404 that
 *  the server returns in 13ms kept a surface in its loading skeleton for
 *  **seven seconds** before it was allowed to render the answer. Measured on
 *  the agent-run Tool calls tab of a run still in flight, which legitimately
 *  has no transcript row yet.
 *
 *  5xx and status-less failures (a dropped connection, a DNS blip) keep the
 *  default three attempts: those genuinely can succeed on a retry.
 */
export function retryUnlessClientError(failureCount: number, error: unknown): boolean {
  const status = httpStatus(error);
  if (status !== null && status >= 400 && status < 500) return false;
  return failureCount < 3;
}
