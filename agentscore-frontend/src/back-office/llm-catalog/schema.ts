/** The single schema behind the LLM inference admin form.
 *
 * The create and edit pages used to carry two hand-maintained copies of the
 * provider list, the provider-conditional field set, and the payload builders.
 * They drifted — different labels for the same field, and a credential model
 * that predated the discriminated unions the wire now requires. This module is
 * the one source both pages render from and build payloads through.
 *
 * Every type here is derived from the generated OpenAPI contract rather than
 * hand-written, so a wire change that renames or drops a member fails the type
 * check instead of failing at request time.
 *
 * **The two credential shapes are not interchangeable, and that is the reason
 * this module exists.** `LLMInferenceCreate.credential` takes the AWS case as
 * two separate fields (rules the packed `id:secret` string out
 * explicitly). The connectivity probe's `TestConnectionIn` still takes the same
 * pair as ONE colon-packed string, which
 * `endpoint_binding_from_test_connection` splits back apart. So the draft holds
 * the two halves separately and only `buildProbePayload` packs them. A form
 * that fed one shape to both calls would fail at request time with no gate
 * reporting it.
 *
 * The probe's **settings** are no longer a second shape: it now carries the same
 * discriminated union as create and update, so `buildSettings` serves both and a
 * coordinate cannot reach one call while being dropped from the other. Only the
 * credential remains split, and only in that one packing.
 */

import type {
  LLMInferenceCreate,
  LLMInferenceOut,
  LLMInferenceUpdate,
  TestConnectionIn,
} from "@/back-office/llm-catalog/inference-fixtures";

export type { LLMInferenceCreate, LLMInferenceOut, LLMInferenceUpdate, TestConnectionIn };

export type Provider = LLMInferenceCreate["provider"];
export type EndpointSettings = LLMInferenceCreate["settings"];
export type CredentialIn = LLMInferenceCreate["credential"];
export type CredentialKind = CredentialIn["kind"];

/** The provider list — single-sourced. Both pages and the list page's provider
 * label lookup read this; there is no second copy and no hand-written union. */
export const PROVIDERS: readonly { value: Provider; label: string }[] = [
  { value: "anthropic", label: "Anthropic" },
  { value: "openai", label: "OpenAI" },
  { value: "azure", label: "Azure OpenAI" },
  { value: "bedrock", label: "Amazon Bedrock" },
];

export const PROVIDER_LABEL: Record<string, string> = Object.fromEntries(
  PROVIDERS.map((p) => [p.value, p.label]),
);

/** Mirrors the backend's `_ACCEPTED_CREDENTIAL_KINDS` table
 * (`schemas/scoring.py`), which is the authority. Duplicated here only to keep
 * the form from offering a pair the server refuses; the server still validates.
 * States the table and why it is a table over the pair rather than a
 * flag on a type. */
export const ACCEPTED_CREDENTIAL_KINDS: Record<
  Provider,
  readonly CredentialKind[]
> = {
  anthropic: ["api_key"],
  openai: ["api_key", "ambient"],
  azure: ["api_key"],
  bedrock: ["aws", "ambient"],
};

export const CREDENTIAL_KIND_LABEL: Record<CredentialKind, string> = {
  api_key: "API key",
  aws: "AWS access key pair",
  ambient: "Keyless — ambient credential chain",
};

/** Whether a keyless OpenAI-compatible endpoint may be submitted at all.
 *
 * **This deliberately checks only that an address was given, and does NOT
 * decide whether the address is the vendor's own.** The server owns that
 * question, against its own set of vendor hostnames — a set this campaign has
 * already had to widen once. A second copy of that set here would be two
 * mechanisms bounding one rule, and the next host added server-side would
 * silently make this form permissive. So the form enforces the cheap, stable
 * half locally and surfaces the server's refusal
 * (`llm_inference_ambient_requires_custom_base_url`) for the rest. */
export function keylessNeedsAddress(baseUrl: string): boolean {
  return baseUrl.trim().length === 0;
}

/** The form's flat working state. Flat because a React form edits fields, not
 * unions; the unions are assembled at submit by the builders below. */
