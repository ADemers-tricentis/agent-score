import ChipStatus from "@tricentis/aura/components/ChipStatus.js";
import Chip from "@mui/material/Chip";
import type { SessionVerdict, Verdict } from "../../types";

const SESSION_STATUS_MAP: Record<SessionVerdict, "Passed" | "Pending" | "Failed"> = {
  PASS: "Passed",
  PARTIAL: "Pending",
  FAIL: "Failed",
};

const COMPOSITE_COLOR: Record<Verdict, "success" | "warning" | "error"> = {
  Ship: "success",
  Review: "warning",
  Block: "error",
};

/** Composite Ship/Review/Block verdict — the ship-readiness recommendation. */
export function CompositeVerdictChip({ verdict, size = "small" }: { verdict: Verdict; size?: "small" | "medium" }) {
  return (
    <Chip
      label={verdict}
      size="small"
      color={COMPOSITE_COLOR[verdict]}
      sx={{
        fontWeight: 600,
        height: size === "medium" ? 26 : 20,
        fontSize: size === "medium" ? "0.75rem" : "0.68rem",
      }}
    />
  );
}

/** Per-session PASS/PARTIAL/FAIL verdict, shown to practitioners as Passed/Pending/Failed. */
export function SessionVerdictChip({ verdict, size = "small" }: { verdict: SessionVerdict; size?: "small" | "medium" }) {
  return (
    <ChipStatus
      status={SESSION_STATUS_MAP[verdict]}
      sx={size === "medium" ? { fontSize: "0.8rem", height: 28, "& .MuiChip-label": { px: 1.5 } } : undefined}
    />
  );
}
