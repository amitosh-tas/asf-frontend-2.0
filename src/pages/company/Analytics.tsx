import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { DataTableColumn } from "@/components/ui/DataTable";
import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import PageLayout from "@/components/layout/PageLayout";
import Pill from "@/components/ui/Pill";
import { StatCardsSkeleton } from "@/components/ui/Skeleton";
import AnalyticsGrid from "@/features/analytics/components/AnalyticsGrid";
import AvgOrderValueTrend from "@/features/analytics/components/AvgOrderValueTrend";
import NewCustomersTrend from "@/features/analytics/components/NewCustomerTrend";
import ReportFilters from "@/features/reports/components/ReportFilters";
import {
  getPresetDateRange,
  type DateRange,
} from "@/features/reports/utils/dateRange";
import {
  formatMinorUnits,
  formatReportDate,
} from "@/features/reports/utils/formatting";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";
import toast from "react-hot-toast";
import {
  getReportChannels,
  getReportCustomers,
  getReportLocations,
  getReportTrend,
  getReportsSummary,
  type ReportChannel,
  type ReportCustomerSummary,
  type ReportLocation,
  type ReportTrendPoint,
  type ReportsParams,
  type ReportsSummary,
} from "@/services/companyServices";
import {
  viewReportChannels,
  viewReportCustomers,
  viewReportLocations,
  viewReportSummary,
  viewReportTrend,
} from "@/services/viewonlyService";

interface AnalyticsResult {
  key: string;
  trend: ReportTrendPoint[];
  customerSummary?: ReportCustomerSummary;
  channels: ReportChannel[];
  locations: ReportLocation[];
  allLocations: ReportLocation[];
  summary?: ReportsSummary;
  errors: {
    trend?: string;
    customers?: string;
    channels?: string;
    locations?: string;
    summary?: string;
  };
}

const emptyResult: Omit<AnalyticsResult, "key" | "errors"> = {
  trend: [],
  channels: [],
  locations: [],
  allLocations: [],
};

