import {
  memo,
  useCallback,
  useId,
  useMemo,
  type ComponentType,
  type ReactNode,
} from "react";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import IconMaterialSymbolsClose from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsClose.mjs";

import { EmptyState } from "@/shared/components/empty-state";
import { ErrorState } from "@/shared/components/error-state";
import { focusRing } from "@/shared/theme/focus-ring";

interface EmptyStateConfig {
  icon?: ComponentType<{ className?: string }>;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  /** Optional stable hook for e2e/component tests — spread straight through
   *  to `EmptyState`, which already accepts it. */
  testId?: string;
}

interface CardGridBaseProps<T> {
  /** Items to render as cards. */
  items: T[];
  /** Render skeleton cards instead of items when true. */
  isLoading?: boolean;
  /** Surface an error state instead of the grid when set. */
  error?: Error | null;
  /** Empty-state config rendered when there are no items. */
  emptyState?: EmptyStateConfig;
  /** Stable id per item — keys the open dialog + card refs. */
  getItemId: (item: T) => string;
  /** Stable per-item `data-testid` — lands on the card-header `<button>`. */
  getItemTestId: (item: T) => string;
  /**
   * Accessible label for the card's header `<button>` (the entity name). The
   * header button is a stretched overlay with no text of its own, so this is
   * its accessible name — and, in expand mode, the open dialog's accessible
   * name too.
   */
  getItemLabel: (item: T) => string;
  /**
   * Renders a card's collapsed body. `isOpen` reflects the open state (always
   * `false` in navigate mode — there is no notion of an open card there).
   */
  renderCard: (item: T, isOpen: boolean) => ReactNode;
  /** Skeleton card count when `isLoading`. Default `6`. */
  skeletonCount?: number;
  /** Minimum card width in px for the auto-fill grid. Default `280`. */
  minCardWidth?: number;
  /**
   * Fixed column count, overriding the responsive `auto-fill` track. Set it
   * only when the card is laid out for a known width — `1` turns the grid into
   * a single stack of full-width row cards (the customer agents list view).
   * Left unset, the grid stays responsive, which is what every card built to
   * `minCardWidth` wants.
   */
  columns?: number;
  /** Fixed card height in px (uniform per tab). */
  cardHeight?: number;
  /** Stamps `aria-pressed` on the navigate arm's header button when
   *  supplied — a checkable card grid (batch corpus selection). Read only in
   *  navigate mode; left unset, the markup is byte-identical to today's. */
  getItemPressed?: (item: T) => boolean;
}

interface CardGridExpandProps<T> {
  /** Renders the detail for the open item (inside the centered dialog). */
  renderDetail: (item: T) => ReactNode;
  /** Currently-open item id (controlled by the page). */
  openId: string | null;
  /** Toggle handler — receives the next open id (or `null` to close). */
  onToggle: (id: string | null) => void;
  onItemClick?: undefined;
}

interface CardGridNavigateProps<T> {
  /** Click handler — navigates instead of opening a detail dialog. */
  onItemClick: (item: T) => void;
  renderDetail?: undefined;
  openId?: undefined;
  onToggle?: undefined;
}

/**
 * `CardGridProps` splits into two mutually exclusive arms so an expand
 * handler and a navigate handler can never be half-configured together:
 * - **expand** — `renderDetail` + `openId` + `onToggle`, all required. Opens
 *   detail in the centered modal dialog. All six current call sites (the
 *   flat + empty-group + per-group grids in `EvalCatalogPage`, plus
 *   `DimensionsPage`, `ProfilesPage`, and the dev gallery) use this arm.
 * - **navigate** — `onItemClick` only. No dialog; the header button click
 *   navigates instead. `aria-expanded` is never stamped in this mode.
 */
export type CardGridProps<T> = CardGridBaseProps<T> &
  (CardGridExpandProps<T> | CardGridNavigateProps<T>);

function isExpandGrid<T>(
  props: CardGridProps<T>,
): props is CardGridBaseProps<T> & CardGridExpandProps<T> {
  // Discriminate on the VALUE, not key presence: `CardGridNavigateProps`
  // types `onToggle` as `?: undefined`, so a caller writing
  // `<CardGrid onItemClick={f} onToggle={undefined} …/>` type-checks fine —
  // `"onToggle" in props` would still read `true` for that object (the key
  // is present, just holding `undefined`), taking the expand branch and
  // throwing on the first card click (`renderDetail` is undefined there).
  return typeof props.onToggle === "function";
}

