/** LLM Catalog page — the global LLM inference catalog plus the LLM usage
 * audit log (build-plan S10).
 *
 * `LLMCatalogPage` is the superadmin guard-and-return; `<AccessDenied />`
 * returns before the shell ever mounts, so a member's queries — catalog,
 * usage, pricing, or routing — never fire. `LLMCatalogShell` owns the
 * persistent header (title + "New inference"), the four-tab strip
 * (`?tab=catalog|usage|pricing|routing`, `tab-params.ts`), and the single
 * `ScrollRegion` all four tabs render into (mirrors `ScoringPipelinePage`'s
 * persistent-header-above-tabs shape). Catalog is `InferencesList`
 * (unchanged DataTable + Toolbar + row-action Menu convention, mirrors
 * Users/Tenants); Usage log is `UsageLogTab` (`UsageLogTab.tsx`); Pricing is
 * `PricingTab` (`PricingTab.tsx`) — the `model_prices` admin surface;
 * Routing is `TaskRoutingTab` (`TaskRoutingTab.tsx`) — the per-task-type
 * inference routing admin surface (LLM inference catalog PR 3).
 *
 * 409 `inference_is_default` / `inference_in_use` on delete surface the
 * envelope message via the api module's `detail()` extractor.
 */

import { useMemo, useRef, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { toast } from "@/shared/lib/toast";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import IconMaterialSymbolsAdd from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsAdd.mjs";
import IconMaterialSymbolsBalance from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsBalance.mjs";
import IconMaterialSymbolsDelete from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsDelete.mjs";
import IconMaterialSymbolsEdit from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsEdit.mjs";
import IconMaterialSymbolsKey from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsKey.mjs";
import IconMaterialSymbolsMoreVert from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsMoreVert.mjs";
import IconMaterialSymbolsReplay from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsReplay.mjs";
import IconMaterialSymbolsSearch from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSearch.mjs";
import IconMaterialSymbolsStar from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsStar.mjs";
import type { ColumnDef } from "@tanstack/react-table";

import {
  deleteInference,
  listInferences,
  restoreInference,
  setDefaultInference,
  type LLMInferenceOut,
} from "@/back-office/llm-catalog/inference-fixtures";
import { PricingTab } from "@/back-office/llm-catalog/PricingTab";
import { PROVIDER_LABEL } from "@/back-office/llm-catalog/schema";
import type { LLMCatalogTab } from "@/back-office/llm-catalog/tab-params";
import { TaskRoutingTab } from "@/back-office/llm-catalog/TaskRoutingTab";
import { UsageLogTab } from "@/back-office/llm-catalog/UsageLogTab";
import { Chip } from "@/shared/components/chip";
import { DataTable } from "@/shared/components/data-table";
import { PageBand } from "@/shared/components/page-band";
import { pageContentPaddingSx } from "@/shared/components/page-content";
import { PageHeader } from "@/shared/components/page-header";
import { ScrollRegion } from "@/shared/components/scroll-region";
import { Toolbar } from "@/shared/components/toolbar";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";

interface RowActionsMenuProps {
  inference: LLMInferenceOut;
  onEdit: () => void;
  onSetDefault: () => void;
  onRestore: () => void;
  onDelete: () => void;
}

function RowActionsMenu({
  inference,
  onEdit,
  onSetDefault,
  onRestore,
  onDelete,
}: RowActionsMenuProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const isDeleted = inference.deletedAt != null;

  return (
    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
      <IconButton
        ref={triggerRef}
        size="small"
        aria-label={`Actions for ${inference.name}`}
        onClick={() => setOpen(true)}
      >
        <IconMaterialSymbolsMoreVert sx={{ fontSize: 18 }} />
      </IconButton>
      <Menu
        anchorEl={triggerRef.current}
        open={open}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          data-testid="row-action-edit"
          onClick={() => {
            close();
            onEdit();
          }}
        >
          <ListItemIcon>
            <IconMaterialSymbolsEdit sx={{ fontSize: 18 }} />
          </ListItemIcon>
          Edit
        </MenuItem>
        {!isDeleted ? (
          <MenuItem
            data-testid="row-action-set-default"
            disabled={inference.isDefault}
            data-disabled={inference.isDefault || undefined}
            onClick={() => {
              close();
              onSetDefault();
            }}
          >
            <ListItemIcon>
              <IconMaterialSymbolsStar sx={{ fontSize: 18 }} />
            </ListItemIcon>
            Set as default
          </MenuItem>
        ) : null}
        <Divider />
        {isDeleted ? (
          <MenuItem
            data-testid="row-action-restore"
            onClick={() => {
              close();
              onRestore();
            }}
          >
            <ListItemIcon>
              <IconMaterialSymbolsReplay sx={{ fontSize: 18 }} />
            </ListItemIcon>
            Restore
          </MenuItem>
        ) : (
          <MenuItem
            data-testid="row-action-delete"
            onClick={() => {
              close();
              onDelete();
            }}
            sx={{ color: "error.main" }}
          >
            <ListItemIcon>
              <IconMaterialSymbolsDelete sx={{ fontSize: 18, color: "error.main" }} />
            </ListItemIcon>
            Delete
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}

export function LLMCatalogPage() {
  return <LLMCatalogShell />;
}

function LLMCatalogShell() {
  // validateSearch (tab-params.ts) guarantees a valid tab; strict:false is
  // loosely typed here (mirrors IngestionPage/ScoringPipelinePage), and lets
  // the ten pre-existing tests that mount `<LLMCatalogPage />` at the generic
  // "/" harness route keep passing unchanged — an absent `?tab=` just defaults.
  const search = useSearch({ strict: false }) as { tab?: LLMCatalogTab };
  const tab = search.tab ?? "catalog";
  const navigate = useNavigate();

  return (
    <Box sx={{ display: "flex", minHeight: 0, flex: 1, flexDirection: "column" }}>
      <PageBand sx={{ pt: 4, pb: 2.5 }}>
        <PageHeader
          title="LLM Catalog"
          description="Named, reusable LLM inferences used to score benchmarks. Global catalog managed by superadmins."
          actions={
            <Button
              variant="contained"
              onClick={() => void navigate({ to: "/llm-catalog/new" })}
              data-testid="new-inference-button"
              startIcon={<IconMaterialSymbolsAdd sx={{ fontSize: 16 }} />}
            >
              New inference
            </Button>
          }
        />
      </PageBand>

      <PageBand sx={{ py: 0 }}>
        <Tabs
          value={tab}
          onChange={(_e, v) =>
            void navigate({
              to: "/llm-catalog",
              search: { tab: v as LLMCatalogTab },
            })
          }
        >
          <Tab
            label="Catalog"
            value="catalog"
            data-tab="catalog"
            data-testid="llm-catalog-tab-catalog"
          />
          <Tab
            label="Usage log"
            value="usage"
            data-tab="usage"
            data-testid="llm-catalog-tab-usage"
          />
          <Tab
            label="Pricing"
            value="pricing"
            data-tab="pricing"
            data-testid="llm-catalog-tab-pricing"
          />
          <Tab
            label="Routing"
            value="routing"
            data-tab="routing"
            data-testid="llm-catalog-tab-routing"
          />
        </Tabs>
      </PageBand>

      {/* The shell owns the one ScrollRegion every tab renders into — a tab
       *  body must never nest a second scroll container. */}
      <ScrollRegion>
        <Box sx={{ ...pageContentPaddingSx, pt: 3 }}>
          {tab === "catalog" ? <InferencesList /> : null}
          {tab === "usage" ? <UsageLogTab /> : null}
          {tab === "pricing" ? <PricingTab /> : null}
          {tab === "routing" ? <TaskRoutingTab /> : null}
        </Box>
      </ScrollRegion>
    </Box>
  );
}

function InferencesList() {
  const [search, setSearch] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LLMInferenceOut | null>(null);
  const [, forceRerender] = useState(0);
  const bump = () => forceRerender((n) => n + 1);

  const navigate = useNavigate();

  const debouncedSearch = useDebouncedValue(search);

  const setDefault = {
    mutate: (inferenceId: string) => {
      const inference = setDefaultInference(inferenceId);
      toast.success(`"${inference.name}" is now the default inference`);
      bump();
    },
  };

  const softDelete = {
    mutate: (inferenceId: string) => {
      try {
        deleteInference(inferenceId);
        toast.success("Inference deleted");
        bump();
      } catch (err) {
        toast.error((err as Error).message);
      }
    },
  };

  const restore = {
    mutate: (inferenceId: string) => {
      restoreInference(inferenceId);
      toast.success("Inference restored");
      bump();
    },
  };

  const inferences = listInferences({ includeDeleted, q: debouncedSearch || undefined });

  const columns = useMemo<ColumnDef<LLMInferenceOut, unknown>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        accessorFn: (j) => j.name,
        meta: { headerSx: { width: "40%" } },
        cell: ({ row }) => (
          <Box sx={{ display: "flex", minWidth: 0, flexDirection: "column" }}>
            <Box sx={{ display: "flex", minWidth: 0, alignItems: "center", gap: 0.75 }}>
              <Box
                component="span"
                sx={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontWeight: 500,
                }}
              >
                {row.original.name}
              </Box>
              {/* Beside the name rather than in a column of its own: exactly
               *  one row in the whole catalog is the default, so a dedicated
               *  column spent width on a dash in every other row and pushed
               *  the table into a horizontal scrollbar. `flexShrink: 0` keeps
               *  the badge intact while the name truncates. */}
              {row.original.isDefault ? (
                <Chip
                  tint="info"
                  icon={IconMaterialSymbolsStar}
                  data-testid="inference-default-badge"
                  sx={{ flexShrink: 0 }}
                >
                  Default
                </Chip>
              ) : null}
            </Box>
            {row.original.description ? (
              <Box
                component="span"
                sx={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  typography: "caption",
                  color: "text.secondary",
                }}
              >
                {row.original.description}
              </Box>
            ) : null}
          </Box>
        ),
      },
      {
        id: "provider",
        header: "Provider",
        accessorFn: (j) => j.provider,
        meta: { headerSx: { width: "13%" } },
        cell: ({ row }) => (
          <Box component="span">
            {PROVIDER_LABEL[row.original.provider] ?? row.original.provider}
          </Box>
        ),
      },
      {
        id: "model",
        header: "Model",
        accessorFn: (j) => j.modelId,
        meta: { headerSx: { width: "32%" } },
        cell: ({ row }) => (
          <Box
            component="span"
            sx={{
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontFamily: "monospace",
              typography: "caption",
            }}
          >
            {row.original.modelId}
          </Box>
        ),
      },
      {
        id: "updated",
        header: "Updated",
        accessorFn: (j) => j.updatedAt,
        meta: { headerSx: { width: "10%" } },
        cell: ({ row }) =>
          new Date(row.original.updatedAt).toLocaleDateString(),
      },
      {
        id: "actions",
        header: "",
        // Sized, not left to grow. The six declared widths now sum to 100%
        // WITH this one included — they used to sum to 100% without it, so the
        // fixed layout had nowhere to put the actions column and the table
        // overflowed into a horizontal scrollbar on every viewport.
        meta: { headerSx: { width: "5%" } },
        cell: ({ row }) => {
          const inference = row.original;
          return (
            <Box onClick={(e) => e.stopPropagation()}>
              <RowActionsMenu
                inference={inference}
                onEdit={() =>
                  void navigate({ to: `/llm-catalog/${inference.id}` })
                }
                onSetDefault={() => setDefault.mutate(inference.id)}
                onRestore={() => restore.mutate(inference.id)}
                onDelete={() => setDeleteTarget(inference)}
              />
            </Box>
          );
        },
      },
    ],
    [navigate, restore, setDefault],
  );

  // No own header/ScrollRegion — `LLMCatalogShell` (LLMCatalogPage.tsx above)
  // owns the persistent header, the "New inference" action, and the single
  // scroll container both tabs render into. This is the Catalog tab's body only.
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box>
        <Toolbar
          search={
            <TextField
              size="small"
              fullWidth
              placeholder="Filter inferences by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{
                htmlInput: {
                  "aria-label": "Search inferences",
                  "data-testid": "search-inferences",
                },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconMaterialSymbolsSearch
                        sx={{ fontSize: 16, color: "text.secondary" }}
                      />
                    </InputAdornment>
                  ),
                },
              }}
            />
          }
          filters={
            <Button
              type="button"
              variant="outlined"
              size="small"
              data-testid="toggle-deleted"
              data-active={includeDeleted || undefined}
              onClick={() => setIncludeDeleted((v) => !v)}
              sx={{
                borderStyle: "solid",
                fontWeight: 400,
                color: "text.secondary",
                "&:hover": { color: "text.primary" },
                "&[data-active]": {
                  borderColor: "text.primary",
                  bgcolor: "action.hover",
                  color: "text.primary",
                },
              }}
            >
              Show deleted
            </Button>
          }
          right={
            inferences.length > 0 ? (
              <Box component="span">
                {inferences.length} inference{inferences.length === 1 ? "" : "s"}
              </Box>
            ) : undefined
          }
        />
      </Box>

      <DataTable
        columns={columns}
        data={inferences}
        isLoading={false}
        error={null}
        getRowId={(j) => j.id}
        getRowTestId={(j) => `inference-row-${j.id}`}
        onRowClick={(j) => void navigate({ to: `/llm-catalog/${j.id}` })}
        tableSx={{ tableLayout: "fixed" }}
        emptyState={{
          icon: IconMaterialSymbolsBalance,
          title: "No inferences found",
          description:
            debouncedSearch || includeDeleted
              ? "Try a different search term, or clear the filters."
              : "Create an inference to start scoring benchmarks.",
        }}
        enableSorting={false}
      />

      <Dialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconMaterialSymbolsKey sx={{ fontSize: 16, color: "text.secondary" }} />
          Delete {deleteTarget?.name}?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Soft-deletes the inference and frees its name for reuse. The default
            inference or one referenced by a benchmark/metric can't be deleted —
            reassign or set another default first. Restorable while soft-deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            data-testid="delete-cancel"
            onClick={() => setDeleteTarget(null)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            data-testid="delete-confirm"
            onClick={() => {
              if (deleteTarget) {
                softDelete.mutate(deleteTarget.id);
                setDeleteTarget(null);
              }
            }}
            startIcon={<IconMaterialSymbolsDelete sx={{ fontSize: 16 }} />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
