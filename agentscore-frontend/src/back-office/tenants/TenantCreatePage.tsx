/** Tenant create page — name + kind + grouping attributes + metadata.
 *
 * Mirrors the "New tenant" dialog in the design ref, rendered as a full page
 * for richer validation (JSON metadata, etc.). Writes the tenant row on
 * save; there is no external resource to provision.
 */

import { useState } from "react";
import { useFakeMutation as useMutation, useFakeQueryClient as useQueryClient } from "@/back-office/agents/fake-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "@/shared/lib/toast";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Button from "@mui/material/Button";
import FormLabel from "@mui/material/FormLabel";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import BreadcrumbsItem from "@tricentis/aura/components/BreadcrumbsItem.js";
import IconMaterialSymbolsArrowForward from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsArrowForward.mjs";
import IconMaterialSymbolsSave from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSave.mjs";

import * as api from "@/back-office/tenants/tenant-fixtures";
import { FormSection } from "@/shared/components/form-section";
import { OneTimeSecretBanner } from "@/shared/components/OneTimeSecretBanner";

// Auto-minted first key for a new external tenant (revealed once on create).
const INITIAL_KEY_NAME = "default";

interface FormState {
  name: string;
  env: string;
  metadata: string;
}

const INITIAL: FormState = {
  name: "",
  env: "",
  metadata: "",
};

function parseMetadata(
  raw: string,
): { ok: true; value: Record<string, unknown> | null } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return { ok: true, value: null };
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (
      parsed === null ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return { ok: false, error: "Metadata must be a JSON object" };
    }
    return { ok: true, value: parsed as Record<string, unknown> };
  } catch {
    return { ok: false, error: "Invalid JSON" };
  }
}

