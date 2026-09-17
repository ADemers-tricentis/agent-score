/** PricingTab — the `model_prices` admin surface (LLM Catalog's third tab,
 * spec: LLM inference catalog PR 2).
 *
 * List (`DataTable`, no own scroll region — the shell owns the one both other
 * tabs already render into) + create/edit through one `PriceFormDialog` +
 * delete through a confirm dialog. Mirrors `InferencesList`'s DataTable +
 * Toolbar + row-action convention in `LLMCatalogPage.tsx`, except create and
 * edit are dialogs here rather than routed pages: a price row has five fields
 * and no sub-navigation of its own, so a dedicated route would be a page for
 * a form a dialog already does justice to.
 *
 * Reached only through `LLMCatalogShell`, which is itself behind the
 * page-level superadmin gate (`LLMCatalogPage`) — a member's `pricesListQueryOptions`
 * read never fires, the same guarantee `UsageLogTab` relies on.
 *
 * `manuallyOverridden` renders as a Chip, never folded into any other column —
 * it is the flag that stops a re-seed from clobbering an admin's edit, so an
 * operator scanning the table needs to see it at a glance.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/shared/lib/toast";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import FormLabel from "@mui/material/FormLabel";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import IconMaterialSymbolsAdd from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsAdd.mjs";
import IconMaterialSymbolsDelete from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsDelete.mjs";
import IconMaterialSymbolsEdit from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsEdit.mjs";
import IconMaterialSymbolsPayments from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsPayments.mjs";
import IconMaterialSymbolsSave from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSave.mjs";
import IconMaterialSymbolsSearch from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSearch.mjs";
import type { ColumnDef } from "@tanstack/react-table";

import {
  buildPriceCreateBody,
  buildPriceUpdateBody,
  draftFromPrice,
  emptyPriceDraft,
  hasPriceErrors,
  validatePriceDraft,
  type ModelPriceOut,
  type PriceFormDraft,
} from "@/back-office/llm-catalog/pricing-schema";
import {
  createPriceFake,
  deletePriceFake,
  listPricesFake,
  updatePriceFake,
} from "@/back-office/llm-catalog/usage-pricing-fixtures";
import { PROVIDER_LABEL, PROVIDERS } from "@/back-office/llm-catalog/schema";
import { Chip } from "@/shared/components/chip";
import { DataTable } from "@/shared/components/data-table";
import {
  FacetedFilter,
  type FacetedFilterOption,
} from "@/shared/components/faceted-filter";
import { Toolbar } from "@/shared/components/toolbar";

/** Compact per-million-USD rate. `null`/`undefined` → "not priced", never a
 * dash or a `$0.00` — the whole reason the cache columns are nullable is that
 * "no rate on file" and "priced at zero" are different facts. */
function formatRate(rate: string | null | undefined): string {
  if (rate == null) return "not priced";
  const n = Number(rate);
  if (!Number.isFinite(n)) return rate;
  return `$${n.toFixed(4)}`;
}

interface PriceFormFieldsProps {
  draft: PriceFormDraft;
  onChange: (patch: Partial<PriceFormDraft>) => void;
  errors: ReturnType<typeof validatePriceDraft>;
  disabled?: boolean;
}

