import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import IconButton from "@mui/material/IconButton";
import Select from "@mui/material/Select";
import SvgIcon from "@mui/material/SvgIcon";
import type { View, Project, ProjectType } from "../types";
import { PROJECTS, getAdoptedProfile, useMockData } from "../data/mock";
import { agentVerdict, TRACES_NEEDED } from "../data/verdict";
import DataTable from "../components/DataTable";
import TintChip from "../components/TintChip";
import EmptyState from "../components/EmptyState";

interface Props {
  navigate: (v: View) => void;
  tenantId: string;
}

const AGENT_ICON = "M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3zm-2 10H6V7h12v12zm-9-6c-.83 0-1.5-.67-1.5-1.5S8.17 10 9 10s1.5.67 1.5 1.5S9.83 13 9 13zm6 0c-.83 0-1.5-.67-1.5-1.5S14.17 10 15 10s1.5.67 1.5 1.5S15.83 13 15 13zm-5 3h4v-2h-4v2z";
const ADD_ICON = "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z";
const SEARCH_ICON = "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z";
const REFRESH_ICON = "M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08a5.99 5.99 0 01-5.65 4c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L14 11h7V4l-3.35 2.35z";

const TYPE_LABEL: Record<ProjectType, string> = {
  ATA: "ATA",
  ATC: "ATC",
  CURA: "CURA",
  AI_WORKSPACE: "AI Workspace",
  CODING: "Coding",
  APT: "APT",
};

const VERDICT_LABEL: Record<"ship" | "review" | "block", string> = {
  ship: "Ship",
  review: "Needs work",
  block: "Don't ship",
};

const VERDICT_TINT: Record<"ship" | "review" | "block", "success" | "warning" | "destructive"> = {
  ship: "success",
  review: "warning",
  block: "destructive",
};

