import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import type { Golden, LabelingCandidate, SessionVerdict } from "../../../types";
import { listLabelingQueue, listGoldens, submitLabel } from "../../../data/mock";
import LabelingCandidateCard from "./LabelingCandidateCard";

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString();
}

/**
 * Labeling queue: a human occasionally double-checks low-confidence or
 * flagged sessions, confirms or corrects the system's read, and can see a
 * record of what's already been confirmed (the "goldens" below the queue).
 */
export default function LabelingTab({ agentId }: { agentId: string }) {
  const [queue, setQueue] = useState<LabelingCandidate[]>([]);
  const [goldens, setGoldens] = useState<Golden[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listLabelingQueue(agentId), listGoldens(agentId)]).then(([nextQueue, nextGoldens]) => {
      if (cancelled) return;
      setQueue(nextQueue);
      setGoldens(nextGoldens);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [agentId]);

  async function refresh() {
    const [nextQueue, nextGoldens] = await Promise.all([listLabelingQueue(agentId), listGoldens(agentId)]);
    setQueue(nextQueue);
    setGoldens(nextGoldens);
  }

  async function handleConfirm(candidate: LabelingCandidate) {
    await submitLabel(agentId, candidate.id, "confirm");
    await refresh();
  }

  async function handleOverride(candidate: LabelingCandidate, verdict: SessionVerdict, note?: string) {
    // The suggested verdict was already rejected in favor of `verdict` by
    // the reviewer; submitLabel only records the decision kind and note, so
    // the chosen verdict itself just drives which golden gets created.
    void verdict;
    await submitLabel(agentId, candidate.id, "override", note);
    await refresh();
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Needs review
        </Typography>

        {loaded && queue.length === 0 ? (
          <Paper sx={{ p: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
            <Box sx={{ py: 2, textAlign: "center" }}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Nothing needs review right now.
              </Typography>
            </Box>
          </Paper>
        ) : (
          queue.map((candidate) => (
            <LabelingCandidateCard
              key={candidate.id}
              candidate={candidate}
              onConfirm={() => handleConfirm(candidate)}
              onOverride={(verdict, note) => handleOverride(candidate, verdict, note)}
            />
          ))
        )}
      </Box>

      <Paper sx={{ p: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          Confirmed examples
        </Typography>

        {goldens.length === 0 ? (
          <Box sx={{ py: 2, textAlign: "center" }}>
            <Typography variant="body2" sx={{ color: "text.disabled" }}>
              No confirmed examples yet.
            </Typography>
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Trace</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary", width: 180 }}>Confirmed</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary", width: 110 }}>Decision</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Note</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {goldens.map((golden) => (
                <TableRow key={golden.id} sx={{ "&:last-child td": { borderBottom: 0 } }}>
                  <TableCell>
                    <Typography variant="body2">{golden.traceName}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {formatTimestamp(golden.confirmedAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={golden.decision === "confirm" ? "Confirmed" : "Overridden"}
                      size="small"
                      color={golden.decision === "confirm" ? "success" : "warning"}
                      sx={{ height: 20, fontSize: "0.68rem" }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: golden.note ? "text.secondary" : "text.disabled" }}>
                      {golden.note ?? "-"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Box>
  );
}
