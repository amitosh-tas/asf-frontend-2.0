import { useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";

import {
  getReportsSummary,
  getReportChannels,
  getReportCampaigns,
  getReportLocations,
  getReportTrend,
  getReportCustomers,
  getWorkspaceDashboard,
  type ReportsParams,
} from "../services/companyServices"

type ApiResult = {
  status?: number;
  data?: unknown;
  error?: string;
};

type ApiTest = {
  key: string;
  label: string;
  description: string;
  run: (params: ReportsParams) => Promise<unknown>;
};

function getDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDefaultDates() {
  const to = new Date();
  const from = new Date(to);

  from.setDate(from.getDate() - 29);

  return {
    from: getDateString(from),
    to: getDateString(to),
  };
}

const defaultDates = getDefaultDates();

const apiTests: ApiTest[] = [
  {
    key: "summary",
    label: "Reports Summary",
    description: "GET /v1/reports/summary",
    run: (params) => getReportsSummary(params),
  },
  {
    key: "channels",
    label: "Report Channels",
    description: "GET /v1/reports/channels",
    run: (params) => getReportChannels(params),
  },
  {
    key: "campaigns",
    label: "Report Campaigns",
    description: "GET /v1/reports/campaigns",
    run: (params) => getReportCampaigns(params),
  },
  {
    key: "locations",
    label: "Report Locations",
    description: "GET /v1/reports/locations",
    run: (params) => getReportLocations(params),
  },
  {
    key: "trend",
    label: "Report Trend",
    description: "GET /v1/reports/trend",
    run: (params) => getReportTrend(params),
  },
  {
    key: "customers",
    label: "Report Customers",
    description: "GET /v1/reports/customers",
    run: (params) => getReportCustomers(params),
  },
  {
    key: "dashboard",
    label: "Workspace Dashboard",
    description: "GET /api/workspace/dashboard",
    run: () => getWorkspaceDashboard(),
  },
];

export default function ReportsApiTester() {
  const [from, setFrom] = useState(defaultDates.from);
  const [to, setTo] = useState(defaultDates.to);
  const [model, setModel] = useState("last_non_direct");
  const [locationId, setLocationId] = useState("");

  const [results, setResults] = useState<Record<string, ApiResult>>({});
  const [loading, setLoading] = useState<string[]>([]);

  const dateRangeInvalid = !from || !to || from > to;

  function downloadAllResponses() {
    const exportData = {
      exportedAt: new Date().toISOString(),
      filters: {
        from,
        to,
        model: model || undefined,
        locationId: locationId || undefined,
      },
      responses: apiTests.map((test) => ({
        endpoint: test.description,
        name: test.label,
        status: results[test.key]?.status ?? null,
        data: results[test.key]?.data ?? null,
        error: results[test.key]?.error ?? null,
        tested: Boolean(results[test.key]),
      })),
    };

    const blob = new Blob(
      [JSON.stringify(exportData, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `reports-api-responses-${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.json`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  function buildParams(): ReportsParams {
    return {
      from,
      to,
      ...(model ? { model } : {}),
      ...(locationId.trim() ? { locationId: locationId.trim() } : {}),
    };
  }

  async function testApi(test: ApiTest) {
    if (dateRangeInvalid && test.key !== "dashboard") {
      setResults((previous) => ({
        ...previous,
        [test.key]: {
          error: "Please provide a valid start date and end date.",
        },
      }));
      return;
    }

    setLoading((previous) =>
      previous.includes(test.key) ? previous : [...previous, test.key]
    );

    try {
      const response = await test.run(buildParams()) as {
        status?: number;
        data?: unknown;
      };

      setResults((previous) => ({
        ...previous,
        [test.key]: {
          status: response.status,
          data: response.data,
        },
      }));
    } catch (error: unknown) {
      const err = error as {
        message?: string;
        response?: {
          status?: number;
          data?: unknown;
        };
      };

      setResults((previous) => ({
        ...previous,
        [test.key]: {
          status: err.response?.status,
          data: err.response?.data,
          error:
            err.message ?? "An unknown error occurred while calling the API.",
        },
      }));
    } finally {
      setLoading((previous) =>
        previous.filter((key) => key !== test.key)
      );
    }
  }

  async function testAllApis() {
    // Calls all seven endpoints independently.
    await Promise.all(apiTests.map((test) => testApi(test)));
  }

  function clearResults() {
    setResults({});
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              Reports API Tester
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Test reporting endpoints and inspect their raw responses.
            </p>
          </div>

          <button
            type="button"
            onClick={downloadAllResponses}
            disabled={Object.keys(results).length === 0}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Download All Responses
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={clearResults}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-100"
            >
              Clear Results
            </button>

            <button
              type="button"
              onClick={testAllApis}
              disabled={loading.length > 0 || dateRangeInvalid}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Test All APIs
            </button>
          </div>
        </header>

        {/* Shared report filters */}
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold">
            Request Filters
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-1 text-sm">
              <span className="font-medium">From</span>
              <input
                type="date"
                value={from}
                max={to || undefined}
                onChange={(event) => setFrom(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium">To</span>
              <input
                type="date"
                value={to}
                min={from || undefined}
                max={getDateString(new Date())}
                onChange={(event) => setTo(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium">Attribution Model</span>
              <select
                value={model}
                onChange={(event) => setModel(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
              >
                <option value="last_non_direct">Last Non-Direct</option>
                <option value="">Workspace Default</option>
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium">Location ID (optional)</span>
              <input
                type="text"
                value={locationId}
                onChange={(event) => setLocationId(event.target.value)}
                placeholder="Enter a location ID"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          </div>

          {dateRangeInvalid && (
            <p className="mt-3 text-sm text-red-600">
              Select a valid date range. The start date must not be after
              the end date.
            </p>
          )}

          <p className="mt-3 text-xs text-slate-500">
            Reporting requests use the selected dates and optional filters.
            The workspace dashboard request does not use these filters.
          </p>
        </section>

        {/* Endpoint cards */}
        <section className="grid gap-4 lg:grid-cols-2">
          {apiTests.map((test) => {
            const result = results[test.key];
            const isLoading = loading.includes(test.key);

            return (
              <article
                key={test.key}
                className="min-w-0 rounded-xl border border-slate-200 bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-semibold">{test.label}</h2>
                    <code className="mt-1 block break-all text-xs text-slate-500">
                      {test.description}
                    </code>
                  </div>

                  <button
                    type="button"
                    onClick={() => testApi(test)}
                    disabled={
                      isLoading ||
                      (test.key !== "dashboard" && dateRangeInvalid)
                    }
                    className="shrink-0 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span
                        role="status"
                        aria-label={`Testing ${test.label}`}
                        className="inline-flex w-16"
                      >
                        <Skeleton className="h-4 w-full bg-white/30" />
                      </span>
                    ) : (
                      "Test API"
                    )}
                  </button>
                </div>

                {result && (
                  <div className="mt-4 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {result.status !== undefined && (
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            result.status >= 200 && result.status < 300
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          HTTP {result.status}
                        </span>
                      )}

                      {result.error && (
                        <span className="text-sm text-red-600">
                          {result.error}
                        </span>
                      )}
                    </div>

                    {result.data !== undefined && (
                      <pre className="max-h-96 overflow-auto rounded-lg bg-slate-950 p-4 text-xs leading-5 text-green-300">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    )}

                    {result.error && result.data === undefined && (
                      <pre className="max-h-96 overflow-auto rounded-lg bg-red-50 p-4 text-xs text-red-700">
                        {result.error}
                      </pre>
                    )}
                  </div>
                )}

                {!result && !isLoading && (
                  <p className="mt-4 text-sm text-slate-400">
                    No response yet. Click Test API to begin.
                  </p>
                )}
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}