import { useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import IconMaterialSymbolsKeyboardArrowDown from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsKeyboardArrowDown.mjs";
import IconMaterialSymbolsSync from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSync.mjs";

import { REFRESH_INTERVALS } from "@/shared/components/refresh-intervals";

interface AutoRefreshControlProps {
  /** Currently selected interval id. */
  intervalId: string;
  onIntervalChange: (id: string) => void;
  /** Manual refresh — fired by the left icon button. */
  onRefresh: () => void;
  /** Spins the icon + disables the button while a fetch is in flight. */
  isRefreshing?: boolean;
  className?: string;
}

/**
 * A split control: a manual refresh icon button on the left and
 * an auto-refresh interval dropdown on the right (Off / 30s / 1m / 5m / 15m).
 * The parent owns the polling effect — this is presentation + selection only.
 */
export function AutoRefreshControl({
  intervalId,
  onIntervalChange,
  onRefresh,
  isRefreshing = false,
  className,
}: AutoRefreshControlProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  const active =
    REFRESH_INTERVALS.find((i) => i.id === intervalId) ??
    REFRESH_INTERVALS[0];
  const triggerLabel = active.ms === null ? "Off" : active.id;
  const isActive = active.ms !== null;

  return (
    <Box
      data-slot="auto-refresh-control"
      className={className}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        overflow: "hidden",
        borderRadius: 1,
        border: 1,
        borderColor: "divider",
      }}
    >
      <IconButton
        type="button"
        size="small"
        onClick={onRefresh}
        disabled={isRefreshing}
        aria-label="Refresh now"
        data-testid="refresh-traces"
        sx={{ borderRadius: 0 }}
      >
        <IconMaterialSymbolsSync
          fontSize="small"
          sx={{
            "@keyframes auto-refresh-spin": {
              from: { transform: "rotate(0deg)" },
              to: { transform: "rotate(360deg)" },
            },
            animation: isRefreshing
              ? "auto-refresh-spin 1s linear infinite"
              : "none",
          }}
        />
      </IconButton>
      <Divider orientation="vertical" flexItem sx={{ my: 0.75 }} />
      <Button
        ref={triggerRef}
        type="button"
        variant="text"
        size="small"
        color="inherit"
        onClick={() => setOpen(true)}
        data-slot="auto-refresh-trigger"
        data-testid="auto-refresh-trigger"
        data-active={isActive || undefined}
        endIcon={
          <IconMaterialSymbolsKeyboardArrowDown
            fontSize="small"
            sx={{ color: "text.secondary" }}
          />
        }
        sx={{
          gap: 0.5,
          borderRadius: 0,
          fontWeight: 400,
          textTransform: "none",
          color: isActive ? "text.primary" : "text.secondary",
        }}
      >
        {triggerLabel}
      </Button>
      <Menu
        anchorEl={triggerRef.current}
        open={open}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { width: "11rem" } } }}
      >
        {REFRESH_INTERVALS.map((i) => (
          <MenuItem
            key={i.id}
            selected={i.id === intervalId}
            data-testid={`refresh-interval-${i.id}`}
            onClick={() => {
              onIntervalChange(i.id);
              setOpen(false);
            }}
          >
            {i.label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
