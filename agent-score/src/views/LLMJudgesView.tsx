import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import ChipStatus from "@tricentis/aura/components/ChipStatus.js";
import ChipSubtle from "@tricentis/aura/components/ChipSubtle.js";
import Tag from "@tricentis/aura/components/Tag.js";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import type { View } from "../types";
import { LLM_JUDGES } from "../data/mock";

interface Props {
  navigate: (v: View) => void;
}

const PROVIDER_COLOR: Record<string, "default" | "primary" | "secondary"> = {
  Anthropic: "primary",
  "AWS Bedrock": "secondary",
  "OpenAI-compatible": "default",
};

export default function LLMJudgesView({ navigate }: Props) {
  return (
    <Box sx={{ p: 3, maxWidth: 900 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            LLM Judges
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 560 }}>
            Named LLM judges registered in the global catalog. Each judge is backed by a specific
            provider and model. AgentScore dispatches correctness, quality, security, and attribution
            judges in parallel per session — 3 calls on PASS, 4 on non-PASS.
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => navigate({ name: "add-judge" })}
          sx={{ flexShrink: 0, ml: 2 }}
        >
          Add judge
        </Button>
      </Box>

      <Paper sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "action.hover" }}>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Provider</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Model</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Added</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {LLM_JUDGES.map((judge) => (
              <TableRow key={judge.id} sx={{ "&:last-child td": { borderBottom: 0 } }}>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {judge.name}
                  </Typography>
                  {judge.description && (
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                      {judge.description}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <ChipSubtle
                    label={judge.provider}
                    color={PROVIDER_COLOR[judge.provider]}
                    sx={{ fontSize: "0.7rem", fontWeight: 600 }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="caption" sx={{ fontFamily: "monospace", color: "text.secondary" }}>
                    {judge.model}
                  </Typography>
                </TableCell>
                <TableCell>
                  <ChipStatus status={judge.status === "live" ? "Active" : "Failed"} />
                </TableCell>
                <TableCell>
                  <Typography variant="caption" sx={{ color: "text.disabled" }}>
                    {judge.createdAt}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Divider sx={{ my: 3 }} />

      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
          Judge dispatch model
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1.5 }}>
          Three judges run in parallel via <code>Promise.all</code> on every session. Attribution runs
          conditionally on non-PASS sessions only.
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1.5 }}>
          {[
            { label: "Correctness", desc: "Correctness score", always: true },
            { label: "Quality", desc: "Relevance score", always: true },
            { label: "Security", desc: "Safety verdict override layer", always: true },
            { label: "Attribution", desc: "Root cause on non-PASS sessions", always: false },
          ].map(({ label, desc, always }) => (
            <Paper
              key={label}
              sx={{
                p: 1.5,
                border: "1px solid",
                borderColor: always ? "divider" : "warning.dark",
                borderRadius: 1.5,
                bgcolor: always ? "transparent" : "rgba(var(--mui-palette-warning-mainChannel) / 0.08)",
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700, display: "block", mb: 0.25 }}>
                {label}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                {desc}
              </Typography>
              <Tag
                label={always ? "Always" : "Conditional"}
                sx={{
                  mt: 0.75,
                  height: 16,
                  fontSize: "0.58rem",
                  fontWeight: 700,
                  ...(always ? {} : { bgcolor: "warning.main", "& .MuiChip-label": { color: "white" } }),
                }}
              />
            </Paper>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
