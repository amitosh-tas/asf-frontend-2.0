import { useState } from "react";
import toast from "react-hot-toast";
import ReasonDialog from "@/components/ui/ReasonDialog";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";
import { Link } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import DataTable from "@/components/ui/DataTable";
import Button from "@/components/ui/Button";
import { Kpi, KpiGrid, ErrorBox } from "@/features/insights/components/Kpi";
import { useAsync } from "@/features/insights/hooks/useReport";
import { formatDateTime, formatNumber, formatPercent } from "@/features/reports/utils/formatting";
import { api } from "@/services/api";

interface Health {
  eventsPerMinute: number;
  eventsLast24h: number;
  processedWithin60sPercent: number | null;
  queue: { pending: number; failed: number; dead: number; replaying: number };
  jobs: Record<string, number | string>;
  backgroundJobs?: {
    available: boolean;
    queued?: number;
    running?: number;
    dead?: number;
    oldestQueuedAt?: string | null;
    recentDead?: { id: string; type: string; workspaceId: string | null; lastError: string | null; finishedAt: string | null }[];
  };
  slowestConnectors: { connectorId: string; workspaceId: string; type: string | null; name: string | null; events: number; avgMs: number; maxMs: number }[];
  failingConnectors: { id: string; workspaceId: string; type: string; name: string; errorCount: number; lastError: string | null; lastErrorAt: string | null }[];
  errorsByCompany: { workspaceId: string; name: string | null; failed: number; dead: number; lastError: string | null }[];
  process: { uptimeSeconds: number; rssMb: number };
  lastUpdated: string;
}

const seconds = (ms: number) => `${(ms / 1000).toFixed(ms < 10_000 ? 1 : 0)} s`;

