import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import type { View } from "../types";
import { getRegistrySlot, AGENT_VERSIONS, useMockData } from "../data/mock";
import { buildLineage } from "../data/registry-lineage";
import EntityShell from "../components/EntityShell";
import FormSection from "../components/FormSection";
import DangerZone from "../components/DangerZone";
import CodeBlock from "../components/CodeBlock";
import TintChip, { ChipStrip } from "../components/TintChip";
import { NotFoundState } from "../components/EmptyState";
import RevokeVersionDialog from "../components/registry/RevokeVersionDialog";

interface Props {
  slotSlug: string;
  versionId: string;
  tenantId?: string;
  navigate: (v: View) => void;
}

export default function RegistryVersionDetailView({ slotSlug, versionId, tenantId, navigate }: Props) {
  useMockData();
  const [revokeOpen, setRevokeOpen] = useState(false);

  const slot = getRegistrySlot(slotSlug);
  const version = AGENT_VERSIONS.find((v) => v.id === versionId);

  if (!slot || !version) {
    return (
      <Box sx={{ p: 3 }}>
        <NotFoundState
          entity="Version"
          action={<Button variant="outlined" onClick={() => navigate({ name: "registry-slot", slotSlug, tenantId })}>Back to slot</Button>}
        />
      </Box>
    );
  }

  const byId = new Map(AGENT_VERSIONS.map((v) => [v.id, v] as const));
  const lineage = buildLineage(version.id, byId);

  return (
    <EntityShell
      title={`${version.name} · #${version.versionNumber}`}
      badges={<TintChip tint={version.revokedAt ? "destructive" : "success"} label={version.revokedAt ? "Revoked" : "Active"} />}
      testId="version-detail"
      actions={
        <Button
          variant="contained"
          onClick={() => navigate({ name: "registry-version-new", slotSlug, fromVersionId: version.id, tenantId })}
        >
          New version from this
        </Button>
      }
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 1024 }}>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          This version is immutable — every field below is fixed at creation. To change any of them, publish
          "New version from this" and edit the copy.
        </Typography>

        <FormSection title="General">
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Box>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>Name</Typography>
              <Typography variant="body2">{version.name}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.5 }}>Instructions</Typography>
              <CodeBlock testId="version-instructions-copy">{version.instructions}</CodeBlock>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.5 }}>Tools</Typography>
              {version.toolAllowlist.length > 0 ? (
                <ChipStrip>
                  {version.toolAllowlist.map((t) => <TintChip key={t} tint="outline" label={t} />)}
                </ChipStrip>
              ) : (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>No tools allowed.</Typography>
              )}
            </Box>
          </Box>
        </FormSection>

        <FormSection title="Model">
          <Box sx={{ display: "flex", gap: 4 }}>
            <Box>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>Provider</Typography>
              <Typography variant="body2">{version.modelProvider}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>Model id</Typography>
              <Typography variant="body2">{version.modelId}</Typography>
            </Box>
          </Box>
        </FormSection>

        <FormSection title="Bounds">
          <Box sx={{ display: "flex", gap: 4 }}>
            <Box>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>Dollar ceiling</Typography>
              <Typography variant="body2">${version.dollarCeilingUsd}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>Turn cap</Typography>
              <Typography variant="body2">{version.turnCap ?? "No cap"}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>Wall-clock cap</Typography>
              <Typography variant="body2">{version.wallClockCapSeconds != null ? `${version.wallClockCapSeconds}s` : "No cap"}</Typography>
            </Box>
          </Box>
        </FormSection>

        <FormSection title="Provenance">
          <Box sx={{ display: "flex", gap: 4 }}>
            <Box>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>Created</Typography>
              <Typography variant="body2">{new Date(version.createdAt).toLocaleString()}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>Created by</Typography>
              <Typography variant="body2">{version.createdByUserId ?? "System"}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>Revoked</Typography>
              <Typography variant="body2">{version.revokedAt ? new Date(version.revokedAt).toLocaleString() : "Not revoked"}</Typography>
            </Box>
          </Box>
        </FormSection>

        <FormSection title="Lineage" description="Newest → oldest. Each version's base is the one it was copied from.">
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {lineage.chain.map((v, i) => (
              <ChipStrip key={v.id}>
                <TintChip tint={i === 0 ? "info" : "muted"} label={`#${v.versionNumber} ${v.name}`} />
                {v.tenantId === null && <TintChip tint="outline" label="global" />}
                {v.revokedAt && <TintChip tint="destructive" label="Revoked" />}
              </ChipStrip>
            ))}
            <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5 }}>
              {lineage.truncated
                ? "Lineage truncated (a base link is missing or the depth cap was hit) — whether it terminates at a global version can't be determined from what loaded."
                : lineage.terminatesGlobal
                ? "Terminates at a global version."
                : "From-scratch chain — does not terminate at a global version."}
            </Typography>
          </Box>
        </FormSection>

        <DangerZone>
          <DangerZone.Row
            title="Revoke this version"
            description={
              version.revokedAt
                ? "This version is already revoked."
                : "Permanent — no un-revoke. Recovery means publishing a new version and rebinding every slot that used this one."
            }
            action={
              <Button variant="contained" color="error" disabled={Boolean(version.revokedAt)} onClick={() => setRevokeOpen(true)} data-testid="version-revoke">
                Revoke
              </Button>
            }
          />
        </DangerZone>
      </Box>

      <RevokeVersionDialog open={revokeOpen} onClose={() => setRevokeOpen(false)} version={version} />
    </EntityShell>
  );
}
