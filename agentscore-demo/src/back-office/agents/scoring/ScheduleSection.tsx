import { useEffect, useState, type InputHTMLAttributes } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormLabel from "@mui/material/FormLabel";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import IconMaterialSymbolsKeyboardArrowDown from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsKeyboardArrowDown.mjs";
import { toast } from "@/shared/lib/toast";

type BenchmarkConfigOut = any;
type ScheduleUpdateIn = {
  refreshCadenceMinutes: number | null;
  refreshLookbackDays: number | null;
  autonomousScoringEnabled: boolean;
};

// ---------------------------------------------------------------------------
// Scoring-schedule section, rendered on the agent Settings page — per-agent
// cadence + lookback overrides, plus the autonomy kill switch (§4.6 Gap 2
// operator control). Submit → PUT …/scoring/schedule (server emits
// schedule_changed on actual change).
// ---------------------------------------------------------------------------

export function ScheduleSection({
  tenantId,
  agentId,
  benchmark,
}: {
  tenantId: string;
  agentId: string;
  benchmark: BenchmarkConfigOut | null;
}) {
  const [cadence, setCadence] = useState<string>(
    benchmark?.refreshCadenceMinutes != null
      ? String(benchmark.refreshCadenceMinutes)
      : "",
  );
  const [lookback, setLookback] = useState<string>(
    benchmark?.refreshLookbackDays != null
      ? String(benchmark.refreshLookbackDays)
      : "",
  );
  const [autonomousScoringEnabled, setAutonomousScoringEnabled] =
    useState<boolean>(benchmark?.autonomousScoringEnabled ?? true);

  // The `useState` initializers above only run on first mount. The benchmark
  // query is often still in flight then, so it resolves *after* this tab has
  // already rendered with the "not loaded yet" defaults — re-sync local form
  // state whenever the underlying benchmark values change so a late-arriving
  // `autonomousScoringEnabled: false` (operator's kill switch) doesn't get
  // silently overwritten back to the `true` default on submit.
  useEffect(() => {
    setCadence(
      benchmark?.refreshCadenceMinutes != null
        ? String(benchmark.refreshCadenceMinutes)
        : "",
    );
    setLookback(
      benchmark?.refreshLookbackDays != null
        ? String(benchmark.refreshLookbackDays)
        : "",
    );
    setAutonomousScoringEnabled(benchmark?.autonomousScoringEnabled ?? true);
  }, [
    benchmark?.refreshCadenceMinutes,
    benchmark?.refreshLookbackDays,
    benchmark?.autonomousScoringEnabled,
  ]);

  const [saving, setSaving] = useState(false);

  function submit() {
    const body: ScheduleUpdateIn = {
      refreshCadenceMinutes: cadence === "" ? null : Number(cadence),
      refreshLookbackDays: lookback === "" ? null : Number(lookback),
      autonomousScoringEnabled,
    };
    void body; // no backend - nothing to send, local state already reflects the form
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Schedule updated.");
    }, 400);
  }

  return (
    <Accordion defaultExpanded data-testid="schedule-accordion">
      <AccordionSummary expandIcon={<IconMaterialSymbolsKeyboardArrowDown />}>
        <Box sx={{ typography: "body2", fontWeight: 600 }}>
          Refresh schedule
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 360 }}>
          <Typography variant="caption" color="text.secondary">
            Override the global default. Leave blank to inherit the global
            cadence and lookback window.
          </Typography>
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
              <FormLabel htmlFor="schedule-autonomous-scoring">
                Autonomous scoring
              </FormLabel>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Disabling stops first-run discovery and cadence scoring for
                this agent. Score now stays available.
              </Typography>
            </Box>
            <Switch
              id="schedule-autonomous-scoring"
              checked={autonomousScoringEnabled}
              onChange={(e) => setAutonomousScoringEnabled(e.target.checked)}
              slotProps={{
                // MUI's Switch `input` slot type omits arbitrary data-*; it is
                // forwarded to the <input> at runtime (see the testid-forwarding
                // guard), so cast to the DOM attribute type.
                input: {
                  "data-testid": "schedule-autonomous-scoring",
                } as InputHTMLAttributes<HTMLInputElement>,
              }}
            />
          </Box>
          <TextField
            type="number"
            label="Cadence (minutes)"
            value={cadence}
            onChange={(e) => setCadence(e.target.value)}
            size="small"
            fullWidth
            slotProps={{
              htmlInput: { min: 60, "data-testid": "schedule-cadence" },
            }}
            helperText="Minimum 60 minutes"
          />
          <TextField
            type="number"
            label="Lookback (days)"
            value={lookback}
            onChange={(e) => setLookback(e.target.value)}
            size="small"
            fullWidth
            slotProps={{
              htmlInput: { min: 1, max: 90, "data-testid": "schedule-lookback" },
            }}
            helperText="1–90 days"
          />
          <Button
            variant="contained"
            disableElevation
            onClick={submit}
            disabled={saving}
            data-testid="schedule-submit"
            sx={{ alignSelf: "flex-start" }}
          >
            {saving ? "Saving…" : "Save schedule"}
          </Button>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
