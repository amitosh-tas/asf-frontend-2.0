import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import ReportToolbar from "@/features/insights/components/ReportToolbar";
import OrderDetailModal from "@/features/insights/components/OrderDetailModal";
import { ErrorBox } from "@/features/insights/components/Kpi";
import { useList, useReportFilters, useViewWorkspaceId } from "@/features/insights/hooks/useReport";
import { formatDateTime, formatMinorUnits } from "@/features/reports/utils/formatting";
import { CHANNEL_LABELS, MATCH_LABELS, channelLabel, listUrl, type OrderRow, type Page } from "@/services/insights";

const selectClass = "rounded-full border border-border bg-transparent px-3 py-2 text-sm text-text";

/** Orders and transactions (scope 5.4). Filters come from the URL so every dashboard number can drill here. */
function Transactions() {
  const workspaceId = useViewWorkspaceId();
  const [params, setParams] = useSearchParams();
  const { filters, update, query } = useReportFilters();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const range = params.get("from") && params.get("to") ? { from: params.get("from") as string, to: params.get("to") as string } : filters.range;
  const extra = {
    status: params.get("status") ?? undefined,
    channel: params.get("channel") ?? undefined,
    campaign: params.get("campaign") ?? undefined,
    newVsReturning: params.get("newVsReturning") ?? undefined,
    refunded: params.get("refunded") ?? undefined,
    unattributed: params.get("unattributed") ?? undefined,
    search: params.get("search") ?? undefined,
  };
  const listQuery = { ...query, ...range, ...extra, page, limit: 25 };
  const orders = useList<Page<OrderRow>>(listUrl.orders(workspaceId), listQuery);
  const setFilter = (key: string, value?: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
    setPage(1);
  };
  const p = orders.data?.pagination;

  return (
    <PageLayout headTitle="Sales" title="Orders & transactions" description="Every paid order with its source under the selected model, how it was matched, and whether the customer was new.">
      <ReportToolbar
        filters={{ ...filters, range }}
        onChange={(patch) => {
          if (patch.range) {
            const next = new URLSearchParams(params);
            next.set("from", patch.range.from);
            next.set("to", patch.range.to);
            setParams(next, { replace: true });
          }
          update(patch);
          setPage(1);
        }}
        workspaceId={workspaceId}
        csv={{ url: listUrl.orders(workspaceId), query: { ...query, ...range, ...extra }, filename: "orders.csv" }}
        lastUpdated={orders.data?.lastUpdated}
      />
      <ErrorBox error={orders.error} onRetry={orders.reload} />
      <DataTable
        tableHead="Orders"
        tableSubHead="Click an order for its journey and the credit under every model"
        filters={
          <div className="flex flex-wrap items-center gap-2">
            <input aria-label="Search order id" placeholder="Search order id" defaultValue={extra.search} onKeyDown={(e) => e.key === "Enter" && setFilter("search", (e.target as HTMLInputElement).value || undefined)} className={selectClass} />
            <select aria-label="Status" value={extra.status ?? ""} onChange={(e) => setFilter("status", e.target.value || undefined)} className={selectClass}>
              <option value="">Any status</option>
              <option value="paid">Paid</option>
              <option value="partially_refunded">Partially refunded</option>
              <option value="refunded">Refunded</option>
              <option value="pending">Pending</option>
              <option value="voided">Voided</option>
            </select>
            <select aria-label="Channel" value={extra.channel ?? ""} onChange={(e) => setFilter("channel", e.target.value || undefined)} className={selectClass}>
              <option value="">Any channel</option>
              {Object.entries(CHANNEL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select aria-label="New or returning" value={extra.newVsReturning ?? ""} onChange={(e) => setFilter("newVsReturning", e.target.value || undefined)} className={selectClass}>
              <option value="">New + returning</option>
              <option value="new">New customers</option>
              <option value="returning">Returning customers</option>
            </select>
            <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={extra.refunded === "true"} onChange={(e) => setFilter("refunded", e.target.checked ? "true" : undefined)} /> Refunded</label>
            <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={extra.unattributed === "true"} onChange={(e) => setFilter("unattributed", e.target.checked ? "true" : undefined)} /> Unattributed</label>
            {extra.campaign && <Badge>Campaign: {extra.campaign} <button type="button" className="ml-1" onClick={() => setFilter("campaign")}>×</button></Badge>}
          </div>
        }
        loading={orders.loading}
        data={orders.data?.data ?? []}
        getRowKey={(o) => o.id}
        onRowClick={(o) => setSelected(o.id)}
        emptyMessage="No orders match these filters."
        pagination={p ? { page: p.page ?? 1, limit: p.limit, total: p.total, pages: p.pages ?? 1, isLoading: orders.loading, onPageChange: setPage } : undefined}
        columns={[
          { key: "date", header: "Date", render: (o) => formatDateTime(o.orderedAt) },
          { key: "id", header: "Order", render: (o) => <span className="font-mono text-xs">{o.externalId}</span> },
          { key: "cust", header: "Customer", render: (o) => o.customerEmail ?? (o.customerId ? o.customerId.slice(0, 8) : "Anonymous") },
          { key: "loc", header: "Location", render: (o) => o.locationName ?? "—" },
          { key: "items", header: "Items", render: (o) => (o.items.length ? o.items.slice(0, 2).join(", ") + (o.items.length > 2 ? ` +${o.items.length - 2}` : "") : "—") },
          { key: "gross", header: "Gross", align: "right", render: (o) => formatMinorUnits(o.grossMinorUnits, o.currency) },
          { key: "disc", header: "Discount", align: "right", render: (o) => formatMinorUnits(o.discountMinorUnits, o.currency) },
          { key: "tax", header: "Tax", align: "right", render: (o) => formatMinorUnits(o.taxMinorUnits, o.currency) },
          { key: "net", header: "Net", align: "right", render: (o) => formatMinorUnits(o.netMinorUnits, o.currency) },
          { key: "ref", header: "Refund", align: "right", render: (o) => (o.refundedMinorUnits === "0" ? "—" : formatMinorUnits(o.refundedMinorUnits, o.currency)) },
          { key: "src", header: "Source", render: (o) => channelLabel(o.source) },
          { key: "match", header: "Match", render: (o) => <Badge variant={o.matchMethod === "none" ? "warning" : "success"}>{MATCH_LABELS[o.matchMethod] ?? o.matchMethod}</Badge> },
          { key: "type", header: "Customer", render: (o) => o.customerType },
        ]}
      />
      {selected && <OrderDetailModal orderId={selected} workspaceId={workspaceId} onClose={() => setSelected(null)} />}
    </PageLayout>
  );
}

export default Transactions;
