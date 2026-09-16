/** LLMInferenceCreatePage — register a new LLM inference (global catalogue).
 *
 * Route: /llm-catalog/new (superadmin only).
 *
 * Chrome per the design language's create shape: a light top (back-link +
 * title + one-line description), the shared `FormSection`s, and a single
 * bottom Cancel / Create bar. The fields and every payload come from
 * `schema.ts` and `LLMInferenceFormFields.tsx`, which the edit page renders
 * too — the two pages had drifted into two copies of one form.
 *
 * Secrets are write-only: they go out on create and are never read back.
 */

import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "@/shared/lib/toast";
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
import IconMaterialSymbolsSync from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSync.mjs";

import { createInference, testConnection } from "@/back-office/llm-catalog/inference-fixtures";
import {
  InferenceGeneralFields,
  InferenceProviderFields,
} from "@/back-office/llm-catalog/LLMInferenceFormFields";
import {
  buildCreateBody,
  buildProbePayload,
  emptyDraft,
  hasErrors,
  validateDraft,
  type LLMInferenceFormDraft,
} from "@/back-office/llm-catalog/schema";
import { FormSection } from "@/shared/components/form-section";

type TestResult = { ok: boolean; message: string };

const spinSx = {
  "@keyframes inference-test-spin": {
    from: { transform: "rotate(0deg)" },
    to: { transform: "rotate(360deg)" },
  },
  animation: "inference-test-spin 1s linear infinite",
};

export function LLMInferenceCreatePage() {
  const [draft, setDraft] = useState<LLMInferenceFormDraft>(emptyDraft);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [creating, setCreating] = useState(false);
  const [testing, setTesting] = useState(false);

  const navigate = useNavigate();

  const patch = (values: Partial<LLMInferenceFormDraft>) => {
    setDraft((previous) => ({ ...previous, ...values }));
    // Any credential or address edit invalidates a previous probe result —
    // leaving a stale "Connection OK" beside changed credentials would read
    // as proof of something that was never tested.
    setTestResult(null);
  };

  const create = {
    isPending: creating,
    mutate: () => {
      setCreating(true);
      try {
        const inference = createInference(buildCreateBody(draft));
        toast.success(`Inference ${inference.name} created`);
        void navigate({ to: "/llm-catalog", search: { tab: "catalog" } });
      } catch (err) {
        toast.error((err as Error).message);
      } finally {
        setCreating(false);
      }
    },
  };

  const test = {
    isPending: testing,
    mutate: () => {
      setTesting(true);
      setTimeout(() => {
        const result = testConnection(buildProbePayload(draft));
        setTestResult({
          ok: result.ok,
          message: result.ok
            ? "Connection OK — auth and model verified."
            : `Connection test failed: ${result.message ?? result.code ?? "unknown error"}.`,
        });
        setTesting(false);
      }, 500);
    },
  };

  const errors = validateDraft(draft, "create");
  const disabled = hasErrors(errors) || create.isPending;

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: 0,
        flex: 1,
        flexDirection: "column",
        gap: 3,
        overflowY: "auto",
        px: 4,
        py: 3,
      }}
    >
      <Box>
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
            New inference
          </Typography>
        </Breadcrumbs>
        <Typography
          component="h1"
          variant="h3"
          sx={{ mt: 1.5, fontWeight: 600, letterSpacing: "-0.025em" }}
        >
          Add inference
        </Typography>
        <Typography variant="subtitle1" sx={{ mt: 0.5, color: "text.secondary" }}>
          Registers a named LLM inference in the global catalogue. Credentials
          are stored encrypted and never returned.
        </Typography>
      </Box>

      <Stack sx={{ width: "100%", maxWidth: 1024, gap: 3 }}>
        <FormSection
          title="General"
          description="Name is the human identifier — unique across live inferences."
        >
          <InferenceGeneralFields
            draft={draft}
            onChange={patch}
            errors={errors}
            idPrefix="new-inference"
            mode="create"
          />
        </FormSection>

        <FormSection
          title="Provider & credentials"
          description="The provider, the model it serves, its connection coordinates, and how it authenticates."
        >
          <InferenceProviderFields
            draft={draft}
            onChange={patch}
            errors={errors}
            idPrefix="new-inference"
            mode="create"
          />
        </FormSection>

        <FormSection
          title="Connectivity"
          description="An optional live check. It runs one minimal real call and does not block saving."
        >
          <Stack sx={{ gap: 1 }}>
            <Box>
              <Button
                type="button"
                variant="outlined"
                disabled={test.isPending || draft.modelId.trim().length === 0}
                onClick={() => {
                  setTestResult(null);
                  test.mutate();
                }}
                data-testid="inference-test-connection"
                startIcon={
                  test.isPending ? (
                    <IconMaterialSymbolsSync sx={{ fontSize: 16, ...spinSx }} />
                  ) : (
                    <IconMaterialSymbolsBolt sx={{ fontSize: 16 }} />
                  )
                }
              >
                Test connection
              </Button>
            </Box>
            {testResult ? (
              <Box
                data-testid="inference-test-result"
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 0.75,
                  typography: "caption",
                  color: testResult.ok ? "success.main" : "error.main",
                }}
              >
                {testResult.ok ? (
                  <IconMaterialSymbolsCheckCircle
                    sx={{ mt: 0.25, fontSize: 14, flexShrink: 0 }}
                  />
                ) : (
                  <IconMaterialSymbolsCancel
                    sx={{ mt: 0.25, fontSize: 14, flexShrink: 0 }}
                  />
                )}
                <Box component="span">{testResult.message}</Box>
              </Box>
            ) : (
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Verifies auth and that the entered model answers.
              </Typography>
            )}
          </Stack>
        </FormSection>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 1,
          }}
        >
          <Button
            variant="outlined"
            onClick={() => void navigate({ to: "/llm-catalog", search: { tab: "catalog" } })}
            disabled={create.isPending}
            data-testid="cancel-inference"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={disabled}
            onClick={() => create.mutate()}
            data-testid="create-inference-submit"
            startIcon={<IconMaterialSymbolsSave sx={{ fontSize: 16 }} />}
          >
            Add inference
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