export function TenantCreatePage() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  // After a successful external create we hold the new tenant + its one-time
  // API key secret locally and show the reveal screen instead of navigating
  // immediately — the secret is never re-fetchable (reveal-once).
  const [created, setCreated] = useState<{
    tenant: api.TenantProfile;
    secret: string;
  } | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: async () => {
      const parsed = parseMetadata(form.metadata);
      if (!parsed.ok) {
        throw new Error(parsed.error);
      }
      const tenant = await api.createTenant({
        name: form.name.trim(),
        kind: "external",
        env: form.env.trim() || null,
        metadata: parsed.value,
      });
      try {
        const res = await api.createTenantApiKey(
          tenant.tenant_id,
          INITIAL_KEY_NAME,
        );
        return { tenant, secret: res.tk, keyFailed: false };
      } catch {
        // The tenant already exists; only the key mint failed. Don't strand
        // the operator — send them to Settings to create one manually.
        return { tenant, secret: null as string | null, keyFailed: true };
      }
    },
    onSuccess: ({ tenant, secret, keyFailed }) => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["sidebar-counts", "tenants"] });
      if (secret) {
        toast.success(`Tenant ${tenant.name} created`);
        setCreated({ tenant, secret });
        return;
      }
      if (keyFailed) {
        toast.error(
          `Tenant ${tenant.name} created, but its initial API key could not be issued — create one in Settings.`,
        );
        void navigate({
          to: "/tenants/$tenantId/settings",
          params: { tenantId: tenant.tenant_id },
        });
        return;
      }
      toast.success(`Tenant ${tenant.name} created`);
      void navigate({
        to: "/tenants/$tenantId",
        params: { tenantId: tenant.tenant_id },
      });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const update = (patch: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const onMetadataChange = (value: string) => {
    update({ metadata: value });
    const parsed = parseMetadata(value);
    setMetadataError(parsed.ok ? null : parsed.error);
  };

  const disabled =
    form.name.trim().length === 0 ||
    metadataError !== null ||
    create.isPending;

  if (created) {
    return (
      <Box
        sx={{
          display: "flex",
          minHeight: 0,
          flex: 1,
          flexDirection: "column",
          overflowY: "auto",
          px: 4,
          py: 3,
        }}
      >
        <Stack spacing={3} sx={{ width: "100%", maxWidth: 1024 }}>
          <Box>
            <Breadcrumbs data-slot="breadcrumb" aria-label="breadcrumb">
              <BreadcrumbsItem
                data-slot="breadcrumb-link"
                component={Link}
                to="/tenants"
                label="Tenants"
              />
              <Typography
                data-slot="breadcrumb-page"
                component="span"
                variant="body2"
                color="text.primary"
                aria-current="page"
              >
                {created.tenant.name}
              </Typography>
            </Breadcrumbs>
            <Typography
              component="h1"
              variant="h3"
              sx={{ mt: 1.5, fontWeight: 600, letterSpacing: "-0.025em" }}
            >
              Tenant created
            </Typography>
            <Typography variant="subtitle1" sx={{ mt: 0.5, color: "text.secondary" }}>
              <Box component="span" sx={{ fontFamily: "monospace" }}>
                {created.tenant.name}
              </Box>{" "}
              is ready. Copy its API key now — it is shown only once and cannot
              be retrieved again. Manage keys later under the tenant's Settings.
            </Typography>
          </Box>

          <OneTimeSecretBanner
            secret={created.secret}
            title="API key — copy now"
            description="This is the only time the full secret is shown. Store it somewhere safe."
          />

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              disableElevation
              data-testid="continue-to-tenant"
              onClick={() =>
                void navigate({
                  to: "/tenants/$tenantId",
                  params: { tenantId: created.tenant.tenant_id },
                })
              }
              endIcon={<IconMaterialSymbolsArrowForward fontSize="small" />}
            >
              Continue to tenant
            </Button>
          </Box>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: 0,
        flex: 1,
        flexDirection: "column",
        overflowY: "auto",
        px: 4,
        py: 3,
      }}
    >
      <Stack spacing={3} sx={{ width: "100%", maxWidth: 1024 }}>
        <Box>
          <Breadcrumbs data-slot="breadcrumb" aria-label="breadcrumb">
            <BreadcrumbsItem
              data-slot="breadcrumb-link"
              component={Link}
              to="/tenants"
              label="Tenants"
            />
            <Typography
              data-slot="breadcrumb-page"
              component="span"
              variant="body2"
              color="text.primary"
              aria-current="page"
            >
              New tenant
            </Typography>
          </Breadcrumbs>
          <Typography
            component="h1"
            variant="h3"
            sx={{
              mt: 1.5,
              fontWeight: 600,
              letterSpacing: "-0.025em",
            }}
          >
            New tenant
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{ mt: 0.5, color: "text.secondary" }}
          >
            Your workspace on AgentScore. Groups your agents for billing and
            scoring.
          </Typography>
        </Box>

        <FormSection
          title="General"
          description="The name for your workspace. Must be unique."
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            <FormLabel htmlFor="new-tenant-name" sx={{ typography: "subtitle1" }}>
              Name <Box component="span" sx={{ color: "error.main" }}>*</Box>
            </FormLabel>
            <TextField
              id="new-tenant-name"
              autoComplete="off"
              placeholder="e.g. my-team"
              value={form.name}
              onChange={(e) => update({ name: e.target.value })}
              size="small"
              slotProps={{
                htmlInput: {
                  "data-testid": "tenant-name-input",
                  sx: { fontFamily: "monospace" },
                },
              }}
            />
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Used in URLs.
            </Typography>
          </Box>
        </FormSection>

        <FormSection
          title="Grouping attributes"
          description="Free-form metadata used in filters and dashboards. Not auth-relevant."
        >
          <Grid container columns={2} spacing={1.5}>
            <Grid size={{ xs: 2, sm: 1 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                <FormLabel htmlFor="new-tenant-env" sx={{ typography: "subtitle1" }}>
                  Environment
                </FormLabel>
                <TextField
                  id="new-tenant-env"
                  placeholder="prod / staging / dev"
                  value={form.env}
                  onChange={(e) => update({ env: e.target.value })}
                  size="small"
                  slotProps={{
                    htmlInput: { "data-testid": "tenant-env-input" },
                  }}
                />
              </Box>
            </Grid>
          </Grid>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            <FormLabel htmlFor="new-tenant-metadata" sx={{ typography: "subtitle1" }}>
              Metadata{" "}
              <Box component="span" sx={{ fontWeight: 400, color: "text.secondary" }}>
                (JSON, optional)
              </Box>
            </FormLabel>
            <TextField
              multiline
              rows={4}
              placeholder={'{"team": "platform", "owner": "you@yourcompany.com"}'}
              value={form.metadata}
              onChange={(e) => onMetadataChange(e.target.value)}
              error={metadataError !== null}
              slotProps={{
                htmlInput: {
                  id: "new-tenant-metadata",
                  "data-testid": "tenant-metadata-input",
                  sx: { fontFamily: "monospace" },
                },
              }}
            />
            {metadataError ? (
              <Typography variant="caption" sx={{ color: "error.main" }}>
                {metadataError}
              </Typography>
            ) : (
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Free-form JSON. You can search and filter on it later.
              </Typography>
            )}
          </Box>
        </FormSection>

        <Box
          sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1 }}
        >
          <Button
            variant="outlined"
            onClick={() => void navigate({ to: "/tenants" })}
            disabled={create.isPending}
            data-testid="cancel-tenant"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={disabled}
            onClick={() => create.mutate()}
            data-testid="create-tenant-submit"
            startIcon={<IconMaterialSymbolsSave fontSize="small" />}
          >
            Create tenant
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
