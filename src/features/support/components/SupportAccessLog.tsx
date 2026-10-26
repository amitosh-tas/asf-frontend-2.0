import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import DataTable, { type DataTableColumn } from "@/components/ui/DataTable";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";
import { getCompanySupportAccess, type SupportSessionRecord } from "@/services/supportSessionService";

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function getState(record: SupportSessionRecord): { label: string; variant: "success" | "neutral" | "warning" } {
  if (record.endedAt) return { label: "Ended", variant: "neutral" };
  return new Date(record.expiresAt).getTime() > Date.now()
    ? { label: "Active", variant: "warning" }
    : { label: "Expired", variant: "neutral" };
}

/** Company-facing transparency: every time platform support opened this company's data, and why. */
export default function SupportAccessLog() {
  const [records, setRecords] = useState<SupportSessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getCompanySupportAccess()
      .then((response) => {
        if (cancelled) return;
        if (!Array.isArray(response.data?.data)) throw new Error("Unexpected support access response format.");
        setRecords(response.data.data);
        setError("");
      })
      .catch((requestError: unknown) => {
        if (!cancelled) setError(getRequestErrorMessage(requestError));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const columns: DataTableColumn<SupportSessionRecord>[] = [
    { key: "agent", header: "Support agent", render: (record) => <span>{record.supportAgent ?? "Platform support"}</span> },
    { key: "reason", header: "Reason", render: (record) => <span className="text-sm">{record.reason}</span> },
    {
      key: "data",
      header: "Personal data",
      render: (record) => <Badge variant={record.maskPii ? "success" : "danger"}>{record.maskPii ? "Masked" : "Visible"}</Badge>,
    },
    { key: "started", header: "Started", render: (record) => <span className="whitespace-nowrap text-xs">{formatDateTime(record.startedAt)}</span> },
    { key: "ended", header: "Ended", render: (record) => <span className="whitespace-nowrap text-xs">{formatDateTime(record.endedAt ?? record.expiresAt)}</span> },
    {
      key: "state",
      header: "Status",
      render: (record) => {
        const state = getState(record);
        return <Badge variant={state.variant}>{state.label}</Badge>;
      },
    },
  ];

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-lg font-semibold">Support access</h2>
        <p className="text-sm text-text-muted">
          Our support team can open your data only inside a logged session with a written reason. Every session appears here.
        </p>
      </div>
      {error ? (
        <div role="alert" className="flex items-center justify-between rounded-lg border border-danger/30 p-4 text-sm text-danger">
          <span>{error}</span>
          <Button type="button" variant="ghost" size="sm" onClick={() => { setLoading(true); setError(""); setReloadKey((key) => key + 1); }}>
            Retry
          </Button>
        </div>
      ) : (
        <DataTable
          tableHead="Support sessions"
          tableSubHead={`${records.length} session${records.length === 1 ? "" : "s"}`}
          columns={columns}
          data={records}
          getRowKey={(record) => record.id}
          loading={loading}
          emptyMessage="Platform support has not accessed your data."
        />
      )}
    </section>
  );
}
