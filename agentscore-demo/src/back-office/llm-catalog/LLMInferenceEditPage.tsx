/** LLMInferenceEditPage — edit one named LLM inference (provider / model / credentials).
 *
 * Superadmin-only. Chrome per the design language's detail/edit shape: a pinned
 * header with no action buttons, then `FormSection`s each owning an inline
 * `Save` that enables only when its own section is dirty. The fields and every
 * payload come from `schema.ts` and `LLMInferenceFormFields.tsx`, shared with
 * the create page — the two were two hand-maintained copies of one form.
 *
 * Load-bearing keep-credential behaviour: the secret fields render blank and a
 * blank submission omits `credential` entirely, which the server reads as "keep
 * the stored one". Secrets are never read back. A half-submitted AWS pair is
 * refused rather than sent, because rotating one half and leaving the other
 * stale is the failure the wire schema exists to make unrepresentable.
 */

import { useEffect, useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { toast } from "@/shared/lib/toast";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import BreadcrumbsItem from "@tricentis/aura/components/BreadcrumbsItem.js";
import IconMaterialSymbolsBolt from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsBolt.mjs";
import IconMaterialSymbolsCancel from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsCancel.mjs";
import IconMaterialSymbolsCheckCircle from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsCheckCircle.mjs";
import IconMaterialSymbolsSave from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSave.mjs";

import { getInference, testConnection, updateInference } from "@/back-office/llm-catalog/inference-fixtures";
import {
  InferenceGeneralFields,
  InferenceProviderFields,
} from "@/back-office/llm-catalog/LLMInferenceFormFields";
import {
  PROVIDER_LABEL,
  buildProbePayload,
  buildUpdateBody,
  credentialStatus,
  draftFromEndpoint,
  emptyDraft,
  validateDraft,
  type LLMInferenceFormDraft,
} from "@/back-office/llm-catalog/schema";
import { Chip } from "@/shared/components/chip";
import { EntityShell } from "@/shared/components/entity-shell";
import { FormSection } from "@/shared/components/form-section";
import { NotFoundState } from "@/shared/components/not-found-state";
import { StatusDot } from "@/shared/components/status-dot";

/** The fields each inline save button watches. Splitting the draft this way is
 * what lets one full-object PUT back two independently-enabled buttons. */
const GENERAL_FIELDS = [
  "name",
  "description",
  "isDefault",
  "maxConcurrency",
] as const;
const PROVIDER_FIELDS = [
  "provider",
  "modelId",
  "credentialKind",
  "apiKey",
  "accessKeyId",
  "secretAccessKey",
  "baseUrl",
  "azureEndpoint",
  "azureDeployment",
  "azureApiVersion",
  "bedrockRegion",
] as const;

function isDirty(
  draft: LLMInferenceFormDraft,
  saved: LLMInferenceFormDraft,
  fields: readonly (keyof LLMInferenceFormDraft)[],
): boolean {
  return fields.some((field) => {
    const current = draft[field];
    const original = saved[field];
    if (typeof current === "string" && typeof original === "string") {
      return current.trim() !== original.trim();
    }
    return current !== original;
  });
}

export function LLMInferenceEditPage() {
  // `strict: false` avoids brittleness around how TanStack Router computes
  // the route ID under a pathless layout parent (matches UserEditPage).
  const { inferenceId } = useParams({ strict: false }) as { inferenceId: string };
  const [, forceRerender] = useState(0);
  const bump = () => forceRerender((n) => n + 1);

  const inference = getInference(inferenceId);

  const [draft, setDraft] = useState<LLMInferenceFormDraft>(emptyDraft);
  const [saved, setSaved] = useState<LLMInferenceFormDraft>(emptyDraft);

  useEffect(() => {
    if (inference) {
      const next = draftFromEndpoint(inference);
      setDraft(next);
      setSaved(next);
    }
  }, [inference]);

  const patch = (values: Partial<LLMInferenceFormDraft>) =>
    setDraft((previous) => ({ ...previous, ...values }));

  const [savePending, setSavePending] = useState(false);
  const save = {
    isPending: savePending,
    mutate: () => {
      setSavePending(true);
      try {
        updateInference(inferenceId, buildUpdateBody(draft));
        toast.success("Inference updated");
        bump();
        setSaved(draft);
      } catch (err) {
        toast.error((err as Error).message);
      } finally {
        setSavePending(false);
      }
    },
  };

  // Probe the saved row when no new secret was typed, else the entered
  // credentials. Passing the id keeps every secret off the wire entirely.
  const [testPending, setTestPending] = useState(false);
  const [testData, setTestData] = useState<{ ok: boolean; message?: string | null } | undefined>(undefined);
  const test = {
    isPending: testPending,
    data: testData,
    mutate: () => {
      setTestPending(true);
      const enteredSecret =
        draft.apiKey.trim() ||
        draft.accessKeyId.trim() ||
        draft.secretAccessKey.trim();
      setTimeout(() => {
        const result = testConnection(
          enteredSecret
            ? buildProbePayload(draft)
            : buildProbePayload(draft, inferenceId),
        );
        setTestData(result);
        setTestPending(false);
      }, 500);
    },
  };

  if (!inference) {
    return (
      <NotFoundState
        entity="Inference"
        action={
          <Button
            component={Link}
            to="/llm-catalog"
            variant="outlined"
            data-testid="inference-not-found-back"
          >
            Back to LLM Catalog
          </Button>
        }
      />
    );
  }

  const isDeleted = Boolean(inference.deletedAt);
  // `saved` is the server's own state, so `saved.credentialKind` is the stored
  // kind — the third argument is what stops a kind switch with a blank secret
  // from validating into a no-op PUT.
  const errors = validateDraft(draft, "edit", saved.credentialKind);
  const formValid = Object.keys(errors).length === 0 && !isDeleted;
  const credential = credentialStatus(inference);

  const canSaveGeneral =
    isDirty(draft, saved, GENERAL_FIELDS) && formValid && !save.isPending;
  const canSaveCredentials =
    isDirty(draft, saved, PROVIDER_FIELDS) && formValid && !save.isPending;

  const testResult = test.data;

  return (
    <EntityShell
      breadcrumb={
        <Breadcrumbs data-slot="breadcrumb" aria-label="breadcrumb">
          <BreadcrumbsItem
            data-slot="breadcrumb-link"
            component={Link}
            to="/llm-catalog"
            label="LLM Catalog"
          />
          <Typography
            data-slot="breadcrumb-page"
            component="span"
            variant="body2"
            color="text.primary"
            aria-current="page"
          >
            {inference.name}
          </Typography>
        </Breadcrumbs>
      }
      title={inference.name}
      badges={
        <>
          <Chip tint="info">
            {PROVIDER_LABEL[inference.provider] ?? inference.provider}
          </Chip>
          {inference.isDefault ? <Chip tint="success">default</Chip> : null}
          {isDeleted ? (
            <StatusDot status="destructive">deleted</StatusDot>
          ) : (
            <StatusDot status="success">active</StatusDot>
          )}
        </>
      }
      meta={
        <>
          <Box component="span" sx={{ fontFamily: "monospace" }}>
            {inference.id}
          </Box>
          <Box component="span">·</Box>
          <Box component="span">Model {inference.modelId}</Box>
          <Box component="span">·</Box>
          {/* Keyed on the credential kind, never on `configured` — a
              deliberately keyless endpoint is a working configuration and must
              not read as one an operator should go fix. */}
          <Box component="span" data-testid="inference-credential-status">
            {credential.label}
          </Box>
          <Box component="span">·</Box>
          <Box component="span">
            Updated {new Date(inference.updatedAt).toLocaleDateString()}
          </Box>
        </>
      }
    >
      <Box sx={{ px: 4, py: 3 }}>
        <Stack sx={{ maxWidth: 1024, gap: 3 }}>
          <FormSection
            title="General"
            description="Name is the human identifier used in selectors and run provenance. It must be unique among active inferences."
          >
            <InferenceGeneralFields
              draft={draft}
              onChange={patch}
              errors={errors}
              idPrefix="edit-inference"
              disabled={isDeleted}
              mode="edit"
              isCurrentDefault={inference.isDefault}
            />
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                disabled={!canSaveGeneral}
                onClick={() => save.mutate()}
                data-testid="save-general"
                startIcon={<IconMaterialSymbolsSave sx={{ fontSize: 16 }} />}
              >
                Save general
              </Button>
            </Box>
          </FormSection>

          <FormSection
            title="Provider & credentials"
            description="The provider, the model it serves, its connection coordinates, and how it authenticates. Secrets are write-only — leave them blank to keep what is stored."
          >
            <InferenceProviderFields
              draft={draft}
              onChange={patch}
              errors={errors}
              idPrefix="edit-inference"
              disabled={isDeleted}
              mode="edit"
            />

            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
              <Button
                variant="outlined"
                disabled={isDeleted || !draft.modelId.trim() || test.isPending}
                onClick={() => test.mutate()}
                data-testid="inference-test-connection"
                startIcon={<IconMaterialSymbolsBolt sx={{ fontSize: 16 }} />}
              >
                {test.isPending ? "Testing…" : "Test connection"}
              </Button>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {draft.apiKey.trim() ||
                draft.accessKeyId.trim() ||
                draft.secretAccessKey.trim()
                  ? "Tests the entered credentials."
                  : "Tests the saved inference."}
              </Typography>
            </Box>

            {testResult ? (
              testResult.ok ? (
                <Alert
                  severity="success"
                  data-testid="inference-test-result"
                  icon={<IconMaterialSymbolsCheckCircle sx={{ fontSize: 16 }} />}
                >
                  Connection test passed.
                </Alert>
              ) : (
                <Alert
                  severity="error"
                  data-testid="inference-test-result"
                  icon={<IconMaterialSymbolsCancel sx={{ fontSize: 16 }} />}
                >
                  {testResult.message
                    ? `Connection test failed: ${testResult.message}`
                    : "Connection test failed."}
                </Alert>
              )
            ) : null}

            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                disabled={!canSaveCredentials}
                onClick={() => save.mutate()}
                data-testid="save-credentials"
                startIcon={<IconMaterialSymbolsSave sx={{ fontSize: 16 }} />}
              >
                Save credentials
              </Button>
            </Box>
          </FormSection>
        </Stack>
      </Box>
    </EntityShell>
  );
}