function PriceFormFields({ draft, onChange, errors, disabled }: PriceFormFieldsProps) {
  return (
    <Stack sx={{ gap: 2, pt: 1 }}>
      <Stack sx={{ gap: 0.75 }}>
        <FormLabel htmlFor="price-form-provider">Provider</FormLabel>
        <TextField
          select
          value={draft.provider}
          disabled={disabled}
          onChange={(e) =>
            onChange({ provider: e.target.value as PriceFormDraft["provider"] })
          }
          fullWidth
          size="small"
          slotProps={{
            htmlInput: { id: "price-form-provider", "data-testid": "price-form-provider" },
          }}
        >
          {PROVIDERS.map((p) => (
            <MenuItem key={p.value} value={p.value}>
              {p.label}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <Stack sx={{ gap: 0.75 }}>
        <FormLabel htmlFor="price-form-model">Model id</FormLabel>
        <TextField
          autoComplete="off"
          placeholder="e.g. claude-sonnet-4-5"
          value={draft.modelId}
          disabled={disabled}
          error={Boolean(errors.modelId)}
          helperText={errors.modelId}
          onChange={(e) => onChange({ modelId: e.target.value })}
          fullWidth
          size="small"
          slotProps={{
            htmlInput: { id: "price-form-model", "data-testid": "price-form-model" },
          }}
        />
      </Stack>

      <Stack sx={{ gap: 0.75 }}>
        <FormLabel htmlFor="price-form-effective-from">Effective from</FormLabel>
        <TextField
          type="date"
          value={draft.effectiveFrom}
          disabled={disabled}
          error={Boolean(errors.effectiveFrom)}
          helperText={errors.effectiveFrom}
          onChange={(e) => onChange({ effectiveFrom: e.target.value })}
          fullWidth
          size="small"
          slotProps={{
            htmlInput: {
              id: "price-form-effective-from",
              "data-testid": "price-form-effective-from",
            },
          }}
        />
      </Stack>

      <Box sx={{ display: "flex", gap: 2 }}>
        <Stack sx={{ gap: 0.75, flex: 1 }}>
          <FormLabel htmlFor="price-form-input-rate">Input $/M tokens</FormLabel>
          <TextField
            type="text"
            placeholder="3.00"
            value={draft.inputPricePerMillionUsd}
            disabled={disabled}
            error={Boolean(errors.inputPricePerMillionUsd)}
            helperText={errors.inputPricePerMillionUsd}
            onChange={(e) => onChange({ inputPricePerMillionUsd: e.target.value })}
            fullWidth
            size="small"
            slotProps={{
              htmlInput: {
                id: "price-form-input-rate",
                "data-testid": "price-form-input-rate",
                inputMode: "decimal",
              },
            }}
          />
        </Stack>
        <Stack sx={{ gap: 0.75, flex: 1 }}>
          <FormLabel htmlFor="price-form-output-rate">Output $/M tokens</FormLabel>
          <TextField
            type="text"
            placeholder="15.00"
            value={draft.outputPricePerMillionUsd}
            disabled={disabled}
            error={Boolean(errors.outputPricePerMillionUsd)}
            helperText={errors.outputPricePerMillionUsd}
            onChange={(e) => onChange({ outputPricePerMillionUsd: e.target.value })}
            fullWidth
            size="small"
            slotProps={{
              htmlInput: {
                id: "price-form-output-rate",
                "data-testid": "price-form-output-rate",
                inputMode: "decimal",
              },
            }}
          />
        </Stack>
      </Box>

      <Box sx={{ display: "flex", gap: 2 }}>
        <Stack sx={{ gap: 0.75, flex: 1 }}>
          <FormLabel htmlFor="price-form-cache-read-rate">
            Cache read $/M tokens
          </FormLabel>
          <TextField
            type="text"
            placeholder="Leave blank if not priced"
            value={draft.cacheReadPricePerMillionUsd}
            disabled={disabled}
            error={Boolean(errors.cacheReadPricePerMillionUsd)}
            helperText={errors.cacheReadPricePerMillionUsd}
            onChange={(e) =>
              onChange({ cacheReadPricePerMillionUsd: e.target.value })
            }
            fullWidth
            size="small"
            slotProps={{
              htmlInput: {
                id: "price-form-cache-read-rate",
                "data-testid": "price-form-cache-read-rate",
                inputMode: "decimal",
              },
            }}
          />
        </Stack>
        <Stack sx={{ gap: 0.75, flex: 1 }}>
          <FormLabel htmlFor="price-form-cache-write-rate">
            Cache write $/M tokens
          </FormLabel>
          <TextField
            type="text"
            placeholder="Leave blank if not priced"
            value={draft.cacheWritePricePerMillionUsd}
            disabled={disabled}
            error={Boolean(errors.cacheWritePricePerMillionUsd)}
            helperText={errors.cacheWritePricePerMillionUsd}
            onChange={(e) =>
              onChange({ cacheWritePricePerMillionUsd: e.target.value })
            }
            fullWidth
            size="small"
            slotProps={{
              htmlInput: {
                id: "price-form-cache-write-rate",
                "data-testid": "price-form-cache-write-rate",
                inputMode: "decimal",
              },
            }}
          />
        </Stack>
      </Box>
    </Stack>
  );
}

interface PriceFormDialogProps {
  open: boolean;
  mode: "create" | "edit";
  initialDraft: PriceFormDraft;
  onClose: () => void;
  onSubmit: (draft: PriceFormDraft) => void;
  isPending: boolean;
}

function PriceFormDialog({
  open,
  mode,
  initialDraft,
  onClose,
  onSubmit,
  isPending,
}: PriceFormDialogProps) {
  const [draft, setDraft] = useState<PriceFormDraft>(initialDraft);

  // Re-seed the local draft every time the dialog opens — for the create
  // dialog that's always a blank draft, for the edit dialog it's whichever
  // row's Edit button was clicked. `initialDraft` is a fresh object on every
  // parent render, so the effect below deliberately reads it off a ref rather
  // than depending on it directly: depending on the identity itself would
  // also fire while the dialog is OPEN and the operator is mid-edit,
  // discarding their unsaved keystrokes. The ref write happens on every
  // render (cheap, and refs are exempt from exhaustive-deps), so the effect
  // — keyed on `open` alone — always reads the latest `initialDraft` at the
  // moment it opens.
  const initialDraftRef = useRef(initialDraft);
  initialDraftRef.current = initialDraft;
  useEffect(() => {
    if (open) setDraft(initialDraftRef.current);
  }, [open]);

  const errors = validatePriceDraft(draft);
  const disabled = hasPriceErrors(errors) || isPending;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <IconMaterialSymbolsPayments sx={{ fontSize: 16, color: "text.secondary" }} />
        {mode === "create" ? "Add price" : "Edit price"}
      </DialogTitle>
      <DialogContent>
        <PriceFormFields
          draft={draft}
          onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
          errors={errors}
          disabled={isPending}
        />
      </DialogContent>
      <DialogActions>
        <Button
          variant="outlined"
          data-testid="cancel-price"
          onClick={onClose}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          data-testid={mode === "create" ? "create-price-submit" : "edit-price-submit"}
          disabled={disabled}
          onClick={() => onSubmit(draft)}
          startIcon={<IconMaterialSymbolsSave sx={{ fontSize: 16 }} />}
        >
          {mode === "create" ? "Add price" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** Derived from `PROVIDERS`, not hand-listed: a provider added to the wire and
 *  not here would be unfilterable while still appearing in the table. */
const PROVIDER_OPTIONS: FacetedFilterOption[] = PROVIDERS.map(({ value, label }) => ({
  value,
  label,
}));


export function PricingTab() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ModelPriceOut | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ModelPriceOut | null>(null);
  // Filter state is local, not a URL search param: the price table is a
  // superadmin working surface with nothing to deep-link INTO — unlike the
  // usage log, whose filtered view is handed to a per-call detail page and
  // back. Local state keeps this tab's `?tab=pricing` link clean.
  const [search, setSearch] = useState("");
  const [providerValues, setProviderValues] = useState<string[]>([]);

  // No backend: local state seeded from the fixture module, mutated in place.
  const [allPrices, setAllPrices] = useState<ModelPriceOut[]>(() => listPricesFake());
  const [isPending, setIsPending] = useState(false);

  const create = {
    mutate: (draft: PriceFormDraft) => {
      setIsPending(true);
      setTimeout(() => {
        createPriceFake(buildPriceCreateBody(draft) as Partial<ModelPriceOut>);
        setAllPrices(listPricesFake());
        toast.success("Price added");
        setIsPending(false);
        setCreateOpen(false);
      }, 300);
    },
    isPending,
  };

  const update = {
    mutate: (vars: { id: string; draft: PriceFormDraft }) => {
      setIsPending(true);
      setTimeout(() => {
        updatePriceFake(vars.id, buildPriceUpdateBody(vars.draft) as Partial<ModelPriceOut>);
        setAllPrices(listPricesFake());
        toast.success("Price updated");
        setIsPending(false);
        setEditTarget(null);
      }, 300);
    },
    isPending,
  };

  const remove = {
    mutate: (priceId: string) => {
      deletePriceFake(priceId);
      setAllPrices(listPricesFake());
      toast.success("Price deleted");
    },
  };

  // Client-side, deliberately: the whole table is one unpaginated response of
  // well under a thousand rows, so a round trip per keystroke would buy
  // nothing. `GET /admin/llm-prices` stays filter-free.
  const prices = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const providers = new Set(providerValues);
    return allPrices
      .filter((price) => {
        if (providers.size > 0 && !providers.has(price.provider)) return false;
        if (!needle) return true;
        return price.modelId.toLowerCase().includes(needle);
      })
      .slice()
      // Newest rate first. A model's rows are effective-dated, and the one an
      // operator is looking for is nearly always the one that just changed —
      // sorting by model id buried it wherever the alphabet put it. Ties break
      // on model id so the order is total, never dependent on the server's.
      .sort(
        (a, b) =>
          b.effectiveFrom.localeCompare(a.effectiveFrom) ||
          a.modelId.localeCompare(b.modelId),
      );
  }, [allPrices, search, providerValues]);

  const columns = useMemo<ColumnDef<ModelPriceOut, unknown>[]>(
    () => [
      {
        id: "provider",
        header: "Provider",
        accessorFn: (p) => p.provider,
        meta: { headerSx: { width: "11%" } },
        cell: ({ row }) => PROVIDER_LABEL[row.original.provider] ?? row.original.provider,
      },
      {
        id: "model",
        header: "Model",
        accessorFn: (p) => p.modelId,
        meta: { headerSx: { width: "22%" } },
        cell: ({ row }) => (
          <Box
            component="span"
            sx={{ fontFamily: "monospace", typography: "caption" }}
          >
            {row.original.modelId}
          </Box>
        ),
      },
      {
        id: "effectiveFrom",
        header: "Effective from",
        accessorFn: (p) => p.effectiveFrom,
        meta: { headerSx: { width: "12%" } },
      },
      {
        id: "input",
        header: "Input $/M",
        accessorFn: (p) => p.inputPricePerMillionUsd,
        meta: { headerSx: { width: "11%" } },
        cell: ({ row }) => formatRate(row.original.inputPricePerMillionUsd),
      },
      {
        id: "output",
        header: "Output $/M",
        accessorFn: (p) => p.outputPricePerMillionUsd,
        meta: { headerSx: { width: "11%" } },
        cell: ({ row }) => formatRate(row.original.outputPricePerMillionUsd),
      },
      {
        id: "cacheRead",
        header: "Cache read $/M",
        accessorFn: (p) => p.cacheReadPricePerMillionUsd,
        meta: { headerSx: { width: "10%" } },
        cell: ({ row }) => formatRate(row.original.cacheReadPricePerMillionUsd),
      },
      {
        id: "cacheWrite",
        header: "Cache write $/M",
        accessorFn: (p) => p.cacheWritePricePerMillionUsd,
        meta: { headerSx: { width: "10%" } },
        cell: ({ row }) => formatRate(row.original.cacheWritePricePerMillionUsd),
      },
      {
        id: "overridden",
        header: "Overridden",
        accessorFn: (p) => p.manuallyOverridden,
        meta: { headerSx: { width: "7%" } },
        cell: ({ row }) =>
          row.original.manuallyOverridden ? (
            <Chip tint="info">Manual</Chip>
          ) : (
            <Box component="span" sx={{ color: "text.secondary" }}>
              —
            </Box>
          ),
      },
      {
        id: "actions",
        header: "",
        // Sized, like every other column here. The eight declared widths used
        // to sum to 100% WITHOUT this one, so the fixed layout had nowhere to
        // put it and the table overflowed into a horizontal scrollbar with the
        // row actions half cut off — the same defect the catalog list carried.
        meta: { headerSx: { width: "6%" } },
        cell: ({ row }) => (
          <Box
            onClick={(e) => e.stopPropagation()}
            sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}
          >
            <IconButton
              size="small"
              aria-label={`Edit price for ${row.original.modelId}`}
              data-testid="price-edit"
              onClick={() => setEditTarget(row.original)}
            >
              <IconMaterialSymbolsEdit sx={{ fontSize: 16 }} />
            </IconButton>
            <IconButton
              size="small"
              aria-label={`Delete price for ${row.original.modelId}`}
              data-testid="price-delete"
              onClick={() => setDeleteTarget(row.original)}
            >
              <IconMaterialSymbolsDelete sx={{ fontSize: 16, color: "error.main" }} />
            </IconButton>
          </Box>
        ),
      },
    ],
    [],
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Toolbar
        search={
          <TextField
            size="small"
            fullWidth
            placeholder="Filter by model id…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              htmlInput: {
                "aria-label": "Search prices by model id",
                "data-testid": "search-prices",
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
          <FacetedFilter
            title="Provider"
            testId="filter-price-provider"
            options={PROVIDER_OPTIONS}
            values={providerValues}
            onChange={setProviderValues}
          />
        }
        actions={
          <Button
            variant="contained"
            size="small"
            data-testid="new-price-button"
            onClick={() => setCreateOpen(true)}
            startIcon={<IconMaterialSymbolsAdd sx={{ fontSize: 16 }} />}
          >
            New price
          </Button>
        }
        right={
          allPrices.length > 0 ? (
            <Box component="span" data-testid="price-count">
              {prices.length === allPrices.length
                ? `${allPrices.length} price${allPrices.length === 1 ? "" : "s"}`
                : `${prices.length} of ${allPrices.length} prices`}
            </Box>
          ) : undefined
        }
      />

      <DataTable
        columns={columns}
        data={prices}
        isLoading={false}
        error={null}
        getRowId={(p) => p.id}
        getRowTestId={(p) => `price-row-${p.id}`}
        tableSx={{ tableLayout: "fixed" }}
        emptyState={{
          icon: IconMaterialSymbolsPayments,
          title: "No prices found",
          description:
            "Enter a price for a model so its calls can be costed — cache tokens included.",
        }}
        enableSorting={false}
      />

      <PriceFormDialog
        open={createOpen}
        mode="create"
        initialDraft={emptyPriceDraft()}
        onClose={() => setCreateOpen(false)}
        onSubmit={(draft) => create.mutate(draft)}
        isPending={create.isPending}
      />

      <PriceFormDialog
        open={editTarget !== null}
        mode="edit"
        initialDraft={editTarget ? draftFromPrice(editTarget) : emptyPriceDraft()}
        onClose={() => setEditTarget(null)}
        onSubmit={(draft) => {
          if (editTarget) update.mutate({ id: editTarget.id, draft });
        }}
        isPending={update.isPending}
      />

      <Dialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconMaterialSymbolsDelete sx={{ fontSize: 16, color: "text.secondary" }} />
          Delete this price row?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Deletes the price row for {deleteTarget?.provider} ·{" "}
            {deleteTarget?.modelId} effective {deleteTarget?.effectiveFrom}.
            Historical spend already recorded under this rate is unaffected —
            the ledger stores each call&apos;s cost at the time it was priced.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            data-testid="price-delete-cancel"
            onClick={() => setDeleteTarget(null)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            data-testid="price-delete-confirm"
            onClick={() => {
              if (deleteTarget) {
                remove.mutate(deleteTarget.id);
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
