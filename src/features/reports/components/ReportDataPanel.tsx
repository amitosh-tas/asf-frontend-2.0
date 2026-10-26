interface ReportDataPanelProps {
  title: string;
  data: unknown;
  loading: boolean;
  error: string;
}

export default function ReportDataPanel({
  title,
  data,
  loading,
  error,
}: ReportDataPanelProps) {
  return (
    <section
      aria-busy={loading}
      className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card"
    >
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="font-heading text-base font-semibold tracking-tight text-text">
          {title}
        </h2>
      </div>
      <div className="max-h-120 overflow-auto p-5 sm:p-6">
        {loading ? (
          <div
            role="status"
            aria-label={`Loading ${title.toLowerCase()}`}
            className="space-y-3"
          >
            {Array.from({ length: 7 }, (_, index) => (
              <Skeleton
                key={index}
                className={`h-3 ${index % 3 === 0 ? "w-4/5" : "w-full"}`}
              />
            ))}
          </div>
        ) : error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : data === undefined || data === null ? (
          <p className="text-sm text-text-muted">No report data returned.</p>
        ) : (
          <pre className="overflow-x-auto whitespace-pre-wrap wrap-break-word text-xs leading-5 text-text">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    </section>
  );
}
import { Skeleton } from "@/components/ui/Skeleton";
