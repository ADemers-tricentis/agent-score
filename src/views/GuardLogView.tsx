import { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import type { View, GuardDecision, GuardRule } from "../types";
import { GUARD_LOG, PROJECTS } from "../data/mock";

interface Props {
  navigate: (v: View) => void;
}

const DECISION_CONFIG: Record<GuardDecision, { color: "success" | "warning" | "error"; label: string }> = {
  allow: { color: "success", label: "allow" },
  warn: { color: "warning", label: "warn" },
  block: { color: "error", label: "block" },
};

const RULE_CONFIG: Record<string, { color: "primary" | "warning" | "error" }> = {
  R1: { color: "error" },
  R2: { color: "warning" },
  R3: { color: "warning" },
};

function fmtTs(ts: string): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function GuardLogView({ navigate: _navigate }: Props) {
  const [filterProj, setFilterProj] = useState<string>("all");
  const [filterDec, setFilterDec] = useState<string>("all");
  const [filterRule, setFilterRule] = useState<string>("all");

  const filtered = GUARD_LOG.filter((entry) => {
    if (filterProj !== "all" && entry.proj !== filterProj) return false;
    if (filterDec !== "all" && entry.dec !== filterDec) return false;
    if (filterRule !== "all") {
      if (filterRule === "none" && entry.rule !== null) return false;
      if (filterRule !== "none" && entry.rule !== filterRule) return false;
    }
    return true;
  });

  const counts = {
    allow: GUARD_LOG.filter((e) => e.dec === "allow").length,
    warn: GUARD_LOG.filter((e) => e.dec === "warn").length,
    block: GUARD_LOG.filter((e) => e.dec === "block").length,
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
        Guard Log
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
        POST /guard/pre-tool-use decisions across all sessions
      </Typography>

      {/* Summary chips */}
      <Box sx={{ display: "flex", gap: 1.5, mb: 3, flexWrap: "wrap" }}>
        <SummaryCard label="Total" value={GUARD_LOG.length} color="primary.main" />
        <SummaryCard label="Allow" value={counts.allow} color="success.main" />
        <SummaryCard label="Warn" value={counts.warn} color="warning.main" />
        <SummaryCard label="Block" value={counts.block} color="error.main" />
      </Box>

      {/* Filters */}
      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Project</InputLabel>
          <Select value={filterProj} label="Project" onChange={(e) => setFilterProj(e.target.value as string)}>
            <MenuItem value="all">All projects</MenuItem>
            {PROJECTS.map((p) => (
              <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Decision</InputLabel>
          <Select value={filterDec} label="Decision" onChange={(e) => setFilterDec(e.target.value as string)}>
            <MenuItem value="all">All decisions</MenuItem>
            <MenuItem value="allow">Allow</MenuItem>
            <MenuItem value="warn">Warn</MenuItem>
            <MenuItem value="block">Block</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Rule</InputLabel>
          <Select value={filterRule} label="Rule" onChange={(e) => setFilterRule(e.target.value as string)}>
            <MenuItem value="all">All rules</MenuItem>
            <MenuItem value="none">No rule</MenuItem>
            <MenuItem value="R1">R1 — Exact repeat</MenuItem>
            <MenuItem value="R2">R2 — Error repeat</MenuItem>
            <MenuItem value="R3">R3 — Inspect streak</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Paper sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Time</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Project</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Tool</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Fingerprint</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Rule</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Decision</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Reason</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((entry, i) => {
              const decCfg = DECISION_CONFIG[entry.dec];
              const project = PROJECTS.find((p) => p.id === entry.proj);
              return (
                <TableRow
                  key={i}
                  sx={{ "&:last-child td": { borderBottom: 0 } }}
                >
                  <TableCell>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                      {fmtTs(entry.ts)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {project?.name ?? entry.proj}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontFamily: "monospace", color: "primary.light", fontWeight: 600 }}>
                      {entry.tool}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontFamily: "monospace", color: "text.disabled" }}>
                      {entry.fingerprint}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {entry.rule ? (
                      <Chip
                        label={entry.rule}
                        color={RULE_CONFIG[entry.rule].color}
                        size="small"
                        sx={{ fontWeight: 700, fontSize: "0.68rem", height: 20 }}
                      />
                    ) : (
                      <Typography variant="caption" sx={{ color: "text.disabled" }}>—</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={decCfg.label}
                      color={decCfg.color}
                      size="small"
                      sx={{ fontWeight: 700, fontSize: "0.68rem", height: 20 }}
                    />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 280 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {entry.reason}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: "center", py: 3, borderBottom: 0 }}>
                  <Typography variant="body2" sx={{ color: "text.disabled" }}>
                    No entries match the current filters.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
          Rule Reference
        </Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          {[
            { rule: "R1", desc: "Exact-repeat block — same tool + argument fingerprint already executed this session. Hard block." },
            { rule: "R2", desc: "Error-repeat warn — same fingerprint returned an error previously. Allow through with warning." },
            { rule: "R3", desc: "Inspect-streak warn — trailing consecutive run of inspect-family calls without an action step." },
          ].map(({ rule, desc }) => (
            <Paper
              key={rule}
              sx={{ p: 1.5, flex: "1 1 280px", border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                <Chip label={rule} color={RULE_CONFIG[rule as GuardRule & string].color} size="small" sx={{ fontWeight: 700, fontSize: "0.68rem", height: 20 }} />
              </Box>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>{desc}</Typography>
            </Paper>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Paper sx={{ px: 2, py: 1, border: "1px solid", borderColor: "divider", borderRadius: 1.5, minWidth: 90 }}>
      <Typography variant="caption" sx={{ color: "text.disabled", display: "block", mb: 0.25 }}>
        {label}
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 700, color, lineHeight: 1 }}>
        {value}
      </Typography>
    </Paper>
  );
}
