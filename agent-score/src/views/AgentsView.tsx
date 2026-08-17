import { useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import ButtonBase from "@mui/material/ButtonBase";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import SvgIcon from "@mui/material/SvgIcon";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";
import Tag from "@tricentis/aura/components/Tag.js";
import type { View, Project, ProjectType } from "../types";
import { PROJECTS, getAdoptedProfile } from "../data/mock";
import { agentVerdict, criticalSafety, TRACES_NEEDED, type AgentVerdict } from "../data/verdict";
import ScoreMeter from "../components/ScoreMeter";

interface Props {
  navigate: (v: View) => void;
}

const TENANT = "tais";
const PAGE_SIZE = 10;

function AddIcon() {
  return <SvgIcon><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></SvgIcon>;
}
function SearchIcon() {
  return <SvgIcon sx={{ fontSize: 18 }}><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></SvgIcon>;
}
function FilterIcon() {
  return <SvgIcon sx={{ fontSize: 18 }}><path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" /></SvgIcon>;
}
function CloseIcon() {
  return <SvgIcon sx={{ fontSize: 16 }}><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></SvgIcon>;
}
function ChevronRightIcon() {
  return <SvgIcon sx={{ fontSize: 20, color: "text.disabled" }}><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" /></SvgIcon>;
}
function ChevronLeftIcon() {
  return <SvgIcon sx={{ fontSize: 18 }}><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></SvgIcon>;
}
function ChevronRightSmallIcon() {
  return <SvgIcon sx={{ fontSize: 18 }}><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" /></SvgIcon>;
}
function DescriptionIcon() {
  return <SvgIcon sx={{ fontSize: 18, color: "text.disabled" }}><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" /></SvgIcon>;
}
function ClockIcon({ color }: { color: string }) {
  return <SvgIcon sx={{ fontSize: 20, color }}><path d="M11.99 2C6.47 2 2 6.47 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zM12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z" /></SvgIcon>;
}
function ShieldWarningIcon({ color }: { color: string }) {
  return <SvgIcon sx={{ fontSize: 20, color }}><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 6h2v2h-2V7zm0 4h2v4h-2v-4z" /></SvgIcon>;
}

type FilterField = "type" | "reliability" | "phase" | "band" | "state";

const FILTER_FIELDS: { value: FilterField; label: string; options: { value: string; label: string }[] }[] = [
  {
    value: "type",
    label: "Type",
    options: [
      { value: "ATA", label: "ATA" },
      { value: "ATC", label: "ATC" },
      { value: "CURA", label: "CURA" },
      { value: "AI_WORKSPACE", label: "AI Workspace" },
      { value: "CODING", label: "Coding" },
      { value: "APT", label: "APT" },
    ],
  },
  {
    value: "reliability",
    label: "Reliability",
    options: [
      { value: "RELIABLE", label: "Reliable" },
      { value: "NEEDS_WORK", label: "Needs work" },
      { value: "UNSTABLE", label: "Unstable" },
    ],
  },
  {
    value: "phase",
    label: "Phase",
    options: [
      { value: "1", label: "Phase 1" },
      { value: "2", label: "Phase 2" },
    ],
  },
  {
    value: "band",
    label: "Verdict",
    options: [
      { value: "ship", label: "Ship" },
      { value: "review", label: "Review" },
      { value: "block", label: "Block" },
    ],
  },
  {
    value: "state",
    label: "Run state",
    options: [
      { value: "collecting", label: "Collecting traces" },
      { value: "scoring", label: "Scoring" },
      { value: "scored", label: "Scored" },
      { value: "error", label: "Run failed" },
    ],
  },
];

function fieldMeta(field: FilterField | "") {
  return FILTER_FIELDS.find((f) => f.value === field);
}

interface FilterRow {
  id: number;
  field: FilterField | "";
  value: string;
}

function matchesFilter(project: Project, verdict: AgentVerdict, row: FilterRow): boolean {
  switch (row.field) {
    case "type":
      return project.type === row.value;
    case "reliability":
      return project.reliability === row.value;
    case "phase":
      return String(project.phase) === row.value;
    case "band":
      return verdict.band === row.value;
    case "state":
      return verdict.state === row.value;
    default:
      return true;
  }
}

/** 1, 2, 3 … N-1, N style page list, collapsing runs of hidden pages into a single "…". */
function pageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const keep = new Set<number>([1, 2, total - 1, total, current - 1, current, current + 1]);
  const sorted = [...keep].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result: (number | "…")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push("…");
    result.push(p);
    prev = p;
  }
  return result;
}

