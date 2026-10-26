
import { useEffect, useRef, useState } from "react";
import {
  getPresetDateRange,
  getTodayDate,
  isValidDateRange,
  type DateRange,
  type DateRangePreset,
} from "../utils/dateRange";
import { useReportTimeZone } from "../utils/timezone";

interface ReportFiltersProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  locationId?: string;
  onLocationChange: (locationId?: string) => void;
  locations?: Array<{ id: string; name: string }>;
  locationsLoading?: boolean;
}

const presets: {
  label: Exclude<DateRangePreset, "custom">;
  days: 7 | 14 | 30 | 90;
}[] = [
  { label: "7D", days: 7 },
  { label: "14D", days: 14 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
];

export default function ReportFilters({
  dateRange,
  onDateRangeChange,
  locationId,
  onLocationChange,
  locations = [],
  locationsLoading = false,
}: ReportFiltersProps) {
  const [selectedPreset, setSelectedPreset] =
    useState<DateRangePreset>("30D");
  const [customRange, setCustomRange] = useState(dateRange);
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);
  const reportTimeZone = useReportTimeZone();

  const today = getTodayDate(reportTimeZone);
  const customRangeValid = isValidDateRange(customRange, today);

  // Keep the selected preset in sync when the applied date range changes.
  useEffect(() => {
    const matchingPreset = presets.find((preset) => {
      const range = getPresetDateRange(preset.days, new Date(), reportTimeZone);
      return range.from === dateRange.from && range.to === dateRange.to;
    });

    setSelectedPreset(matchingPreset?.label ?? "custom");
    setCustomRange(dateRange);
  }, [dateRange.from, dateRange.to, reportTimeZone]);

  // Close the popover when clicking outside it.
  useEffect(() => {
    if (!isCustomOpen) return;

    function handleOutsideClick(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setCustomRange(dateRange);
        setIsCustomOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setCustomRange(dateRange);
        setIsCustomOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isCustomOpen, dateRange]);

  const selectPreset = (preset: (typeof presets)[number]) => {
    const range = getPresetDateRange(preset.days, new Date(), reportTimeZone);

    setSelectedPreset(preset.label);
    setCustomRange(range);
    setIsCustomOpen(false);
    onDateRangeChange(range);
  };

  const updateCustomRange = (key: keyof DateRange, value: string) => {
    setCustomRange((current) => ({ ...current, [key]: value }));
  };

  const openCustomRange = () => {
    setCustomRange(dateRange);
    setIsCustomOpen(true);
  };

  const cancelCustomRange = () => {
    setCustomRange(dateRange);
    setIsCustomOpen(false);
  };

  const applyCustomRange = () => {
    if (!customRangeValid) return;

    setSelectedPreset("custom");
    onDateRangeChange(customRange);
    setIsCustomOpen(false);
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <div className="relative" ref={popoverRef}>
        <div
          aria-label="Date range"
          className="inline-flex shrink-0 flex-nowrap rounded-full border border-border bg-transparent p-1"
          role="group"
        >
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              aria-pressed={selectedPreset === preset.label}
              onClick={() => selectPreset(preset)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                selectedPreset === preset.label
                  ? "bg-primary text-white"
                  : "text-text-muted hover:bg-hover hover:text-text"
              }`}
            >
              {preset.label}
            </button>
          ))}

          <button
            type="button"
            aria-pressed={selectedPreset === "custom"}
            aria-expanded={isCustomOpen}
            onClick={() => {
              if (isCustomOpen) {
                cancelCustomRange();
              } else {
                openCustomRange();
              }
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              selectedPreset === "custom"
                ? "bg-primary text-white"
                : "text-text-muted hover:bg-hover hover:text-text"
            }`}
          >
            Custom Range
          </button>
        </div>

        {isCustomOpen && (
          <div
            role="dialog"
            aria-label="Choose custom date range"
            className="absolute right-0 top-full z-50 mt-2 w-[min(340px,calc(100vw-2rem))] rounded-xl border border-border bg-card p-4 shadow-xl"
          >
            <h3 className="mb-4 text-sm font-semibold text-text">
              Custom date range
            </h3>

            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5 text-xs font-medium text-text-muted">
                Start date
                <input
                  type="date"
                  value={customRange.from}
                  max={customRange.to || today}
                  onChange={(event) =>
                    updateCustomRange("from", event.target.value)
                  }
                  className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-text"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-xs font-medium text-text-muted">
                End date
                <input
                  type="date"
                  value={customRange.to}
                  min={customRange.from || undefined}
                  max={today}
                  onChange={(event) =>
                    updateCustomRange("to", event.target.value)
                  }
                  className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-text"
                />
              </label>
            </div>

            {!customRangeValid && (
              <p role="alert" className="mt-3 text-xs text-danger">
                Choose a valid date range that ends today or earlier.
              </p>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={cancelCustomRange}
                className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-hover hover:text-text"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!customRangeValid}
                onClick={applyCustomRange}
                className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Apply range
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <label
          htmlFor="report-location"
          className="text-xs font-medium text-text-muted"
        >
          Location
        </label>

        <select
          id="report-location"
          value={locationId ?? ""}
          onChange={(event) =>
            onLocationChange(event.target.value || undefined)
          }
          disabled={locationsLoading}
          className="max-w-56 rounded-full border border-border bg-transparent px-3 py-2 text-sm text-text disabled:cursor-wait disabled:opacity-60"
        >
          <option value="">
            {locationsLoading ? "Loading locations..." : "All locations"}
          </option>

          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
      </div>
      {reportTimeZone && (
        <p className="w-full text-right text-xs text-text-muted">
          Days follow your company timezone ({reportTimeZone}).
        </p>
      )}
    </div>
  );
}
