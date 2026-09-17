/** One entry of a `verdicts.evidence_refs` list, and how to render it.
 *
 * The column carries TWO shapes and the wire type is `unknown[]` for exactly
 * that reason. Every production row is written by the judge, whose
 * `verify_citations` persists one `{span_id, verified, transcript_truncated}`
 * triple per cited span; seeded fixtures still write bare span-id strings.
 * Any component reading `evidenceRefs` has to handle both — rendering a
 * triple as if it were a string yields `[object Object]`, and rejecting a
 * string as malformed slanders legitimate data.
 *
 * `describeEvidenceRef` is the single place that decides which shape an entry
 * is, so the two renderers that show citations cannot disagree about it.
 */

/** The judge's own citation record — see `scoring/judge_agent.verify_citations`. */
export interface EvidenceRef {
  span_id: string;
  verified: boolean;
  transcript_truncated: boolean | null;
}

export function isEvidenceRef(value: unknown): value is EvidenceRef {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Record<string, unknown>).span_id === "string" &&
    typeof (value as Record<string, unknown>).verified === "boolean"
  );
}

/** What a caller should render for one entry.
 *
 * `verified` is `null` for a plain string ref: a fixture-written span id
 * carries no verification record, and that is a genuine third state — NOT
 * "unverified", which would report a fabricated citation where none was
 * claimed. `malformed` is the fail-closed arm: an entry matching neither
 * known shape is called out rather than rendered as ordinary evidence.
 */
export type EvidenceRefDisplay = {
  kind: "triple" | "string" | "malformed";
  label: string;
  verified: boolean | null;
};

export function describeEvidenceRef(value: unknown): EvidenceRefDisplay {
  if (isEvidenceRef(value)) {
    return { kind: "triple", label: value.span_id, verified: value.verified };
  }
  if (typeof value === "string") {
    return { kind: "string", label: value, verified: null };
  }
  return { kind: "malformed", label: JSON.stringify(value) ?? String(value), verified: false };
}
