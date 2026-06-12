import Chip from "@mui/material/Chip";
import type { Verdict } from "../types";

interface Props {
  verdict: Verdict;
  size?: "small" | "medium";
}

const CONFIG = {
  PASS: { label: "PASS", color: "success" as const },
  PARTIAL: { label: "PARTIAL", color: "warning" as const },
  FAIL: { label: "FAIL", color: "error" as const },
};

export default function VerdictBadge({ verdict, size = "small" }: Props) {
  const { label, color } = CONFIG[verdict];
  return (
    <Chip
      label={label}
      color={color}
      size={size}
      sx={{
        fontWeight: 700,
        letterSpacing: "0.04em",
        fontSize: size === "small" ? "0.7rem" : "0.8rem",
      }}
    />
  );
}