function relativeTime(ts: string | null): string {
  if (!ts) return "Never";
  const diffMs = Date.now() - new Date(ts).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function lastActiveTs(project: Project): string | null {
  const sessions = project.runs.flatMap((r) => r.sessions);
  if (sessions.length === 0) return null;
  return sessions.reduce((latest, s) => (s.ts > latest ? s.ts : latest), sessions[0].ts);
}

export default function AgentsView({ navigate, tenantId }: Props) {
  useMockData();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ProjectType | null>(null);
  const [verdictFilter, setVerdictFilter] = useState<"ship" | "review" | "block" | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [view, setView] = useState<"list" | "grouped">("list");
  const [typeMenuAnchor, setTypeMenuAnchor] = useState<HTMLElement | null>(null);
  const [verdictMenuAnchor, setVerdictMenuAnchor] = useState<HTMLElement | null>(null);

  const tenantProjects = useMemo(() => PROJECTS.filter((p) => p.tenantId === tenantId), [tenantId]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tenantProjects.filter((project) => {
      if (!showDeleted && project.lifecycleStatus === "deleted") return false;
      if (showDeleted && project.lifecycleStatus !== "deleted") return false;
      const matchesSearch = !term || project.name.toLowerCase().includes(term) || project.service.toLowerCase().includes(term);
      if (!matchesSearch) return false;
      if (typeFilter && project.type !== typeFilter) return false;
      if (verdictFilter) {
        const band = agentVerdict(project).band;
        if (band !== verdictFilter) return false;
      }
      return true;
    });
  }, [tenantProjects, search, showDeleted, typeFilter, verdictFilter]);

  const groups = useMemo(() => {
    if (view !== "grouped") return null;
    const map = new Map<ProjectType, Project[]>();
    for (const p of filtered) {
      if (!map.has(p.type)) map.set(p.type, []);
      map.get(p.type)!.push(p);
    }
    return map;
  }, [view, filtered]);

  const columns = [
    {
      id: "agent",
      header: "Agent",
      width: "30%",
      render: (p: Project) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>{p.name}</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.25 }}>
            <TintChip tint="muted" label="external" />
            <Typography variant="caption" sx={{ color: "text.disabled", fontFamily: "monospace" }}>{p.service}</Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: "traces",
      header: "Traces",
      width: "10%",
      align: "right" as const,
      sortValue: (p: Project) => p.runs.flatMap((r) => r.sessions).length,
      render: (p: Project) => p.runs.flatMap((r) => r.sessions).length,
    },
    {
      id: "lastActive",
      header: "Last active",
      width: "12%",
      sortValue: (p: Project) => lastActiveTs(p) ?? "",
      render: (p: Project) => <Typography variant="body2" sx={{ color: "text.secondary" }}>{relativeTime(lastActiveTs(p))}</Typography>,
    },
    {
      id: "stage",
      header: "Stage",
      width: "18%",
      render: (p: Project) => {
        const total = p.runs.flatMap((r) => r.sessions).length;
        return total >= TRACES_NEEDED
          ? <TintChip tint="success" label="Up to date" />
          : <TintChip tint="info" label={`Collecting traces — ${total} of ${TRACES_NEEDED}`} />;
      },
    },
    {
      id: "score",
      header: "Score",
      width: "12%",
      align: "right" as const,
      sortValue: (p: Project) => agentVerdict(p).score ?? -1,
      render: (p: Project) => {
        const verdict = agentVerdict(p);
        if (verdict.score == null || !verdict.band) {
          const total = p.runs.flatMap((r) => r.sessions).length;
          return <TintChip tint="outline" label={`${total}/${TRACES_NEEDED} traces`} />;
        }
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{verdict.score.toFixed(1)}</Typography>
            <TintChip tint={VERDICT_TINT[verdict.band]} label={VERDICT_LABEL[verdict.band]} />
          </Box>
        );
      },
    },
    {
      id: "profile",
      header: "Profile / Fit",
      width: "18%",
      render: (p: Project) => {
        const adopted = p.adoptedProfileId ? getAdoptedProfile(p.id) : undefined;
        if (!adopted) return <Typography variant="body2" sx={{ fontStyle: "italic", color: "text.disabled" }}>Pending assignment</Typography>;
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{adopted.profile.name}</Typography>
            <TintChip tint="muted" label={adopted.profile.origin === "auto" ? "auto" : "manual"} />
          </Box>
        );
      },
    },
  ];

  const emptyState = (
    <EmptyState icon={AGENT_ICON} title="No agents match" description="Try a different search or filter." />
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 2, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SvgIcon sx={{ color: "text.secondary" }}><path d={AGENT_ICON} /></SvgIcon>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>My Agents</Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Agents registered to this tenant, one ingest identity each.
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="outlined" onClick={() => navigate({ name: "demo-gallery" })}>Try a demo agent</Button>
          <Button variant="contained" startIcon={<SvgIcon><path d={ADD_ICON} /></SvgIcon>} onClick={() => navigate({ name: "add-agent" })}>
            New agent
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
        <TextField
          size="small"
          placeholder="Filter agents by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 320 }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SvgIcon sx={{ fontSize: 18 }}><path d={SEARCH_ICON} /></SvgIcon></InputAdornment> } }}
        />
        <Button
          size="small"
          variant="outlined"
          color={typeFilter ? "primary" : "inherit"}
          onClick={(e) => setTypeMenuAnchor(e.currentTarget)}
          sx={{ color: typeFilter ? undefined : "text.secondary" }}
        >
          Type{typeFilter ? `: ${TYPE_LABEL[typeFilter]}` : ""}
        </Button>
        <Menu anchorEl={typeMenuAnchor} open={Boolean(typeMenuAnchor)} onClose={() => setTypeMenuAnchor(null)}>
          <MenuItem onClick={() => { setTypeFilter(null); setTypeMenuAnchor(null); }}>All types</MenuItem>
          {(Object.keys(TYPE_LABEL) as ProjectType[]).map((t) => (
            <MenuItem key={t} selected={typeFilter === t} onClick={() => { setTypeFilter(t); setTypeMenuAnchor(null); }}>{TYPE_LABEL[t]}</MenuItem>
          ))}
        </Menu>
        <Button
          size="small"
          variant="outlined"
          color={verdictFilter ? "primary" : "inherit"}
          onClick={(e) => setVerdictMenuAnchor(e.currentTarget)}
          sx={{ color: verdictFilter ? undefined : "text.secondary" }}
        >
          Verdict{verdictFilter ? `: ${VERDICT_LABEL[verdictFilter]}` : ""}
        </Button>
        <Menu anchorEl={verdictMenuAnchor} open={Boolean(verdictMenuAnchor)} onClose={() => setVerdictMenuAnchor(null)}>
          <MenuItem onClick={() => { setVerdictFilter(null); setVerdictMenuAnchor(null); }}>All verdicts</MenuItem>
          {(["ship", "review", "block"] as const).map((b) => (
            <MenuItem key={b} selected={verdictFilter === b} onClick={() => { setVerdictFilter(b); setVerdictMenuAnchor(null); }}>{VERDICT_LABEL[b]}</MenuItem>
          ))}
        </Menu>
        <Button
          size="small"
          variant="outlined"
          color={showDeleted ? "primary" : "inherit"}
          onClick={() => setShowDeleted((v) => !v)}
          sx={{ color: showDeleted ? undefined : "text.secondary" }}
        >
          Show deleted
        </Button>

        <Box sx={{ flex: 1 }} />

        <Select size="small" value="30s" sx={{ fontSize: "0.8rem", height: 32 }}>
          <MenuItem value="30s">30s</MenuItem>
          <MenuItem value="1m">1m</MenuItem>
          <MenuItem value="off">Off</MenuItem>
        </Select>
        <IconButton size="small" title="Refresh">
          <SvgIcon fontSize="small"><path d={REFRESH_ICON} /></SvgIcon>
        </IconButton>
        <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, v) => v && setView(v)}>
          <ToggleButton value="list" sx={{ textTransform: "none", px: 1.5 }}>List</ToggleButton>
          <ToggleButton value="grouped" sx={{ textTransform: "none", px: 1.5 }}>Grouped</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1 }}>
        {filtered.length} agent{filtered.length !== 1 ? "s" : ""}
      </Typography>

      {view === "list" || !groups ? (
        <DataTable
          columns={columns}
          data={filtered}
          getRowId={(p) => p.id}
          onRowClick={(p) => navigate({ name: "agent", projectId: p.id })}
          emptyState={emptyState}
          enableSorting
        />
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {[...groups.entries()].map(([type, rows]) => (
            <Box key={type}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.disabled", textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 0.75 }}>
                {TYPE_LABEL[type]} · {rows.length}
              </Typography>
              <DataTable columns={columns} data={rows} getRowId={(p) => p.id} onRowClick={(p) => navigate({ name: "agent", projectId: p.id })} emptyState={emptyState} />
            </Box>
          ))}
          {filtered.length === 0 && emptyState}
        </Box>
      )}
    </Box>
  );
}

export type { ProjectType };
