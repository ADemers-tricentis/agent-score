/** TaskRoutingTab — task-type routing admin surface (LLM Catalog's fourth
 * tab, spec: LLM inference catalog PR 3 §3.1).
 *
 * One row per *assignable* task type — `guide_generation`, the only one the
 * routing cascade still resolves. `scoring_eval`, `profile_fit` and
 * `agent_card` are all retired (each reads a bound agent version's pinned
 * model identity instead), and `eval_preview`, `connectivity_probe`,
 * `catalog_verification`, `chat_assistant` and `improvement_advisor` never
 * routed through this cascade to begin with — none of the six appears here
 * (`routing-api.ts`'s `ASSIGNABLE_TASK_TYPES`).
 *
 * Every row always renders, configured or not: an unconfigured row shows
 * `resolvedInference` — the global default it currently inherits — behind an
 * "Inherited" chip, so an operator can never mistake "nothing set, falls to
 * default" for "explicitly configured". `inference`/`inherited` come
 * straight off the wire (spec: `resolved_from` on the resolved-inference
 * shape); this never recomputes the cascade client-side.
 *
 * Editable in place via one `Combobox` per row — reached only through
 * `LLMCatalogShell`, itself behind the page-level superadmin gate
 * (`LLMCatalogPage`), the same guarantee `PricingTab` relies on.
 */

import { useMemo, useState } from "react";
import { toast } from "@/shared/lib/toast";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import IconMaterialSymbolsAltRoute from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsAltRoute.mjs";
import IconMaterialSymbolsClose from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsClose.mjs";
import type { ColumnDef } from "@tanstack/react-table";

import { ASSIGNABLE_TASK_TYPES } from "@/back-office/llm-catalog/routing-api";
import {
  deleteTaskAssignmentFake,
  listTaskAssignmentsFake,
  selectableInferences,
  upsertTaskAssignmentFake,
  type FakeTaskAssignment,
} from "@/back-office/llm-catalog/usage-pricing-fixtures";
import { Chip } from "@/shared/components/chip";
import { Combobox, type ComboboxOption } from "@/shared/components/combobox";
import { DataTable } from "@/shared/components/data-table";

type TaskAssignmentOut = FakeTaskAssignment;

function resolvedLabel(ref: { name: string } | null | undefined): string {
  return ref ? ref.name : "No default set";
}

export function TaskRoutingTab() {
  // No backend: local state seeded from the fixture module.
  const [assignments, setAssignments] = useState<FakeTaskAssignment[]>(() => listTaskAssignmentsFake());
  const selectable = useMemo(() => selectableInferences(), []);

  const upsertMutate = (vars: { taskType: string; inferenceId: string }) => {
    upsertTaskAssignmentFake(vars.taskType, vars.inferenceId);
    setAssignments(listTaskAssignmentsFake());
    toast.success("Routing updated");
  };

  const clearMutate = (taskType: string) => {
    deleteTaskAssignmentFake(taskType);
    setAssignments(listTaskAssignmentsFake());
    toast.success("Routing cleared — now inherits the global default");
  };

  const byTaskType = useMemo(() => {
    const map = new Map<string, TaskAssignmentOut>();
    for (const row of assignments) map.set(row.taskType, row);
    return map;
  }, [assignments]);

  // Every assignable task type gets a row, configured or not — a task type
  // the list read hasn't returned yet (or a fresh Purpose member the backend
  // knows about but this closed set hasn't caught up to) still renders as
  // fully inherited rather than disappearing.
  const rows = useMemo<TaskAssignmentOut[]>(
    () =>
      ASSIGNABLE_TASK_TYPES.map(
        (t) =>
          byTaskType.get(t.value) ?? {
            taskType: t.value,
            inference: null,
            resolvedInference: null,
            inherited: true,
            createdAt: null,
            updatedAt: null,
          },
      ),
    [byTaskType],
  );

  const options = useMemo<ComboboxOption[]>(
    () =>
      selectable.map((inf) => ({
        value: inf.id,
        label: inf.name,
        description: `${inf.provider} · ${inf.modelId}`,
      })),
    [selectable],
  );

  const columns = useMemo<ColumnDef<TaskAssignmentOut, unknown>[]>(
    () => [
      {
        id: "taskType",
        header: "Task type",
        accessorFn: (r) => r.taskType,
        meta: { headerSx: { width: "20%" } },
        cell: ({ row }) => (
          <Box sx={{ fontWeight: 500 }}>
            {ASSIGNABLE_TASK_TYPES.find((t) => t.value === row.original.taskType)
              ?.label ?? row.original.taskType}
          </Box>
        ),
      },
      {
        id: "resolved",
        header: "Resolved inference",
        accessorFn: (r) => r.resolvedInference?.name,
        meta: { headerSx: { width: "26%" } },
        cell: ({ row }) => (
          <Box
            component="span"
            data-testid={`task-routing-resolved-${row.original.taskType}`}
            sx={{ fontFamily: "monospace", typography: "caption" }}
          >
            {resolvedLabel(row.original.resolvedInference)}
          </Box>
        ),
      },
      {
        id: "status",
        header: "Status",
        accessorFn: (r) => r.inherited,
        meta: { headerSx: { width: "18%" } },
        // Two distinct hooks rather than one hook with two texts: "inherited"
        // and "configured" is the distinction an operator misreads, so the
        // browser lane asserts it by presence, never by reading the chip's
        // wording.
        cell: ({ row }) =>
          row.original.inherited ? (
            <Chip
              tint="muted"
              data-testid={`task-routing-inherited-${row.original.taskType}`}
            >
              Inherited from global default
            </Chip>
          ) : (
            <Chip
              tint="info"
              data-testid={`task-routing-configured-${row.original.taskType}`}
            >
              Configured
            </Chip>
          ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const assignment = row.original;
          return (
            <Box
              onClick={(e) => e.stopPropagation()}
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <Combobox
                testId={`task-routing-select-${assignment.taskType}`}
                options={options}
                value={assignment.inference?.inferenceId}
                placeholder="Use global default"
                onChange={(inferenceId) => {
                  if (inferenceId) {
                    upsertMutate({
                      taskType: assignment.taskType,
                      inferenceId,
                    });
                  } else {
                    clearMutate(assignment.taskType);
                  }
                }}
              />
              {!assignment.inherited ? (
                <Tooltip title="Clear — inherit the global default">
                  <IconButton
                    size="small"
                    aria-label={`Clear routing for ${assignment.taskType}`}
                    data-testid={`task-routing-clear-${assignment.taskType}`}
                    onClick={() => clearMutate(assignment.taskType)}
                  >
                    <IconMaterialSymbolsClose sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              ) : null}
            </Box>
          );
        },
      },
    ],
    [options, upsertMutate, clearMutate],
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <DataTable
        columns={columns}
        data={rows}
        isLoading={false}
        error={null}
        getRowId={(r) => r.taskType}
        getRowTestId={(r) => `task-routing-row-${r.taskType}`}
        tableSx={{ tableLayout: "fixed" }}
        emptyState={{
          icon: IconMaterialSymbolsAltRoute,
          title: "No task types",
          description: "Task-type routing is unavailable.",
        }}
        enableSorting={false}
      />
    </Box>
  );
}