// A stable no-op stands in for `onToggle` in navigate mode instead of
// `undefined`, so `handleToggle` below never needs an `onToggle?.(...)`
// branch that navigate mode could never actually exercise (`handleToggle`
// itself is only ever wired to a card header in expand mode) — an
// unreachable branch that coverage would otherwise have to carry forever.
const NOOP_TOGGLE: (id: string | null) => void = () => {};

/**
 * Generic card grid — the visual-browse counterpart to `DataTable`.
 * Renders `items` as fixed-height cards in a `repeat(auto-fill, …)`
 * CSS grid. In **expand mode**, clicking a card's header opens its detail in
 * a **centered modal dialog** (a scrim dims the grid behind it) with a close
 * ✕ in the top-right; the dialog closes on the ✕, `Esc`, or a backdrop click.
 * In **navigate mode**, clicking a card's header calls `onItemClick` instead
 * — no dialog is rendered at all.
 *
 * Load-bearing a11y: in expand mode each card header is a real `<button>`
 * carrying `aria-expanded` + `aria-controls`, the dialog is a focus-trapped
 * modal named by the open item's label, and on close MUI restores focus to
 * the card header that opened it. In navigate mode `aria-expanded` is
 * omitted entirely — stamping `aria-expanded="false"` on a button that never
 * expands anything is itself an a11y defect.
 */
export function CardGrid<T>(props: CardGridProps<T>) {
  const {
    items,
    isLoading = false,
    error = null,
    emptyState,
    getItemId,
    getItemTestId,
    getItemLabel,
    renderCard,
    skeletonCount = 6,
    minCardWidth = 280,
    columns,
    cardHeight,
    getItemPressed,
  } = props;

  const baseId = useId();
  const expand = isExpandGrid(props) ? props : undefined;
  const openId = expand?.openId ?? null;
  // Depend on `onToggle` itself (stable per the caller's own memoization),
  // not on `expand` — `expand` is a fresh object every render (it's derived
  // from `props` via a ternary), so depending on it would invalidate this
  // callback on every render instead of only when `openId`/`onToggle` change.
  const onToggle = isExpandGrid(props) ? props.onToggle : NOOP_TOGGLE;

  const openItem = useMemo(
    () => items.find((item) => getItemId(item) === openId) ?? null,
    [items, openId, getItemId],
  );

  const handleToggle = useCallback(
    (id: string) => onToggle(id === openId ? null : id),
    [openId, onToggle],
  );

  const gridSx = {
    display: "grid",
    gridTemplateColumns:
      columns != null
        ? `repeat(${columns}, minmax(0, 1fr))`
        : `repeat(auto-fill, minmax(${minCardWidth}px, 1fr))`,
    gap: 2,
    alignItems: "start",
  } as const;

  if (error) {
    return (
      <Box data-slot="card-grid">
        <ErrorState message={error.message} />
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box data-slot="card-grid" sx={gridSx}>
        {Array.from({ length: skeletonCount }).map((_, idx) => (
          <Skeleton
            key={`card-skeleton-${idx}`}
            data-slot="card-grid-skeleton"
            variant="rounded"
            sx={{ height: cardHeight ?? 180, borderRadius: 1.5 }}
          />
        ))}
      </Box>
    );
  }

  if (items.length === 0) {
    return (
      <Box data-slot="card-grid">
        {emptyState ? <EmptyState {...emptyState} /> : null}
      </Box>
    );
  }

  const panelId = `${baseId}-panel`;

  return (
    <Box data-slot="card-grid" sx={gridSx}>
      {items.map((item) => {
        const id = getItemId(item);
        const isOpen = id === openId;
        return isExpandGrid(props) ? (
          <CardCell
            key={id}
            id={id}
            testId={getItemTestId(item)}
            label={getItemLabel(item)}
            panelId={panelId}
            isOpen={isOpen}
            cardHeight={cardHeight}
            onToggle={handleToggle}
          >
            {renderCard(item, isOpen)}
          </CardCell>
        ) : (
          <CardCell
            key={id}
            id={id}
            testId={getItemTestId(item)}
            label={getItemLabel(item)}
            cardHeight={cardHeight}
            onItemClick={() => props.onItemClick(item)}
            pressed={getItemPressed?.(item)}
          >
            {renderCard(item, isOpen)}
          </CardCell>
        );
      })}

      {/* Detail opens as a centered modal dialog (scrim dims the grid); close
          on the ✕, Esc, or a backdrop click. MUI traps focus and restores it to
          the card header on close. Navigate mode renders no dialog at all. */}
      {expand ? (
        <Dialog
          open={Boolean(openItem)}
          onClose={() => expand.onToggle(null)}
          maxWidth={false}
          scroll="paper"
          aria-label={openItem ? getItemLabel(openItem) : undefined}
          slotProps={{
            paper: {
              sx: {
                position: "relative",
                width: "min(880px, 94vw)",
                maxHeight: "90vh",
                borderRadius: 1,
              },
            },
          }}
        >
          {openItem ? (
            <>
              <IconButton
                aria-label="Close"
                data-slot="card-grid-close"
                onClick={() => expand.onToggle(null)}
                size="small"
                sx={{ position: "absolute", top: 8, right: 8, zIndex: 1, color: "text.secondary" }}
              >
                <IconMaterialSymbolsClose sx={{ fontSize: 20 }} />
              </IconButton>
              <Box
                id={panelId}
                data-slot="card-grid-panel"
                role="region"
                aria-label={getItemLabel(openItem)}
                sx={{ overflowY: "auto" }}
              >
                {expand.renderDetail(openItem)}
              </Box>
            </>
          ) : null}
        </Dialog>
      ) : null}
    </Box>
  );
}

