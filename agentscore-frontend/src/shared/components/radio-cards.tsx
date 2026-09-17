import type { InputHTMLAttributes, ReactNode } from "react";
import Box from "@mui/material/Box";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import { alpha } from "@mui/material/styles";

export interface RadioCardItem<TValue extends string = string> {
  value: TValue;
  label: ReactNode;
  description?: ReactNode;
  /** Disable selection of this item. */
  disabled?: boolean;
}

interface RadioCardsProps<TValue extends string = string> {
  items: RadioCardItem<TValue>[];
  /** Number of columns. Default 2. */
  columns?: 1 | 2 | 3;
  /** Selected value. */
  value?: TValue;
  /** Fired with the new value when a card is selected. */
  onValueChange?: (value: TValue) => void;
  /** Disable the whole group. */
  disabled?: boolean;
  /**
   * Optional stable hook. When set, each radio's `<input>` gets
   * `data-testid="<testIdPrefix>-<value>"` so e2e flows can target a specific
   * card (e.g. `kind-radio-g_eval`).
   */
  testIdPrefix?: string;
  className?: string;
}

/**
 * Radio group rendered as bordered cards (title + description). The checked
 * card gets a darker border + tinted background.
 *
 * Used for Role (Member / Superadmin) and Kind (External / Internal) pickers.
 */
export function RadioCards<TValue extends string = string>({
  items,
  columns = 2,
  value,
  onValueChange,
  disabled,
  testIdPrefix,
  className,
}: RadioCardsProps<TValue>) {
  return (
    <RadioGroup
      data-slot="radio-group"
      className={className}
      value={value ?? null}
      onChange={(_event, next) => onValueChange?.(next as TValue)}
      sx={{
        display: "grid",
        width: "100%",
        gap: 1,
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }}
    >
      {items.map((it) => {
        const checked = value === it.value;
        const itemDisabled = disabled || it.disabled;
        return (
          <Box
            key={it.value}
            component="label"
            data-slot="radio-card"
            aria-disabled={itemDisabled || undefined}
            sx={(theme) => ({
              display: "flex",
              cursor: itemDisabled ? "not-allowed" : "pointer",
              alignItems: "flex-start",
              gap: 1.25,
              borderRadius: 1,
              border: 1,
              borderColor: checked ? "text.primary" : "divider",
              bgcolor: checked
                ? alpha(theme.palette.action.hover, 0.4)
                : "background.paper",
              px: 1.5,
              py: 1,
              typography: "body1",
              opacity: itemDisabled ? 0.5 : 1,
            })}
          >
            <Radio
              value={it.value}
              disabled={itemDisabled}
              checked={checked}
              size="small"
              disableRipple
              slotProps={{
                // MUI's Radio `input` slot type omits arbitrary data-*; it is
                // forwarded to the <input> at runtime (see the testid-forwarding
                // guard), so cast to the DOM attribute type.
                input: {
                  "data-testid": testIdPrefix
                    ? `${testIdPrefix}-${it.value}`
                    : undefined,
                } as InputHTMLAttributes<HTMLInputElement>,
              }}
              sx={{ mt: -0.25, p: 0, flexShrink: 0 }}
            />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Box sx={{ fontWeight: 500, lineHeight: 1.2 }}>{it.label}</Box>
              {it.description ? (
                <Box
                  sx={{
                    mt: 0.25,
                    typography: "caption",
                    color: "text.secondary",
                  }}
                >
                  {it.description}
                </Box>
              ) : null}
            </Box>
          </Box>
        );
      })}
    </RadioGroup>
  );
}
