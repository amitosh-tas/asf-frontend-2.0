import { formatMajorUnits } from "@/features/reports/utils/formatting";
import { Skeleton } from "@/components/ui/Skeleton";

interface IAnalytics {
  revenue?: string;
  exclTax?: string;
  tax?: string;
  invoices?: number;
  currency?: string;
  description?: string;
  loading?: boolean;
}

function Analytics({
  revenue,
  exclTax,
  tax,
  invoices = 0,
  currency,
  description,
  loading = false,
}: IAnalytics) {
  if (loading) {
    return (
      <section
        role="status"
        aria-label="Loading revenue summary"
        className="flex min-h-36 flex-col gap-5 rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6 lg:flex-row lg:items-end lg:justify-between"
      >
        <div className="w-full max-w-sm space-y-3">
          <Skeleton className="h-10 w-3/4 sm:h-12" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Skeleton className="h-12 w-full max-w-64" />
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-5 rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <p className="font-heading text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
          {revenue === undefined || !currency
            ? "—"
            : formatMajorUnits(revenue, currency)}
        </p>

        <p className="mt-2 text-sm text-text-muted">
          {exclTax === undefined || tax === undefined || !currency
            ? "Revenue breakdown unavailable"
            : `${formatMajorUnits(exclTax, currency)} excl. tax · ${formatMajorUnits(tax, currency)} tax`}
        </p>
      </div>

      <div className="max-w-64 text-sm leading-6 text-text-muted">
        {description ?? (
          <>
            Revenue across{" "}
            <span className="font-medium tabular-nums text-text">
              {invoices.toLocaleString()} invoices
            </span>
            .
          </>
        )}
      </div>
    </div>
  );
}

export default Analytics;