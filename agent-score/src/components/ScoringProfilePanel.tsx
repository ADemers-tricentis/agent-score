import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import type { ScoringProfile, ProfileVersion, View } from "../types";
import { DIMENSION_ORDER } from "../data/dimensions";

interface Props {
  profile: ScoringProfile | null;
  version: ProfileVersion | null;
  navigate: (v: View) => void;
}

export default function ScoringProfilePanel({ profile, version, navigate }: Props) {
  if (!profile || !version) {
    return (
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 1.5, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Scoring profile</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>No scoring profile adopted for this agent yet.</Typography>
        <Button size="small" variant="contained" onClick={() => navigate({ name: "profiles" })}>Adopt a profile</Button>
      </Paper>
    );
  }

  const dimensionsPresent = DIMENSION_ORDER.filter((d) => version.entries.some((e) => e.dimension === d));
  const weightsLine = dimensionsPresent
    .map((d) => `${d.toLowerCase()}: ${version.dimensionWeights[d] ?? 0}`)
    .join(", ");

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 1.5 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Scoring profile</Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>The rules this agent is being scored against</Typography>
        </Box>
      </Box>

      <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 1.5, mb: 2.5, bgcolor: "rgba(var(--mui-palette-primary-mainChannel) / 0.03)" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 0.75 }}>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{profile.name}</Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>Version v{version.version}</Typography>
          </Box>
          <Button size="small" variant="outlined" color="inherit" sx={{ color: "text.secondary", fontSize: "0.68rem" }} onClick={() => navigate({ name: "profiles" })}>
            Switch profile
          </Button>
        </Box>
        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1 }}>
          How much each area counts toward the final score · {weightsLine}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.disabled" }}>
          To change what's measured, publish a new profile version, then pin it here.
        </Typography>
      </Paper>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        {dimensionsPresent.map((dim) => {
          const entries = version.entries.filter((e) => e.dimension === dim);
          return (
            <Box key={dim}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{dim.toLowerCase()}</Typography>
                <Chip label={`weight ${version.dimensionWeights[dim] ?? 0}`} size="small" variant="outlined" sx={{ fontSize: "0.65rem" }} />
              </Box>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: "text.secondary", fontSize: "0.72rem" }}>Eval</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "text.secondary", fontSize: "0.72rem", width: 80 }}>Threshold</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "text.secondary", fontSize: "0.72rem", width: 60 }}>Weight</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "text.secondary", fontSize: "0.72rem", width: 90 }}>In scoring?</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id} sx={{ "&:last-child td": { borderBottom: 0 } }}>
                      <TableCell sx={{ fontSize: "0.8rem" }}>{entry.evalName}</TableCell>
                      <TableCell sx={{ fontSize: "0.8rem", fontFamily: "monospace" }}>{entry.threshold}</TableCell>
                      <TableCell sx={{ fontSize: "0.8rem", fontFamily: "monospace" }}>{entry.weight}</TableCell>
                      <TableCell>
                        <Chip
                          label={entry.enabled ? "Yes" : "No"}
                          size="small"
                          variant="outlined"
                          color={entry.enabled ? "success" : "default"}
                          sx={{ height: 20, fontSize: "0.68rem" }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}
