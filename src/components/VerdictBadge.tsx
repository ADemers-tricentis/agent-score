import ChipStatus from "@tricentis/aura/components/ChipStatus.js";
import type { Verdict } from "../types";

interface Props {
  verdict: Verdict;
  size?: "small" | "medium";
}

const STATUS_MAP = {
  PASS: "Passed",
  PARTIAL: "Pending",
  FAIL: "Failed",
} as const;

export default function VerdictBadge({ verdict, size = "small" }: Props) {
  return (
    <ChipStatus
      status={STATUS_MAP[verdict]}
      sx={
        size === "medium"
          ? { fontSize: "0.8rem", height: 28, "& .MuiChip-label": { px: 1.5 } }
          : undefined
      }
    />
  );
}
