import PageLayout from "@/components/layout/PageLayout";
import DataTable from "@/components/ui/DataTable";
import ReportToolbar from "@/features/insights/components/ReportToolbar";
import { Kpi, KpiGrid, ErrorBox } from "@/features/insights/components/Kpi";
import { useReport, useReportFilters, useViewWorkspaceId } from "@/features/insights/hooks/useReport";
import { formatMinorUnits, formatNumber } from "@/features/reports/utils/formatting";
import { channelLabel, reportUrl, type JourneysReport } from "@/services/insights";

/** Customer journeys (scope 5.3): common paths, touches and days to purchase, assisted conversions. */
export default function Journeys() {
  const workspaceId = useViewWorkspaceId();
  const { filters, update, query } = useReportFilters();
  const r = useReport<JourneysReport>("journeys", query, workspaceId);
  const cur = r.data?.currency ?? "USD";
  return (
    <PageLayout headTitle="Marketing" title="Customer journeys" description='The paths customers take before buying, such as "Meta → Google → purchase".'>
      <ReportToolbar filters={filters} onChange={update} workspaceId={workspaceId} showModel={false} lastUpdated={r.data?.lastUpdated} csv={{ url: reportUrl("journeys", workspaceId), query, filename: "journeys.csv" }} />
      <ErrorBox error={r.error} onRetry={r.reload} />
      <KpiGrid>
        <Kpi label="Average touches per journey" value={formatNumber(r.data?.averageTouches, 2)} loading={r.loading} />
        <Kpi label="Average days to purchase" value={formatNumber(r.data?.averageDaysToPurchase, 1)} loading={r.loading} hint="first touch to order" />
        <Kpi label="Journeys with tracked visits" value={formatNumber(r.data?.journeysWithTouches)} loading={r.loading} />
      </KpiGrid>
      <DataTable
        tableHead="Most common paths"
        loading={r.loading}
        data={r.data?.paths ?? []}
        getRowKey={(p) => p.path}
        emptyMessage="No orders in this period."
        columns={[
          { key: "path", header: "Path", render: (p) => p.steps.map(channelLabel).join(" → ") + " → purchase" },
          { key: "orders", header: "Orders", align: "right", render: (p) => formatNumber(p.orders) },
          { key: "rev", header: "Revenue", align: "right", render: (p) => formatMinorUnits(p.revenueMinorUnits, cur) },
        ]}
      />
      <div className="mt-6">
        <DataTable
          tableHead="Assisted conversions"
          tableSubHead="Channels that appeared in a journey but were not the last touch"
          loading={r.loading}
          data={r.data?.assisted ?? []}
          getRowKey={(a) => a.channel}
          emptyMessage="No multi-touch journeys yet."
          columns={[
            { key: "ch", header: "Channel", render: (a) => channelLabel(a.channel) },
            { key: "o", header: "Assisted orders", align: "right", render: (a) => formatNumber(a.assistedOrders) },
            { key: "r", header: "Assisted revenue", align: "right", render: (a) => formatMinorUnits(a.assistedRevenueMinorUnits, cur) },
          ]}
        />
      </div>
    </PageLayout>
  );
}
