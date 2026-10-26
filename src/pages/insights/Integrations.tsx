import { useState } from "react";
import toast from "react-hot-toast";
import PageLayout from "@/components/layout/PageLayout";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Connectors from "@/features/connectors/components/Connectors";
import ReportToolbar from "@/features/insights/components/ReportToolbar";
import { Section, ErrorBox } from "@/features/insights/components/Kpi";
import { useAsync, useReport, useReportFilters, useViewWorkspaceId } from "@/features/insights/hooks/useReport";
import { formatDateTime, formatPercent } from "@/features/reports/utils/formatting";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";
import { api } from "@/services/api";
import type { DataQualityReport } from "@/services/insights";
import { useAppSelector } from "@/app/hooks";

interface FeedItem { kind: "event" | "touch"; id: string; at: string; source: string; type: string; status: string; error?: string | null; isTest: boolean; channel?: string; payload?: unknown }

/** Integrations and data quality (scope 5.9). */
export default function Integrations() {
  const workspaceId = useViewWorkspaceId();
  const role = useAppSelector((state: { auth: { user?: { role?: string } } }) => state.auth.user?.role);
  const isAdmin = !workspaceId && role === "company_admin";
  const { filters, update, query } = useReportFilters();
  const quality = useReport<DataQualityReport>("data-quality", query, workspaceId);
  const feed = useAsync<{ data: FeedItem[] }>(async () => (await api.get("/api/workspace/events/live", { params: { payload: isAdmin ? "true" : undefined, limit: 50 } })).data, [isAdmin], !workspaceId);
  const [open, setOpen] = useState<FeedItem | null>(null);
  const [rerunning, setRerunning] = useState(false);

  const rerun = async () => {
    setRerunning(true);
    try {
      await api.post("/api/workspace/attribution/rerun", {});
      toast.success("Attribution re-run started. Reports update when it finishes.");
    } catch (e) {
      toast.error(getRequestErrorMessage(e));
    } finally {
      setRerunning(false);
    }
  };

  return (
    <PageLayout headTitle="Data" title="Integrations & data quality" description="Connector health, the live event feed and checks that keep the numbers trustworthy.">
      {isAdmin && (
        <Section title="Connectors" subtitle="Last event, error count, health check and replay of failed events">
          <Connectors />
        </Section>
      )}

      {!workspaceId && (
        <Section title="Live event feed" subtitle="Newest events first (test events are marked)" actions={<Button type="button" size="sm" variant="outline" onClick={feed.reload}>Refresh</Button>}>
          <DataTable
            loading={feed.loading}
            data={feed.data?.data ?? []}
            getRowKey={(e) => `${e.kind}-${e.id}`}
            onRowClick={isAdmin ? (e) => e.kind === "event" && setOpen(e) : undefined}
            emptyMessage="Nothing received in the last 24 hours."
            columns={[
              { key: "at", header: "Received", render: (e) => formatDateTime(e.at) },
              { key: "src", header: "Source", render: (e) => e.source },
              { key: "type", header: "Event", render: (e) => (e.kind === "touch" ? `visit (${e.channel ?? "?"})` : e.type) },
              { key: "st", header: "Status", render: (e) => <Badge variant={e.status === "processed" ? "success" : e.status === "pending" ? "neutral" : "danger"}>{e.status}</Badge> },
              { key: "test", header: "", render: (e) => (e.isTest ? <Badge>test</Badge> : null) },
              { key: "err", header: "Problem", render: (e) => e.error ?? "" },
            ]}
          />
        </Section>
      )}

      <ReportToolbar filters={filters} onChange={update} workspaceId={workspaceId} showModel={false} lastUpdated={quality.data?.lastUpdated} />
      <ErrorBox error={quality.error} onRetry={quality.reload} />
      <Section title="Data quality checks" actions={isAdmin ? <Button type="button" size="sm" variant="outline" loading={rerunning} onClick={rerun}>Re-run attribution</Button> : undefined}>
        <ul className="flex flex-col divide-y divide-border">
          {(quality.data?.checks ?? []).map((c) => (
            <li key={c.key} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <span>{c.label}</span>
              <span className="flex items-center gap-2">
                {c.share !== undefined && <span className="text-xs text-text-muted">{formatPercent(c.share)}</span>}
                <Badge variant={c.count === 0 ? "success" : c.key === "orders_without_token" ? "neutral" : "warning"}>{c.count}</Badge>
              </span>
            </li>
          ))}
        </ul>
      </Section>

      {open && (
        <Modal open title={`${open.source} · ${open.type}`} description={formatDateTime(open.at)} onClose={() => setOpen(null)} size="lg">
          {open.error && <p className="mb-3 text-sm text-danger">{open.error}</p>}
          <pre className="max-h-96 overflow-auto rounded-md bg-surface-muted p-3 text-xs">{JSON.stringify(open.payload, null, 2)}</pre>
        </Modal>
      )}
    </PageLayout>
  );
}