/** Platform health (scope 4.9): ingest rate, queue, processing latency, failing integrations. */
export default function PlatformHealth() {
  const [tick, setTick] = useState(0);
  const health = useAsync<Health>(async () => (await api.get<Health>("/api/platform-admin/health")).data, [tick]);
  const h = health.data;
  const bg = h?.backgroundJobs;
  const [retrying, setRetrying] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <PageLayout headTitle="Platform health" title="Platform health" description="Events coming in across every company over the last 24 hours, and anything that is failing.">
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>{h ? `Updated ${formatDateTime(h.lastUpdated)} · up ${Math.round(h.process.uptimeSeconds / 3600)} h · ${h.process.rssMb} MB` : ""}</span>
        <Button type="button" size="sm" variant="outline" onClick={() => setTick((t) => t + 1)}>Refresh</Button>
      </div>
      <ErrorBox error={health.error} onRetry={health.reload} />
      <KpiGrid>
        <Kpi label="Events / minute" value={formatNumber(h?.eventsPerMinute, 2)} loading={health.loading} hint="last hour" />
        <Kpi label="Events (24 h)" value={formatNumber(h?.eventsLast24h)} loading={health.loading} />
        <Kpi label="Processed within 60 s" value={formatPercent(h?.processedWithin60sPercent)} loading={health.loading} hint="target: nearly all" />
        <Kpi label="Queue waiting" value={formatNumber(h?.queue.pending)} loading={health.loading} hint={h ? `${h.queue.replaying} replaying` : undefined} />
        <Kpi label="Failed (retrying)" value={formatNumber(h?.queue.failed)} loading={health.loading} />
        <Kpi label="Dead letters" value={formatNumber(h?.queue.dead)} loading={health.loading} hint="need a replay after the cause is fixed" />
      </KpiGrid>

      {bg?.available === false ? (
        <p className="text-xs text-text-muted">Background jobs are kept in memory only: the BackgroundJob table is not migrated yet.</p>
      ) : (
        <KpiGrid>
          <Kpi label="Background jobs waiting" value={formatNumber(bg?.queued)} loading={health.loading} hint={bg?.oldestQueuedAt ? `oldest since ${formatDateTime(bg.oldestQueuedAt)}` : "re-runs, rebuilds, ad spend syncs"} />
          <Kpi label="Background jobs running" value={formatNumber(bg?.running)} loading={health.loading} hint="on any instance" />
          <Kpi label="Background jobs failed" value={formatNumber(bg?.dead)} loading={health.loading} hint="stopped after 5 attempts" />
        </KpiGrid>
      )}
      {(bg?.recentDead?.length ?? 0) > 0 && (
        <DataTable
          tableHead="Failed background jobs"
          data={bg?.recentDead ?? []}
          getRowKey={(j) => j.id}
          columns={[
            { key: "type", header: "Job", render: (j) => <code className="text-xs">{j.type}</code> },
            { key: "ws", header: "Company", render: (j) => (j.workspaceId ? <Link className="underline" to={`/super/workspaces/${j.workspaceId}`}>{j.workspaceId.slice(0, 8)}</Link> : "—") },
            { key: "err", header: "Last error", render: (j) => <span className="text-xs">{j.lastError ?? "—"}</span> },
            { key: "at", header: "Stopped", render: (j) => formatDateTime(j.finishedAt) },
            { key: "retry", header: "", align: "right", render: (j) => <Button type="button" size="sm" variant="outline" onClick={() => setRetrying(j.id)}>Retry</Button> },
          ]}
        />
      )}
      {retrying && (
        <ReasonDialog
          title="Run this job again?"
          description="It is queued again and picked up by an instance within a minute."
          confirmLabel="Retry job"
          busy={busy}
          onClose={() => setRetrying(null)}
          onConfirm={async (reason) => {
            setBusy(true);
            try {
              await api.post(`/api/platform-admin/jobs/${retrying}/retry`, { reason });
              toast.success("Job queued again");
              setRetrying(null);
              health.reload();
            } catch (err) {
              toast.error(getRequestErrorMessage(err));
            } finally {
              setBusy(false);
            }
          }}
        />
      )}

      <DataTable
        tableHead="Failing integrations"
        data={h?.failingConnectors ?? []}
        loading={health.loading}
        getRowKey={(c) => c.id}
        emptyMessage="No integration is failing."
        columns={[
          { key: "name", header: "Integration", render: (c) => `${c.name} (${c.type})` },
          { key: "ws", header: "Company", render: (c) => <Link className="underline" to={`/super/workspaces/${c.workspaceId}`}>{c.workspaceId.slice(0, 8)}</Link> },
          { key: "errors", header: "Errors", align: "right", render: (c) => formatNumber(c.errorCount) },
          { key: "last", header: "Last error", render: (c) => <span className="text-xs">{c.lastError ?? "—"}<br />{formatDateTime(c.lastErrorAt)}</span> },
        ]}
      />
      <DataTable
        tableHead="Errors by company"
        data={h?.errorsByCompany ?? []}
        loading={health.loading}
        getRowKey={(r) => r.workspaceId}
        emptyMessage="No failed events in the last 24 hours."
        columns={[
          { key: "name", header: "Company", render: (r) => <Link className="underline" to={`/super/workspaces/${r.workspaceId}`}>{r.name ?? r.workspaceId}</Link> },
          { key: "failed", header: "Failed", align: "right", render: (r) => formatNumber(r.failed) },
          { key: "dead", header: "Dead", align: "right", render: (r) => formatNumber(r.dead) },
          { key: "last", header: "Last error", render: (r) => <span className="text-xs">{r.lastError ?? "—"}</span> },
        ]}
      />
      <DataTable
        tableHead="Slowest integrations"
        tableSubHead="Average time from receiving an event to finishing it"
        data={h?.slowestConnectors ?? []}
        loading={health.loading}
        getRowKey={(r) => r.connectorId}
        emptyMessage="No processed integration events in the last 24 hours."
        columns={[
          { key: "name", header: "Integration", render: (r) => `${r.name ?? "—"} (${r.type ?? "?"})` },
          { key: "events", header: "Events", align: "right", render: (r) => formatNumber(r.events) },
          { key: "avg", header: "Average", align: "right", render: (r) => seconds(r.avgMs) },
          { key: "max", header: "Slowest", align: "right", render: (r) => seconds(r.maxMs) },
        ]}
      />
    </PageLayout>
  );
}
