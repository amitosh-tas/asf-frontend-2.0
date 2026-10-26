import type { ComponentProps } from "react";


type SkeletonProps = ComponentProps<"div">;

export function Skeleton({
  className = "",
  ...props
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-border/60 motion-reduce:animate-none ${className}`}
      {...props}
    />
  );
}

interface StatCardsSkeletonProps {
  count: number;
  className?: string;
}

export function StatCardsSkeleton({
  count,
  className = "grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4",
}: StatCardsSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading statistics"
      className={className}
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="flex min-h-32 min-w-0 flex-col gap-3 rounded-2xl border border-border bg-card p-5"
        >
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="mt-1 h-7 w-1/3" />
          <Skeleton className="h-3 w-3/5" />
        </div>
      ))}
      <span className="sr-only">Loading statistics…</span>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <section
      role="status"
      aria-label="Loading chart"
      className="w-full min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-6"
    >
      <Skeleton className="h-5 w-36" />
      <Skeleton className="mt-2 h-3 w-48 max-w-full" />
      <div className="mt-5 flex h-65 items-end gap-3 border-b border-border px-3">
        {[42, 66, 50, 82, 58, 74, 46, 68, 54, 88, 62, 76].map(
          (height, index) => (
            <Skeleton
              key={index}
              className="flex-1 rounded-t-sm rounded-b-none"
              style={{ height: `${height}%` }}
            />
          ),
        )}
      </div>
      <span className="sr-only">Loading chart…</span>
    </section>
  );
}

export function WorkspaceDetailsSkeleton() {
  return (
    <div role="status" aria-label="Loading workspace details" className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="w-full max-w-sm space-y-2">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-5 w-3/5" />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <Skeleton className="h-5 w-36" />
        <div className="mt-4 space-y-4">
          <div className="flex gap-4 border-b border-border pb-3">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-4 flex-1" />
            ))}
          </div>
          {Array.from({ length: 4 }, (_, rowIndex) => (
            <div
              key={rowIndex}
              className="flex gap-4 border-b border-border pb-3 last:border-0"
            >
              {Array.from({ length: 4 }, (_, columnIndex) => (
                <Skeleton
                  key={columnIndex}
                  className={`h-4 flex-1 ${
                    columnIndex === 1 ? "max-w-56" : "max-w-32"
                  }`}
                />
              ))}
            </div>
          ))}
        </div>
      </section>
      <span className="sr-only">Loading workspace details…</span>
    </div>
  );
}
