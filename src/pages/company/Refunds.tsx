import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import DataTable from "@/components/ui/DataTable";
import ReportToolbar from "@/features/insights/components/ReportToolbar";
import OrderDetailModal from "@/features/insights/components/OrderDetailModal";
import { ErrorBox, Kpi, KpiGrid } from "@/features/insights/components/Kpi";
import { useList, useReportFilters, useViewWorkspaceId } from "@/features/insights/hooks/useReport";
import { formatDateTime, formatMinorUnits, formatNumber } from "@/features/reports/utils/formatting";
import { CHANNEL_LABELS, channelLabel, listUrl, type Page, type RefundRow } from "@/services/insights";

const selectClass = "rounded-full border border-border bg-transparent px-3 py-2 text-sm text-text";

type RefundPage = Page<RefundRow> & { totals?: { refunds: number; amountMinorUnits: string; currency: string | null } };

/**
 * Refunds (scope 5.4 / section 6): every refund on its own date, linked to its order. The source is the
 * order's main source under the selected model, so you can see which channels bring refunds.
 */
function Refunds() {
  const workspaceId = useViewWorkspaceId();
  const [params, setParams] = useSearchParams();
  const { filters, update, query } = useReportFilters();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const extra = { channel: params.get("channel") ?? undefined, search: params.get("search") ?? undefined };
  const listQuery = { ...query, ...extra, page, limit: 25 };
  const refunds = useList<RefundPage>(listUrl.refunds(workspaceId), listQuery);
  const setFilter = (key: string, value?: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
    setPage(1);
  };
  const p = refunds.data?.pagination;
  const totals = refunds.data?.totals;
  const mixedCurrencies = new Set((refunds.data?.data ?? []).map((r) => r.currency)).size > 1;

  return (
    <PageLayout headTitle="Refunds" title="Refunds" description="Refunds reduce revenue on the day they happen. Each one is linked to the order it reverses."
      actions={
        <ReportToolbar
          filters={filters}
          onChange={(patch) => {
            update(patch);
            setPage(1);
          }}
          workspaceId={workspaceId}
          csv={{ url: listUrl.refunds(workspaceId), query: { ...query, ...extra }, filename: `refunds-${filters.range.from}-${filters.range.to}.csv` }}
          lastUpdated={refunds.data?.lastUpdated} fx={refunds.data?.fx}
        />
      }
    >
      <ErrorBox error={refunds.error} onRetry={refunds.reload} />
      <KpiGrid>
        <Kpi label="Refunds" value={formatNumber(totals?.refunds)} loading={refunds.loading} />
        <Kpi
          label="Refunded amount"
          value={
            mixedCurrencies
              ? "Several currencies"
              : formatMinorUnits(
                totals?.amountMinorUnits,
                totals?.currency ?? refunds.data?.fx?.reportingCurrency ?? "USD"
              )
          }
        loading={refunds.loading}
          hint={
            mixedCurrencies
              ? "see each row for its currency"
              : "in the reporting currency"
          }
        />
      </KpiGrid>
      <DataTable
        tableHead="Refunds"
        tableSubHead="Click a refund to open its order"
        filters={
          <div className="flex flex-wrap items-center gap-2">
            <input aria-label="Search refund or order id" placeholder="Search refund or order id" defaultValue={extra.search} onKeyDown={(e) => e.key === "Enter" && setFilter("search", (e.target as HTMLInputElement).value || undefined)} className={selectClass} />
            <select aria-label="Channel" value={extra.channel ?? ""} onChange={(e) => setFilter("channel", e.target.value || undefined)} className={selectClass}>
              <option value="">Any channel</option>
              {Object.entries(CHANNEL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        }
        loading={refunds.loading}
        data={refunds.data?.data ?? []}
        getRowKey={(r) => r.id}
        onRowClick={(r) => setSelected(r.orderId)}
        emptyMessage="No refunds in this period."
        pagination={p ? { page: p.page ?? 1, limit: p.limit, total: p.total, pages: p.pages ?? 1, isLoading: refunds.loading, onPageChange: setPage } : undefined}
        columns={[
          { key: "date", header: "Refunded", render: (r) => formatDateTime(r.refundedAt) },
          { key: "amount", header: "Amount", align: "right", render: (r) => formatMinorUnits(r.amountMinorUnits, r.currency) },
          { key: "order", header: "Order", render: (r) => <span className="font-mono text-xs">{r.orderExternalId ?? r.orderId.slice(0, 8)}</span> },
          { key: "ordered", header: "Ordered", render: (r) => formatDateTime(r.orderedAt) },
          { key: "orderNet", header: "Order net", align: "right", render: (r) => formatMinorUnits(r.orderNetMinorUnits, r.currency) },
          { key: "loc", header: "Location", render: (r) => r.locationName ?? "—" },
          { key: "src", header: "Order source", render: (r) => channelLabel(r.source) + (r.campaign ? ` · ${r.campaign}` : "") },
          { key: "reason", header: "Reason", render: (r) => r.reason ?? "—" },
        ]}
      />
      {selected && <OrderDetailModal orderId={selected} workspaceId={workspaceId} onClose={() => setSelected(null)} />}
    </PageLayout>
  );
}

export default Refunds;
