import { useState } from "react";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";

export interface DataTablePagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
}

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
}

interface DataTableProps<T> {
  tableHead?: string;
  tableSubHead?: string;
  columns: DataTableColumn<T>[];
  data: T[];
  getRowKey: (row: T) => string | number;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  loading?: boolean;

  // Optional toolbar / filter controls
  filters?: ReactNode;
  pagination?: DataTablePagination;
}

export default function DataTable<T>({
  tableHead,
  tableSubHead,
  columns,
  data,
  getRowKey,
  emptyMessage = "No data available.",
  onRowClick,
  loading = false,
  filters,
  pagination,
}: DataTableProps<T>) {
  const [internalPage, setInternalPage] = useState(1);
  const pageSize = 10;
  const useInternalPagination = !pagination;
  const totalPages = Math.ceil(data.length / pageSize);
  const displayedData = pagination
    ? data
    : data.slice(
      (internalPage - 1) * pageSize,
      internalPage * pageSize
    );

  const alignment = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <section
      aria-busy={loading}
      className="w-full min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
    >
      {loading && (
        <span role="status" className="sr-only">
          Loading table data…
        </span>
      )}
      {/* Table header */}
      {(tableHead || tableSubHead) && (
        <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border px-5 py-4 sm:px-6">
          {tableHead && (
            <h2 className="font-heading text-base font-semibold tracking-tight text-text">
              {tableHead}
            </h2>
          )}

          {tableSubHead && (
            <p className="text-xs text-text-muted">
              {tableSubHead}
            </p>
          )}
        </div>
      )}

      {/* Optional filters / toolbar */}
      {filters && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
          {filters}
        </div>
      )}

      {/* Table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-140 border-collapse text-sm">
          <thead>
            <tr className="border-y border-border bg-surface-muted/60">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={[
                    "px-4 py-3 text-[10px] font-semibold uppercase",
                    "tracking-[0.08em] text-text-muted",
                    alignment[column.align ?? "left"],
                    column.className ?? "",
                  ].join(" ")}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: 5 }, (_, rowIndex) => (
                <tr
                  key={`skeleton-${rowIndex}`}
                  aria-hidden="true"
                  className="border-b border-border last:border-b-0"
                >
                  {columns.map((column, columnIndex) => (
                    <td
                      key={column.key}
                      className={[
                        "px-4 py-4 align-middle",
                        alignment[column.align ?? "left"],
                      ].join(" ")}
                    >
                      <Skeleton
                        className={`h-4 ${columnIndex === 0 ? "w-3/4" : "w-2/3"
                          }`}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : displayedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-text-muted"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              displayedData.map((row) => (
                <tr
                  key={getRowKey(row)}
                  onClick={
                    onRowClick
                      ? () => onRowClick(row)
                      : undefined
                  }
                  className={[
                    "border-b border-border last:border-b-0",
                    "transition-colors hover:bg-neutral-50",
                    onRowClick ? "cursor-pointer" : "",
                  ].join(" ")}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={[
                        "px-4 py-3.5 align-middle text-text",
                        alignment[column.align ?? "left"],
                        column.className ?? "",
                      ].join(" ")}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pagination ? (
        <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs text-text-muted">
            {pagination.total === 0
              ? "No results"
              : `Showing ${(pagination.page - 1) * pagination.limit + 1
              }–${Math.min(
                pagination.page * pagination.limit,
                pagination.total
              )} of ${pagination.total} entries`}
          </p>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pagination.isLoading || pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              Previous
            </Button>

            <span className="px-2 text-xs text-text-muted">
              Page {pagination.page} of {Math.max(pagination.pages, 1)}
            </span>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={
                pagination.isLoading ||
                pagination.page >= pagination.pages
              }
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : useInternalPagination && data.length > pageSize ? (
        <div className="flex items-center justify-between border-t border-border px-5 py-4 sm:px-6">
          <p className="text-xs text-text-muted">
            Showing {Math.min((internalPage - 1) * pageSize + 1, data.length)}
            –{Math.min(internalPage * pageSize, data.length)} of {data.length} entries
          </p>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={internalPage <= 1}
              onClick={() => setInternalPage((page) => page - 1)}
            >
              Previous
            </Button>

            <span className="px-2 text-xs text-text-muted">
              Page {internalPage} of {totalPages}
            </span>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={internalPage >= totalPages}
              onClick={() => setInternalPage((page) => page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}