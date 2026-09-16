/** The LLM inference form's fields, rendered from `schema.ts`.
 *
 * The create and edit pages used to carry two hand-maintained copies of these
 * fields and had drifted — different labels for the same coordinate, and a
 * credential model that predated the wire's discriminated unions. Both pages
 * now render these two groups.
 *
 * **Why two groups rather than one component:** the design language gives
 * create and edit deliberately different shells — a create page has one bottom
 * submit bar, an edit page has a pinned header and a `Save` inside each
 * `FormSection`. Collapsing them into one page component would flatten that
 * distinction. So the *fields* are shared and each page keeps its own chrome.
 */

import type { InputHTMLAttributes } from "react";
import Box from "@mui/material/Box";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { PasswordInput } from "@/shared/components/password-input";
import { RadioCards } from "@/shared/components/radio-cards";
import {
  ACCEPTED_CREDENTIAL_KINDS,
  CREDENTIAL_KIND_LABEL,
  PROVIDERS,
  SETTINGS_FIELDS,
  defaultCredentialKind,
  type CredentialKind,
  type FieldErrors,
  type LLMInferenceFormDraft,
  type Provider,
} from "@/back-office/llm-catalog/schema";

export interface InferenceFieldsProps {
  draft: LLMInferenceFormDraft;
  onChange: (patch: Partial<LLMInferenceFormDraft>) => void;
  errors: FieldErrors;
  /** Hook prefix — `new-inference` on create, `edit-inference` on edit. The
   * e2e selector contract keys on these, so they are stable names rather than
   * derived from any label. */
  idPrefix: string;
  disabled?: boolean;
  /** On edit a blank secret means "keep the stored credential", so the secret
   * fields carry a different helper and are not marked required. */
  mode: "create" | "edit";
  /** True when this endpoint is already the catalogue default. Demotion is not
   * expressible on this wire — `LLMInferenceUpdate` has no way to say "stop
   * being the default" — so the switch locks rather than accepting a change the
   * server will ignore. The default moves by promoting another inference. */
  isCurrentDefault?: boolean;
}

function Required() {
  return (
    <Box component="span" sx={{ color: "error.main" }}>
      *
    </Box>
  );
}

/** Name, description, and the catalogue-default switch. */
export function InferenceGeneralFields({
  draft,
  onChange,
  errors,
  idPrefix,
  disabled,
  mode,
  isCurrentDefault,
}: InferenceFieldsProps) {
  return (
    <>
      <Stack sx={{ gap: 0.75 }}>
        <FormLabel htmlFor={`${idPrefix}-name`}>
          Name <Required />
        </FormLabel>
        <TextField
          autoComplete="off"
          placeholder="e.g. Sonnet-strict"
          value={draft.name}
          disabled={disabled}
          error={Boolean(errors.name)}
          helperText={errors.name}
          onChange={(e) => onChange({ name: e.target.value })}
          fullWidth
          slotProps={{
            htmlInput: {
              id: `${idPrefix}-name`,
              "data-testid": `${idPrefix}-name`,
            },
          }}
        />
      </Stack>

      <Stack sx={{ gap: 0.75 }}>
        <FormLabel htmlFor={`${idPrefix}-description`}>Description</FormLabel>
        <TextField
          multiline
          minRows={mode === "create" ? 3 : 2}
          placeholder="Optional — what this inference is for."
          value={draft.description}
          disabled={disabled}
          onChange={(e) => onChange({ description: e.target.value })}
          fullWidth
          slotProps={{
            htmlInput: {
              id: `${idPrefix}-description`,
              "data-testid": `${idPrefix}-description`,
            },
          }}
        />
      </Stack>

      <Stack sx={{ gap: 0.75 }}>
        <FormLabel htmlFor={`${idPrefix}-max-concurrency`}>
          Max concurrency
        </FormLabel>
        {/* `type="text"` with a numeric input mode, NOT `type="number"` — and
            that is a correctness choice, not a style one. A number input runs
            the HTML value-sanitization algorithm: any text it cannot parse
            becomes the EMPTY STRING. Here blank is a meaningful, legal value
            (unset -> `null` -> follow the shared default), so an operator with
            a stored ceiling of 4 who types a stray `e` would get a blank
            draft, a clean `validateDraft`, an ENABLED save, and a full PUT
            sending `maxConcurrency: null` — silently clearing the very ceiling
            this control exists to let them set. Confirmed in this repo's own
            jsdom: "1e" and "four" both sanitize to "".

            `StreamConfigForm.tsx` uses `type="number"` with a string draft
            safely, and the reason it is safe there is that blank is INVALID in
            that field. This one inverts that premise, so the pattern must not
            be copied across. As text, the draft holds exactly what was typed,
            `parseMaxConcurrency` returns `undefined` for it, and the operator
            gets a refusal with a reason instead of a silent erasure. The cost
            is the native spinner and `min`/`max`/`step`, which were decorative:
            `validateDraft` already mirrors the server bound and the database
            CHECK, and jsdom never implemented them anyway. */}
        <TextField
          type="text"
          placeholder="Shared default"
          value={draft.maxConcurrency}
          disabled={disabled}
          error={Boolean(errors.maxConcurrency)}
          helperText={
            errors.maxConcurrency ??
            "Optional ceiling on in-flight calls to this endpoint. Leave blank to use the shared default."
          }
          onChange={(e) => onChange({ maxConcurrency: e.target.value })}
          sx={{ maxWidth: 200 }}
          slotProps={{
            htmlInput: {
              id: `${idPrefix}-max-concurrency`,
              "data-testid": `${idPrefix}-max-concurrency`,
              // On the input slot, not the TextField root — MUI forwards it to
              // the DOM only from here, and a numeric soft keyboard that never
              // reaches the element is the same as not having asked for one.
              inputMode: "numeric",
            },
          }}
        />
      </Stack>

      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
          borderRadius: 1,
          border: 1,
          borderColor: "divider",
          px: 1.5,
          py: 1.25,
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
          <FormLabel htmlFor={`${idPrefix}-default`}>
            {mode === "create" ? "Set as default inference" : "Default inference"}
          </FormLabel>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {isCurrentDefault
              ? "This is the catalogue default. To change it, set another inference as default."
              : "The default inference is preselected wherever an inference is needed. The first inference in the catalogue always becomes the default."}
          </Typography>
        </Box>
        <Switch
          checked={draft.isDefault}
          disabled={disabled || isCurrentDefault}
          onChange={(e) => onChange({ isDefault: e.target.checked })}
          slotProps={{
            // MUI's Switch `input` slot type omits arbitrary data-*; it is
            // forwarded to the <input> at runtime (see the testid-forwarding
            // guard), so cast to the DOM attribute type.
            input: {
              id: `${idPrefix}-default`,
              "data-testid": `${idPrefix}-default`,
            } as InputHTMLAttributes<HTMLInputElement>,
          }}
        />
      </Box>
    </>
  );
}

