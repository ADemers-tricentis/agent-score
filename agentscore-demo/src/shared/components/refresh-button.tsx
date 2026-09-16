/** A manual refresh icon button.
 *
 * The left half of `AutoRefreshControl` without the interval dropdown, for
 * surfaces that want "fetch again now" and nothing more. The back office pairs
 * refresh with polling because a staff console watches other people's activity
 * move; the customer app polls only while that customer's own run is in flight
 * (`useRunInFlight`), so everywhere else the manual button is the whole need and
 * an idle interval picker would just be a timer on their tab.
 *
 * The spin keyframes are duplicated from `AutoRefreshControl` rather than
 * shared: two `sx` blocks are cheaper than a third module, and Emotion scopes
 * the animation name per rendered element either way.
 */

import IconButton from "@mui/material/IconButton";
import Tooltip from "@tricentis/aura/components/Tooltip.js";
import IconMaterialSymbolsSync from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSync.mjs";

export function RefreshButton({
  onRefresh,
  isRefreshing = false,
  label = "Refresh",
  testId,
}: {
  onRefresh: () => void;
  /** Spins the icon and disables the button while a fetch is in flight. */
  isRefreshing?: boolean;
  /** Accessible name + tooltip. Name the surface when a page has more than one. */
  label?: string;
  testId?: string;
}) {
  return (
    <Tooltip title={label} arrow>
      <IconButton
        type="button"
        size="small"
        onClick={onRefresh}
        disabled={isRefreshing}
        aria-label={label}
        data-testid={testId}
      >
        <IconMaterialSymbolsSync
          fontSize="small"
          sx={{
            "@keyframes refresh-button-spin": {
              from: { transform: "rotate(0deg)" },
              to: { transform: "rotate(360deg)" },
            },
            animation: isRefreshing
              ? "refresh-button-spin 1s linear infinite"
              : "none",
          }}
        />
      </IconButton>
    </Tooltip>
  );
}
