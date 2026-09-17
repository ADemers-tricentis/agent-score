import { useMemo, useState, type HTMLAttributes } from "react";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { alpha } from "@mui/material/styles";
import IconMaterialSymbolsKeyboardArrowDown from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsKeyboardArrowDown.mjs";
import IconMaterialSymbolsSpeed from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSpeed.mjs";

import { getFixture, type ScoringEventOut } from "@/back-office/agents/scoring/profile-fixtures";
import { DataTablePagination } from "@/shared/components/data-table";
import { EmptyState } from "@/shared/components/empty-state";

const SCORING_EVENTS_PAGE_LIMIT = 10;

const SCORING_EVENT_TYPE_OPTIONS = [
  "run_started",
  "run_partial",
  "run_completed",
  "window_rescored",
  "profile_auto_refit",
];

function eventLabel(type: string): string {
  const labels: Record<string, string> = {
    run_partial: "Scoring run partially completed",
    run_started: "Scoring run started",
    run_completed: "Scoring run completed",
    window_rescored: "Recent interactions re-scored",
    profile_auto_refit: "Profile re-evaluated automatically",
  };
  const words = type.replaceAll("_", " ");
  return labels[type] ?? words.charAt(0).toUpperCase() + words.slice(1);
}

export function ActivityTab({
  tenantId: _tenantId,
  agentId,
}: {
  tenantId: string;
  agentId: string;
}) {
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [actorFilter, setActorFilter] = useState("");
  const [pageIndex, setPageIndex] = useState(0);

  const allEvents = useMemo(() => getFixture(agentId).activity, [agentId]);

  const filtered = useMemo(
    () =>
      allEvents.filter((ev) => {
        if (typeFilter && ev.eventType !== typeFilter) return false;
        if (actorFilter && !(ev.actorEmail ?? "").toLowerCase().includes(actorFilter.toLowerCase())) return false;
        return true;
      }),
    [allEvents, typeFilter, actorFilter],
  );

  const total = filtered.length;
  const events = filtered.slice(pageIndex * SCORING_EVENTS_PAGE_LIMIT, (pageIndex + 1) * SCORING_EVENTS_PAGE_LIMIT);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <TextField
          select
          id="activity-event-type"
          label="Event type"
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPageIndex(0);
          }}
          size="small"
          sx={{ minWidth: 200 }}
          slotProps={{
            select: {
              SelectDisplayProps: {
                "data-testid": "activity-type-filter",
              } as HTMLAttributes<HTMLDivElement>,
            },
          }}
        >
          <MenuItem value="" data-testid="activity-type-option-all">
            All types
          </MenuItem>
          {SCORING_EVENT_TYPE_OPTIONS.map((t) => (
            <MenuItem key={t} value={t} data-testid={`activity-type-option-${t}`}>
              {eventLabel(t)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          id="activity-actor-filter"
          label="Actor (email or user ID)"
          value={actorFilter}
          onChange={(e) => {
            setActorFilter(e.target.value);
            setPageIndex(0);
          }}
          size="small"
          placeholder="user@example.com"
          sx={{ minWidth: 240 }}
          slotProps={{
            htmlInput: { "data-testid": "activity-actor-filter" },
          }}
        />
      </Box>

      {events.length === 0 ? (
        <EmptyState
          icon={IconMaterialSymbolsSpeed}
          title={typeFilter || actorFilter ? "No matching activity" : "No activity yet"}
          description={typeFilter || actorFilter ? "Try another event type or actor." : "Scoring runs and profile changes will appear here."}
        />
      ) : (
        <>
          <Box
            sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}
            data-testid="activity-list"
          >
            {events.map((ev) => (
              <ActivityRow key={ev.id} event={ev} />
            ))}
          </Box>
          <DataTablePagination
            pagination={{
              mode: "offset",
              pageIndex,
              pageSize: SCORING_EVENTS_PAGE_LIMIT,
              total,
              onPageChange: setPageIndex,
            }}
            rowsRendered={events.length}
          />
        </>
      )}
    </Box>
  );
}

function ActivityRow({ event }: { event: ScoringEventOut }) {
  const [open, setOpen] = useState(false);
  const referenceData = event.referenceData ?? {};
  const hasReference = Object.keys(referenceData).length > 0;

  return (
    <Box
      sx={(theme) => ({
        borderRadius: 1,
        border: 1,
        borderColor: alpha(theme.palette.divider, 0.6),
        px: 2,
        py: 1.5,
      })}
      data-testid={`activity-row-${event.id}`}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
        <Box component="span" sx={{ typography: "body2", fontWeight: 600 }}>
          {eventLabel(event.eventType)}
        </Box>
        <Box
          component="span"
          sx={{ typography: "caption", color: "text.secondary" }}
        >
          {event.actorEmail ?? "System"}
        </Box>
        <Box
          component="span"
          sx={{ typography: "caption", color: "text.secondary", ml: "auto" }}
        >
          {new Date(event.createdAt).toLocaleString()}
        </Box>
        {hasReference ? (
          <IconButton
            size="small"
            aria-label={`Toggle details for ${eventLabel(event.eventType)}`}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            data-testid={`activity-expand-${event.id}`}
          >
            <IconMaterialSymbolsKeyboardArrowDown
              fontSize="small"
              sx={{
                transform: open ? "rotate(180deg)" : "none",
                transition: "transform 150ms",
              }}
            />
          </IconButton>
        ) : null}
      </Box>
      {hasReference ? (
        <Collapse in={open} unmountOnExit>
          <Box
            component="pre"
            sx={{
              mt: 1,
              p: 1,
              borderRadius: 1,
              bgcolor: "action.hover",
              typography: "caption",
              fontFamily: "monospace",
              overflowX: "auto",
            }}
          >
            {JSON.stringify(referenceData, null, 2)}
          </Box>
        </Collapse>
      ) : null}
    </Box>
  );
}
