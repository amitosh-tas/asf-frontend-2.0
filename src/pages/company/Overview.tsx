import { useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, ArrowUpRight as OpenIcon, ChartNoAxesCombined, CircleDollarSign, MousePointer2, ShoppingBag } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import DataTable from "@/components/ui/DataTable";
import ReportToolbar from "@/features/insights/components/ReportToolbar";
import AlertsBanner from "@/features/insights/components/AlertsBanner";
import TrendChart from "@/features/insights/components/TrendChart";
import { Kpi, Section, ShareBars, Warnings, ErrorBox } from "@/features/insights/components/Kpi";
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

const MATCH_COLORS: Record<string, string> = { token: "var(--color-chart-1)", visitor_id: "var(--color-chart-2)", click_id: "#81928a", email: "#a6afa5", phone: "#c0c6bb", none: "#d8ddd4" };

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
    <PageLayout
      headTitle="TRACKVYN / OVERVIEW"
      title="Revenue at a glance"
      description="A clear view of sales performance, attribution, and customer growth for this period."
      actions={
        <ReportToolbar
          filters={filters}
          onChange={update}
          workspaceId={workspaceId}
          lastUpdated={d?.lastUpdated}
          fx={d?.fx}
          csv={{ url: reportUrl("summary", workspaceId), query, filename: `summary-${filters.range.from}-${filters.range.to}.csv` }}
        />
      }
    >
      <AlertsBanner workspaceId={workspaceId} />
      <ErrorBox error={report.error} onRetry={report.reload} />
      <Warnings warnings={d?.warnings} />

      <section aria-label="Revenue and core metrics" className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-12">
        <button
          type="button"
          onClick={() => drill({})}
          className="group relative flex min-h-[218px] min-w-0 flex-col justify-between overflow-hidden rounded-[22px] bg-[#202b25] p-6 text-left text-white shadow-[0_14px_35px_rgba(30,48,36,0.13)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(30,48,36,0.18)] sm:col-span-2 xl:col-span-5 xl:p-7"
        >
          <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 size-52 rounded-full border border-white/10" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-2 -top-2 size-36 rounded-full border border-white/10" />
          <div className="relative flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-xs font-medium text-white/70"><CircleDollarSign size={16} /> Net revenue</span>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-medium text-white/65">{formatReportDate(filters.range.from)} — {formatReportDate(filters.range.to)}</span>
          </div>
          <div className="relative mt-7">
            <p className="break-words font-heading text-[clamp(2.2rem,4vw,3.6rem)] font-semibold leading-none tracking-[-0.055em] tabular-nums text-[#d2fb83]">
              {report.loading ? "Loading…" : money(s?.revenue.netMinorUnits)}
            </p>
            <p className="mt-4 flex items-center gap-2 text-xs text-white/65">
              {d?.changes.netRevenue == null ? <span>No previous period to compare</span> : <>
                {d.changes.netRevenue >= 0 ? <ArrowUpRight size={14} className="text-[#d2fb83]" /> : <ArrowDownRight size={14} className="text-rose-300" />}
                <span className="font-semibold text-white">{Math.abs(d.changes.netRevenue).toLocaleString("en-IN", { maximumFractionDigits: 1 })}%</span>
                <span>versus previous period</span>
              </>}
            </p>
          </div>
          <div className="relative mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
            <div><p className="text-[10px] uppercase tracking-[0.12em] text-white/50">Gross revenue</p><p className="mt-1 text-sm font-semibold tabular-nums">{report.loading ? "—" : money(s?.revenue.grossMinorUnits)}</p></div>
            <div><p className="text-[10px] uppercase tracking-[0.12em] text-white/50">Refunds</p><p className="mt-1 text-sm font-semibold tabular-nums">{report.loading ? "—" : money(s?.revenue.refundsMinorUnits)}</p></div>
          </div>
          <OpenIcon aria-hidden="true" size={16} className="absolute bottom-6 right-6 text-white/35 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white/75" />
        </button>

        <div className="min-w-0 sm:col-span-2 xl:col-span-7">
          <div className="grid h-full grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricTile icon={<ShoppingBag size={17} />} label="Orders" value={formatNumber(s?.orders.total)} change={d?.changes.orders} loading={report.loading} onClick={() => drill({})} />
            <MetricTile icon={<ChartNoAxesCombined size={17} />} label="Average order value" value={money(s?.revenue.averageOrderValueMinorUnits)} change={d?.changes.averageOrderValue} loading={report.loading} />
            <MetricTile icon={<MousePointer2 size={17} />} label="Attribution coverage" value={formatPercent(d?.coverage.rate)} change={d?.coverage.changePercent} loading={report.loading} hint="Revenue matched to a source" onClick={() => drill({ unattributed: "true" })} />
          </div>
        </div>
      </section>

      <section aria-label="Customer and traffic metrics" className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi label="New customers" value={formatNumber(s?.orders.newCustomers)} change={d?.changes.newCustomers} loading={report.loading} hint={s ? `${money(s.revenue.newCustomerRevenueMinorUnits)} revenue` : undefined} onClick={() => drill({ newVsReturning: "new" })} />
        <Kpi label="Returning customers" value={formatNumber(s?.orders.returningCustomers)} change={d?.changes.returningCustomers} loading={report.loading} onClick={() => drill({ newVsReturning: "returning" })} />
        <Kpi label="Repeat purchase rate" value={formatPercent(s?.orders.repeatRate)} change={d?.changes.repeatRate} loading={report.loading} hint="Customers with 2+ paid orders" />
        <Kpi label="Tracked visits" value={formatNumber(d?.kpis.trackedVisits.value)} loading={report.loading} hint={d ? `Visit retention ${d.kpis.retention.percentage}%` : undefined} />
        <Kpi label="Bookings" value={formatNumber(s?.bookings.total)} loading={report.loading} hint={s ? `${formatNumber(s.bookings.scheduled)} scheduled · ${formatNumber(s.bookings.cancelled)} cancelled` : undefined} />
      </section>

      <Section title="Revenue performance" subtitle="Daily net revenue compared with the previous period" actions={<span className="inline-flex items-center gap-1.5 rounded-full bg-active px-2.5 py-1 text-[10px] font-semibold text-text"><span className="size-1.5 rounded-full bg-chart-1" /> Current period</span>}>
        <TrendChart
          loading={report.loading}
          data={(d?.trend ?? []).map((t) => ({ date: t.date, current: Number(t.netMinorUnits), previous: Number(t.previousNetMinorUnits) }))}
          series={[
            { key: "current", label: "This period", color: "var(--color-chart-1)" },
            { key: "previous", label: "Previous period", color: "var(--color-chart-3)", dashed: true },
          ]}
          format={(v) => formatMinorCompact(v, cur)}
          height={320}
        />
      </Section>

      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="h-full min-w-0">
        <Section title="Revenue by channel" subtitle={`Credited with ${d?.model?.replace(/_/g, " ") ?? "the selected attribution model"}`}>
          <ShareBars
            rows={(d?.revenueBySource ?? []).map((r) => ({ label: r.source, value: Number(r.revenueMinorUnits), color: r.color || "var(--color-chart-1)", detail: `${formatNumber(r.conversions, 2)} orders` }))}
            format={(v) => money(v)}
          />
        </Section>
        </div>
        <div className="h-full min-w-0">
        <Section title="Attribution coverage" subtitle="How revenue was connected to a customer touchpoint">
          <ShareBars
            rows={(d?.coverage.byMatchMethod ?? []).map((m) => ({ label: MATCH_LABELS[m.matchMethod] ?? m.matchMethod, value: Number(m.revenueMinorUnits), color: MATCH_COLORS[m.matchMethod], detail: `${formatNumber(m.orders)} orders` }))}
            format={(v) => money(v)}
          />
        </Section>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-7">
          <div className="space-y-4 rounded-[22px] border border-border bg-card p-5 shadow-[0_5px_22px_rgba(32,43,37,0.035)] sm:hidden">
            <div><h2 className="font-heading text-sm font-bold text-text">Campaign performance</h2><p className="mt-1 text-xs text-text-muted">Top credited campaigns in this period</p></div>
            {report.loading ? <p className="text-sm text-text-muted">Loading campaigns…</p> : d?.topCampaigns.length ? d.topCampaigns.slice(0, 5).map((row) => (
              <button key={`${row.channel}-${row.campaign}`} type="button" onClick={() => drill({ channel: row.channel, campaign: row.campaign })} className="flex w-full items-center justify-between gap-3 border-t border-border pt-3 text-left">
                <span className="min-w-0"><span className="block truncate text-sm font-semibold text-text">{row.campaign || "Unassigned campaign"}</span><span className="mt-0.5 block text-xs text-text-muted">{row.label ?? row.channel} · {formatNumber(row.orders, 2)} orders</span></span>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-text">{money(row.netMinorUnits)}</span>
              </button>
            )) : <p className="text-sm text-text-muted">No campaign revenue in this period.</p>}
          </div>
          <div className="hidden sm:block">
          <DataTable
            tableHead="Campaign performance"
            tableSubHead="Top credited campaigns in this period"
            data={d?.topCampaigns ?? []}
            loading={report.loading}
            getRowKey={(r) => `${r.channel}-${r.campaign}`}
            emptyMessage="No campaign revenue in this period."
            onRowClick={(r) => drill({ channel: r.channel, campaign: r.campaign })}
            columns={[
              { key: "campaign", header: "Campaign", render: (r) => <span className="font-medium text-text">{r.campaign}</span> },
              { key: "channel", header: "Channel", render: (r) => r.label ?? r.channel },
              { key: "orders", header: "Orders", align: "right", render: (r) => formatNumber(r.orders, 2) },
              { key: "net", header: "Revenue", align: "right", render: (r) => money(r.netMinorUnits) },
            ]}
          />
          </div>
        </div>
        <div className="min-w-0 xl:col-span-5">
          <div className="space-y-4 rounded-[22px] border border-border bg-card p-5 shadow-[0_5px_22px_rgba(32,43,37,0.035)] sm:hidden">
            <div><h2 className="font-heading text-sm font-bold text-text">Top locations</h2><p className="mt-1 text-xs text-text-muted">Revenue and orders by location</p></div>
            {report.loading ? <p className="text-sm text-text-muted">Loading locations…</p> : d?.topLocations.length ? d.topLocations.slice(0, 5).map((row) => (
              <div key={row.locationId ?? row.locationName} className="flex items-center justify-between gap-3 border-t border-border pt-3">
                <span className="min-w-0"><span className="block truncate text-sm font-semibold text-text">{row.locationName}</span><span className="mt-0.5 block text-xs text-text-muted">{formatNumber(row.orders)} orders</span></span>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-text">{money(row.netMinorUnits)}</span>
              </div>
            )) : <p className="text-sm text-text-muted">No location data in this period.</p>}
          </div>
          <div className="hidden sm:block">
          <DataTable
            tableHead="Top locations"
            tableSubHead="Revenue and orders by location"
            data={d?.topLocations ?? []}
            loading={report.loading}
            getRowKey={(r) => r.locationId ?? r.locationName}
            emptyMessage="No location data in this period."
            columns={[
              { key: "name", header: "Location", render: (r) => <span className="font-medium text-text">{r.locationName}</span> },
              { key: "orders", header: "Orders", align: "right", render: (r) => formatNumber(r.orders) },
              { key: "net", header: "Net revenue", align: "right", render: (r) => money(r.netMinorUnits) },
            ]}
          />
          </div>
        </div>
      </div>

    </PageLayout>
  );
}

