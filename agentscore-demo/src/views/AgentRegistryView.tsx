import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import type { View } from "../types";
import { registrySlots, resolveSlotBinding, useMockData, TENANTS } from "../data/mock";
import DataTable from "../components/DataTable";
import TintChip from "../components/TintChip";
import EmptyState from "../components/EmptyState";

const REGISTRY_ICON = "M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18L19.28 8 12 11.82 4.72 8 12 4.18zM4 9.7l7 3.5v7.1l-7-3.5V9.7zm9 10.6v-7.1l7-3.5v7.1l-7 3.5z";

const GLOBAL_SCOPE = "__global__";

interface Props {
  tenantId?: string;
  navigate: (v: View) => void;
}

export default function AgentRegistryView({ tenantId, navigate }: Props) {
  useMockData();

  const scope = tenantId ?? GLOBAL_SCOPE;
  const scopeOptions = [
    { value: GLOBAL_SCOPE, label: "Global" },
    ...TENANTS.map((t) => ({ value: t.id, label: t.name })),
  ];
  const currentScopeOption = scopeOptions.find((o) => o.value === scope) ?? scopeOptions[0];

  const slots = registrySlots();

  return (
    <Box sx={{ p: 3, maxWidth: 1100 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
        Agent Registry
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 3, maxWidth: 620 }}>
        Task slots and the agent versions serving them.
      </Typography>

      <Box sx={{ maxWidth: 320, mb: 2 }}>
        <Autocomplete
          disableClearable
          options={scopeOptions}
          getOptionLabel={(o) => o.label}
          value={currentScopeOption}
          onChange={(_, value) => navigate({ name: "agent-registry", tenantId: value.value === GLOBAL_SCOPE ? undefined : value.value })}
          renderInput={(params) => <TextField {...params} label="Registry scope" size="small" data-testid="registry-scope-picker" />}
        />
      </Box>

      <DataTable
        getRowId={(slot) => slot.id}
        getRowTestId={(slot) => `slot-row-${slot.slug}`}
        onRowClick={(slot) => navigate({ name: "registry-slot", slotSlug: slot.slug, tenantId })}
        data={slots}
        emptyState={
          <EmptyState icon={REGISTRY_ICON} title="No task slots" description="This scope has no task slots to show." testId="registry-empty" />
        }
        columns={[
          {
            id: "slot",
            header: "Slot",
            width: tenantId ? "26%" : "34%",
            render: (slot) => (
              <Box>
                <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 600 }}>{slot.slug}</Typography>
                {slot.description && (
                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>{slot.description}</Typography>
                )}
              </Box>
            ),
          },
          {
            id: "bound-version",
            header: "Bound version",
            width: tenantId ? "18%" : "22%",
            render: (slot) => {
              const resolved = resolveSlotBinding(slot.id, tenantId ?? null);
              if (!resolved.version) return <Typography variant="body2" sx={{ color: "text.secondary" }}>Unbound</Typography>;
              return (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <Typography variant="body2" sx={{ fontFamily: "monospace" }}>#{resolved.version.versionNumber}</Typography>
                  {resolved.version.revokedAt && (
                    <TintChip tint="destructive" label="Revoked" />
                  )}
                </Box>
              );
            },
          },
          ...(tenantId
            ? [
                {
                  id: "source",
                  header: "Source",
                  width: "14%",
                  render: (slot: (typeof slots)[number]) => {
                    const resolved = resolveSlotBinding(slot.id, tenantId);
                    if (!resolved.source) return <Typography variant="body2" sx={{ color: "text.secondary" }}>—</Typography>;
                    return <TintChip tint={resolved.source === "global" ? "muted" : "info"} label={resolved.source} />;
                  },
                },
                {
                  id: "staleness",
                  header: "Staleness",
                  width: "14%",
                  render: (slot: (typeof slots)[number]) => {
                    const resolved = resolveSlotBinding(slot.id, tenantId);
                    if (!resolved.stale) return null;
                    return <TintChip tint="warning" label="Stale" />;
                  },
                },
              ]
            : []),
          {
            id: "model",
            header: "Model",
            width: tenantId ? "22%" : "32%",
            render: (slot) => {
              const resolved = resolveSlotBinding(slot.id, tenantId ?? null);
              if (!resolved.version) return <Typography variant="body2" sx={{ color: "text.secondary" }}>—</Typography>;
              return (
                <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                  {resolved.version.modelProvider}/{resolved.version.modelId}
                </Typography>
              );
            },
          },
          {
            id: "tools",
            header: "Tools",
            width: tenantId ? "6%" : "12%",
            align: "right",
            render: (slot) => <Typography variant="body2">{slot.toolAllowlist.length}</Typography>,
          },
        ]}
      />
    </Box>
  );
}
