import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import type { View } from "../types";
import { getRegistrySlot, versionsForSlot, resolveSlotBinding, useMockData } from "../data/mock";
import EntityShell from "../components/EntityShell";
import FormSection from "../components/FormSection";
import DataTable from "../components/DataTable";
import TintChip, { ChipStrip } from "../components/TintChip";
import EmptyState, { NotFoundState } from "../components/EmptyState";
import JsonViewer from "../components/JsonViewer";
import ReassignBindingDialog from "../components/registry/ReassignBindingDialog";

interface Props {
  slotSlug: string;
  tenantId?: string;
  navigate: (v: View) => void;
}

export default function RegistrySlotDetailView({ slotSlug, tenantId, navigate }: Props) {
  useMockData();
  const [reassignOpen, setReassignOpen] = useState(false);

  const slot = getRegistrySlot(slotSlug);
  if (!slot) {
    return (
      <Box sx={{ p: 3 }}>
        <NotFoundState
          entity="Slot"
          action={<Button variant="outlined" onClick={() => navigate({ name: "agent-registry", tenantId })}>Back to Agent Registry</Button>}
        />
      </Box>
    );
  }

  const versions = versionsForSlot(slot.id, tenantId ?? null);
  const resolved = resolveSlotBinding(slot.id, tenantId ?? null);
  const copySource = versions.find((v) => !v.revokedAt) ?? versions[0];

  return (
    <EntityShell
      title={slot.slug}
      meta={slot.description ?? undefined}
      testId="slot-detail"
      actions={
        <Button
          variant="contained"
          onClick={() => navigate({ name: "registry-version-new", slotSlug: slot.slug, fromVersionId: copySource?.id, tenantId })}
        >
          New version
        </Button>
      }
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 1024 }}>
        <FormSection title="Slot contract" description="The output contract and tool allowlist every version of this slot must satisfy.">
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <JsonViewer value={slot.outputContract} />
            {slot.toolAllowlist.length > 0 ? (
              <ChipStrip>
                {slot.toolAllowlist.map((tool) => (
                  <TintChip key={tool} tint="outline" label={tool} />
                ))}
              </ChipStrip>
            ) : (
              <Typography variant="caption" sx={{ color: "text.secondary" }}>No tools allowed.</Typography>
            )}
            <ChipStrip>
              <TintChip tint={slot.readOnly ? "warning" : "muted"} label={slot.readOnly ? "Read-only" : "Writable"} />
              <TintChip tint="outline" label={slot.priorityClass} />
            </ChipStrip>
          </Box>
        </FormSection>

        <FormSection title="Current binding" description="The version this slot serves in the selected scope.">
          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
            <Box>
              {resolved.version ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {resolved.version.name} · #{resolved.version.versionNumber}
                    </Typography>
                    {tenantId && resolved.source && <TintChip tint={resolved.source === "global" ? "muted" : "info"} label={resolved.source} />}
                    {resolved.version.revokedAt && <TintChip tint="destructive" label="Revoked" />}
                  </Box>
                  {resolved.version.revokedAt && (
                    <Alert severity="warning" sx={{ mt: 0.5 }}>
                      This slot cannot serve traffic — every run through it refuses with "version revoked". Reassign it to a live version.
                    </Alert>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Unbound — no version currently serves this slot in this scope.
                </Typography>
              )}
            </Box>
            <Button variant="outlined" onClick={() => setReassignOpen(true)} sx={{ flexShrink: 0 }}>
              Reassign
            </Button>
          </Box>
        </FormSection>

        <FormSection title="Versions" description="Every version of this slot in the selected scope, newest first.">
          <DataTable
            getRowId={(v) => v.id}
            getRowTestId={(v) => `version-row-${v.id}`}
            onRowClick={(v) => navigate({ name: "registry-version", slotSlug: slot.slug, versionId: v.id, tenantId })}
            data={versions}
            emptyState={<EmptyState title="No versions yet" testId="version-list-empty" />}
            columns={[
              { id: "number", header: "#", width: "8%", render: (v) => `#${v.versionNumber}` },
              { id: "name", header: "Name", width: "30%", render: (v) => v.name },
              {
                id: "model",
                header: "Model",
                width: "38%",
                render: (v) => (
                  <Typography variant="caption" sx={{ fontFamily: "monospace" }}>{v.modelProvider}/{v.modelId}</Typography>
                ),
              },
              {
                id: "ceiling",
                header: "$ ceiling",
                width: "14%",
                align: "right",
                render: (v) => v.dollarCeilingUsd,
              },
              {
                id: "revoked",
                header: "",
                width: "10%",
                render: (v) => (v.revokedAt ? <TintChip tint="destructive" label="Revoked" /> : null),
              },
            ]}
          />
        </FormSection>
      </Box>

      <ReassignBindingDialog
        open={reassignOpen}
        onClose={() => setReassignOpen(false)}
        slotId={slot.id}
        tenantId={tenantId ?? null}
        currentVersionId={resolved.version?.id}
      />
    </EntityShell>
  );
}
