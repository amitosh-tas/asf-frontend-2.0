import { useState } from "react";
import { Link } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import DataTable from "@/components/ui/DataTable";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { ErrorBox } from "@/features/insights/components/Kpi";
import { useAsync } from "@/features/insights/hooks/useReport";
import { formatDateTime } from "@/features/reports/utils/formatting";
import { api } from "@/services/api";

interface AuditRow {
  id: string;
  createdAt: string;
  workspaceId: string | null;
  actorUserId: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  reason: string | null;
  ip: string | null;
}
interface Page {
  data: AuditRow[];
  pagination: { page: number; limit: number; total: number; pages: number };
  available?: boolean;
}

async function exportCsv(params: Record<string, string | undefined>) {
  const res = await api.get<Blob>("/api/platform-admin/audit-log", { params: { ...params, format: "csv" }, responseType: "blob" });
  const href = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = href;
  a.download = "platform-audit-log.csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

/** Everything platform admins did (scope 4.9 / 4.10): each action carries a written reason. */
export default function PlatformAuditLog() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const params = { page, limit: 50, action: action.trim() || undefined, workspaceId: workspaceId.trim() || undefined, all: "true" };
  const log = useAsync<Page>(async () => (await api.get<Page>("/api/platform-admin/audit-log", { params })).data, [JSON.stringify(params)]);
  return (
    <PageLayout headTitle="Audit log" title="Platform audit log" description="Every action taken by a platform admin, with the reason they gave. Companies see the entries about them in their own audit log.">
      <div className="flex flex-wrap items-end gap-3">
        <Input aria-label="Action" placeholder="Action starts with… (e.g. admin.)" value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} className="w-64" />
        <Input aria-label="Company id" placeholder="Company id" value={workspaceId} onChange={(e) => { setWorkspaceId(e.target.value); setPage(1); }} className="w-72" />
        <Button type="button" variant="outline" onClick={() => void exportCsv({ action: params.action, workspaceId: params.workspaceId, all: "true" })}>Export CSV</Button>
      </div>
      <ErrorBox error={log.error} onRetry={log.reload} />
      {log.data?.available === false && <p className="text-sm text-text-muted">The audit log table is not migrated yet.</p>}
      <DataTable
        data={log.data?.data ?? []}
        loading={log.loading}
        getRowKey={(r) => r.id}
        emptyMessage="No entries."
        pagination={log.data ? { ...log.data.pagination, isLoading: log.loading, onPageChange: setPage } : undefined}
        columns={[
          { key: "at", header: "When", render: (r) => formatDateTime(r.createdAt) },
          { key: "action", header: "Action", render: (r) => <code className="text-xs">{r.action}</code> },
          { key: "ws", header: "Company", render: (r) => (r.workspaceId ? <Link className="underline" to={`/super/workspaces/${r.workspaceId}`}>{r.workspaceId.slice(0, 8)}</Link> : "—") },
          { key: "target", header: "Target", render: (r) => (r.targetType ? `${r.targetType} ${r.targetId?.slice(0, 8) ?? ""}` : "—") },
          { key: "reason", header: "Reason", render: (r) => r.reason ?? "—" },
          { key: "actor", header: "By", render: (r) => <span className="text-xs">{r.actorUserId?.slice(0, 8) ?? "system"}{r.ip ? ` · ${r.ip}` : ""}</span> },
        ]}
      />
    </PageLayout>
  );
}