function ScoreBadge({ verdict, critical }: { verdict: AgentVerdict; critical: boolean }) {
  if (critical) {
    return (
      <Box sx={{ width: 44, height: 44, borderRadius: "50%", border: "2px solid", borderColor: "error.main", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <ShieldWarningIcon color="var(--mui-palette-error-main, #f87171)" />
      </Box>
    );
  }
  if (verdict.state !== "scored") {
    return (
      <Box sx={{ width: 44, height: 44, borderRadius: "50%", border: "2px solid", borderColor: "text.disabled", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <ClockIcon color="var(--mui-palette-text-disabled, #6b7280)" />
      </Box>
    );
  }
  return <ScoreMeter score={verdict.score} size={44} />;
}

function rowAccentColor(verdict: AgentVerdict, critical: boolean): string {
  if (critical) return "error.main";
  if (verdict.state !== "scored") return "text.disabled";
  if (verdict.band === "ship") return "success.main";
  if (verdict.band === "review") return "warning.main";
  return "error.main";
}

function AgentRow({ project, navigate }: { project: Project; navigate: (v: View) => void }) {
  const verdict = agentVerdict(project);
  const critical = !!criticalSafety(project);
  const isScored = verdict.state === "scored";
  const totalSessions = project.runs.flatMap((r) => r.sessions).length;
  const adopted = project.adoptedProfileId ? getAdoptedProfile(project.id) : undefined;

  return (
    <ButtonBase
      onClick={() => navigate({ name: "agent-detail", projectId: project.id })}
      sx={{ display: "block", textAlign: "left", width: "100%" }}
    >
      <Paper
        variant="outlined"
        sx={{
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          gap: 2,
          py: 1.25,
          pl: 2.5,
          pr: 2,
          "&:hover": { bgcolor: "action.hover" },
          transition: "background-color 0.15s",
        }}
      >
        <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, bgcolor: rowAccentColor(verdict, critical) }} />

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {project.name}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.disabled", fontFamily: "monospace" }}>
            {project.service}
          </Typography>
        </Box>

        <Box sx={{ width: 90, flexShrink: 0 }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {TENANT}
          </Typography>
        </Box>

        <Box sx={{ width: 200, flexShrink: 0 }}>
          {adopted ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
              <DescriptionIcon />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {adopted.profile.name}
                </Typography>
                <Tag
                  label={adopted.profile.origin === "auto" ? "Auto" : "Manual"}
                  sx={{ height: 16, fontSize: "0.6rem", fontWeight: 700 }}
                />
              </Box>
            </Box>
          ) : (
            <Typography variant="body2" sx={{ fontStyle: "italic", color: "text.disabled" }}>
              Pending assignment
            </Typography>
          )}
        </Box>

        <Box sx={{ width: 130, flexShrink: 0, textAlign: "right" }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {isScored ? `${totalSessions} trace${totalSessions !== 1 ? "s" : ""}` : `${totalSessions}/${TRACES_NEEDED} traces`}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: isScored ? "normal" : "italic" }}>
            {isScored ? project.runs[0]?.date : "Pending traces"}
          </Typography>
        </Box>

        <ScoreBadge verdict={verdict} critical={critical} />
        <ChevronRightIcon />
      </Paper>
    </ButtonBase>
  );
}

export default function AgentsView({ navigate }: Props) {
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const nextRowId = useRef(1);
  const [draftFilters, setDraftFilters] = useState<FilterRow[]>([{ id: 0, field: "", value: "" }]);
  const [appliedFilters, setAppliedFilters] = useState<FilterRow[]>([]);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return PROJECTS.filter((project) => {
      const matchesSearch = !term || project.name.toLowerCase().includes(term) || project.service.toLowerCase().includes(term);
      if (!matchesSearch) return false;
      const verdict = agentVerdict(project);
      return appliedFilters.every((row) => matchesFilter(project, verdict, row));
    });
  }, [search, appliedFilters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  function addFilterRow() {
    nextRowId.current += 1;
    setDraftFilters((prev) => [...prev, { id: nextRowId.current, field: "", value: "" }]);
  }
  function removeFilterRow(id: number) {
    setDraftFilters((prev) => prev.filter((r) => r.id !== id));
  }
  function updateFilterRow(id: number, patch: Partial<FilterRow>) {
    setDraftFilters((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function applyFilters() {
    setAppliedFilters(draftFilters.filter((r) => r.field && r.value));
    setPage(1);
    setFilterOpen(false);
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            Agents
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {PROJECTS.length} agents · {PROJECTS.filter((p) => p.phase === 1).length} Phase 1 · {PROJECTS.filter((p) => p.phase === 2).length} Phase 2
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="outlined" onClick={() => navigate({ name: "demo-gallery" })}>
            Try a demo agent
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate({ name: "add-agent" })}>
            Add Agent
          </Button>
        </Box>
      </Box>

      <Paper variant="outlined" sx={{ mb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1 }}>
          <TextField
            size="small"
            placeholder="Search agents…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            sx={{ width: 400 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              },
            }}
          />
          <Divider orientation="vertical" flexItem />
          <Badge badgeContent={appliedFilters.length} color="primary" invisible={appliedFilters.length === 0}>
            <IconButton
              size="small"
              onClick={() => {
                setDraftFilters(appliedFilters.length ? appliedFilters : [{ id: 0, field: "", value: "" }]);
                setFilterOpen((o) => !o);
              }}
              sx={{ border: "1px solid", borderColor: filterOpen ? "primary.main" : "divider" }}
            >
              <FilterIcon />
            </IconButton>
          </Badge>
        </Box>

        {filterOpen && (
          <Box sx={{ px: 2, pb: 2, borderTop: "1px solid", borderColor: "divider", pt: 2 }}>
            {draftFilters.map((row) => {
              const meta = fieldMeta(row.field);
              return (
                <Box key={row.id} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                  <IconButton size="small" onClick={() => removeFilterRow(row.id)}>
                    <CloseIcon />
                  </IconButton>
                  <Select
                    size="small"
                    displayEmpty
                    value={row.field}
                    onChange={(e) => updateFilterRow(row.id, { field: e.target.value as FilterField, value: "" })}
                    sx={{ minWidth: 160 }}
                  >
                    <MenuItem value="">
                      <em style={{ fontStyle: "normal", color: "var(--mui-palette-text-disabled)" }}>Field</em>
                    </MenuItem>
                    {FILTER_FIELDS.map((f) => (
                      <MenuItem key={f.value} value={f.value}>
                        {f.label}
                      </MenuItem>
                    ))}
                  </Select>
                  <Select
                    size="small"
                    displayEmpty
                    value={row.value}
                    disabled={!row.field}
                    onChange={(e) => updateFilterRow(row.id, { value: e.target.value })}
                    sx={{ minWidth: 180 }}
                  >
                    <MenuItem value="">
                      <em style={{ fontStyle: "normal", color: "var(--mui-palette-text-disabled)" }}>Value</em>
                    </MenuItem>
                    {meta?.options.map((o) => (
                      <MenuItem key={o.value} value={o.value}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
              );
            })}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Button size="small" startIcon={<AddIcon />} onClick={addFilterRow}>
                Add filter
              </Button>
              <Button size="small" variant="contained" onClick={applyFilters}>
                Apply filter
              </Button>
            </Box>
          </Box>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ display: "flex", alignItems: "center", gap: 2, py: 1, pl: 2.5, pr: 2, mb: 1, bgcolor: "action.hover" }}>
        <Typography variant="caption" sx={{ flex: 1, color: "text.secondary", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Agent
        </Typography>
        <Typography variant="caption" sx={{ width: 90, flexShrink: 0, color: "text.secondary", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Tenant
        </Typography>
        <Typography variant="caption" sx={{ width: 200, flexShrink: 0, color: "text.secondary", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Profile
        </Typography>
        <Typography variant="caption" sx={{ width: 130, flexShrink: 0, textAlign: "right", color: "text.secondary", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Score
        </Typography>
        <Box sx={{ width: 20 }} />
      </Paper>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {pageItems.map((project) => (
          <AgentRow key={project.id} project={project} navigate={navigate} />
        ))}
        {pageItems.length === 0 && (
          <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              No agents match your search or filters.
            </Typography>
          </Paper>
        )}
      </Box>

      {filtered.length > 0 && (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 2 }}>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Rows per page: {startIdx + 1}-{Math.min(startIdx + PAGE_SIZE, filtered.length)} of {filtered.length}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <IconButton size="small" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
              <ChevronLeftIcon />
            </IconButton>
            {pageList(currentPage, totalPages).map((p, i) =>
              p === "…" ? (
                <Typography key={`ellipsis-${i}`} variant="body2" sx={{ color: "text.disabled", px: 0.5 }}>
                  …
                </Typography>
              ) : (
                <ButtonBase
                  key={p}
                  onClick={() => setPage(p)}
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: 1,
                    fontSize: "0.8rem",
                    fontWeight: p === currentPage ? 700 : 400,
                    color: p === currentPage ? "primary.main" : "text.secondary",
                    bgcolor: p === currentPage ? "action.selected" : "transparent",
                  }}
                >
                  {p}
                </ButtonBase>
              )
            )}
            <IconButton size="small" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>
              <ChevronRightSmallIcon />
            </IconButton>
          </Box>
        </Box>
      )}
    </Box>
  );
}

export type { ProjectType };
