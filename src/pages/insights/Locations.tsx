import PageLayout from "@/components/layout/PageLayout";
import DataTable from "@/components/ui/DataTable";
import ReportToolbar from "@/features/insights/components/ReportToolbar";
import { ErrorBox, Warnings } from "@/features/insights/components/Kpi";
import { useReport, useReportFilters, useViewWorkspaceId } from "@/features/insights/hooks/useReport";
import { formatMinorUnits, formatNumber } from "@/features/reports/utils/formatting";
import { channelLabel, reportUrl, type LocationRow, type ReportMeta } from "@/services/insights";

/** Locations (scope 5.7): comparison and ranking; each location uses its own timezone for its days. */
export default function Locations() {
  const workspaceId = useViewWorkspaceId();
  const { filters, update, query } = useReportFilters();
  const r = useReport<ReportMeta & { data: LocationRow[] }>("locations", { ...query, locationId: undefined }, workspaceId);
  const cur = r.data?.currency ?? "USD";
  const money = (v: string | null) => (v === null ? "—" : formatMinorUnits(v, cur));
  return (
    <PageLayout headTitle="Business" title="Locations" description="Revenue, customers, bookings, top sources and CAC per location, ranked."
      actions={
        <ReportToolbar filters={{ ...filters, locationId: undefined }} onChange={update} workspaceId={workspaceId} lastUpdated={r.data?.lastUpdated} fx={r.data?.fx} csv={{ url: reportUrl("locations", workspaceId), query, filename: "locations.csv" }} />
      }
    >
      <ErrorBox error={r.error} onRetry={r.reload} />
      <Warnings warnings={r.data?.warnings} />
      <DataTable
        tableHead="Location ranking"
        tableSubHead="Day boundaries follow each location's timezone"
        loading={r.loading}
        data={r.data?.data ?? []}
        getRowKey={(l) => l.locationId ?? "none"}
        columns={[
          { key: "rank", header: "#", render: (l) => l.rank },
          { key: "name", header: "Location", render: (l) => <span>{l.locationName}<span className="block text-xs text-text-muted">{l.timezone}</span></span> },
          { key: "net", header: "Revenue", align: "right", render: (l) => money(l.netMinorUnits) },
          { key: "orders", header: "Orders", align: "right", render: (l) => formatNumber(l.orders) },
          { key: "new", header: "New", align: "right", render: (l) => formatNumber(l.newCustomers) },
          { key: "ret", header: "Returning", align: "right", render: (l) => formatNumber(l.returningCustomers) },
          { key: "bk", header: "Bookings", align: "right", render: (l) => formatNumber(l.bookings) },
          { key: "src", header: "Top sources", render: (l) => l.topSources.map((t) => channelLabel(t.channel)).join(", ") || "—" },
          { key: "cac", header: "CAC", align: "right", render: (l) => money(l.cacMinorUnits) },
        ]}
      />
    </PageLayout>
  );
}