function Analytics() {
  const { id: workspaceId } = useParams<{ id: string }>();
  const [dateRange, setDateRange] = useState<DateRange>(() =>
    getPresetDateRange(30),
  );
  const { from, to } = dateRange;
  const [locationId, setLocationId] = useState<string>();
  const requestKey = `${from}:${to}:${locationId ?? ""}`;
  const [result, setResult] = useState<AnalyticsResult>();
  const currentResult = result?.key === requestKey ? result : undefined;
  const trend = currentResult?.trend ?? [];
  const customerSummary = currentResult?.customerSummary;
  const channels = currentResult?.channels ?? [];
  const locations = currentResult?.locations ?? [];
  const allLocations = currentResult?.allLocations ?? [];
  const summary = currentResult?.summary;
  const errors = currentResult?.errors ?? {};
  const loading = currentResult === undefined;

  useEffect(() => {
    let cancelled = false;
    const key = `${from}:${to}:${locationId ?? ""}`;
    const params: ReportsParams = {
      from,
      to,
      model: "last_non_direct",
      ...(locationId ? { locationId } : {}),
    };
    const locationParams: ReportsParams = {
      from,
      to,
      model: "last_non_direct",
    };
    const locationsRequest = workspaceId
      ? viewReportLocations(workspaceId, params)
      : getReportLocations(params);
    const allLocationsRequest = locationId
      ? workspaceId
        ? viewReportLocations(workspaceId, locationParams)
        : getReportLocations(locationParams)
      : locationsRequest;
    const requests = Promise.allSettled([
      workspaceId
        ? viewReportTrend(workspaceId, params)
        : getReportTrend(params),
      workspaceId
        ? viewReportCustomers(workspaceId, params)
        : getReportCustomers(params),
      locationsRequest,
      allLocationsRequest,
      workspaceId
        ? viewReportChannels(workspaceId, params)
        : getReportChannels(params),
      workspaceId
        ? viewReportSummary(workspaceId, params)
        : getReportsSummary(params),
    ]);

    void requests.then(
      ([
        trendResult,
        customerResult,
        locationResult,
        allLocationResult,
        channelsResult,
        summaryResult,
      ]) => {
        if (cancelled) return;
        const failedRequests = [
          trendResult.status === "rejected" ? "trend" : undefined,
          customerResult.status === "rejected" ? "customer analytics" : undefined,
          locationResult.status === "rejected" ? "locations" : undefined,
          allLocationResult.status === "rejected" && locationId
            ? "location filters"
            : undefined,
          channelsResult.status === "rejected" ? "channel reports" : undefined,
          summaryResult.status === "rejected" ? "report summary" : undefined,
        ].filter((request): request is string => request !== undefined);
        if (failedRequests.length > 0) {
          const messages = [
            trendResult.status === "rejected"
              ? getRequestErrorMessage(trendResult.reason)
              : undefined,
            customerResult.status === "rejected"
              ? getRequestErrorMessage(customerResult.reason)
              : undefined,
            locationResult.status === "rejected"
              ? getRequestErrorMessage(locationResult.reason)
              : undefined,
            allLocationResult.status === "rejected"
              ? getRequestErrorMessage(allLocationResult.reason)
              : undefined,
            channelsResult.status === "rejected"
              ? getRequestErrorMessage(channelsResult.reason)
              : undefined,
            summaryResult.status === "rejected"
              ? getRequestErrorMessage(summaryResult.reason)
              : undefined,
          ].filter((message): message is string => message !== undefined);
          toast.error(messages.join(", "));
        }

        setResult({
          key,
          trend:
            trendResult.status === "fulfilled" ? trendResult.value.data.data : [],
          customerSummary:
            customerResult.status === "fulfilled"
              ? customerResult.value.data
              : undefined,
          locations:
            locationResult.status === "fulfilled"
              ? locationResult.value.data.data
              : [],
          allLocations:
            allLocationResult.status === "fulfilled"
              ? allLocationResult.value.data.data
              : [],
          channels:
            channelsResult.status === "fulfilled"
              ? channelsResult.value.data.data
              : [],
          summary:
            summaryResult.status === "fulfilled"
              ? summaryResult.value.data
              : undefined,
          errors: {
            trend:
              trendResult.status === "rejected"
                ? getRequestErrorMessage(trendResult.reason)
                : undefined,
            customers:
              customerResult.status === "rejected"
                ? getRequestErrorMessage(customerResult.reason)
                : undefined,
            locations:
              locationResult.status === "rejected"
                ? getRequestErrorMessage(locationResult.reason)
                : allLocationResult.status === "rejected"
                  ? getRequestErrorMessage(allLocationResult.reason)
                : undefined,
            channels:
              channelsResult.status === "rejected"
                ? getRequestErrorMessage(channelsResult.reason)
                : undefined,
            summary:
              summaryResult.status === "rejected"
                ? getRequestErrorMessage(summaryResult.reason)
                : undefined,
          },
        });
      },
    ).catch((requestError: unknown) => {
      if (cancelled) return;
      const message = getRequestErrorMessage(requestError);
      toast.error(message);
      setResult({
        key,
        ...emptyResult,
        errors: {
          trend: message,
          customers: message,
          locations: message,
          channels: message,
          summary: message,
        },
      });
    });

    return () => {
      cancelled = true;
    };
  }, [from, to, locationId, workspaceId]);

  const currency = summary?.currency;
  const locationOptions = allLocations.flatMap((location) =>
    location.locationId
      ? [{ id: location.locationId, name: location.locationName }]
      : [],
  );
  const summaryCards = summary
    ? [
        {
          title: "Net Revenue",
          value: formatMinorUnits(summary.revenue.netMinorUnits, summary.currency),
          description: `${summary.orders.total.toLocaleString()} orders`,
        },
        {
          title: "Attributed Revenue",
          value: formatMinorUnits(
            summary.attribution.attributedRevenueMinorUnits,
            summary.currency,
          ),
          description: `${summary.attribution.coverageRate}% attribution coverage`,
        },
        {
          title: "Bookings",
          value: summary.bookings.total.toLocaleString(),
          description: `${summary.bookings.scheduled.toLocaleString()} scheduled · ${summary.bookings.cancelled.toLocaleString()} cancelled`,
        },
      ]
    : [];
  const channelColumns: DataTableColumn<ReportChannel>[] = [
    {
      key: "channel",
      header: "Channel",
      render: (row) => <Pill name={row.channel} />,
    },
    {
      key: "orders",
      header: "Orders",
      align: "right",
      render: (row) => row.orders.toLocaleString(),
    },
    {
      key: "revenue",
      header: "Net revenue",
      align: "right",
      render: (row) =>
        currency ? formatMinorUnits(row.netMinorUnits, currency) : "—",
    },
    {
      key: "newCustomers",
      header: "New customers",
      align: "right",
      render: (row) => row.newCustomers.toLocaleString(),
    },
    {
      key: "returningCustomers",
      header: "Returning customers",
      align: "right",
      render: (row) => row.returningCustomers.toLocaleString(),
    },
  ];
  const locationColumns: DataTableColumn<ReportLocation>[] = [
    {
      key: "location",
      header: "Location",
      render: (row) => row.locationName,
    },
    {
      key: "orders",
      header: "Orders",
      align: "right",
      render: (row) => row.orders.toLocaleString(),
    },
    {
      key: "revenue",
      header: "Net revenue",
      align: "right",
      render: (row) =>
        currency ? formatMinorUnits(row.netMinorUnits, currency) : "—",
    },
    {
      key: "newCustomers",
      header: "New customers",
      align: "right",
      render: (row) => row.newCustomers.toLocaleString(),
    },
    {
      key: "returningCustomers",
      header: "Returning customers",
      align: "right",
      render: (row) => row.returningCustomers.toLocaleString(),
    },
  ];
  const avgOrderValueData = trend.map((point) => ({
    label: formatReportDate(point.date),
    value:
      point.orders > 0
        ? Number(point.netMinorUnits) / 100 / point.orders
        : 0,
  }));
  const newCustomerData = trend.map((point) => ({
    label: formatReportDate(point.date),
    value: point.newCustomers,
  }));

  return (
    <PageLayout
      title="Analytics"
      headTitle="TAS"
      description="Explore revenue, customer, channel, and location reports for the selected period."
      actions={
        <ReportFilters
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          locationId={locationId}
          onLocationChange={setLocationId}
          locations={locationOptions}
          locationsLoading={loading}
        />
      }
    >
      {errors.locations && (
        <p role="alert" className="text-sm text-danger">
          Unable to load location reports: {errors.locations}
        </p>
      )}

      {(summaryCards.length > 0 || errors.summary || loading) && (
        <section className="space-y-3">
          <h2 className="font-heading text-base font-semibold text-text">
            Report summary
          </h2>
          {errors.summary && (
            <p role="alert" className="text-sm text-danger">
              Unable to load report summary: {errors.summary}
            </p>
          )}
          {loading ? (
            <StatCardsSkeleton count={3} />
          ) : summaryCards.length > 0 ? (
            <AnalyticsGrid>
              {summaryCards.map(({ title, value, description }) => (
                <Card
                  key={title}
                  title={title}
                  value={value}
                  description={description}
                />
              ))}
            </AnalyticsGrid>
          ) : null}
        </section>
      )}

      {loading ? (
        <StatCardsSkeleton count={4} />
      ) : customerSummary ? (
        <AnalyticsGrid>
          <Card
            title="Total Customers"
            value={customerSummary.totalCustomers.toLocaleString()}
            description="in selected period"
          />
          <Card
            title="New Customers"
            value={customerSummary.newCustomers.toLocaleString()}
            description="in selected period"
          />
          <Card
            title="Returning Customers"
            value={customerSummary.returningCustomers.toLocaleString()}
            description="in selected period"
          />
          <Card
            title="Repeat Rate"
            value={`${customerSummary.repeatRate}%`}
            description="in selected period"
          />
        </AnalyticsGrid>
      ) : null}
      {errors.customers && (
        <p role="alert" className="text-sm text-danger">
          Unable to load customer analytics: {errors.customers}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <AvgOrderValueTrend
          data={avgOrderValueData}
          currency={currency}
          loading={loading}
          error={
            errors.trend ??
            (!currency && !loading
              ? "Currency details are unavailable."
              : undefined)
          }
        />
        <NewCustomersTrend
          data={newCustomerData}
          loading={loading}
          error={errors.trend}
        />
      </div>

      <section className="space-y-3">
        {errors.channels && (
          <p role="alert" className="text-sm text-danger">
            Unable to load channel reports: {errors.channels}
          </p>
        )}
        <DataTable
          tableHead="Revenue by Channel"
          tableSubHead="Attribution by the selected model"
          columns={channelColumns}
          data={channels}
          getRowKey={(row) => row.channel}
          loading={loading}
          emptyMessage="No channel data found for this period."
        />
      </section>

      <section className="space-y-3">
        <DataTable
          tableHead="Revenue by Location"
          tableSubHead="Location totals for the selected period"
          columns={locationColumns}
          data={locations}
          getRowKey={(row) => row.locationId ?? row.locationName}
          loading={loading}
          emptyMessage="No location data found for this period."
        />
      </section>
    </PageLayout>
  );
}

export default Analytics;
