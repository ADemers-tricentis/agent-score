import { useState, type ComponentType, type ReactNode } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type RowData,
  type SortingState,
} from "@tanstack/react-table";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { type SxProps, type Theme } from "@mui/material/styles";
import IconMaterialSymbolsArrowDownward from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsArrowDownward.mjs";
import IconMaterialSymbolsArrowUpward from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsArrowUpward.mjs";
import IconMaterialSymbolsUnfoldMore from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsUnfoldMore.mjs";

import { EmptyState } from "@/shared/components/empty-state";
import { focusRing } from "@/shared/theme/focus-ring";

declare module "@tanstack/react-table" {
  // Opt-in per-column styling applied to the header/body cells. Lets a column
  // (e.g. a fluid, truncating "name" column) control its own sizing without the
  // DataTable knowing about it. Unset on every other column → no effect.
  // `headerSx`/`cellSx` are the MUI-native styling path; the `*ClassName` pair
  // is the className escape hatch for callers that pass a custom class.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    cellClassName?: string;
    headerClassName?: string;
    cellSx?: SxProps<Theme>;
    headerSx?: SxProps<Theme>;
  }
}

interface EmptyStateConfig {
  icon?: ComponentType<{ className?: string }>;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  /** Stable hook on the empty state — the e2e suite cannot select on the
   *  title text. Spread straight through to `EmptyState`, which already
   *  stamps it as `data-testid`. */
  testId?: string;
}

interface OffsetPagination {
  /** Omitted (or `"offset"`) selects today's page-index/page-size mode. */
  mode?: "offset";
  /** 0-based current page index. */
  pageIndex: number;
  /** Number of items per page. */
  pageSize: number;
  /** Total item count across all pages (from the server). */
  total: number;
  /** Fired when the user clicks Previous / Next. */
  onPageChange: (pageIndex: number) => void;
}

interface CursorPagination {
  /** Opaque server cursor mode — no page index/size, so "has more" must be
   *  supplied directly rather than derived. */
  mode: "cursor";
  /** Whether a next page is available. */
  hasNext: boolean;
  /** Whether a previous page is available. */
  hasPrev: boolean;
  /** Fired when the user clicks Next. */
  onNext: () => void;
  /** Fired when the user clicks Previous. */
  onPrev: () => void;
  /** Total item count (for the label only — a cursor cannot derive a range). */
  total: number;
}

/**
 * Server-side pagination config. Discriminated on `mode`: the offset
 * discriminant is optional (today's callers pass no `mode` key and keep
 * compiling), the cursor discriminant is required so a caller cannot
 * half-configure it and get a silently dead Previous button.
 */
export type PaginationConfig = OffsetPagination | CursorPagination;

export interface DataTableProps<TData> {
  /** TanStack Table column definitions. */
  columns: ColumnDef<TData, unknown>[];
  /** Row data for the current page. */
  data: TData[];
  /** Render skeleton rows when true. */
  isLoading?: boolean;
  /** Show an error-state row when set. */
  error?: Error | null;
  /** Empty-state config (icon + title + description + action). */
  emptyState?: EmptyStateConfig;
  /** Server-side pagination (Previous / Next + count). */
  pagination?: PaginationConfig;
  /** Click handler invoked when a row is clicked. */
  onRowClick?: (row: TData) => void;
  /** Stable row key — required if `onRowClick` is used. */
  getRowId?: (row: TData) => string;
  /** Stable per-row `data-testid` for tests / e2e. */
  getRowTestId?: (row: TData) => string;
  /** Enable column sort UI. Per-column sort uses the column's `enableSorting`. Default `true`. */
  enableSorting?: boolean;
  /** Controlled sort state. Provide with `onSortingChange` for server-side
   *  sort; omit to let the table own sort state client-side. */
  sorting?: SortingState;
  /** Fired when the sort toggles — required when `sorting` is controlled. */
  onSortingChange?: OnChangeFn<SortingState>;
  /** Skip the client-side sort model (the data arrives pre-sorted from the
   *  server). Pair with controlled `sorting`. Default `false`. */
  manualSorting?: boolean;
  /** Skeleton row count when `isLoading`. Default `5`. */
  skeletonRows?: number;
  /** Extra classes on the `data-table` root — forwarded to the root element. */
  className?: string;
  /** Extra classes on the inner `<table>` — e.g. `table-fixed` for proportional columns. */
  tableClassName?: string;
  /** Extra `sx` on the inner MUI `<Table>` — e.g. `{ tableLayout: "fixed" }` for proportional columns. */
  tableSx?: SxProps<Theme>;
}

