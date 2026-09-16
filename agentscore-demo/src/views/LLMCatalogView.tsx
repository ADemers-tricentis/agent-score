import { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import AuraTabPanel from "@tricentis/aura/components/TabPanel.js";
import ChipStatus from "@tricentis/aura/components/ChipStatus.js";
import ChipSubtle from "@tricentis/aura/components/ChipSubtle.js";
import { LLM_JUDGES, LLM_USAGE_LOG, LLM_PRICING, LLM_ROUTING } from "../data/mock";

const PROVIDER_COLOR: Record<string, "default" | "primary" | "secondary"> = {
  Anthropic: "primary",
  "AWS Bedrock": "secondary",
  "OpenAI-compatible": "default",
};

const JUDGE_NAME_BY_ID: Record<string, string> = Object.fromEntries(
  LLM_JUDGES.map((judge) => [judge.id, judge.name]),
);

const TAB_LABELS = ["Catalog", "Usage log", "Pricing", "Routing"] as const;

function formatUsd(value: number, digits = 2): string {
  return `$${value.toFixed(digits)}`;
}

function formatTs(ts: string): string {
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LLMCatalogView() {
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ p: 3, maxWidth: 1000 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
          LLM Catalog
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 640 }}>
          A back-office view of every model AgentScore calls on your behalf - the registered judges,
          what they've been used for, what they cost, and which task slot each one is routed to.
        </Typography>
      </Box>

      <Paper sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
        <Tabs
          value={tab}
          onChange={(_, v: number) => setTab(v)}
          sx={{ borderBottom: "1px solid", borderColor: "divider", bgcolor: "action.hover" }}
        >
          {TAB_LABELS.map((label) => (
            <Tab key={label} label={label} sx={{ fontSize: "0.8rem" }} />
          ))}
        </Tabs>

        <AuraTabPanel value={tab} index={0} sx={{ p: 0 }}>
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
        </AuraTabPanel>

        <AuraTabPanel value={tab} index={1} sx={{ p: 0 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "action.hover" }}>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Timestamp</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Judge</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Task</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary" }} align="right">Tokens</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary" }} align="right">Cost</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {LLM_USAGE_LOG.map((entry) => (
                <TableRow key={entry.id} sx={{ "&:last-child td": { borderBottom: 0 } }}>
                  <TableCell>
                    <Typography variant="caption" sx={{ color: "text.disabled" }}>
                      {formatTs(entry.ts)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {JUDGE_NAME_BY_ID[entry.judgeId] ?? entry.judgeId}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {entry.task}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                      {entry.tokens.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                      {formatUsd(entry.costUsd)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AuraTabPanel>

        <AuraTabPanel value={tab} index={2} sx={{ p: 0 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "action.hover" }}>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Model</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary" }} align="right">Input / 1M</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary" }} align="right">Output / 1M</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary" }} align="right">Cache read / 1M</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary" }} align="right">Cache write / 1M</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Effective</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {LLM_PRICING.map((row) => (
                <TableRow key={row.id} sx={{ "&:last-child td": { borderBottom: 0 } }}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {JUDGE_NAME_BY_ID[row.judgeId] ?? row.judgeId}
                    </Typography>
                    <Typography variant="caption" sx={{ fontFamily: "monospace", color: "text.secondary", display: "block" }}>
                      {row.model}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                      {formatUsd(row.inputPer1M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                      {formatUsd(row.outputPer1M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                      {formatUsd(row.cacheReadPer1M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                      {formatUsd(row.cacheWritePer1M)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ color: "text.disabled" }}>
                      {row.effectiveDate}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AuraTabPanel>

        <AuraTabPanel value={tab} index={3} sx={{ p: 0 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "action.hover" }}>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Task slot</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Assigned judge</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {LLM_ROUTING.map((route) => (
                <TableRow key={route.id} sx={{ "&:last-child td": { borderBottom: 0 } }}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {route.taskSlot}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <ChipSubtle
                      label={JUDGE_NAME_BY_ID[route.judgeId] ?? route.judgeId}
                      sx={{ fontSize: "0.7rem", fontWeight: 600 }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AuraTabPanel>
      </Paper>
    </Box>
  );
}
