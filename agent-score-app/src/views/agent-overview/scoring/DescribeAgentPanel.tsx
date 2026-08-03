import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import type { DescribeAgentGuidedInput, DescribeAgentResult } from "../../../types";
import { describeAgent, applyDescribeAgentResult } from "../../../data/mock";

type Mode = "guided" | "expert";
type Phase = "form" | "checking" | "result";

const CHECKLIST_STEPS = ["Parsing spec", "Matching profile library", "Comparing evals"];
const STEP_DELAY_MS = 550;

const EMPTY_GUIDED: DescribeAgentGuidedInput = { whatItDoes: "", neverDo: "", mainConcern: "" };

/**
 * REQ-069/070/071: lets a domain expert describe their agent in plain
 * language (or paste a spec) so AgentScore can double-check the scoring
 * setup without needing traces first.
 */
export default function DescribeAgentPanel({
  agentId,
  open,
  onClose,
}: {
  agentId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<Mode>("guided");
  const [guided, setGuided] = useState<DescribeAgentGuidedInput>(EMPTY_GUIDED);
  const [expertSpec, setExpertSpec] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [checklistIndex, setChecklistIndex] = useState(0);
  const [result, setResult] = useState<DescribeAgentResult | null>(null);
  const [applied, setApplied] = useState(false);

  // Reset all local state whenever the dialog is (re)opened.
  useEffect(() => {
    if (!open) return;
    setMode("guided");
    setGuided(EMPTY_GUIDED);
    setExpertSpec("");
    setPhase("form");
    setChecklistIndex(0);
    setResult(null);
    setApplied(false);
  }, [open]);

  // Drives the sequential "Parsing spec" -> "Matching profile library" ->
  // "Comparing evals" checklist animation, then fetches the real result.
  useEffect(() => {
    if (phase !== "checking") return;

    if (checklistIndex >= CHECKLIST_STEPS.length) {
      let cancelled = false;
      const input =
        mode === "guided" ? { mode: "guided" as const, guided } : { mode: "expert" as const, expertSpec };
      describeAgent(agentId, input).then((r) => {
        if (cancelled) return;
        setResult(r);
        setPhase("result");
      });
      return () => {
        cancelled = true;
      };
    }

    const t = setTimeout(() => setChecklistIndex((i) => i + 1), STEP_DELAY_MS);
    return () => clearTimeout(t);
  }, [phase, checklistIndex, agentId, mode, guided, expertSpec]);

  const canSubmit =
    mode === "guided"
      ? guided.whatItDoes.trim() !== "" && guided.neverDo.trim() !== "" && guided.mainConcern.trim() !== ""
      : expertSpec.trim() !== "";

  function handleSubmit() {
    setPhase("checking");
    setChecklistIndex(0);
  }

  async function handleApply() {
    if (!result) return;
    await applyDescribeAgentResult(agentId, result);
    setApplied(true);
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Describe your agent</DialogTitle>
      <DialogContent>
        {phase === "form" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 0.5 }}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Tell us about your agent so we can double-check the scoring setup matches what it actually does.
            </Typography>

            <ToggleButtonGroup
              value={mode}
              exclusive
              size="small"
              onChange={(_, v: Mode | null) => v && setMode(v)}
              sx={{ alignSelf: "flex-start" }}
            >
              <ToggleButton value="guided" sx={{ textTransform: "none", px: 2 }}>
                Guided
              </ToggleButton>
              <ToggleButton value="expert" sx={{ textTransform: "none", px: 2 }}>
                Expert
              </ToggleButton>
            </ToggleButtonGroup>

            {mode === "guided" ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <TextField
                  label="What does it do?"
                  multiline
                  minRows={2}
                  fullWidth
                  value={guided.whatItDoes}
                  onChange={(e) => setGuided((g) => ({ ...g, whatItDoes: e.target.value }))}
                />
                <TextField
                  label="What should it never do?"
                  multiline
                  minRows={2}
                  fullWidth
                  value={guided.neverDo}
                  onChange={(e) => setGuided((g) => ({ ...g, neverDo: e.target.value }))}
                />
                <TextField
                  label="What's your main concern?"
                  multiline
                  minRows={2}
                  fullWidth
                  value={guided.mainConcern}
                  onChange={(e) => setGuided((g) => ({ ...g, mainConcern: e.target.value }))}
                />
              </Box>
            ) : (
              <TextField
                label="Paste a YAML/JSON/Markdown spec"
                multiline
                minRows={8}
                fullWidth
                value={expertSpec}
                onChange={(e) => setExpertSpec(e.target.value)}
                sx={{ "& textarea": { fontFamily: "monospace", fontSize: "0.8rem" } }}
              />
            )}
          </Box>
        )}

        {phase === "checking" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, py: 3 }}>
            {CHECKLIST_STEPS.map((step, i) => (
              <Box key={step} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={{ width: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {i < checklistIndex ? (
                    <Typography sx={{ color: "success.main", fontWeight: 700 }}>✓</Typography>
                  ) : i === checklistIndex ? (
                    <CircularProgress size={14} thickness={5} />
                  ) : (
                    <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "action.disabledBackground" }} />
                  )}
                </Box>
                <Typography
                  variant="body2"
                  sx={{ color: i <= checklistIndex ? "text.primary" : "text.disabled" }}
                >
                  {step}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {phase === "result" && result && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 0.5 }}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Matched profile: <strong>{result.matchedProfileName}</strong> ({result.confidence}% confidence)
            </Typography>

            {result.noChangesNeeded ? (
              <Alert severity="success" sx={{ borderRadius: 1.5 }}>
                Your current scoring setup already matches this description. No changes needed.
              </Alert>
            ) : (
              <>
                {result.evalsToAdd.length > 0 && (
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600 }}>
                      EVALS TO ADD
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 0.5 }}>
                      {result.evalsToAdd.map((name) => (
                        <Chip key={name} label={`+ ${name}`} size="small" color="success" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                )}
                {result.evalsToRemove.length > 0 && (
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600 }}>
                      EVALS TO REMOVE
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 0.5 }}>
                      {result.evalsToRemove.map((name) => (
                        <Chip key={name} label={`- ${name}`} size="small" color="error" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                )}
                {result.weightAdjustments.length > 0 && (
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600 }}>
                      WEIGHT ADJUSTMENTS
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 0.5 }}>
                      {result.weightAdjustments.map((adj) => (
                        <Typography key={adj.name} variant="body2" sx={{ color: "warning.main", fontWeight: 500 }}>
                          {adj.name}: {adj.from} → {adj.to}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                )}

                {applied ? (
                  <Alert severity="success" sx={{ borderRadius: 1.5 }}>
                    Changes applied.
                  </Alert>
                ) : (
                  <Divider />
                )}
              </>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {phase === "form" && (
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="contained" disabled={!canSubmit} onClick={handleSubmit}>
              Submit
            </Button>
          </>
        )}
        {phase === "checking" && <Button onClick={onClose}>Cancel</Button>}
        {phase === "result" && (
          <>
            <Button onClick={onClose}>Close</Button>
            {result && !result.noChangesNeeded && !applied && (
              <Button variant="contained" onClick={handleApply}>
                Apply changes
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