export interface LLMInferenceFormDraft {
  name: string;
  description: string;
  provider: Provider;
  modelId: string;
  isDefault: boolean;
  /** Raw text of the per-endpoint concurrency ceiling (`maxConcurrency` on the
   * wire). A string, not a number, so the control can express "unset" as `""`
   * — distinct from `"0"`, which is itself out of range. Blank builds to
   * `null` (never configured, the frozen shared default applies); a digit
   * string builds to that number. */
  maxConcurrency: string;
  credentialKind: CredentialKind;
  apiKey: string;
  accessKeyId: string;
  secretAccessKey: string;
  baseUrl: string;
  azureEndpoint: string;
  azureDeployment: string;
  azureApiVersion: string;
  bedrockRegion: string;
}

export type SettingsFieldKey =
  | "baseUrl"
  | "azureEndpoint"
  | "azureDeployment"
  | "azureApiVersion"
  | "bedrockRegion";

export interface SettingsFieldSpec {
  key: SettingsFieldKey;
  /** Stable hook suffix — the e2e selector contract keys on this, so it must
   * not follow the label's wording. */
  slug: string;
  label: string;
  placeholder: string;
  required: boolean;
  helper?: string;
}

/** The provider-conditional settings fields, one list per provider. This is the
 * table the form renders from; adding a provider field is an entry here rather
 * than a new conditional branch in two page components. */
export const SETTINGS_FIELDS: Record<Provider, readonly SettingsFieldSpec[]> = {
  anthropic: [],
  openai: [
    {
      key: "baseUrl",
      slug: "base-url",
      label: "Base address",
      placeholder: "https://my-gateway.internal/v1",
      required: false,
      helper:
        "Leave blank for OpenAI's own address. Set it to point at a self-hosted model or an OpenAI-compatible gateway.",
    },
  ],
  azure: [
    {
      key: "azureEndpoint",
      slug: "azure-endpoint",
      label: "Azure endpoint",
      placeholder: "https://my-resource.openai.azure.com",
      required: true,
    },
    {
      key: "azureDeployment",
      slug: "azure-deployment",
      label: "Azure deployment",
      placeholder: "gpt-4o",
      required: true,
    },
    {
      key: "azureApiVersion",
      slug: "azure-api-version",
      label: "Azure API version",
      placeholder: "2024-06-01",
      required: true,
    },
  ],
  bedrock: [
    {
      key: "bedrockRegion",
      slug: "bedrock-region",
      label: "AWS region",
      placeholder: "us-east-1",
      required: true,
    },
  ],
};

export function emptyDraft(): LLMInferenceFormDraft {
  return {
    name: "",
    description: "",
    provider: "anthropic",
    modelId: "",
    isDefault: false,
    maxConcurrency: "",
    credentialKind: "api_key",
    apiKey: "",
    accessKeyId: "",
    secretAccessKey: "",
    baseUrl: "",
    azureEndpoint: "",
    azureDeployment: "",
    azureApiVersion: "",
    bedrockRegion: "",
  };
}

/** Rebuild the draft from a saved endpoint. Secrets are never read back — the
 * three secret fields stay blank and a blank submission keeps the stored
 * credential (`LLMInferenceUpdate.credential` omitted). */
export function draftFromEndpoint(endpoint: LLMInferenceOut): LLMInferenceFormDraft {
  const settings = endpoint.settings;
  return {
    ...emptyDraft(),
    name: endpoint.name,
    description: endpoint.description ?? "",
    provider: endpoint.provider,
    modelId: endpoint.modelId,
    isDefault: endpoint.isDefault,
    // `null` (never configured) reads back as blank, never `"0"` — a stored
    // `0` cannot occur (the server's range floor is 1), but collapsing
    // `null` to any digit string would misrepresent "unset" as a real ceiling.
    maxConcurrency:
      endpoint.maxConcurrency === null || endpoint.maxConcurrency === undefined
        ? ""
        : String(endpoint.maxConcurrency),
    credentialKind: endpoint.credentialKind,
    baseUrl: settings.provider === "openai" ? (settings.baseUrl ?? "") : "",
    azureEndpoint: settings.provider === "azure" ? settings.endpoint : "",
    azureDeployment: settings.provider === "azure" ? settings.deployment : "",
    azureApiVersion: settings.provider === "azure" ? settings.apiVersion : "",
    bedrockRegion: settings.provider === "bedrock" ? settings.region : "",
  };
}

