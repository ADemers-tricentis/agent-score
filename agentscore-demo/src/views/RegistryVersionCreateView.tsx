import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Autocomplete from "@mui/material/Autocomplete";
import type { View } from "../types";
import { getRegistrySlot, versionsForSlot, AGENT_VERSIONS, createAgentVersion } from "../data/mock";
import EntityShell from "../components/EntityShell";
import FormSection from "../components/FormSection";
import EmptyState, { NotFoundState } from "../components/EmptyState";
import { useToast } from "../components/Toast";

interface Props {
  slotSlug: string;
  fromVersionId?: string;
  tenantId?: string;
  navigate: (v: View) => void;
}

function isValidCap(value: string): boolean {
  return value === "" || /^\d+$/.test(value);
}

export default function RegistryVersionCreateView({ slotSlug, fromVersionId, tenantId, navigate }: Props) {
  const toast = useToast();
  const slot = getRegistrySlot(slotSlug);

  const fromVersion = fromVersionId ? AGENT_VERSIONS.find((v) => v.id === fromVersionId) : undefined;
  const existingVersions = slot ? versionsForSlot(slot.id, tenantId ?? null) : [];

  const [name, setName] = useState(fromVersion?.name ?? "");
  const [instructions, setInstructions] = useState(fromVersion?.instructions ?? "");
  const [tools, setTools] = useState<string[]>(
    fromVersion ? fromVersion.toolAllowlist.filter((t) => slot?.toolAllowlist.includes(t)) : [],
  );
  const [modelProvider, setModelProvider] = useState(fromVersion?.modelProvider ?? "");
  const [modelId, setModelId] = useState(fromVersion?.modelId ?? "");
  const [dollarCeiling, setDollarCeiling] = useState(fromVersion?.dollarCeilingUsd ?? "3.00");
  const [turnCap, setTurnCap] = useState(fromVersion?.turnCap != null ? String(fromVersion.turnCap) : "");
  const [wallClockCap, setWallClockCap] = useState(fromVersion?.wallClockCapSeconds != null ? String(fromVersion.wallClockCapSeconds) : "");

  if (!slot) {
    return (
      <Box sx={{ p: 3 }}>
        <NotFoundState entity="Slot" action={<Button variant="outlined" onClick={() => navigate({ name: "agent-registry", tenantId })}>Back to Agent Registry</Button>} />
      </Box>
    );
  }

  if (fromVersionId && !fromVersion) {
    return (
      <Box sx={{ p: 3 }}>
        <NotFoundState entity="Source version" action={<Button variant="outlined" onClick={() => navigate({ name: "registry-slot", slotSlug, tenantId })}>Back to slot</Button>} />
      </Box>
    );
  }

  if (!fromVersionId && existingVersions.length > 0) {
    return (
      <Box sx={{ p: 3 }}>
        <EmptyState
          testId="version-create-needs-source"
          title="Pick a version to copy"
          description="This slot already has a version in scope — creating from scratch isn't allowed once a lineage exists. Open the slot and copy the version you want to base this one on."
          action={<Button variant="outlined" onClick={() => navigate({ name: "registry-slot", slotSlug, tenantId })}>Back to slot</Button>}
        />
      </Box>
    );
  }

  const turnCapValid = isValidCap(turnCap);
  const wallClockCapValid = isValidCap(wallClockCap);
  const canSubmit =
    name.trim() !== "" && instructions.trim() !== "" && modelProvider.trim() !== "" && modelId.trim() !== "" &&
    dollarCeiling.trim() !== "" && turnCapValid && wallClockCapValid;

  function handleSubmit() {
    if (!canSubmit) return;
    const created = createAgentVersion({
      slotSlug,
      tenantId: tenantId ?? null,
      fromVersionId,
      name: name.trim(),
      instructions,
      toolAllowlist: tools,
      modelProvider: modelProvider.trim(),
      modelId: modelId.trim(),
      dollarCeilingUsd: dollarCeiling.trim(),
      turnCap: turnCap === "" ? null : parseInt(turnCap, 10),
      wallClockCapSeconds: wallClockCap === "" ? null : parseInt(wallClockCap, 10),
    });
    toast.success(`Version #${created.versionNumber} published`);
    navigate({ name: "registry-version", slotSlug, versionId: created.id, tenantId });
  }

  const subtitle = fromVersion
    ? `Copied from #${fromVersion.versionNumber} ${fromVersion.name}${fromVersion.revokedAt ? " (revoked — publishing this copy is the documented recovery path)" : ""}. Edit any field before publishing.`
    : "No version exists for this slot yet — authoring from scratch.";

  return (
    <EntityShell title="New version" meta={subtitle}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 720 }}>
        <FormSection title="General">
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField label="Name *" size="small" value={name} onChange={(e) => setName(e.target.value)} data-testid="version-name" />
            <TextField
              label="Instructions *"
              multiline
              minRows={6}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              data-testid="version-instructions"
            />
            <Autocomplete
              multiple
              options={slot.toolAllowlist}
              value={tools}
              onChange={(_, value) => setTools(value)}
              renderInput={(params) => (
                <TextField {...params} label="Tools" placeholder="Add tools…" size="small" data-testid="version-tools-picker" />
              )}
            />
            {tools.length === 0 && (
              <Typography variant="caption" sx={{ color: "text.secondary" }}>No tools selected.</Typography>
            )}
          </Box>
        </FormSection>

        <FormSection title="Model" description="No route lists valid model identities - enter exactly what the inference layer expects.">
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Model provider *"
              size="small"
              placeholder="e.g. openai"
              helperText="Free text — not validated against a catalog."
              value={modelProvider}
              onChange={(e) => setModelProvider(e.target.value)}
              data-testid="version-model-provider"
            />
            <TextField
              label="Model id *"
              size="small"
              placeholder="e.g. gpt-4.1"
              helperText="Free text — not validated against a catalog."
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              data-testid="version-model-id"
            />
          </Box>
        </FormSection>

        <FormSection title="Bounds">
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Dollar ceiling (USD) *"
              size="small"
              value={dollarCeiling}
              onChange={(e) => setDollarCeiling(e.target.value)}
              data-testid="version-dollar-ceiling"
            />
            <TextField
              label="Turn cap (optional)"
              size="small"
              value={turnCap}
              onChange={(e) => setTurnCap(e.target.value)}
              error={!turnCapValid}
              helperText={!turnCapValid ? "Enter a whole number, or leave blank for no cap." : undefined}
              data-testid="version-turn-cap"
            />
            <TextField
              label="Wall-clock cap, seconds (optional)"
              size="small"
              value={wallClockCap}
              onChange={(e) => setWallClockCap(e.target.value)}
              error={!wallClockCapValid}
              helperText={!wallClockCapValid ? "Enter a whole number of seconds, or leave blank for no cap." : undefined}
              data-testid="version-wall-clock-cap"
            />
          </Box>
        </FormSection>

        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button variant="outlined" color="inherit" onClick={() => navigate({ name: "registry-slot", slotSlug, tenantId })} data-testid="cancel-version">
            Cancel
          </Button>
          <Button variant="contained" disabled={!canSubmit} onClick={handleSubmit} data-testid="create-version-submit">
            Create
          </Button>
        </Box>
      </Box>
    </EntityShell>
  );
}
