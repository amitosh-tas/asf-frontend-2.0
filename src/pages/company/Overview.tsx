import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import DataTable from "@/components/ui/DataTable";
import ReportToolbar from "@/features/insights/components/ReportToolbar";
import AlertsBanner from "@/features/insights/components/AlertsBanner";
import TrendChart from "@/features/insights/components/TrendChart";
import { Kpi, KpiGrid, Section, ShareBars, Warnings, ErrorBox } from "@/features/insights/components/Kpi";
import { useReport, useReportFilters, useViewWorkspaceId } from "@/features/insights/hooks/useReport";
import { useBasePath } from "@/features/insights/hooks/useBasePath";
import { formatMinorUnits, formatMinorCompact, formatPercent, formatNumber } from "@/features/reports/utils/formatting";
import {
  MATCH_LABELS,
  reportUrl,
  type CampaignRow,
  type LocationRow,
  type MatchMethodRow,
  type ReportMeta,
  type SummaryBlock,
  type Changes,
  type TrendPoint,
} from "@/services/insights";

interface DashboardReport extends ReportMeta {
  summary: SummaryBlock;
  changes: Changes;
  primaryRevenue: { totalRevenue: string; grossRevenue: string; tax: string; invoicesCount: number; description: string };
  kpis: { trackedVisits: { value: number }; retention: { percentage: number; detail: string } };
  revenueBySource: { source: string; channel: string; percentage: number; color: string; revenueMinorUnits: string; conversions: number }[];
  coverage: { rate: number; byMatchMethod: MatchMethodRow[]; changePercent: number | null };
  trend: (TrendPoint & { previousNetMinorUnits: string; previousDate: string | null })[];
  topCampaigns: CampaignRow[];
  topLocations: LocationRow[];
}

const MATCH_COLORS: Record<string, string> = { token: "#15803d", visitor_id: "#0ea5e9", click_id: "#3b82f6", email: "#a855f7", phone: "#ec4899", none: "#9ca3af" };

