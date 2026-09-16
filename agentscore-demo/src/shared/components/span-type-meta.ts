import type SvgIcon from "@mui/material/SvgIcon";

import IconMaterialSymbolsBolt from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsBolt.mjs";
import IconMaterialSymbolsBuild from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsBuild.mjs";
import IconMaterialSymbolsDatabase from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsDatabase.mjs";
import IconMaterialSymbolsFiberManualRecord from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsFiberManualRecord.mjs";
import IconMaterialSymbolsSmartToy from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSmartToy.mjs";
import IconMaterialSymbolsStarShine from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsStarShine.mjs";

export type SpanType =
  | "root"
  | "generation"
  | "tool"
  | "retriever"
  | "external"
  | "generic";

export interface SpanTypeMeta {
  icon: typeof SvgIcon;
  /**
   * Palette color (an `sx` color string) shared by the span-type icon tint and
   * the inline-timeline bar fill. Theme-token strings so both stay coherent;
   * the old Tailwind alpha tints (/40, /60, /80) collapse to the base token.
   */
  color: string;
  /** Default label. */
  defaultLabel: string;
}

/**
 * OTel span.kind / Langfuse observation type → icon + color palette.
 * Single source of truth so the trace-detail UI stays coherent.
 */
export const SPAN_TYPE_META: Record<SpanType, SpanTypeMeta> = {
  root: {
    icon: IconMaterialSymbolsSmartToy,
    color: "text.primary",
    defaultLabel: "agent",
  },
  generation: {
    icon: IconMaterialSymbolsStarShine,
    color: "primary.main",
    defaultLabel: "generation",
  },
  tool: {
    icon: IconMaterialSymbolsBuild,
    color: "success.main",
    defaultLabel: "tool",
  },
  retriever: {
    icon: IconMaterialSymbolsDatabase,
    color: "primary.main",
    defaultLabel: "retriever",
  },
  external: {
    icon: IconMaterialSymbolsBolt,
    color: "warning.main",
    defaultLabel: "external",
  },
  generic: {
    icon: IconMaterialSymbolsFiberManualRecord,
    color: "text.secondary",
    defaultLabel: "span",
  },
};
