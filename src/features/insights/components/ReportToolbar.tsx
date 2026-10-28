import { useState } from "react";
import toast from "react-hot-toast";
import ReportFilters from "@/features/reports/components/ReportFilters";
import Button from "@/components/ui/Button";
import { ATTRIBUTION_MODELS, downloadCsv, type AttributionModel, type FxInfo, type ReportQuery } from "@/services/insights";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";
import { formatDateTime } from "@/features/reports/utils/formatting";
import type { ReportFiltersState } from "../hooks/useReport";
import { useAsync, useLocationOptions } from "../hooks/useReport";
import { api } from "@/services/api";

/** The company's reporting currency, for the "Company currency (INR)" label (read once per page load). */
let companyCurrencyRequest: Promise<string | null> | null = null;
function useCompanyCurrency(workspaceId?: string) {
  const res = useAsync<string | null>(async () => {
    if (workspaceId) return null; // view-as: platform admins have no company of their own
    companyCurrencyRequest ??= api
      .get<{ workspace?: { reportingCurrency?: string } | null }>("/api/auth/me")
      .then((r) => r.data.workspace?.reportingCurrency ?? null)
      .catch(() => null);
    return companyCurrencyRequest;
  }, [workspaceId]);
  return res.data ?? null;
}

interface ReportToolbarProps {
  filters: ReportFiltersState;
  onChange: (patch: Partial<ReportFiltersState>) => void;
  workspaceId?: string;
  showModel?: boolean;
  /** When set, an "Export CSV" button downloads this URL with the current filters. */
  csv?: { url: string; query: ReportQuery; filename: string };
  lastUpdated?: string;
  defaultModel?: AttributionModel;
  /** which exchange rates the money figures use (the report's `fx` block) */
  fx?: FxInfo | null;
  /** show the "View in" currency picker (default true) */
  showCurrency?: boolean;
}

/** Currencies offered in the "View in" picker (all converted with the hourly public FX rates). */
export const VIEW_CURRENCIES = ["USD", "INR", "EUR", "GBP", "AED", "SAR", "SGD", "AUD", "CAD", "JPY", "CHF", "NZD", "ZAR", "QAR", "KWD", "MYR", "THB", "IDR", "PHP", "HKD", "CNY", "BRL", "MXN"];

/** Date range, location, attribution model, export and "last updated" — the same on every screen (section 5). */
export default function ReportToolbar({ filters, onChange, workspaceId, showModel = true, csv, lastUpdated, defaultModel, fx, showCurrency = true }: ReportToolbarProps) {
  const locations = useLocationOptions(workspaceId);
  const companyCurrency = useCompanyCurrency(workspaceId);
  const [exporting, setExporting] = useState(false);

  const exportCsv = async () => {
    if (!csv) return;
    setExporting(true);
    try {
      await downloadCsv(csv.url, csv.query, csv.filename);
    } catch (error) {
      toast.error(getRequestErrorMessage(error));
    } finally {
      setExporting(false);
    }
  };

  // Rendered in <PageLayout actions={…}> (top right of the page header), like the original filters.
  return (
    <div className="flex w-full flex-col items-end gap-2 md:w-auto">
      <ReportFilters
        dateRange={filters.range}
        onDateRangeChange={(range) => onChange({ range })}
        locationId={filters.locationId}
        onLocationChange={(locationId) => onChange({ locationId })}
        locations={locations.data ?? []}
        locationsLoading={locations.loading}
      />
      {(showModel || csv || showCurrency) && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {showCurrency && (
            <label className="flex items-center gap-2 text-xs font-medium text-text-muted">
              View in
              <select
                aria-label="Currency"
                value={filters.currency ?? ""}
                onChange={(event) => onChange({ currency: event.target.value || undefined })}
                className="rounded-full border border-border bg-transparent px-3 py-1.5 text-sm text-text"
              >
                <option value="">Company currency{companyCurrency ? ` (${companyCurrency})` : ""}</option>
                {VIEW_CURRENCIES.filter((c) => c !== companyCurrency).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          )}
          {showModel && (
            <label className="flex items-center gap-2 text-xs font-medium text-text-muted">
              Model
              <select
                value={filters.model ?? defaultModel ?? ""}
                onChange={(event) => onChange({ model: (event.target.value || undefined) as AttributionModel | undefined })}
                className="rounded-full border border-border bg-transparent px-3 py-1.5 text-sm text-text"
              >
                {!defaultModel && <option value="">Company default</option>}
                {ATTRIBUTION_MODELS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          {csv && (
            <Button type="button" variant="outline" size="sm" loading={exporting} onClick={exportCsv}>
              Export CSV
            </Button>
          )}
        </div>
      )}
      {lastUpdated && <p className="text-xs text-text-muted">Last updated {formatDateTime(lastUpdated)}</p>}
      {fx && <FxNote fx={fx} />}
    </div>
  );
}

/** "Today's rates (as of 27 Oct)" / "Rates of each sale's date": what the money figures were converted with. */
export function FxNote({ fx }: { fx: FxInfo }) {
  const asOf = fx.ratesAsOf ? new Date(`${fx.ratesAsOf}T00:00:00Z`).toLocaleDateString(undefined, { day: "numeric", month: "short", timeZone: "UTC" }) : null;
  const text =
    fx.mode === "latest"
      ? `Converted to ${fx.reportingCurrency} at today's exchange rates${asOf ? ` (as of ${asOf})` : ""}`
      : `Converted to ${fx.reportingCurrency} at each sale's and booking's own-date exchange rate`;
  return (
    <p className="text-xs text-text-muted" title="Rates update automatically every hour (ECB reference rates). Change this under Settings → Company profile.">
      {text}
    </p>
  );
}
