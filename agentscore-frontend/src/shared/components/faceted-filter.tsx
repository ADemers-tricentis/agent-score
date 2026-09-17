import { useMemo, useRef, useState, type ReactNode } from "react";
import Autocomplete, {
  type AutocompleteRenderInputParams,
} from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import InputBase from "@mui/material/InputBase";
import Popover from "@mui/material/Popover";
import type SvgIcon from "@mui/material/SvgIcon";

import { FLOWING_POPPER_SX } from "@/shared/theme/popper-sx";

export interface FacetedFilterOption {
  value: string;
  label: ReactNode;
  /** Count badge shown next to the option (e.g. matching-rows count). */
  count?: number;
  /** Text used for fuzzy match. Defaults to stringified label. */
  searchText?: string;
}

const optionSearchText = (opt: FacetedFilterOption) =>
  opt.searchText ?? String(opt.label);

interface FacetedFilterProps {
  /** Filter title (e.g. "Tenant"). */
  title: ReactNode;
  /** Optional leading icon. */
  icon?: typeof SvgIcon;
  options: FacetedFilterOption[];
  values: string[];
  /** Called with the new selection. Commits on Apply when `draft` is true. */
  onChange: (values: string[]) => void;
  /** Labels shown inline before collapsing to "N selected". Default 2. */
  inlineLabels?: number;
  /** Hold edits in a draft until Apply / Clear / dismiss. Default true. */
  draft?: boolean;
  searchPlaceholder?: string;
  /** Stable hook for e2e — lands as `data-testid` on the trigger. */
  testId?: string;
  className?: string;
}

/**
 * Dashed-border filter chip + popover with searchable checkbox list. Matches
 * the data-table faceted-filter pattern. Selections are held as a draft until
 * "Apply"; closing the popover discards the draft.
 */
export function FacetedFilter({
  title,
  icon: Icon,
  options,
  values,
  onChange,
  inlineLabels = 2,
  draft = true,
  searchPlaceholder = "Search…",
  testId,
  className,
}: FacetedFilterProps) {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [draftValues, setDraftValues] = useState<string[]>(values);

  const live = draft && open ? draftValues : values;
  const selectedCount = live.length;

  const selectedOptions = useMemo(
    () =>
      live
        .map((v) => options.find((o) => o.value === v))
        .filter((o): o is FacetedFilterOption => Boolean(o)),
    [live, options],
  );

  const summary = useMemo<ReactNode | null>(() => {
    if (selectedCount === 0) return null;
    if (selectedCount >= 4) return `${selectedCount} selected`;
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
  }, [selectedOptions, selectedCount, inlineLabels]);

  const toggle = (value: string) => {
    const next = new Set(live);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    if (draft) setDraftValues(Array.from(next));
    else onChange(Array.from(next));
  };

  const apply = () => {
    onChange(draftValues);
    setOpen(false);
  };
  const clear = () => {
    if (draft) setDraftValues([]);
    else onChange([]);
  };

  return (
    <>
      <Button
        ref={anchorRef}
        type="button"
        variant="outlined"
        size="small"
        onClick={() => {
          setDraftValues(values);
          setOpen(true);
        }}
        data-slot="faceted-filter-trigger"
        data-testid={testId}
        data-selected={selectedCount > 0 || undefined}
        className={className}
        startIcon={Icon ? <Icon /> : undefined}
        sx={{
          height: 32,
          borderStyle: "solid",
          fontWeight: 400,
          textTransform: "none",
          color: selectedCount > 0 ? "text.primary" : "text.secondary",
          "&:hover": { color: "text.primary" },
          // Size the start icon here, not on the icon's own sx: MUI's
          // `.MuiButton-iconSizeSmall` rule overrides an icon-level fontSize.
          "& .MuiButton-startIcon > svg": { fontSize: 14 },
        }}
      >
        <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
          <span>{title}</span>
          {summary ? (
            <>
              <Box component="span" sx={{ color: "text.disabled" }}>
                ·
              </Box>
              <Box component="span" sx={{ color: "text.primary" }}>
                {summary}
              </Box>
            </>
          ) : null}
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
        slotProps={{ paper: { sx: { width: 256, p: 0, mt: 0.5 } } }}
      >
        <Autocomplete<FacetedFilterOption, true, false, false>
          open
          multiple
          disableCloseOnSelect
          options={options}
          value={selectedOptions}
          disablePortal
          openOnFocus
          getOptionLabel={optionSearchText}
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
          noOptionsText="No results."
          renderTags={() => null}
          renderInput={(params: AutocompleteRenderInputParams) => (
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
                placeholder={searchPlaceholder}
                ref={params.InputProps.ref}
                onMouseDown={params.InputProps.onMouseDown}
                inputProps={{
                  ...params.inputProps,
                  "aria-label": typeof title === "string" ? `Search ${title}` : "Search filter options",
                  "data-testid": testId ? `${testId}-search` : undefined,
                }}
                sx={{ typography: "body1" }}
              />
            </Box>
          )}
          renderOption={(props, opt, { selected }) => {
            const { key, ...liProps } = props;
            return (
              <Box
                component="li"
                key={key}
                {...liProps}
                data-checked={selected || undefined}
                data-testid={testId ? `${testId}-option-${opt.value}` : undefined}
              >
                <Checkbox
                  checked={selected}
                  tabIndex={-1}
                  size="small"
                  disableRipple
                  sx={{ p: 0, mr: 1, flexShrink: 0 }}
                />
                <Box
                  component="span"
                  sx={{
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {opt.label}
                </Box>
                {opt.count !== undefined ? (
                  <Box
                    component="span"
                    sx={{
                      fontFamily: "monospace",
                      typography: "caption",
                      color: "text.secondary",
                    }}
                  >
                    {opt.count}
                  </Box>
                ) : null}
              </Box>
            );
          }}
          slotProps={{
            paper: { elevation: 0, sx: { boxShadow: "none" } },
            listbox: { sx: { maxHeight: 280 } },
            popper: { sx: FLOWING_POPPER_SX },
          }}
        />
        {draft ? (
          <>
            <Divider />
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 1,
                py: 0.75,
              }}
            >
              <Button
                type="button"
                variant="text"
                size="small"
                onClick={clear}
                data-testid={testId ? `${testId}-clear` : undefined}
                disabled={selectedCount === 0}
                sx={{ textTransform: "none" }}
              >
                Clear{selectedCount > 0 ? ` (${selectedCount})` : ""}
              </Button>
              <Button
                type="button"
                variant="contained"
                size="small"
                onClick={apply}
                data-testid={testId ? `${testId}-apply` : undefined}
                sx={{ textTransform: "none" }}
              >
                Apply
              </Button>
            </Box>
          </>
        ) : null}
      </Popover>
    </>
  );
}
