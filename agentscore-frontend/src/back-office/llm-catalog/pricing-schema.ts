/** The price admin form's schema — mirrors `schema.ts` (the inference form's
 * own single source), scoped to `model_prices` CRUD.
 *
 * **Every rate stays a decimal string, end to end.** The wire types
 * (`ModelPriceOut`/`*CreateIn`/`*UpdateIn`) accept `number | string` for a
 * rate on write and always return `string` on read, but a JS `number` cannot
 * round-trip an audited money figure without drift — the same reason the
 * column is `Numeric`, not `float`, in the backend. This module never calls
 * `Number()` on a rate for anything but a *display* format; the value that
 * reaches `buildPriceCreateBody`/`buildPriceUpdateBody` is always the
 * trimmed string the operator typed.
 *
 * Cache rates are optional and nullable: a blank field means "this
 * provider/model has no cache rate", not zero, and — per
 * `ModelPriceUpdateIn`'s own contract — an explicit `null` is what clears a
 * previously-entered cache rate back to that state.
 */

import type { components } from "@/shared/api/generated";

export type ModelPriceOut = components["schemas"]["ModelPriceOut"];
export type ModelPriceCreateIn = components["schemas"]["ModelPriceCreateIn"];
export type ModelPriceUpdateIn = components["schemas"]["ModelPriceUpdateIn"];

export type PriceProvider = ModelPriceOut["provider"];

/** The form's flat working state, all four rates as raw text — a text field,
 * not a number field, for the same "blank must not silently sanitize to a
 * wrong value" reason `LLMInferenceFormDraft.maxConcurrency` is text
 * (`LLMInferenceFormFields.tsx`). */
export interface PriceFormDraft {
  provider: PriceProvider;
  modelId: string;
  /** `YYYY-MM-DD`, the shape an `<input type="date">` produces and the wire's
   * `date`-format field expects. */
  effectiveFrom: string;
  inputPricePerMillionUsd: string;
  outputPricePerMillionUsd: string;
  cacheReadPricePerMillionUsd: string;
  cacheWritePricePerMillionUsd: string;
}

export function emptyPriceDraft(): PriceFormDraft {
  return {
    provider: "anthropic",
    modelId: "",
    effectiveFrom: "",
    inputPricePerMillionUsd: "",
    outputPricePerMillionUsd: "",
    cacheReadPricePerMillionUsd: "",
    cacheWritePricePerMillionUsd: "",
  };
}

/** Rebuild the draft from a saved row, for the edit dialog. Null cache rates
 * read back as blank text, never `"0"` — the same "absent is not zero"
 * distinction the row list and `UsageCallDetailPage` render. */
export function draftFromPrice(price: ModelPriceOut): PriceFormDraft {
  return {
    provider: price.provider,
    modelId: price.modelId,
    effectiveFrom: price.effectiveFrom,
    inputPricePerMillionUsd: price.inputPricePerMillionUsd,
    outputPricePerMillionUsd: price.outputPricePerMillionUsd,
    cacheReadPricePerMillionUsd: price.cacheReadPricePerMillionUsd ?? "",
    cacheWritePricePerMillionUsd: price.cacheWritePricePerMillionUsd ?? "",
  };
}

/** A non-negative decimal, as text — no sign, no exponent, no thousands
 * separator. Deliberately a regex rather than `Number.isFinite(Number(v))`:
 * the latter also accepts `"1e3"`, `"Infinity"` and leading/trailing
 * whitespace-adjacent forms a money field must refuse outright.
 *
 * The digit bounds mirror the column (`Numeric(12, 6)`) and the API's own
 * refusal: six decimal places and six integer digits. Without them the form
 * accepts `1.1234567890`, the server rejects it, and the operator learns the
 * limit from an error toast instead of the field. */
const RATE_PATTERN = /^\d{1,6}(\.\d{1,6})?$/;

function isValidRequiredRate(raw: string): boolean {
  return RATE_PATTERN.test(raw.trim());
}

function isValidOptionalRate(raw: string): boolean {
  const trimmed = raw.trim();
  return trimmed === "" || RATE_PATTERN.test(trimmed);
}

export type PriceFieldErrors = Partial<Record<keyof PriceFormDraft, string>>;

const RATE_HELP = "Enter a non-negative rate, e.g. 3.00.";
const CACHE_RATE_HELP = "Enter a non-negative rate, or leave blank.";

export function validatePriceDraft(draft: PriceFormDraft): PriceFieldErrors {
  const errors: PriceFieldErrors = {};

  if (!draft.modelId.trim()) errors.modelId = "Model id is required.";
  if (!draft.effectiveFrom.trim()) {
    errors.effectiveFrom = "Effective-from date is required.";
  }
  if (!isValidRequiredRate(draft.inputPricePerMillionUsd)) {
    errors.inputPricePerMillionUsd = RATE_HELP;
  }
  if (!isValidRequiredRate(draft.outputPricePerMillionUsd)) {
    errors.outputPricePerMillionUsd = RATE_HELP;
  }
  if (!isValidOptionalRate(draft.cacheReadPricePerMillionUsd)) {
    errors.cacheReadPricePerMillionUsd = CACHE_RATE_HELP;
  }
  if (!isValidOptionalRate(draft.cacheWritePricePerMillionUsd)) {
    errors.cacheWritePricePerMillionUsd = CACHE_RATE_HELP;
  }

  return errors;
}

export function hasPriceErrors(errors: PriceFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** The shared shape between `ModelPriceCreateIn` and `ModelPriceUpdateIn` —
 * identical field sets today, so one builder serves both call sites
 * (`buildPriceCreateBody`/`buildPriceUpdateBody` below); each keeps its own
 * name and return type so the two can diverge later without either caller
 * silently building the wrong wire shape. */
function buildPricePayload(draft: PriceFormDraft) {
  return {
    provider: draft.provider,
    modelId: draft.modelId.trim(),
    effectiveFrom: draft.effectiveFrom.trim(),
    inputPricePerMillionUsd: draft.inputPricePerMillionUsd.trim(),
    outputPricePerMillionUsd: draft.outputPricePerMillionUsd.trim(),
    cacheReadPricePerMillionUsd:
      draft.cacheReadPricePerMillionUsd.trim() || null,
    cacheWritePricePerMillionUsd:
      draft.cacheWritePricePerMillionUsd.trim() || null,
  };
}

export function buildPriceCreateBody(draft: PriceFormDraft): ModelPriceCreateIn {
  return buildPricePayload(draft);
}

export function buildPriceUpdateBody(draft: PriceFormDraft): ModelPriceUpdateIn {
  return buildPricePayload(draft);
}