function MetricTile({ icon, label, value, change, loading, hint, onClick }: {
  icon: ReactNode;
  label: string;
  value: string;
  change?: number | null;
  loading?: boolean;
  hint?: string;
  onClick?: () => void;
}) {
  const content = <>
    <span className="flex size-9 items-center justify-center rounded-xl bg-active text-[#68883a]">{icon}</span>
    <span className="mt-4 text-xs font-medium text-text-muted">{label}</span>
    <span className="mt-1 break-words font-heading text-[26px] font-semibold leading-tight tracking-[-0.045em] tabular-nums text-text">{loading ? "—" : value}</span>
    <span className="mt-auto flex min-h-5 items-center gap-1.5 pt-3 text-[10px] text-text-muted">
      {change !== undefined && change !== null ? <><span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold ${change >= 0 ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>{change >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}{Math.abs(change).toLocaleString(undefined, { maximumFractionDigits: 1 })}%</span><span>vs prior period</span></> : hint}
    </span>
  </>;
  const className = "flex min-h-[166px] w-full flex-col rounded-[22px] border border-border bg-card p-5 text-left shadow-[0_5px_22px_rgba(32,43,37,0.035)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(32,43,37,0.08)] xl:min-h-[218px]";
  return onClick ? <button type="button" onClick={onClick} className={className}>{content}</button> : <div className={className}>{content}</div>;
}

export default Overview;
