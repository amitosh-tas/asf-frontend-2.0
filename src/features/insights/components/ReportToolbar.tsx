import { useState } from "react";
import toast from "react-hot-toast";
import ReportFilters from "@/features/reports/components/ReportFilters";
import Button from "@/components/ui/Button";
import { ATTRIBUTION_MODELS, downloadCsv, type AttributionModel, type ReportQuery } from "@/services/insights";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";
import { formatDateTime } from "@/features/reports/utils/formatting";
import type { ReportFiltersState } from "../hooks/useReport";
import { useLocationOptions } from "../hooks/useReport";

interface ReportToolbarProps {
  filters: ReportFiltersState;
  onChange: (patch: Partial<ReportFiltersState>) => void;
  workspaceId?: string;
  showModel?: boolean;
  /** When set, an "Export CSV" button downloads this URL with the current filters. */
  csv?: { url: string; query: ReportQuery; filename: string };
  lastUpdated?: string;
  defaultModel?: AttributionModel;
}

/** Date range, location, attribution model, export and "last updated" — the same on every screen (section 5). */
export default function ReportToolbar({ filters, onChange, workspaceId, showModel = true, csv, lastUpdated, defaultModel }: ReportToolbarProps) {
  const locations = useLocationOptions(workspaceId);
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

  return (
    <div className="mb-6 flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-end gap-3">
        {showModel && (
          <label className="flex items-center gap-2 text-xs font-medium text-text-muted">
            Model
            <select
              value={filters.model ?? defaultModel ?? ""}
              onChange={(event) => onChange({ model: (event.target.value || undefined) as AttributionModel | undefined })}
              className="rounded-full border border-border bg-transparent px-3 py-2 text-sm text-text"
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
      <ReportFilters
        dateRange={filters.range}
        onDateRangeChange={(range) => onChange({ range })}
        locationId={filters.locationId}
        onLocationChange={(locationId) => onChange({ locationId })}
        locations={locations.data ?? []}
        locationsLoading={locations.loading}
      />
      {lastUpdated && <p className="text-right text-xs text-text-muted">Last updated {formatDateTime(lastUpdated)}</p>}
    </div>
  );
}