/** The default credential kind when the provider changes. A provider switch
 * must never leave a kind its new provider refuses — that pair is one of the
 * four the server rejects, and offering it is a form defect rather than a
 * server one. */
export function defaultCredentialKind(provider: Provider): CredentialKind {
  const accepted = ACCEPTED_CREDENTIAL_KINDS[provider];
  return accepted[0];
}

export function buildSettings(draft: LLMInferenceFormDraft): EndpointSettings {
  switch (draft.provider) {
    case "anthropic":
      return { provider: "anthropic" };
    case "openai":
      return { provider: "openai", baseUrl: draft.baseUrl.trim() || null };
    case "azure":
      return {
        provider: "azure",
        endpoint: draft.azureEndpoint.trim(),
        deployment: draft.azureDeployment.trim(),
        apiVersion: draft.azureApiVersion.trim(),
      };
    case "bedrock":
      return { provider: "bedrock", region: draft.bedrockRegion.trim() };
  }
}

/** The credential as the save path wants it — the AWS case as two separate
 * fields, never a packed string.
 *
 * Returns `null` when the operator typed no secret, which on update means
 * "keep the stored credential entirely" (the wire field is omitted). On create
 * `null` is not a valid submission for a secret-bearing kind; `validateDraft`
 * refuses it there rather than sending a blank secret the server would reject.
 */
export function buildCredential(draft: LLMInferenceFormDraft): CredentialIn | null {
  switch (draft.credentialKind) {
    case "ambient":
      // Ambient is an active declaration, not an absence — it is always sent.
      return { kind: "ambient" };
    case "api_key": {
      const apiKey = draft.apiKey.trim();
      return apiKey ? { kind: "api_key", apiKey } : null;
    }
    case "aws": {
      const accessKeyId = draft.accessKeyId.trim();
      const secretAccessKey = draft.secretAccessKey.trim();
      if (!accessKeyId && !secretAccessKey) return null;
      return { kind: "aws", accessKeyId, secretAccessKey };
    }
  }
}

/** The connectivity probe's payload.
 *
 * **`settings` is `buildSettings` — the same builder the save path uses**, which
 * is the point. This function used to hand-enumerate the per-provider
 * coordinates a second time, right beside that builder, and the two drifted:
 * `baseUrl` was collected by the form and sent on save while the probe dropped
 * it, so the probe called OpenAI's own address whatever the operator typed and
 * reported **green** for a vendor key beside a self-hosted address — a pass for
 * an endpoint that was never contacted. One builder is what makes that
 * unrepresentable rather than merely fixed once.
 *
 * **The AWS pair is still colon-packed here**, and it is still the only place.
 * `endpoint_binding_from_test_connection` partitions `apiKey` on the first
 * colon and refuses a blank half, so a form that sent only one half gets a 422
 * rather than a silent fall-through to the ambient credential.
 *
 * An ambient credential sends a blank `apiKey`, which is how the probe's
 * credential half spells the ambient declaration — the backend accepts that only
 * for the providers whose table entry includes it, and refuses it outright
 * elsewhere rather than treating it as "no credential needed".
 *
 * When `inferenceId` is supplied the saved row is probed instead: neither a secret
 * nor a settings object goes on the wire, and the server **refuses** settings
 * alongside an `inferenceId` rather than ignoring them.
 */
export function buildProbePayload(
  draft: LLMInferenceFormDraft,
  inferenceId?: string,
): TestConnectionIn {
  const base: TestConnectionIn = {
    provider: draft.provider,
    modelId: draft.modelId.trim(),
  };
  if (inferenceId) return { ...base, inferenceId };

  let apiKey: string | null = null;
  if (draft.credentialKind === "api_key") {
    apiKey = draft.apiKey.trim() || null;
  } else if (draft.credentialKind === "aws") {
    const id = draft.accessKeyId.trim();
    const secret = draft.secretAccessKey.trim();
    apiKey = id || secret ? `${id}:${secret}` : null;
  }

  return { ...base, settings: buildSettings(draft), apiKey };
}

