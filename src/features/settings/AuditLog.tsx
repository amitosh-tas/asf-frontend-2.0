import { useState } from "react";
import DataTable from "@/components/ui/DataTable";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import toast from "react-hot-toast";
import { useAsync } from "@/features/insights/hooks/useReport";
import { formatDateTime } from "@/features/reports/utils/formatting";
import { downloadCsv, type Page } from "@/services/insights";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";
import { api } from "@/services/api";

interface Entry { id: string; createdAt: string; actorType: string; actorName: string | null; action: string; targetType: string | null; reason: string | null; ip: string | null }

/** Audit log (4.10 / 5.10): logins, changes and platform-admin access. */
export default function AuditLog() {
  const [page, setPage] = useState(1);
  const [actorType, setActorType] = useState("");
  const log = useAsync<Page<Entry> & { available?: boolean }>(async () => (await api.get("/api/workspace/audit-log", { params: { page, limit: 25, actorType: actorType || undefined } })).data, [page, actorType]);
  const p = log.data?.pagination;
  return (
    <DataTable
      tableHead="Audit log"
      tableSubHead="Logins, key and settings changes, and every platform-admin access"
      filters={
        <div className="flex flex-wrap gap-2">
          <select aria-label="Actor" value={actorType} onChange={(e) => (setActorType(e.target.value), setPage(1))} className="rounded-full border border-border px-3 py-1.5 text-sm">
            <option value="">Everyone</option>
            <option value="user">Your team</option>
            <option value="platform_admin">Platform support</option>
            <option value="api_key">API keys</option>
            <option value="system">System</option>
          </select>
          <Button type="button" size="sm" variant="outline" onClick={() => downloadCsv("/api/workspace/audit-log", { actorType: actorType || undefined }, "audit-log.csv").catch((e) => toast.error(getRequestErrorMessage(e)))}>Export CSV</Button>
        </div>
      }
      loading={log.loading}
      data={log.data?.data ?? []}
      getRowKey={(e) => e.id}
      emptyMessage={log.data?.available === false ? "The audit log table is not set up yet (run the database migration)." : "No entries."}
      pagination={p ? { page: p.page ?? 1, limit: p.limit, total: p.total, pages: p.pages ?? 1, isLoading: log.loading, onPageChange: setPage } : undefined}
      columns={[
        { key: "at", header: "When", render: (e) => formatDateTime(e.createdAt) },
        { key: "who", header: "Who", render: (e) => <span>{e.actorName ?? "—"} <Badge variant={e.actorType === "platform_admin" ? "warning" : "neutral"}>{e.actorType}</Badge></span> },
        { key: "what", header: "Action", render: (e) => e.action },
        { key: "why", header: "Reason", render: (e) => e.reason ?? "" },
        { key: "ip", header: "IP", render: (e) => e.ip ?? "" },
      ]}
    />
  );
}