/** Overview (scope 5.1). */
function Overview() {
  const workspaceId = useViewWorkspaceId();
  const to = useBasePath();
  const navigate = useNavigate();
  const { filters, update, query } = useReportFilters();
  const report = useReport<DashboardReport>("dashboard", query, workspaceId);
  const d = report.data;
  const cur = d?.currency ?? "USD";
  const money = (v: string | number | null | undefined) => formatMinorUnits(v, cur);
  const s = d?.summary;
  const drill = (params: Record<string, string>) => navigate(`${to("/transactions")}?${new URLSearchParams({ from: filters.range.from, to: filters.range.to, ...params })}`);

  return (
    <PageLayout headTitle="Overview" title="Company dashboard" description="Revenue, customers and where they came from, in your company's timezone and currency."
      actions={
        <ReportToolbar
          filters={filters}
          onChange={update}
          workspaceId={workspaceId}
          lastUpdated={d?.lastUpdated} fx={d?.fx}
          csv={{ url: reportUrl("summary", workspaceId), query, filename: `summary-${filters.range.from}-${filters.range.to}.csv` }}
        />
      }
    >
      <AlertsBanner workspaceId={workspaceId} />
      <ErrorBox error={report.error} onRetry={report.reload} />
      <Warnings warnings={d?.warnings} />

      <KpiGrid>
        <Kpi label="Net revenue" value={money(s?.revenue.netMinorUnits)} change={d?.changes.netRevenue} loading={report.loading} hint={s ? `Gross ${money(s.revenue.grossMinorUnits)} · refunds ${money(s.revenue.refundsMinorUnits)}` : undefined} onClick={() => drill({})} />
        <Kpi label="Orders" value={formatNumber(s?.orders.total)} change={d?.changes.orders} loading={report.loading} onClick={() => drill({})} />
        <Kpi label="Average order value" value={money(s?.revenue.averageOrderValueMinorUnits)} change={d?.changes.averageOrderValue} loading={report.loading} />
        <Kpi label="Attribution coverage" value={formatPercent(d?.coverage.rate)} change={d?.coverage.changePercent} loading={report.loading} hint="revenue with a known source" onClick={() => drill({ unattributed: "true" })} />
        <Kpi label="New customers" value={formatNumber(s?.orders.newCustomers)} change={d?.changes.newCustomers} loading={report.loading} hint={s ? `${money(s.revenue.newCustomerRevenueMinorUnits)} new-customer revenue` : undefined} onClick={() => drill({ newVsReturning: "new" })} />
        <Kpi label="Returning customers" value={formatNumber(s?.orders.returningCustomers)} change={d?.changes.returningCustomers} loading={report.loading} onClick={() => drill({ newVsReturning: "returning" })} />
        <Kpi label="Repeat rate" value={formatPercent(s?.orders.repeatRate)} change={d?.changes.repeatRate} loading={report.loading} hint="customers with 2+ paid orders in the period" />
        <Kpi label="Tracked visits" value={formatNumber(d?.kpis.trackedVisits.value)} loading={report.loading} hint={d ? `Retention ${d.kpis.retention.percentage}% (${d.kpis.retention.detail})` : undefined} />
      </KpiGrid>

      <Section title="Revenue by channel" subtitle={`Net revenue credited under the ${d?.model?.replace(/_/g, " ") ?? "selected"} model`}>
        <ShareBars
          rows={(d?.revenueBySource ?? []).map((r) => ({ label: r.source, value: Number(r.revenueMinorUnits), color: r.color, detail: `${formatNumber(r.conversions, 2)} orders` }))}
          format={(v) => money(v)}
        />
      </Section>

      <Section title="Revenue trend" subtitle="Net revenue per local day, with the previous period overlaid">
        <TrendChart
          loading={report.loading}
          data={(d?.trend ?? []).map((t) => ({ date: t.date, current: Number(t.netMinorUnits), previous: Number(t.previousNetMinorUnits) }))}
          series={[
            { key: "current", label: "This period", color: "#111111" },
            { key: "previous", label: "Previous period", color: "#a3a3a3", dashed: true },
          ]}
          format={(v) => formatMinorCompact(v, cur)}
        />
      </Section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Section title="How revenue was matched" subtitle="Checkout token is the strongest match; 'Not matched' shows as Direct / unknown">
          <ShareBars
            rows={(d?.coverage.byMatchMethod ?? []).map((m) => ({ label: MATCH_LABELS[m.matchMethod] ?? m.matchMethod, value: Number(m.revenueMinorUnits), color: MATCH_COLORS[m.matchMethod], detail: `${m.orders} orders` }))}
            format={(v) => money(v)}
          />
        </Section>
        <Section title="Top locations">
          <DataTable
            data={d?.topLocations ?? []}
            loading={report.loading}
            getRowKey={(r) => r.locationId ?? r.locationName}
            emptyMessage="No location data in this period."
            columns={[
              { key: "name", header: "Location", render: (r) => r.locationName },
              { key: "orders", header: "Orders", align: "right", render: (r) => formatNumber(r.orders) },
              { key: "net", header: "Net revenue", align: "right", render: (r) => money(r.netMinorUnits) },
            ]}
          />
        </Section>
      </div>

      <DataTable
        tableHead="Top campaigns"
        tableSubHead="Credited revenue under the selected model"
        data={d?.topCampaigns ?? []}
        loading={report.loading}
        getRowKey={(r) => `${r.channel}-${r.campaign}`}
        emptyMessage="No campaign revenue in this period."
        onRowClick={(r) => drill({ channel: r.channel, campaign: r.campaign })}
        columns={[
          { key: "campaign", header: "Campaign", render: (r) => r.campaign },
          { key: "channel", header: "Channel", render: (r) => r.label ?? r.channel },
          { key: "orders", header: "Orders", align: "right", render: (r) => formatNumber(r.orders, 2) },
          { key: "net", header: "Revenue", align: "right", render: (r) => money(r.netMinorUnits) },
        ]}
      />
    </PageLayout>
  );
}

export default Overview;
