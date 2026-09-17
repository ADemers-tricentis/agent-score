import { useRef, useState, type ReactNode } from "react";
import dayjs, { type Dayjs } from "dayjs";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Popover from "@mui/material/Popover";
import { DateRangeCalendar } from "@mui/x-date-pickers-pro/DateRangeCalendar";
import type { DateRange as PickerDateRange } from "@mui/x-date-pickers-pro/models";
import IconMaterialSymbolsCalendarToday from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsCalendarToday.mjs";
import IconMaterialSymbolsCheck from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsCheck.mjs";
import IconMaterialSymbolsKeyboardArrowDown from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsKeyboardArrowDown.mjs";

import { focusRing } from "@/shared/theme/focus-ring";
import {
  TIME_RANGE_PRESETS,
  type TimeRangeValue,
} from "@/shared/components/time-range";

interface TimeRangePickerProps {
  value: TimeRangeValue;
  onChange: (value: TimeRangeValue) => void;
  /** Stable hook for e2e — lands as `data-testid` on the trigger. */
  testId?: string;
  className?: string;
  /** Renders verbatim on the trigger instead of resolving `value` against
   *  `TIME_RANGE_PRESETS` — for a value with no honest preset match, such as
   *  "no window cap applies right now". Without this, an unmatched preset id
   *  falls back to whichever preset `triggerContent` defaults to, which reads
   *  as that preset's own window even though none applies. */
  triggerOverride?: { badge: ReactNode; label: ReactNode };
}

/**
 * A compact time-range control: a trigger showing a short badge + label,
 * opening a preset list with a "Select from calendar" escape hatch for a
 * custom range. Replaces the standalone calendar picker on the traces toolbar.
 */
export function TimeRangePicker({
  value,
  onChange,
  testId,
  className,
  triggerOverride,
}: TimeRangePickerProps) {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"presets" | "calendar">("presets");
  const [draftRange, setDraftRange] = useState<PickerDateRange<Dayjs>>(
    value.kind === "custom"
      ? [dayjs(value.from), dayjs(value.to)]
      : [null, null],
  );

  const trigger = triggerOverride ?? triggerContent(value);

  const choosePreset = (id: string) => {
    onChange({ kind: "preset", preset: id });
    setOpen(false);
  };

  const applyCustom = (next: PickerDateRange<Dayjs>) => {
    setDraftRange(next);
    const [from, to] = next;
    if (from && to) {
      onChange({ kind: "custom", from: from.toDate(), to: to.toDate() });
      setOpen(false);
    }
  };

  return (
    <>
      <Button
        ref={anchorRef}
        type="button"
        variant="outlined"
        size="small"
        color="inherit"
        onClick={() => {
          setView(value.kind === "custom" ? "calendar" : "presets");
          setOpen(true);
        }}
        data-slot="time-range-trigger"
        data-testid={testId}
        className={className}
        endIcon={
          <IconMaterialSymbolsKeyboardArrowDown
            sx={{ color: "text.secondary" }}
          />
        }
        sx={{
          gap: 1,
          fontWeight: 400,
          textTransform: "none",
          color: "text.primary",
        }}
      >
        <Box
          component="span"
          sx={{
            borderRadius: 0.5,
            bgcolor: "action.hover",
            px: 0.75,
            py: 0.25,
            fontFamily: "monospace",
            typography: "caption",
            color: "text.secondary",
          }}
        >
          {trigger.badge}
        </Box>
        <Box component="span">{trigger.label}</Box>
      </Button>
      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { sx: { mt: 0.5, p: 0.5 } } }}
      >
        {view === "presets" ? (
          <Box sx={{ display: "flex", flexDirection: "column", width: 224 }}>
            {TIME_RANGE_PRESETS.map((p) => {
              const active = value.kind === "preset" && value.preset === p.id;
              return (
                <Box
                  key={p.id}
                  component="button"
                  type="button"
                  onClick={() => choosePreset(p.id)}
                  sx={[
                    focusRing,
                    {
                      display: "flex",
                      alignItems: "center",
                      gap: 1.25,
                      borderRadius: 1,
                      border: 0,
                      px: 1,
                      py: 0.75,
                      textAlign: "left",
                      typography: "body2",
                      cursor: "pointer",
                      bgcolor: active ? "action.selected" : "transparent",
                      color: "text.primary",
                      "&:hover": { bgcolor: "action.hover" },
                    },
                  ]}
                >
                  <Box
                    component="span"
                    sx={{
                      display: "grid",
                      width: 36,
                      flexShrink: 0,
                      placeItems: "center",
                      borderRadius: 0.5,
                      bgcolor: "action.hover",
                      px: 0.5,
                      py: 0.25,
                      fontFamily: "monospace",
                      typography: "caption",
                      color: "text.secondary",
                    }}
                  >
                    {p.badge}
                  </Box>
                  <Box component="span" sx={{ flex: 1 }}>
                    {p.label}
                  </Box>
                  {active ? (
                    <IconMaterialSymbolsCheck
                      sx={{ fontSize: 14, color: "text.primary" }}
                    />
                  ) : null}
                </Box>
              );
            })}
            <Divider sx={{ my: 0.5 }} />
            <Box
              component="button"
              type="button"
              onClick={() => setView("calendar")}
              sx={[
                focusRing,
                {
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                  borderRadius: 1,
                  border: 0,
                  px: 1,
                  py: 0.75,
                  textAlign: "left",
                  typography: "body2",
                  cursor: "pointer",
                  bgcolor:
                    value.kind === "custom" ? "action.selected" : "transparent",
                  color: "text.primary",
                  "&:hover": { bgcolor: "action.hover" },
                },
              ]}
            >
              <Box
                component="span"
                sx={{ display: "grid", width: 36, placeItems: "center" }}
              >
                <IconMaterialSymbolsCalendarToday
                  sx={{ fontSize: 14, color: "text.secondary" }}
                />
              </Box>
              <Box component="span" sx={{ flex: 1 }}>
                Select from calendar
              </Box>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <DateRangeCalendar
              calendars={1}
              value={draftRange}
              onChange={applyCustom}
              autoFocus
            />
            <Button
              type="button"
              variant="text"
              size="small"
              color="inherit"
              onClick={() => setView("presets")}
              sx={{ justifyContent: "flex-start", textTransform: "none" }}
            >
              ← Back to presets
            </Button>
          </Box>
        )}
      </Popover>
    </>
  );
}

function triggerContent(value: TimeRangeValue): {
  badge: ReactNode;
  label: ReactNode;
} {
  if (value.kind === "custom") {
    return {
      badge: "·",
      label: `${dayjs(value.from).format("MMM D")} → ${dayjs(value.to).format("MMM D")}`,
    };
  }
  const preset =
    TIME_RANGE_PRESETS.find((p) => p.id === value.preset) ??
    TIME_RANGE_PRESETS.find((p) => p.id === "7d")!;
  return { badge: preset.badge, label: preset.label };
}
