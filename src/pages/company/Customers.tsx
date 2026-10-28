import { useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import DataTable from "@/components/ui/DataTable";
import CustomerTable, { type Customer } from "@/features/customers/components/CustomerTable";
import MergeCustomersModal from "@/features/customers/components/MergeCustomersModal";
import ReportToolbar from "@/features/insights/components/ReportToolbar";
import TrendChart from "@/features/insights/components/TrendChart";
import { Kpi, KpiGrid, Section, ErrorBox } from "@/features/insights/components/Kpi";
import { useList, useReport, useReportFilters, useViewWorkspaceId } from "@/features/insights/hooks/useReport";
import { formatMinorUnits, formatNumber, formatPercent } from "@/features/reports/utils/formatting";
import { downloadCsv, listUrl, reportUrl, type CustomersReport, type Page } from "@/services/insights";
import { useAppSelector } from "@/app/hooks";

const control = "rounded-full border border-border bg-transparent px-3 py-2 text-sm text-text";

/** Customers (scope 5.5): searchable, sortable list; new vs returning trend; cohorts; LTV by acquisition channel. */
function Customers() {
  const workspaceId = useViewWorkspaceId();
  const role = useAppSelector((state: { auth: { user?: { role?: string } } }) => state.auth.user?.role);
  const canMerge = !workspaceId && role === "company_admin";
  const { filters, update, query } = useReportFilters();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("lastPurchaseAt");
  const [type, setType] = useState("");
  const [mergeSource, setMergeSource] = useState<Customer | null>(null);
  const list = useList<Page<Customer>>(listUrl.customers(workspaceId), { page, limit: 25, search: search || undefined, sort, order: "desc", type: type || undefined, model: filters.model });
  const report = useReport<CustomersReport>("customers", query, workspaceId);
  const r = report.data;
  const cur = r?.currency ?? "USD";
  const p = list.data?.pagination;

  return (
    <PageLayout title="Customers" headTitle="Audience" description="Who your customers are, where they first came from, and how often they come back."
      actions={
        <ReportToolbar filters={filters} onChange={update} workspaceId={workspaceId} lastUpdated={r?.lastUpdated} fx={r?.fx} csv={{ url: listUrl.customers(workspaceId), query: { search: search || undefined, sort, type: type || undefined }, filename: "customers.csv" }} />
      }
    >
      <ErrorBox error={list.error ?? report.error} onRetry={() => (list.reload(), report.reload())} />
      <KpiGrid>
        <Kpi label="New customers" value={formatNumber(r?.newCustomers)} loading={report.loading} hint={r ? `${formatMinorUnits(r.newCustomerRevenueMinorUnits, cur)} revenue` : undefined} />
        <Kpi label="Returning customers" value={formatNumber(r?.returningCustomers)} loading={report.loading} />
        <Kpi label="Repeat rate" value={formatPercent(r?.repeatRate)} loading={report.loading} />
        <Kpi label="All customers" value={formatNumber(r?.totalCustomers)} loading={report.loading} />
      </KpiGrid>

      <CustomerTable
        customers={list.data?.data ?? []}
        workspaceId={workspaceId}
        onMerge={canMerge ? setMergeSource : undefined}
        loading={list.loading}
        total={p?.total ?? 0}
        filters={
          <div className="flex flex-wrap gap-2">
            <input aria-label="Search" placeholder="Email, id or external id — press Enter" defaultValue={search} onKeyDown={(e) => e.key === "Enter" && (setSearch((e.target as HTMLInputElement).value.trim()), setPage(1))} className={`${control} w-72`} />
            <select aria-label="Sort" value={sort} onChange={(e) => (setSort(e.target.value), setPage(1))} className={control}>
              <option value="lastPurchaseAt">Last purchase</option>
              <option value="firstPurchaseAt">First purchase</option>
              <option value="firstSeenAt">First seen</option>
              <option value="orders">Orders</option>
              <option value="lifetimeRevenue">Lifetime revenue</option>
            </select>
            <select aria-label="Type" value={type} onChange={(e) => (setType(e.target.value), setPage(1))} className={control}>
              <option value="">All</option>
              <option value="new">One order</option>
              <option value="returning">Repeat buyers</option>
              <option value="prospect">No order yet</option>
            </select>
          </div>
        }
        pagination={{ page: p?.page ?? 1, limit: p?.limit ?? 25, total: p?.total ?? 0, pages: p?.pages ?? 1, isLoading: list.loading, onPageChange: setPage }}
      />

      <div className="mt-6">
        <Section title="New vs returning" subtitle="Distinct customers per local day">
          <TrendChart type="bar" loading={report.loading} data={(r?.trend ?? []).map((t) => ({ date: t.date, newCustomers: t.newCustomers, returning: t.returningCustomers }))} series={[{ key: "newCustomers", label: "New", color: "#111111" }, { key: "returning", label: "Returning", color: "#a3a3a3" }]} format={(v) => formatNumber(v)} />
        </Section>
        <Section title="Cohorts" subtitle="Customers by first-purchase month and the share who bought again in later months">
          <div className="overflow-x-auto">
            <table className="w-full min-w-140 text-xs">
              <thead>
                <tr className="text-left text-text-muted">
                  <th className="px-2 py-1">Cohort</th>
                  <th className="px-2 py-1 text-right">Customers</th>
                  {Array.from({ length: 12 }, (_, i) => <th key={i} className="px-2 py-1 text-right">M{i + 1}</th>)}
                </tr>
              </thead>
              <tbody>
                {(r?.cohorts ?? []).map((c) => (
                  <tr key={c.cohort} className="border-t border-border">
                    <td className="px-2 py-1.5 font-medium">{c.cohort}</td>
                    <td className="px-2 py-1.5 text-right">{c.customers}</td>
                    {c.repeatRateByMonth.map((m) => (
                      <td key={m.month} className="px-2 py-1.5 text-right tabular-nums" style={{ background: m.rate ? `rgba(17,17,17,${Math.min(0.6, m.rate / 100 + 0.05)})` : undefined, color: m.rate > 30 ? "white" : undefined }}>
                        {m.rate ? `${m.rate}%` : ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {r?.cohorts.length === 0 && <p className="py-4 text-sm text-text-muted">No first purchases in this period.</p>}
          </div>
        </Section>
        <DataTable
          tableHead="Lifetime value by acquisition channel"
          tableSubHead="Channel credited on each customer's first order"
          loading={report.loading}
          data={r?.ltvByChannel ?? []}
          getRowKey={(row) => row.channel}
          columns={[
            { key: "ch", header: "Channel", render: (row) => row.label },
            { key: "c", header: "Customers", align: "right", render: (row) => row.customers },
            { key: "o", header: "Avg orders", align: "right", render: (row) => row.averageOrders },
            { key: "ltv", header: "Avg lifetime value", align: "right", render: (row) => formatMinorUnits(row.averageLtvMinorUnits, cur) },
          ]}
        />
        <p className="mt-2 text-right text-xs">
          <button type="button" className="underline" onClick={() => void downloadCsv(reportUrl("customers", workspaceId), query, "ltv-by-channel.csv")}>Export LTV CSV</button>
        </p>
      </div>

      {mergeSource && <MergeCustomersModal source={mergeSource} candidates={list.data?.data ?? []} onClose={() => setMergeSource(null)} onMerged={list.reload} />}
    </PageLayout>
  );
}

export default Customers;
