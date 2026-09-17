import type { SxProps, Theme } from "@mui/material/styles";

/**
 * Force an open `disablePortal` MUI `Autocomplete` popper into normal flow.
 *
 * When an always-open Autocomplete is nested in a `Popover` (our searchable
 * combobox / faceted-filter / model-picker pattern), Popper.js positions the
 * popper via an INLINE `position:absolute` + `transform`, pulling the listbox
 * out of flow — the wrapping Popover Paper then collapses to the search-input
 * height and clips the option list.
 *
 * Apply this on the popper itself via `slotProps={{ popper: { sx: ... } }}` (the
 * popper renders *outside* `.MuiAutocomplete-root`, so an Autocomplete-level
 * descendant selector never reaches it). `!important` is required to beat the
 * inline style; the `as` casts only carry the `!important` suffix past
 * csstype's literal union — the runtime values are valid CSS.
 */
export const FLOWING_POPPER_SX: SxProps<Theme> = {
  position: "static !important" as "static",
  transform: "none !important" as "none",
  width: "100% !important" as "100%",
};
