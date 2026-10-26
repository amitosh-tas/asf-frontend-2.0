import { useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import DataTable from "@/components/ui/DataTable";
import ReportToolbar from "@/features/insights/components/ReportToolbar";
import { Section, Warnings, ErrorBox } from "@/features/insights/components/Kpi";
import { useReport, useReportFilters, useViewWorkspaceId } from "@/features/insights/hooks/useReport";
import { formatMinorUnits, formatNumber } from "@/features/reports/utils/formatting";
import { ATTRIBUTION_MODELS, channelLabel, reportUrl, type CampaignRow, type ChannelsReport, type ReportMeta } from "@/services/insights";

/** Channels and campaigns (scope 5.2): table by channel, model comparison, drill into campaigns. */
export default function Channels() {
  const workspaceId = useViewWorkspaceId();
  const { filters, update, query } = useReportFilters();
  const [compare, setCompare] = useState(false);
  const [drill, setDrill] = useState<string | null>(null);
  const channels = useReport<ChannelsReport>("channels", { ...query, compare }, workspaceId);
  const campaigns = useReport<ReportMeta & { data: CampaignRow[] }>("campaigns", { ...query, channel: drill ?? undefined }, workspaceId, Boolean(drill));
  const cur = channels.data?.currency ?? "USD";
  const money = (v: string | null | undefined) => (v === null || v === undefined ? "—" : formatMinorUnits(v, cur));

  return (
    <PageLayout headTitle="Marketing" title="Channels & campaigns" description="Revenue, new customers, spend, CAC and ROAS by channel under the attribution model you choose."
      actions={
        <ReportToolbar filters={filters} onChange={update} workspaceId={workspaceId} lastUpdated={channels.data?.lastUpdated} csv={{ url: reportUrl("channels", workspaceId), query, filename: "channels.csv" }} />
      }
    >
      <ErrorBox error={channels.error} onRetry={channels.reload} />
      <Warnings warnings={channels.data?.warnings} />

      <DataTable
        tableHead="By channel"
        tableSubHead="Click a channel to see its campaigns"
        loading={channels.loading}
        data={channels.data?.data ?? []}
        getRowKey={(r) => r.channel}
        onRowClick={(r) => setDrill(r.channel)}
        emptyMessage="No revenue in this period."
        columns={[
          { key: "channel", header: "Channel", render: (r) => <span className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ background: r.color }} />{r.label}</span> },
          { key: "net", header: "Revenue", align: "right", render: (r) => money(r.netMinorUnits) },
          { key: "orders", header: "Orders", align: "right", render: (r) => formatNumber(r.orders, 2) },
          { key: "new", header: "New customers", align: "right", render: (r) => formatNumber(r.newCustomers, 2) },
          { key: "spend", header: "Spend", align: "right", render: (r) => money(r.spendMinorUnits) },
          { key: "cac", header: "CAC", align: "right", render: (r) => money(r.cacMinorUnits) },
          { key: "roas", header: "ROAS", align: "right", render: (r) => (r.roas === null ? "—" : `${r.roas}×`) },
          { key: "aov", header: "AOV", align: "right", render: (r) => money(r.averageOrderValueMinorUnits) },
          { key: "days", header: "Days to convert", align: "right", render: (r) => formatNumber(r.averageDaysToConvert, 1) },
        ]}
      />

      {drill && (
        <div className="mt-6">
          <DataTable
            tableHead={`Campaigns in ${channelLabel(drill)}`}
            filters={<button type="button" className="text-xs underline" onClick={() => setDrill(null)}>Close</button>}
            loading={campaigns.loading}
            data={campaigns.data?.data ?? []}
            getRowKey={(r) => r.campaign}
            emptyMessage="No campaigns for this channel."
            columns={[
              { key: "campaign", header: "Campaign", render: (r) => r.campaign },
              { key: "net", header: "Revenue", align: "right", render: (r) => money(r.netMinorUnits) },
              { key: "orders", header: "Orders", align: "right", render: (r) => formatNumber(r.orders, 2) },
              { key: "new", header: "New customers", align: "right", render: (r) => formatNumber(r.newCustomers, 2) },
              { key: "spend", header: "Spend", align: "right", render: (r) => money(r.spendMinorUnits) },
              { key: "cac", header: "CAC", align: "right", render: (r) => money(r.cacMinorUnits) },
              { key: "roas", header: "ROAS", align: "right", render: (r) => (r.roas === null ? "—" : `${r.roas}×`) },
            ]}
          />
        </div>
      )}

      <div className="mt-6">
        <Section
          title="Model comparison"
          subtitle="The same channels under every attribution model, side by side"
          actions={<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} /> Show</label>}
        >
          {compare && channels.data?.comparison ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-140 text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[10px] uppercase tracking-wider text-text-muted">
                    <th className="px-3 py-2">Channel</th>
                    {ATTRIBUTION_MODELS.map((m) => <th key={m.value} className="px-3 py-2 text-right">{m.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {channels.data.comparison.data.map((row) => (
                    <tr key={row.channel} className="border-b border-border last:border-0">
                      <td className="px-3 py-2">{channelLabel(row.channel)}</td>
                      {ATTRIBUTION_MODELS.map((m) => <td key={m.value} className="px-3 py-2 text-right tabular-nums">{money(row[m.value])}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-text-muted">Tick "Show" to compare models.</p>
          )}
        </Section>
      </div>
    </PageLayout>
  );
}