/** The server's own bound (`LLMInferenceCreate`/`LLMInferenceUpdate`,
 * `Field(default=None, ge=1, le=1000)` in `schemas/scoring.py`) — mirrored
 * here, not re-derived, so the two cannot drift apart silently. */
const MAX_CONCURRENCY_MIN = 1;
const MAX_CONCURRENCY_MAX = 1000;

/** Parses the draft's raw ceiling text into the wire value: `null` for a
 * blank control (unset — never a `0`), the integer otherwise. Returns
 * `undefined` for text that is present but not a whole number, which
 * `validateDraft` turns into a refusal rather than a silently-built request.
 *
 * The builders below collapse that `undefined` to `null` with `?? null` —
 * safe only because both pages gate their submit/save control on
 * `validateDraft` returning no errors, so a draft with unparsable ceiling
 * text can never reach a builder. A caller that builds a payload without
 * that gate would silently clear the ceiling instead of refusing the save.
 */
function parseMaxConcurrency(raw: string): number | null | undefined {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  if (!/^-?\d+$/.test(trimmed)) return undefined;
  return Number(trimmed);
}

export type FieldErrors = Partial<Record<keyof LLMInferenceFormDraft, string>>;

/** Client-side validation. The server is the authority on every rule here —
 * this exists so the operator sees the problem beside the field instead of as
 * a toast after a round trip. It deliberately mirrors the server's four
 * refusals rather than inventing rules of its own.
 *
 * `savedKind` is the credential kind the stored endpoint currently has, and it
 * is what makes "keep the existing secret" distinguishable from "switch to a
 * kind and forget its secret". Callers on the edit path must pass it; omitting
 * it silently re-opens that hole.
 */
