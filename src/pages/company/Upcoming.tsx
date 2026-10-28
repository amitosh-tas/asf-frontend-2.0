import { useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import ReportToolbar from "@/features/insights/components/ReportToolbar";
import TrendChart from "@/features/insights/components/TrendChart";
import { Kpi, KpiGrid, Section, ErrorBox } from "@/features/insights/components/Kpi";
import { useList, useReport, useReportFilters, useViewWorkspaceId } from "@/features/insights/hooks/useReport";
import { formatDateTime, formatMinorUnits, formatNumber, formatPercent } from "@/features/reports/utils/formatting";
import { channelLabel, listUrl, reportUrl, type BookingsReport, type GroupRow, type UpcomingBookings } from "@/services/insights";

const statusVariant = (s: string) => (s === "cancelled" || s === "no_show" ? "danger" : s === "completed" ? "success" : "neutral");

/** Bookings and upcoming (scope 5.6). Booked value is kept separate from realized (paid) revenue. */
function Upcoming() {
  const workspaceId = useViewWorkspaceId();
  const { filters, update, query } = useReportFilters();
  const [days, setDays] = useState(14);
  const [group, setGroup] = useState<"byDay" | "byWeek" | "byLocation" | "byService" | "bySource">("byDay");
  const upcoming = useList<UpcomingBookings>(listUrl.upcoming(workspaceId), { days, locationId: filters.locationId, model: filters.model });
  const report = useReport<BookingsReport>("bookings", query, workspaceId);
  const cur = upcoming.data?.currency ?? report.data?.currency ?? "USD";
  const money = (v: string) => formatMinorUnits(v, cur);
  const b = report.data;
  const groupRows: GroupRow[] = upcoming.data?.[group] ?? [];

  return (
    <PageLayout headTitle="Pipeline" title="Bookings & upcoming" description="Upcoming appointments by day, week, location, service and source, plus cancellation, no-show and lead time by channel."
      actions={
        <ReportToolbar filters={filters} onChange={update} workspaceId={workspaceId} lastUpdated={b?.lastUpdated} fx={b?.fx} csv={{ url: reportUrl("bookings", workspaceId), query, filename: "bookings-by-channel.csv" }} />
      }
    >
      <ErrorBox error={upcoming.error ?? report.error} onRetry={() => (upcoming.reload(), report.reload())} />

      <Section
        title="Upcoming"
        subtitle="Scheduled and confirmed bookings from now, in local time"
        actions={
          <div className="flex gap-2">
            <select aria-label="Days ahead" value={days} onChange={(e) => setDays(Number(e.target.value))} className="rounded-full border border-border px-3 py-1.5 text-sm">
              {[7, 14, 30, 60, 90].map((d) => <option key={d} value={d}>Next {d} days</option>)}
            </select>
            <select aria-label="Group by" value={group} onChange={(e) => setGroup(e.target.value as typeof group)} className="rounded-full border border-border px-3 py-1.5 text-sm">
              <option value="byDay">By day</option>
              <option value="byWeek">By week</option>
              <option value="byLocation">By location</option>
              <option value="byService">By service</option>
              <option value="bySource">By source</option>
            </select>
          </div>
        }
      >
        <KpiGrid>
          <Kpi label="Upcoming bookings" value={formatNumber(upcoming.data?.count)} loading={upcoming.loading} />
          <Kpi label="Booked value" value={upcoming.data ? money(upcoming.data.bookedValueMinorUnits) : "—"} loading={upcoming.loading} hint="service price at booking (not yet revenue)" />
        </KpiGrid>
        {group === "byDay" || group === "byWeek" ? (
          <TrendChart type="bar" loading={upcoming.loading} xKey="key" data={groupRows.map((g) => ({ key: g.key, count: g.count }))} series={[{ key: "count", label: "Bookings", color: "#111111" }]} format={(v) => formatNumber(v)} />
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {groupRows.map((g) => (
              <li key={g.key} className="flex justify-between border-b border-border pb-2 last:border-0">
                <span>{group === "bySource" ? channelLabel(g.key) : g.key}</span>
                <span className="tabular-nums">{g.count} · {money(g.bookedValueMinorUnits)} · {g.newGuests} new</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <DataTable
        tableHead="Upcoming appointments"
        loading={upcoming.loading}
        data={upcoming.data?.data ?? []}
        getRowKey={(r) => r.id}
        emptyMessage="No upcoming bookings."
        columns={[
          { key: "when", header: "Appointment", render: (r) => formatDateTime(r.appointmentStartAt) },
          { key: "svc", header: "Service", render: (r) => r.serviceName ?? "—" },
          { key: "loc", header: "Location", render: (r) => r.locationName ?? "—" },
          { key: "val", header: "Booked value", align: "right", render: (r) => formatMinorUnits(r.bookedValueMinorUnits, r.currency) },
          { key: "guest", header: "Guest", render: (r) => <Badge variant={r.guestType === "new" ? "primary" : "neutral"}>{r.guestType}</Badge> },
          { key: "src", header: "Source", render: (r) => channelLabel(r.source) },
          { key: "st", header: "Status", render: (r) => <Badge variant={statusVariant(r.status)}>{r.status}</Badge> },
        ]}
      />

      <div className="mt-6">
        <KpiGrid>
          <Kpi label="Bookings created" value={formatNumber(b?.total)} loading={report.loading} hint={b ? `${b.newGuests} new guests` : undefined} />
          <Kpi label="Cancellation rate" value={formatPercent(b?.cancellationRate)} loading={report.loading} />
          <Kpi label="No-show rate" value={formatPercent(b?.noShowRate)} loading={report.loading} />
          <Kpi label="Average lead time" value={b?.averageLeadTimeHours === null || !b ? "—" : `${formatNumber(b.averageLeadTimeHours / 24, 1)} days`} loading={report.loading} hint="booking made → appointment" />
        </KpiGrid>
        <Section title="Pipeline" subtitle="Bookings created in the period and how many were completed and paid">
          {b && (
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-4">
              <p>Created <strong className="block text-lg">{b.pipeline.created}</strong>{money(b.pipeline.bookedValueMinorUnits)} booked</p>
              <p>Completed <strong className="block text-lg">{b.pipeline.completed}</strong>{formatPercent(b.pipeline.completionRate)}</p>
              <p>Paid <strong className="block text-lg">{b.pipeline.paid}</strong>{formatPercent(b.pipeline.paidRate)}</p>
              <p>Realized revenue <strong className="block text-lg">{money(b.pipeline.realizedRevenueMinorUnits)}</strong>from paid invoices</p>
            </div>
          )}
        </Section>
        <DataTable
          tableHead="By channel"
          loading={report.loading}
          data={b?.byChannel ?? []}
          getRowKey={(r) => r.channel}
          columns={[
            { key: "ch", header: "Channel", render: (r) => r.label },
            { key: "c", header: "Created", align: "right", render: (r) => r.created },
            { key: "v", header: "Booked value", align: "right", render: (r) => money(r.bookedValueMinorUnits) },
            { key: "cr", header: "Cancellation", align: "right", render: (r) => formatPercent(r.cancellationRate) },
            { key: "ns", header: "No-show", align: "right", render: (r) => formatPercent(r.noShowRate) },
            { key: "lt", header: "Lead time", align: "right", render: (r) => (r.averageLeadTimeHours === null ? "—" : `${formatNumber(r.averageLeadTimeHours / 24, 1)} d`) },
            { key: "p", header: "Paid", align: "right", render: (r) => r.paid },
          ]}
        />
      </div>
    </PageLayout>
  );
}

export default Upcoming;