interface CardCellCommonProps {
  id: string;
  testId: string;
  label: string;
  cardHeight?: number;
  children: ReactNode;
}

interface CardCellExpandProps extends CardCellCommonProps {
  panelId: string;
  isOpen: boolean;
  onToggle: (id: string) => void;
}

interface CardCellNavigateProps extends CardCellCommonProps {
  onItemClick: () => void;
  onToggle?: undefined;
  /** `aria-pressed` for the header button — omitted (not `false`) when
   *  undefined, so a plain navigate card never announces a toggle state. */
  pressed?: boolean;
}

type CardCellProps = CardCellExpandProps | CardCellNavigateProps;

function isExpandCell(props: CardCellProps): props is CardCellExpandProps {
  // Same value-based discrimination as `isExpandGrid` above, for the same
  // reason — key presence alone can't tell a real handler from a caller
  // that passed `onToggle: undefined` explicitly.
  return typeof props.onToggle === "function";
}

const CardCell = memo(function CardCell(props: CardCellProps) {
  // The expand affordance is a stretched overlay `<button>` (absolutely
  // positioned behind the content), NOT a wrapper around the card body — so
  // the card's own Edit/Run `IconButton`s are never nested inside another
  // `<button>` (invalid HTML + a11y defect). The content layer is
  // `pointer-events: none` so clicks on inert card chrome fall through to the
  // overlay, while interactive descendants (the action buttons) re-enable
  // pointer events and capture their own clicks.
  const { id, testId, label, cardHeight, children } = props;
  const isOpen = isExpandCell(props) ? props.isOpen : false;

  return (
    <Paper
      data-slot="card-grid-cell"
      data-open={isOpen || undefined}
      variant="outlined"
      sx={{
        position: "relative",
        borderRadius: 1.5,
        height: cardHeight,
        overflow: "hidden",
        borderColor: isOpen ? "primary.main" : "divider",
      }}
    >
      <Box
        component="button"
        type="button"
        data-slot="card-grid-header"
        data-testid={testId}
        aria-label={label}
        // Navigate mode omits `aria-expanded` (value `undefined`) rather than
        // stamping `false`: React never renders an `undefined`-valued
        // attribute, so the button truly has no `aria-expanded` — the same
        // omission technique `aria-controls` below already relies on for
        // collapsed cards. A navigating button that never expands anything
        // must not claim an expand/collapse state at all.
        aria-expanded={isExpandCell(props) ? props.isOpen : undefined}
        // Only the open card's dialog exists in the DOM; referencing a missing
        // id on collapsed (or navigate-mode) cards is an ARIA conformance
        // violation.
        aria-controls={
          isExpandCell(props) && props.isOpen ? props.panelId : undefined
        }
        // Navigate mode only, and only when the caller supplies
        // `getItemPressed`: omitted (not stamped `false`) when it doesn't, so
        // a plain navigate card carries no toggle semantics at all.
        aria-pressed={
          !isExpandCell(props) && props.pressed !== undefined
            ? props.pressed
            : undefined
        }
        onClick={() =>
          isExpandCell(props) ? props.onToggle(id) : props.onItemClick()
        }
        sx={[
          focusRing,
          {
            position: "absolute",
            inset: 0,
            zIndex: 0,
            width: "100%",
            height: "100%",
            p: 0,
            m: 0,
            border: 0,
            background: "none",
            cursor: "pointer",
          },
        ]}
      />
      <Box
        data-slot="card-grid-content"
        sx={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          pointerEvents: "none",
          "& button, & a, & [role='button'], & [tabindex]": {
            pointerEvents: "auto",
          },
        }}
      >
        {children}
      </Box>
    </Paper>
  );
});
