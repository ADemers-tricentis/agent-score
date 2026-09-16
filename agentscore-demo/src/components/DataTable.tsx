import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableSortLabel from "@mui/material/TableSortLabel";
import Paper from "@mui/material/Paper";

export interface DataTableColumn<T> {
  id: string;
  header: string;
  width?: string;
  align?: "left" | "right" | "center";
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => number | string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowId: (row: T) => string;
  getRowTestId?: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyState?: ReactNode;
  enableSorting?: boolean;
}

export default function DataTable<T>({
  columns,
  data,
  getRowId,
  getRowTestId,
  onRowClick,
  emptyState,
  enableSorting = false,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ id: string; dir: "asc" | "desc" } | null>(null);

  const sortedData = useMemo(() => {
    if (!sort) return data;
    const col = columns.find((c) => c.id === sort.id);
    if (!col?.sortValue) return data;
    const withValues = data.map((row) => ({ row, value: col.sortValue!(row) }));
    withValues.sort((a, b) => {
      if (a.value < b.value) return sort.dir === "asc" ? -1 : 1;
      if (a.value > b.value) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
    return withValues.map((w) => w.row);
  }, [data, sort, columns]);

  function handleSort(colId: string) {
    setSort((prev) => {
      if (!prev || prev.id !== colId) return { id: colId, dir: "asc" };
      if (prev.dir === "asc") return { id: colId, dir: "desc" };
      return null;
    });
  }

  if (data.length === 0 && emptyState) {
    return (
      <Paper variant="outlined" sx={{ borderRadius: 1.5 }}>
        {emptyState}
      </Paper>
    );
  }

  const wideTable = columns.length > 6;

  return (
    <Paper variant="outlined" sx={{ borderRadius: 1.5, overflowX: wideTable ? "auto" : "hidden" }}>
      <Table size="small" sx={{ tableLayout: "fixed", minWidth: wideTable ? columns.length * 130 : undefined }}>
        <TableHead>
          <TableRow sx={{ bgcolor: "action.hover" }}>
            {columns.map((col) => (
              <TableCell
                key={col.id}
                align={col.align ?? "left"}
                sx={{
                  fontWeight: 600, color: "text.secondary", width: col.width,
                  ...(wideTable ? { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } : {}),
                }}
              >
                {enableSorting && col.sortValue ? (
                  <TableSortLabel
                    active={sort?.id === col.id}
                    direction={sort?.id === col.id ? sort.dir : "asc"}
                    onClick={() => handleSort(col.id)}
                  >
                    {col.header}
                  </TableSortLabel>
                ) : (
                  col.header
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedData.map((row) => (
            <TableRow
              key={getRowId(row)}
              data-testid={getRowTestId?.(row)}
              hover={Boolean(onRowClick)}
              onClick={() => onRowClick?.(row)}
              sx={{ cursor: onRowClick ? "pointer" : "default", "&:last-child td": { borderBottom: 0 } }}
            >
              {columns.map((col) => (
                <TableCell key={col.id} align={col.align ?? "left"} sx={{ width: col.width }}>
                  {col.render(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}
