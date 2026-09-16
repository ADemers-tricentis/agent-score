import { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import type { Project } from "../../types";
import { labelSession, useMockData } from "../../data/mock";
import { useToast } from "../../components/Toast";
import EmptyState from "../../components/EmptyState";

interface Props {
  project: Project;
}

const LABELING_ICON = "M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16z";
const LABELING_THRESHOLD = 20;

export default function LabelingTab({ project }: Props) {
  useMockData();
  const toast = useToast();
  const allSessions = project.runs.flatMap((r) => r.sessions);
  const captured = allSessions.length;
  const queue = allSessions.filter((s) => !s.labeled);
  const labeledCount = allSessions.filter((s) => s.labeled).length;

  const [selectedId, setSelectedId] = useState<string | null>(queue[0]?.id ?? null);
  const [verdict, setVerdict] = useState<"correct" | "incorrect" | "">("");
  const [note, setNote] = useState("");

  if (captured < LABELING_THRESHOLD) {
    return (
      <EmptyState
        icon={LABELING_ICON}
        title="Labeling not unlocked yet"
        description={`Labeling unlocks at ${LABELING_THRESHOLD} captured interactions — currently ${captured}.`}
      />
    );
  }

  const selected = queue.find((s) => s.id === selectedId) ?? queue[0] ?? null;

  function handleSaveNext() {
    if (!selected || !verdict) return;
    labelSession(project.id, selected.id);
    toast.success("Label saved. Moving to the next interaction.");
    const remaining = queue.filter((s) => s.id !== selected.id);
    setSelectedId(remaining[0]?.id ?? null);
    setVerdict("");
    setNote("");
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>Labeling queue</Typography>
      <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.5 }}>
        {queue.length} loaded for review · {labeledCount} reference labels saved
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 3, maxWidth: 720 }}>
        Review the interaction, choose whether the response is correct, then save.
      </Typography>

      {queue.length === 0 || !selected ? (
        <EmptyState icon={LABELING_ICON} title="No interactions available for review" description="Every captured interaction has a label." testId="label-empty" />
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 2 }}>
          <Paper variant="outlined" sx={{ borderRadius: 1.5, maxHeight: 480, overflow: "auto" }}>
            {queue.map((s, i) => (
              <Box
                key={s.id}
                onClick={() => { setSelectedId(s.id); setVerdict(""); setNote(""); }}
                sx={{ px: 2, py: 1.25, cursor: "pointer", bgcolor: s.id === selected.id ? "action.selected" : "transparent", borderBottom: "1px solid", borderColor: "divider", "&:hover": { bgcolor: "action.hover" } }}
              >
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>Interaction {i + 1}</Typography>
                <Typography variant="body2" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.scenario}</Typography>
              </Box>
            ))}
          </Paper>

          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              Interaction {queue.findIndex((s) => s.id === selected.id) + 1} of {queue.length} loaded
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5 }}>Input</Typography>
                <Box sx={{ bgcolor: "action.hover", borderRadius: 1, p: 1.5, mt: 0.5, border: "1px solid", borderColor: "divider", minHeight: 60 }}>
                  <Typography variant="body2">{selected.scenario}</Typography>
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5 }}>Output</Typography>
                <Box sx={{ bgcolor: "action.hover", borderRadius: 1, p: 1.5, mt: 0.5, border: "1px solid", borderColor: "divider", minHeight: 60 }}>
                  <Typography variant="body2">
                    {selected.verdict === "FAIL" ? "Evaluation failed. Critical threshold not reached." : `Evaluation complete. Score: ${selected.scores.benchmarkPerformance.score}/100.`}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Paper component="form" variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>Your judgment</Typography>
              <RadioGroup value={verdict} onChange={(e) => setVerdict(e.target.value as "correct" | "incorrect")}>
                <FormControlLabel value="correct" control={<Radio size="small" />} label="Mark correct — the response is acceptable for this input." />
                <FormControlLabel value="incorrect" control={<Radio size="small" />} label="Mark incorrect — the response needs correction." />
              </RadioGroup>
              <TextField label="Note (optional)" multiline minRows={2} fullWidth size="small" value={note} onChange={(e) => setNote(e.target.value)} sx={{ mt: 1.5 }} />
              <Button variant="contained" disabled={!verdict} onClick={handleSaveNext} sx={{ mt: 2 }}>
                Save and next
              </Button>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 1 }}>
                Drafts are kept while switching between interactions on this page.
              </Typography>
            </Paper>
          </Paper>
        </Box>
      )}
    </Box>
  );
}
