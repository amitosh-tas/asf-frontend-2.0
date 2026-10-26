import type { ReactNode } from "react";

interface DocTableProps {
  caption: string;
  columns: readonly string[];
  rows: readonly (readonly ReactNode[])[];
}

export function DocTable({ caption, columns, rows }: DocTableProps) {
  return (
    <div
      role="region"
      aria-label={caption}
      tabIndex={0}
      className="mt-4 overflow-x-auto rounded-xl border border-neutral-200"
    >
      <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-600">
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                scope="col"
                className="border-b border-neutral-200 px-4 py-2.5 font-semibold"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 bg-white">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="align-top">
              {row.map((cell, cellIndex) =>
                cellIndex === 0 ? (
                  <th
                    key={cellIndex}
                    scope="row"
                    className="px-4 py-3 font-normal text-neutral-900"
                  >
                    {cell}
                  </th>
                ) : (
                  <td key={cellIndex} className="px-4 py-3 leading-6 text-neutral-700">
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