/** Provider, model id, the provider's settings coordinates, and the
 * credential — the whole shape that varies by provider. */
export function InferenceProviderFields({
  draft,
  onChange,
  errors,
  idPrefix,
  disabled,
  mode,
}: InferenceFieldsProps) {
  const acceptedKinds = ACCEPTED_CREDENTIAL_KINDS[draft.provider];
  const settingsFields = SETTINGS_FIELDS[draft.provider];
  const keepHelper =
    mode === "edit" ? "Leave blank to keep the stored credential." : undefined;

  return (
    <>
      <Stack sx={{ gap: 0.75 }}>
        <FormLabel>
          Provider <Required />
        </FormLabel>
        <RadioCards
          value={draft.provider}
          disabled={disabled}
          onValueChange={(value) => {
            const provider = value as Provider;
            // A provider switch must never leave a credential kind the new
            // provider refuses — that pair is one the server rejects, and
            // offering it would be a form defect rather than a server one.
            onChange({
              provider,
              credentialKind: defaultCredentialKind(provider),
            });
          }}
          testIdPrefix={`${idPrefix}-provider`}
          items={PROVIDERS.map((p) => ({ value: p.value, label: p.label }))}
        />
      </Stack>

      <Stack sx={{ gap: 0.75 }}>
        <FormLabel htmlFor={`${idPrefix}-model`}>
          Model <Required />
        </FormLabel>
        <TextField
          autoComplete="off"
          placeholder="e.g. claude-sonnet-4-5"
          value={draft.modelId}
          disabled={disabled}
          error={Boolean(errors.modelId)}
          helperText={
            errors.modelId ?? "The provider's own model id, entered directly."
          }
          onChange={(e) => onChange({ modelId: e.target.value })}
          fullWidth
          slotProps={{
            htmlInput: {
              id: `${idPrefix}-model`,
              "data-testid": `${idPrefix}-model`,
            },
          }}
        />
      </Stack>

      {settingsFields.map((field) => (
        <Stack key={field.key} sx={{ gap: 0.75 }}>
          <FormLabel htmlFor={`${idPrefix}-${field.slug}`}>
            {field.label} {field.required ? <Required /> : null}
          </FormLabel>
          <TextField
            autoComplete="off"
            placeholder={field.placeholder}
            value={draft[field.key]}
            disabled={disabled}
            error={Boolean(errors[field.key])}
            helperText={errors[field.key] ?? field.helper}
            onChange={(e) => onChange({ [field.key]: e.target.value })}
            fullWidth
            slotProps={{
              htmlInput: {
                id: `${idPrefix}-${field.slug}`,
                "data-testid": `${idPrefix}-${field.slug}`,
              },
            }}
          />
        </Stack>
      ))}

      {acceptedKinds.length > 1 ? (
        <Stack sx={{ gap: 0.75 }}>
          <FormLabel>
            Credential <Required />
          </FormLabel>
          <RadioCards
            value={draft.credentialKind}
            disabled={disabled}
            columns={acceptedKinds.length === 2 ? 2 : 3}
            onValueChange={(value) =>
              onChange({ credentialKind: value as CredentialKind })
            }
            testIdPrefix={`${idPrefix}-credential-kind`}
            items={acceptedKinds.map((kind) => ({
              value: kind,
              label: CREDENTIAL_KIND_LABEL[kind],
            }))}
          />
          {errors.credentialKind ? (
            <FormHelperText error>{errors.credentialKind}</FormHelperText>
          ) : null}
        </Stack>
      ) : null}

      {draft.credentialKind === "api_key" ? (
        <Stack sx={{ gap: 0.75 }}>
          <FormLabel htmlFor={`${idPrefix}-api-key`}>
            API key {mode === "create" ? <Required /> : null}
            <Box
              component="span"
              sx={{
                ml: 0.5,
                typography: "caption",
                color: "text.secondary",
              }}
            >
              (write-only — never shown)
            </Box>
          </FormLabel>
          <PasswordInput
            id={`${idPrefix}-api-key`}
            data-testid={`${idPrefix}-api-key`}
            autoComplete="off"
            placeholder={mode === "edit" ? "Leave blank to keep" : "sk-…"}
            value={draft.apiKey}
            disabled={disabled}
            onChange={(e) => onChange({ apiKey: e.target.value })}
          />
          {errors.apiKey ? (
            <FormHelperText error>{errors.apiKey}</FormHelperText>
          ) : keepHelper ? (
            <FormHelperText>{keepHelper}</FormHelperText>
          ) : null}
        </Stack>
      ) : null}

      {draft.credentialKind === "aws" ? (
        <>
          {/* Two fields, never one packed `id:secret` string — that packing is
              ruled out at rest, and it is assembled only for the connectivity
              probe, whose frozen flat shape wants it. */}
          <Stack sx={{ gap: 0.75 }}>
            <FormLabel htmlFor={`${idPrefix}-access-key-id`}>
              Access key id {mode === "create" ? <Required /> : null}
            </FormLabel>
            <PasswordInput
              id={`${idPrefix}-access-key-id`}
              data-testid={`${idPrefix}-access-key-id`}
              autoComplete="off"
              placeholder={mode === "edit" ? "Leave blank to keep" : "AKIA…"}
              value={draft.accessKeyId}
              disabled={disabled}
              onChange={(e) => onChange({ accessKeyId: e.target.value })}
            />
            {errors.accessKeyId ? (
              <FormHelperText error>{errors.accessKeyId}</FormHelperText>
            ) : null}
          </Stack>
          <Stack sx={{ gap: 0.75 }}>
            <FormLabel htmlFor={`${idPrefix}-secret-access-key`}>
              Secret access key {mode === "create" ? <Required /> : null}
            </FormLabel>
            <PasswordInput
              id={`${idPrefix}-secret-access-key`}
              data-testid={`${idPrefix}-secret-access-key`}
              autoComplete="off"
              placeholder={mode === "edit" ? "Leave blank to keep" : "…"}
              value={draft.secretAccessKey}
              disabled={disabled}
              onChange={(e) => onChange({ secretAccessKey: e.target.value })}
            />
            {errors.secretAccessKey ? (
              <FormHelperText error>{errors.secretAccessKey}</FormHelperText>
            ) : keepHelper ? (
              <FormHelperText>
                {keepHelper} Both halves rotate together — enter both, or
                neither.
              </FormHelperText>
            ) : null}
          </Stack>
        </>
      ) : null}

      {draft.credentialKind === "ambient" ? (
        <Box
          data-testid={`${idPrefix}-ambient-note`}
          sx={{
            borderRadius: 1,
            border: 1,
            borderColor: "divider",
            px: 1.5,
            py: 1.25,
          }}
        >
          <Typography variant="subtitle2">
            No credential is stored for this endpoint
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            It authenticates off the ambient credential chain — on AWS, the
            deploy account&apos;s task role. Nothing is checkable until a real
            call, so &quot;Test connection&quot; is the only proof the chain
            resolves.
          </Typography>
        </Box>
      ) : null}
    </>
  );
}
