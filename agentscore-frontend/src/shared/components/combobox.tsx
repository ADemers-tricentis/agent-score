import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Autocomplete, {
  type AutocompleteRenderInputParams,
} from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import InputBase from "@mui/material/InputBase";
import Popover from "@mui/material/Popover";
import IconMaterialSymbolsUnfoldMore from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsUnfoldMore.mjs";

import { FLOWING_POPPER_SX } from "@/shared/theme/popper-sx";

export interface ComboboxOption {
  value: string;
  label: ReactNode;
  /** Text used for fuzzy match in the search input. Defaults to stringified label. */
  searchText?: string;
  /** Supporting line under the label. */
  description?: ReactNode;
  /** Disable this option (still shown, not selectable). */
  disabled?: boolean;
}

const optionSearchText = (opt: ComboboxOption) =>
  opt.searchText ?? String(opt.label);

/** Shared option row: label + optional description sub-line. */
function OptionRow({ opt }: { opt: ComboboxOption }) {
  return (
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Box
        sx={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {opt.label}
      </Box>
      {opt.description ? (
        <Box
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            typography: "caption",
            color: "text.secondary",
          }}
        >
          {opt.description}
        </Box>
      ) : null}
    </Box>
  );
}

/** Embedded search input for the open popup (replaces cmdk `CommandInput`). */
function PopupSearchInput({
  placeholder,
  params,
}: {
  placeholder?: string;
  params: AutocompleteRenderInputParams;
}) {
  return (
    <Box
      sx={{
        borderBottom: 1,
        borderColor: "divider",
        px: 1.5,
        py: 1,
      }}
    >
      <InputBase
        autoFocus
        fullWidth
        placeholder={placeholder}
        ref={params.InputProps.ref}
        onMouseDown={params.InputProps.onMouseDown}
        inputProps={params.inputProps}
        sx={{ typography: "body1" }}
      />
    </Box>
  );
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  /** Trigger text when nothing is selected. */
  placeholder?: ReactNode;
  searchPlaceholder?: string;
  emptyLabel?: ReactNode;
  /** Allow deselecting by re-clicking the selected option. Default true. */
  clearable?: boolean;
  disabled?: boolean;
  /** Stable hook for e2e — lands as `data-testid` on the trigger. */
  testId?: string;
  className?: string;
  /** Accessible name for the trigger `Button`, overriding the value-derived
   *  one. The trigger's only accessible name is otherwise the current
   *  selection, which changes as the operator picks — a field whose label
   *  must stay stable (e.g. "Target tenant") needs this. */
  ariaLabel?: string;
  /** Raw `Autocomplete` input value on every input change, undebounced — a
   *  caller driving a server-side search debounces on its own end. Also
   *  fires with `""` on close (selecting an option or dismissing the
   *  popover without one), so a caller doesn't need to track dialog-level
   *  state just to keep a reopen from starting on a stale term. */
  onSearchChange?: (term: string) => void;
  /** Skip the built-in client-side substring filter. For a caller whose
   *  `options` are already the exact result set (e.g. a server search),
   *  filtering again against a term the server has already applied would
   *  filter against a stale term. */
  disableClientFilter?: boolean;
}

/**
 * Single-select combobox. Trigger renders the current selection (or
 * placeholder); the popover hosts a searchable, keyboard-navigable option list
 * (MUI `Autocomplete` rendered open inside a width-matched `Popover`).
 */
