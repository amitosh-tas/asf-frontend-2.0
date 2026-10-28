import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";
import { getPresetDateRange, type DateRange } from "@/features/reports/utils/dateRange";
import { api } from "@/services/api";
import { fetchReport, fetchList, type AttributionModel, type ReportName, type ReportQuery } from "@/services/insights";

/** Platform admins "view as" a company under /super/workspaces/:id/view/*; company users have no id. */
export function useViewWorkspaceId(): string | undefined {
  const { id } = useParams<{ id: string }>();
  return id;
}

export interface ReportFiltersState {
  range: DateRange;
  model?: AttributionModel;
  locationId?: string;
  channel?: string;
  /** show money in this currency instead of the company's reporting currency (viewer's choice) */
  currency?: string;
}

const STORAGE_KEY = "report-filters";
const CURRENCY_KEY = "report-currency"; // remembered across visits, per browser

function readCurrency(): string | undefined {
  try {
    const v = localStorage.getItem(CURRENCY_KEY);
    return v && /^[A-Z]{3}$/.test(v) ? v : undefined;
  } catch {
    return undefined;
  }
}

function readStored(): Partial<ReportFiltersState> {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

/** Shared filters (date range, model, location, channel) that follow the user from screen to screen. */
export function useReportFilters(defaultDays: 7 | 14 | 30 | 90 = 30) {
  const [filters, setFilters] = useState<ReportFiltersState>(() => {
    const stored = readStored();
    return { range: stored.range ?? getPresetDateRange(defaultDays), model: stored.model, locationId: stored.locationId, channel: undefined, currency: readCurrency() };
  });
  const update = (patch: Partial<ReportFiltersState>) =>
    setFilters((current) => {
      const next = { ...current, ...patch };
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ range: next.range, model: next.model, locationId: next.locationId }));
        if ("currency" in patch) {
          if (next.currency) localStorage.setItem(CURRENCY_KEY, next.currency);
          else localStorage.removeItem(CURRENCY_KEY);
        }
      } catch {
        /* storage unavailable: filters just don't persist */
      }
      return next;
    });
  const query: ReportQuery = { from: filters.range.from, to: filters.range.to, model: filters.model, locationId: filters.locationId, channel: filters.channel, currency: filters.currency };
  return { filters, update, query };
}

export interface AsyncState<T> {
  data?: T;
  error?: string;
  loading: boolean;
  reload: () => void;
}

/** Fetch a report; refetches when the query (serialised) or the workspace changes. */
export function useReport<T>(name: ReportName, query: ReportQuery, workspaceId?: string, enabled = true): AsyncState<T> {
  return useAsync<T>(() => fetchReport<T>(name, query, workspaceId), [name, JSON.stringify(query), workspaceId], enabled);
}

export function useList<T>(url: string, query: ReportQuery, enabled = true): AsyncState<T> {
  return useAsync<T>(() => fetchList<T>(url, query), [url, JSON.stringify(query)], enabled);
}

export function useAsync<T>(load: () => Promise<T>, deps: unknown[], enabled = true): AsyncState<T> {
  const [state, setState] = useState<{ key: string; data?: T; error?: string }>({ key: "" });
  const [counter, setCounter] = useState(0);
  const key = JSON.stringify([deps, counter, enabled]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    load().then(
      (data) => {
        if (!cancelled) setState({ key, data });
      },
      (error: unknown) => {
        if (!cancelled) setState({ key, error: getRequestErrorMessage(error) });
      },
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const current = state.key === key ? state : undefined;
  return {
    data: current?.data ?? state.data,
    error: current?.error,
    loading: enabled && current === undefined,
    reload: () => setCounter((c) => c + 1),
  };
}

/** Locations for the filter: the company's list, or (view-as) the ones the locations report knows. */
export function useLocationOptions(workspaceId?: string) {
  return useAsync<{ id: string; name: string }[]>(async () => {
    if (!workspaceId) {
      const { data } = await api.get<{ data: { id: string; name: string; isActive?: boolean }[] }>("/api/workspace/locations");
      return data.data.filter((l) => l.isActive !== false).map((l) => ({ id: l.id, name: l.name }));
    }
    const rows = await fetchReport<{ data: { locationId: string | null; locationName: string }[] }>("locations", { ...getPresetDateRange(90) }, workspaceId);
    return rows.data.filter((r) => r.locationId).map((r) => ({ id: r.locationId as string, name: r.locationName }));
  }, [workspaceId]);
}
