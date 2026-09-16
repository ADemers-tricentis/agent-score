import Chip from "@mui/material/Chip";
import SvgIcon from "@mui/material/SvgIcon";
import type { VerdictBandKey } from "../types";
import { VERDICT_BAND_META } from "../data/verdict";

interface Props {
  band: VerdictBandKey;
  size?: "small" | "medium";
}

export default function VerdictChip({ band, size = "small" }: Props) {
  const meta = VERDICT_BAND_META[band];
  return (
    <Chip
      icon={
        <SvgIcon sx={{ fontSize: size === "medium" ? "1rem" : "0.8rem" }}>
          <path d={meta.iconPath} />
        </SvgIcon>
      }
      label={meta.label.toUpperCase()}
      size="small"
      color={meta.muiColor}
      sx={
        size === "medium"
          ? { fontSize: "0.78rem", height: 28, fontWeight: 700, letterSpacing: "0.02em" }
          : { fontSize: "0.65rem", height: 22, fontWeight: 700, letterSpacing: "0.02em" }
      }
    />
  );
}