export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyLabel = "No results.",
  clearable = true,
  disabled,
  testId,
  className,
  ariaLabel,
  onSearchChange,
  disableClientFilter,
}: ComboboxProps) {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  // A caller whose `options` come from a server-side search (the simulation
  // tenant picker) can see its list go momentarily empty on every search-key
  // change, since a fresh key has no cached data yet. Left alone, that flips
  // `selected` to `undefined` on every keystroke's debounced refetch, and
  // MUI's `Autocomplete` resets its input on ANY reference change of its
  // `value` prop — even mid-type — which both wipes what the operator is
  // typing and, once the response lands, re-fires with the resolved option's
  // own label, sending the next search back to the item already selected.
  // Caching the last-resolved option per `value` keeps the `value` reference
  // (and, where the option's own fields are unchanged, its identity) stable
  // across a fetch that hasn't failed, only not yet returned.
  const lastResolvedRef = useRef<ComboboxOption | undefined>(undefined);
  const selected = useMemo(() => {
    const found = options.find((o) => o.value === value);
    const cached =
      lastResolvedRef.current?.value === value
        ? lastResolvedRef.current
        : undefined;
    if (!found) return cached;
    const unchanged =
      cached != null &&
      cached.label === found.label &&
      cached.description === found.description &&
      cached.disabled === found.disabled &&
      // `searchText` (not just `label`) feeds `getOptionLabel`, which is what
      // MUI reseeds the input from — a cache hit that ignored it could seed
      // a reset with a stale search string.
      cached.searchText === found.searchText;
    return unchanged ? cached : found;
  }, [options, value]);
  useEffect(() => {
    lastResolvedRef.current = selected;
  }, [selected]);

  // The popover unmounts its `Autocomplete` on close, so nothing else ever
  // observes a typed-but-unselected search term going away. Reset it here,
  // on every close, so a reopen never inherits a stale filter the visible
  // (empty) input would contradict. Owned here rather than left to
  // `Autocomplete`'s own blur-driven reset, so a caller's search state stays
  // correct regardless of a library default this component doesn't expose
  // as a prop.
  const closePopover = () => {
    setOpen(false);
    onSearchChange?.("");
  };

  return (
    <>
      <Button
        ref={anchorRef}
        type="button"
        variant="outlined"
        role="combobox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen(true)}
        data-slot="combobox-trigger"
        data-testid={testId}
        className={className}
        endIcon={
          <IconMaterialSymbolsUnfoldMore
            sx={{ fontSize: 14, color: "text.secondary" }}
          />
        }
        sx={{
          width: "100%",
          justifyContent: "space-between",
          fontWeight: 400,
          textTransform: "none",
          color: "text.primary",
        }}
      >
        <Box
          component="span"
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            textAlign: "left",
          }}
        >
          {selected ? selected.label : placeholder}
        </Box>
      </Button>
      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={closePopover}
        onKeyDownCapture={(event) => {
          if (event.key === "Escape") closePopover();
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: { width: anchorRef.current?.offsetWidth, p: 0, mt: 0.5 },
          },
        }}
      >
        <Autocomplete<ComboboxOption, false, false, false>
          open
          options={options}
          value={selected ?? null}
          disablePortal
          openOnFocus
          getOptionLabel={optionSearchText}
          getOptionDisabled={(opt) => Boolean(opt.disabled)}
          isOptionEqualToValue={(opt, val) => opt.value === val.value}
          filterOptions={
            disableClientFilter
              ? (opts) => opts
              : (opts, state) => {
                  const q = state.inputValue.trim().toLowerCase();
                  if (!q) return opts;
                  return opts.filter((o) =>
                    optionSearchText(o).toLowerCase().includes(q),
                  );
                }
          }
          onInputChange={
            onSearchChange ? (_event, term) => onSearchChange(term) : undefined
          }
          onChange={(_event, next) => {
            const nextValue =
              next === null
                ? undefined
                : clearable && next.value === value
                  ? undefined
                  : next.value;
            onChange(nextValue);
            closePopover();
          }}
          noOptionsText={emptyLabel}
          renderInput={(params) => (
            <PopupSearchInput placeholder={searchPlaceholder} params={params} />
          )}
          renderOption={(props, opt) => {
            const { key, ...liProps } = props;
            return (
              <Box
                component="li"
                key={key}
                {...liProps}
                data-checked={opt.value === value || undefined}
              >
                <OptionRow opt={opt} />
              </Box>
            );
          }}
          slotProps={{
            paper: { elevation: 0, sx: { boxShadow: "none" } },
            listbox: { sx: { maxHeight: 280 } },
            popper: { sx: FLOWING_POPPER_SX },
          }}
        />
      </Popover>
    </>
  );
}

