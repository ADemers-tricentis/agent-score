import type { SvgIconProps } from "@mui/material/SvgIcon";

import {
  SPAN_TYPE_META,
  type SpanType,
} from "@/shared/components/span-type-meta";

interface SpanTypeIconProps extends Omit<SvgIconProps, "type"> {
  type: SpanType;
  /** Icon edge size, in px. Default 14 (was `size-3.5`). */
  size?: number;
}

/**
 * Icon matched to an OTel span.kind / Langfuse observation type. The icon +
 * palette color live in `span-type-meta.ts`; the color is applied via `sx` so
 * the icon fills with it (`currentColor`).
 */
export function SpanTypeIcon({
  type,
  size = 14,
  className,
  sx,
  ...rest
}: SpanTypeIconProps) {
  const meta = SPAN_TYPE_META[type];
  const Icon = meta.icon;
  return (
    <Icon
      className={className}
      sx={[
        { fontSize: size, color: meta.color },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...rest}
    />
  );
}
