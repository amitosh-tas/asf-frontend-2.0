import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import DataTable from "@/components/ui/DataTable";
import ReportToolbar from "@/features/insights/components/ReportToolbar";
import AlertsBanner from "@/features/insights/components/AlertsBanner";
import TrendChart from "@/features/insights/components/TrendChart";
import { Kpi, KpiGrid, Section, ShareBars, Warnings, ErrorBox } from "@/features/insights/components/Kpi";
import { useReport, useReportFilters, useViewWorkspaceId } from "@/features/insights/hooks/useReport";
import { useBasePath } from "@/features/insights/hooks/useBasePath";
import { formatMinorUnits, formatMinorCompact, formatPercent, formatNumber, formatReportDate } from "@/features/reports/utils/formatting";
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

const MATCH_COLORS: Record<string, string> = { token: "var(--color-chart-1)", visitor_id: "var(--color-chart-2)", click_id: "#64748b", email: "#8b8b95", phone: "#a1a1aa", none: "#d4d4d8" };

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

      <button
        type="button"
        onClick={() => drill({})}
        className="group relative grid w-full min-w-0 grid-cols-1 gap-7 overflow-hidden rounded-2xl border border-hero-outline bg-hero-background p-6 text-left text-hero-foreground shadow-[0_8px_28px_rgba(15,23,42,0.06)] transition before:absolute before:inset-y-6 before:left-0 before:w-1 before:rounded-r-full before:bg-primary hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(15,23,42,0.1)] focus-visible:outline-hero-foreground sm:p-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(260px,0.7fr)] lg:items-center"
        aria-label={`Net revenue ${money(s?.revenue.netMinorUnits)}. View transactions for this period.`}
      >
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-28 size-80 rounded-full bg-hero-glow blur-3xl" />
        <div className="relative min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-hero-muted">Net revenue</span>
            <span className="rounded-full border border-hero-outline bg-hero-surface px-2.5 py-1 text-[11px] font-medium text-hero-muted">
              {formatReportDate(filters.range.from)} – {formatReportDate(filters.range.to)}
            </span>
          </div>
          {report.loading ? (
            <div aria-label="Loading net revenue" className="mt-4 h-12 w-3/4 max-w-md animate-pulse rounded-lg bg-hero-surface" />
          ) : (
            <p className="mt-3 break-words font-heading text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-none tracking-[-0.05em] tabular-nums">
              {money(s?.revenue.netMinorUnits)}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-hero-muted">
            {report.loading ? (
                <span className="h-5 w-40 animate-pulse rounded-full bg-hero-surface" />
            ) : d?.changes.netRevenue == null ? (
              <span>No previous period to compare</span>
            ) : (
              <>
                <span className="inline-flex items-center gap-1 rounded-full border border-hero-outline bg-hero-surface px-2.5 py-1 font-semibold text-hero-foreground">
                  <span aria-hidden="true">{d.changes.netRevenue >= 0 ? "↑" : "↓"}</span>
                  {Math.abs(d.changes.netRevenue).toLocaleString("en-IN", { maximumFractionDigits: 1 })}%
                </span>
                <span>vs previous period</span>
              </>
            )}
          </div>
        </div>

        <div className="relative grid grid-cols-2 gap-3 border-t border-hero-outline pt-5 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
          <div className="min-w-0 rounded-xl border border-hero-outline bg-hero-surface p-4">
            <p className="text-xs font-medium text-hero-muted">Gross revenue</p>
            <p className="mt-2 truncate text-lg font-semibold tabular-nums tracking-tight text-hero-foreground">{report.loading ? "—" : money(s?.revenue.grossMinorUnits)}</p>
          </div>
          <div className="min-w-0 rounded-xl border border-hero-outline bg-hero-surface p-4">
            <p className="text-xs font-medium text-hero-muted">Refunds</p>
            <p className="mt-2 truncate text-lg font-semibold tabular-nums tracking-tight text-hero-foreground">{report.loading ? "—" : money(s?.revenue.refundsMinorUnits)}</p>
          </div>
        </div>
      </button>

      <KpiGrid>
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
            { key: "current", label: "This period", color: "var(--color-chart-1)" },
            { key: "previous", label: "Previous period", color: "var(--color-chart-3)", dashed: true },
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