interface MultiSelectProps {
  options: ComboboxOption[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: ReactNode;
  searchPlaceholder?: string;
  emptyLabel?: ReactNode;
  disabled?: boolean;
  /** Labels shown inline in the trigger before collapsing to "N selected". Default 2. */
  inlineLabels?: number;
  /**
   * When set, the trigger always renders this instead of the selected-summary
   * — use it as a static "Add…" affordance when the current selection is shown
   * elsewhere (e.g. a chip strip below the control).
   */
  triggerLabel?: ReactNode;
  /** Stable hook for e2e — lands as `data-testid` on the trigger. */
  testId?: string;
  className?: string;
}

/**
 * Multi-select combobox. Trigger shows up to `inlineLabels` selected labels
 * before collapsing to "N selected". Selection commits on each toggle (the
 * popup stays open across toggles).
 */
export function MultiSelect({
  options,
  values,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyLabel = "No results.",
  inlineLabels = 2,
  triggerLabel,
  disabled,
  testId,
  className,
}: MultiSelectProps) {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  const selectedOptions = useMemo(
    () =>
      values
        .map((v) => options.find((o) => o.value === v))
        .filter((o): o is ComboboxOption => Boolean(o)),
    [values, options],
  );

  const summary = useMemo<ReactNode>(() => {
    if (values.length === 0) return placeholder;
    if (values.length >= 4) return `${values.length} selected`;
    const labels = selectedOptions.map((o) => o.label);
    if (labels.length <= inlineLabels) {
      return labels.map((l, i) => (
        <span key={i}>
          {i > 0 ? ", " : ""}
          {l}
        </span>
      ));
    }
    const head = labels.slice(0, inlineLabels);
    const extra = labels.length - inlineLabels;
    return (
      <>
        {head.map((l, i) => (
          <span key={i}>
            {i > 0 ? ", " : ""}
            {l}
          </span>
        ))}
        <Box component="span" sx={{ color: "text.secondary" }}>
          {" "}
          +{extra}
        </Box>
      </>
    );
  }, [values, selectedOptions, inlineLabels, placeholder]);

  const toggle = (value: string) => {
    const next = new Set(values);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange(Array.from(next));
  };

  return (
    <>
      <Button
        ref={anchorRef}
        type="button"
        variant="outlined"
        role="combobox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen(true)}
        data-slot="multi-select-trigger"
        data-testid={testId}
        className={className}
        endIcon={
          <IconMaterialSymbolsUnfoldMore
            sx={{ fontSize: 14, color: "text.secondary" }}
          />
        }
        sx={{
          width: "100%",
          justifyContent: "space-between",
          fontWeight: 400,
          textTransform: "none",
          color: "text.primary",
        }}
      >
        <Box
          component="span"
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            textAlign: "left",
          }}
        >
          {triggerLabel ?? summary}
        </Box>
      </Button>
      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={() => setOpen(false)}
        onKeyDownCapture={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: { width: anchorRef.current?.offsetWidth, p: 0, mt: 0.5 },
          },
        }}
      >
        <Autocomplete<ComboboxOption, true, false, false>
          open
          multiple
          disableCloseOnSelect
          options={options}
          value={selectedOptions}
          disablePortal
          openOnFocus
          getOptionLabel={optionSearchText}
          getOptionDisabled={(opt) => Boolean(opt.disabled)}
          isOptionEqualToValue={(opt, val) => opt.value === val.value}
          filterOptions={(opts, state) => {
            const q = state.inputValue.trim().toLowerCase();
            if (!q) return opts;
            return opts.filter((o) =>
              optionSearchText(o).toLowerCase().includes(q),
            );
          }}
          onChange={(_event, _next, reason, details) => {
            if (
              (reason === "selectOption" || reason === "removeOption") &&
              details
            ) {
              toggle(details.option.value);
            }
          }}
          noOptionsText={emptyLabel}
          renderTags={() => null}
          renderInput={(params) => (
            <PopupSearchInput placeholder={searchPlaceholder} params={params} />
          )}
          renderOption={(props, opt, { selected }) => {
            const { key, ...liProps } = props;
            return (
              <Box
                component="li"
                key={key}
                {...liProps}
                data-checked={selected || undefined}
              >
                <OptionRow opt={opt} />
              </Box>
            );
          }}
          slotProps={{
            paper: { elevation: 0, sx: { boxShadow: "none" } },
            listbox: { sx: { maxHeight: 280 } },
            popper: { sx: FLOWING_POPPER_SX },
          }}
        />
      </Popover>
    </>
  );
}