/**
 * Foundation DataTable built on TanStack Table (headless) + MUI `Table`.
 *
 * Bakes in: loading skeleton, error row, empty state, server-side pagination,
 * row click, optional client-side column sort.
 *
 * NOT in this primitive (defer to per-page composition): faceted filters,
 * row selection, URL-state binding.
 */
export function DataTable<TData>({
  columns,
  data,
  isLoading = false,
  error = null,
  emptyState,
  pagination,
  onRowClick,
  getRowId,
  getRowTestId,
  enableSorting = true,
  sorting,
  onSortingChange,
  manualSorting = false,
  skeletonRows = 5,
  className,
  tableClassName,
  tableSx,
}: DataTableProps<TData>) {
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const isControlled = sorting !== undefined;
  const sortingState = isControlled ? sorting : internalSorting;

  const table = useReactTable({
    data,
    columns,
    state: { sorting: sortingState },
    onSortingChange: isControlled ? onSortingChange : setInternalSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel:
      enableSorting && !manualSorting ? getSortedRowModel() : undefined,
    manualSorting,
    enableSorting,
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
    // Server-side pagination — the table just renders what's in `data`.
    manualPagination: true,
    pageCount:
      pagination && pagination.mode !== "cursor"
        ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize))
        : -1,
  });

  const visibleColumnCount = table.getVisibleFlatColumns().length;
  const rows = table.getRowModel().rows;

  return (
    <Box
      data-slot="data-table"
      className={className}
      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
    >
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ borderRadius: 1.25 }}
      >
        <Table className={tableClassName} sx={tableSx}>
          <TableHead>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <TableCell
                      key={header.id}
                      data-column={header.id}
                      className={header.column.columnDef.meta?.headerClassName}
                      sx={[
                        // Table header = subtitle2 (12/500) muted, so column
                        // labels read as subordinate to the body data (docs/10).
                        { typography: "subtitle2", color: "text.secondary" },
                        ...(Array.isArray(header.column.columnDef.meta?.headerSx)
                          ? header.column.columnDef.meta.headerSx
                          : [header.column.columnDef.meta?.headerSx]),
                      ]}
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <Box
                          component="button"
                          type="button"
                          data-slot="data-table-sort"
                          data-sorted={sorted || "none"}
                          onClick={header.column.getToggleSortingHandler()}
                          sx={[
                            focusRing,
                            {
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 0.5,
                              p: 0,
                              border: 0,
                              background: "none",
                              font: "inherit",
                              color: "inherit",
                              textAlign: "left",
                              cursor: "pointer",
                              "&:hover": { color: "text.primary" },
                            },
                          ]}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {sorted === "asc" ? (
                            <IconMaterialSymbolsArrowUpward sx={{ fontSize: 14 }} />
                          ) : sorted === "desc" ? (
                            <IconMaterialSymbolsArrowDownward sx={{ fontSize: 14 }} />
                          ) : (
                            <IconMaterialSymbolsUnfoldMore
                              sx={{ fontSize: 14, color: "text.disabled" }}
                            />
                          )}
                        </Box>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableHead>

          <TableBody>
            {isLoading ? (
              <SkeletonRows
                columnCount={visibleColumnCount}
                rowCount={skeletonRows}
              />
            ) : error ? (
              <TableRow data-slot="data-table-error-row">
                <TableCell
                  colSpan={visibleColumnCount}
                  align="center"
                  sx={{ color: "error.main" }}
                >
                  {error.message || "Failed to load data."}
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow data-slot="data-table-empty-row">
                <TableCell colSpan={visibleColumnCount} sx={{ p: 0 }}>
                  {emptyState ? (
                    <EmptyState {...emptyState} />
                  ) : (
                    <Box
                      sx={{ p: 3, textAlign: "center", color: "text.secondary" }}
                    >
                      No items found.
                    </Box>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const original = row.original;
                const testId = getRowTestId ? getRowTestId(original) : undefined;
                return (
                  <TableRow
                    key={row.id}
                    data-slot="data-table-row"
                    data-testid={testId}
                    hover={Boolean(onRowClick)}
                    onClick={onRowClick ? () => onRowClick(original) : undefined}
                    sx={onRowClick ? { cursor: "pointer" } : undefined}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        data-column={cell.column.id}
                        className={cell.column.columnDef.meta?.cellClassName}
                        sx={cell.column.columnDef.meta?.cellSx}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {pagination && !error ? (
        <DataTablePagination pagination={pagination} rowsRendered={rows.length} />
      ) : null}
    </Box>
  );
}

function SkeletonRows({
  rowCount,
  columnCount,
}: {
  rowCount: number;
  columnCount: number;
}) {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, rowIdx) => (
        <TableRow key={`skeleton-${rowIdx}`} data-slot="data-table-skeleton-row">
          {Array.from({ length: columnCount }).map((__, colIdx) => (
            <TableCell key={colIdx}>
              <Skeleton variant="text" sx={{ width: 96 }} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

/**
 * The Previous/Next + range footer `DataTable` renders under itself.
 *
 * Exported because a table that `DataTable` cannot express still has to page
 * with the same control and the same `data-slot` hooks — the Ingestion →
 * Internal → tenants table hand-rolls its rows for the per-row expandable
 * agent drill, which this primitive has no row-detail slot for. Not a general
 * invitation to hand-roll a table: compose `DataTable` unless a row shape
 * genuinely doesn't fit it.
 */
export function DataTablePagination({
  pagination,
  rowsRendered,
}: {
  pagination: PaginationConfig;
  /** Rows actually rendered on this page — the offset label's range end. */
  rowsRendered: number;
}) {
  let label: string;
  let prevDisabled: boolean;
  let nextDisabled: boolean;
  let handlePrev: () => void;
  let handleNext: () => void;

  if (pagination.mode === "cursor") {
    const { total, hasNext, hasPrev, onNext, onPrev } = pagination;
    // Generic component, so "N traces" would be a lie for other callers —
    // "N results" keeps the same phrasing as the offset zero-case below.
    label = `${total} results`;
    prevDisabled = !hasPrev;
    nextDisabled = !hasNext;
    handlePrev = onPrev;
    handleNext = onNext;
  } else {
    const { pageIndex, pageSize, total, onPageChange } = pagination;
    const offset = pageIndex * pageSize;
    const first = total === 0 ? 0 : offset + 1;
    const last = offset + rowsRendered;
    label = total === 0 ? "0 results" : `${first}–${last} of ${total}`;
    prevDisabled = !(pageIndex > 0);
    nextDisabled = !(last < total);
    handlePrev = () => onPageChange(Math.max(0, pageIndex - 1));
    handleNext = () => onPageChange(pageIndex + 1);
  }

  return (
    <Box
      data-slot="data-table-pagination"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        color: "text.secondary",
      }}
    >
      <Typography
        component="span"
        variant="caption"
        data-slot="data-table-pagination-count"
        // Cursor mode swaps rows behind a byte-identical "N results" label (a
        // cursor can't produce an offset-derived range), so without a live
        // region a screen-reader user gets no confirmation that paging did
        // anything. `polite` — it's a status update, not urgent enough to
        // interrupt whatever the user is doing.
        aria-live="polite"
      >
        {label}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Button
          variant="outlined"
          size="small"
          disabled={prevDisabled}
          onClick={handlePrev}
          data-slot="data-table-prev"
        >
          Previous
        </Button>
        <Button
          variant="outlined"
          size="small"
          disabled={nextDisabled}
          onClick={handleNext}
          data-slot="data-table-next"
        >
          Next
        </Button>
      </Box>
    </Box>
  );
}