export function validateDraft(
  draft: LLMInferenceFormDraft,
  mode: "create" | "edit",
  savedKind?: CredentialKind,
): FieldErrors {
  const errors: FieldErrors = {};

  if (!draft.name.trim()) errors.name = "Name is required.";
  if (!draft.modelId.trim()) errors.modelId = "Model id is required.";

  // Mirrors the server's own bound (`ge=1, le=1000`) rather than inventing a
  // rule of its own — a value this lets through and the server refuses would
  // round-trip as a 422 the operator sees only after Save.
  const maxConcurrency = parseMaxConcurrency(draft.maxConcurrency);
  if (maxConcurrency === undefined) {
    errors.maxConcurrency = "Enter a whole number, or leave blank.";
  } else if (
    maxConcurrency !== null &&
    (maxConcurrency < MAX_CONCURRENCY_MIN || maxConcurrency > MAX_CONCURRENCY_MAX)
  ) {
    errors.maxConcurrency = `Must be between ${MAX_CONCURRENCY_MIN} and ${MAX_CONCURRENCY_MAX}, or left blank.`;
  }

  for (const field of SETTINGS_FIELDS[draft.provider]) {
    if (field.required && !draft[field.key].trim()) {
      errors[field.key] = `${field.label} is required.`;
    }
  }

  if (!ACCEPTED_CREDENTIAL_KINDS[draft.provider].includes(draft.credentialKind)) {
    errors.credentialKind = `${PROVIDER_LABEL[draft.provider]} does not accept ${
      CREDENTIAL_KIND_LABEL[draft.credentialKind]
    }.`;
  } else if (
    draft.credentialKind === "ambient" &&
    draft.provider === "openai" &&
    keylessNeedsAddress(draft.baseUrl)
  ) {
    // A blank address *means* the vendor's own address by the settings union's
    // own definition of the field, and a keyless request there is answered 401.
    // Whether a non-blank address is the vendor's is the server's call, not
    // ours — see `keylessNeedsAddress`.
    errors.baseUrl =
      "A keyless endpoint needs a base address of its own — leave the API key kind selected to use OpenAI's address.";
  }

  // On create every secret-bearing kind must actually carry its secret. On
  // edit a blank secret means "keep the stored one", so it is valid — but only
  // while the kind stays put. Move the kind and leave the secret blank and
  // `buildCredential` returns null, `buildUpdateBody` omits `credential`
  // altogether, and the server reads that as "keep what you have": a 200 and a
  // success toast for a change that never happened, with the radio snapping
  // back on the next refetch. The new kind needs its own secret.
  const kindChanged =
    savedKind !== undefined && draft.credentialKind !== savedKind;

  if (mode === "create" || kindChanged) {
    if (draft.credentialKind === "api_key" && !draft.apiKey.trim()) {
      errors.apiKey = "API key is required.";
    }
    if (draft.credentialKind === "aws") {
      if (!draft.accessKeyId.trim()) {
        errors.accessKeyId = "Access key id is required.";
      }
      if (!draft.secretAccessKey.trim()) {
        errors.secretAccessKey = "Secret access key is required.";
      }
    }
  } else if (draft.credentialKind === "aws") {
    // A half-submitted pair is the one AWS case that is never valid, on either
    // path: rotating one half and leaving the other stale is the failure
    // `LLMInferenceUpdate` makes unrepresentable, so the form refuses it too.
    const id = draft.accessKeyId.trim();
    const secret = draft.secretAccessKey.trim();
    if (id && !secret) {
      errors.secretAccessKey = "Enter both halves of the pair, or neither.";
    }
    if (secret && !id) {
      errors.accessKeyId = "Enter both halves of the pair, or neither.";
    }
  }

  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function buildCreateBody(draft: LLMInferenceFormDraft): LLMInferenceCreate {
  const credential = buildCredential(draft);
  if (credential === null) {
    throw new Error("A credential is required to create an endpoint.");
  }
  return {
    name: draft.name.trim(),
    description: draft.description.trim() || null,
    provider: draft.provider,
    modelId: draft.modelId.trim(),
    isDefault: draft.isDefault,
    // Sent explicitly — `null` for blank, never omitted. Create has no prior
    // value to protect (an omitted field also leaves the column NULL server
    // side), but building it the same way as update keeps one rule for both
    // rather than two payload shapes for one field.
    maxConcurrency: parseMaxConcurrency(draft.maxConcurrency) ?? null,
    settings: buildSettings(draft),
    credential,
  };
}

export function buildUpdateBody(draft: LLMInferenceFormDraft): LLMInferenceUpdate {
  const credential = buildCredential(draft);
  return {
    name: draft.name.trim(),
    description: draft.description.trim() || null,
    provider: draft.provider,
    modelId: draft.modelId.trim(),
    isDefault: draft.isDefault,
    // Always present, unlike `credential` below. `LLMInferenceUpdate` is a
    // full-replacement PUT for this field — an omitted key parses server-side
    // to the same `None` default as an explicit `null`, and is APPLIED, not
    // treated as "keep what's stored". Before this control existed the form
    // never sent the key at all, so every save from this screen silently
    // cleared a configured ceiling to NULL. Sending the parsed value on every
    // submit — the loaded value when the operator never touched the control,
    // `null` for a cleared one — is what makes a save round-trip instead of
    // erase.
    maxConcurrency: parseMaxConcurrency(draft.maxConcurrency) ?? null,
    settings: buildSettings(draft),
    // Omitted rather than null-and-present: "keep the stored credential".
    ...(credential === null ? {} : { credential }),
  };
}

export interface CredentialStatus {
  label: string;
  /** Whether this endpoint needs an operator's attention. Keyed on
   * `credentialKind`, never on `configured` — is explicit that
   * `configured` is derived and kept only for compatibility, and that a
   * deliberately keyless endpoint and a broken credential-missing one render
   * byte-identically under it. */
  needsAttention: boolean;
}

/** How an endpoint's credential reads in a list or a detail header. */
export function credentialStatus(endpoint: LLMInferenceOut): CredentialStatus {
  switch (endpoint.credentialKind) {
    case "ambient":
      return { label: "Keyless (ambient)", needsAttention: false };
    case "api_key":
      return {
        label: endpoint.keyHint
          ? `API key (${endpoint.keyHint})`
          : "API key stored",
        needsAttention: false,
      };
    case "aws":
      // No hint for this kind by deliberate decision — neither half's
      // ciphertext is exposed and no hint is derived from either.
      return { label: "AWS key pair stored", needsAttention: false };
  }
}
