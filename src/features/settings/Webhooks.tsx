import { useState } from "react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { Section } from "@/features/insights/components/Kpi";
import { useAsync } from "@/features/insights/hooks/useReport";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";
import { formatDateTime } from "@/features/reports/utils/formatting";
import { api } from "@/services/api";

interface Endpoint { id: string; url: string; eventTypes: string[]; isActive: boolean; consecutiveFailures: number; disabledReason: string | null }
interface Delivery { id: string; eventType: string; status: string; attempts: number; responseStatus: number | null; error: string | null; createdAt: string; deliveredAt: string | null }

const EVENTS = ["order.attributed", "booking.created", "booking.updated", "booking.cancelled", "refund.created", "integration.failing"];

/** Outbound webhooks (5.10): endpoints, event types, delivery log, test, secret rotation. */
export default function Webhooks() {
  const hooks = useAsync<Endpoint[]>(async () => (await api.get<{ data: Endpoint[] }>("/api/workspace/webhooks")).data.data, []);
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>(["order.attributed"]);
  const [secret, setSecret] = useState<string | null>(null);
  const [log, setLog] = useState<Endpoint | null>(null);
  const deliveries = useAsync<{ data: Delivery[] }>(async () => (await api.get(`/api/workspace/webhooks/${log?.id}/deliveries`, { params: { limit: 50 } })).data, [log?.id], Boolean(log));
  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    try {
      const out = await fn();
      if (ok) toast.success(ok);
      hooks.reload();
      return out;
    } catch (e) {
      toast.error(getRequestErrorMessage(e));
      return null;
    }
  };

  return (
    <Section title="Outbound webhooks" subtitle="Signed with HMAC-SHA256 (X-Webhook-Signature-V2: t=…,v1=…) and retried for 24 hours">
      <div className="mb-4 flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <Input aria-label="Endpoint URL" placeholder="https://your-server.com/webhooks/attribution" value={url} onChange={(e) => setUrl(e.target.value)} className="max-w-md" />
          <Button
            type="button"
            disabled={!url || !events.length}
            onClick={async () => {
              const res = (await run(() => api.post("/api/workspace/webhooks", { url, eventTypes: events }), "Endpoint added")) as { data?: { signingSecret?: string } } | null;
              if (res?.data?.signingSecret) setSecret(res.data.signingSecret);
              setUrl("");
            }}
          >
            Add endpoint
          </Button>
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          {EVENTS.map((ev) => (
            <label key={ev} className="flex items-center gap-1">
              <input type="checkbox" checked={events.includes(ev)} onChange={(e) => setEvents(e.target.checked ? [...events, ev] : events.filter((x) => x !== ev))} /> {ev}
            </label>
          ))}
        </div>
      </div>
      <ul className="divide-y divide-border text-sm">
        {(hooks.data ?? []).map((h) => (
          <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <span className="min-w-0">
              <span className="block truncate font-mono text-xs">{h.url}</span>
              <span className="text-xs text-text-muted">{h.eventTypes.join(", ")}</span>
              {h.disabledReason && <span className="block text-xs text-danger">{h.disabledReason}</span>}
            </span>
            <span className="flex flex-wrap gap-2">
              <Badge variant={h.isActive ? "success" : "neutral"}>{h.isActive ? "on" : "off"}</Badge>
              <Button type="button" size="sm" variant="outline" onClick={() => setLog(h)}>Delivery log</Button>
              <Button type="button" size="sm" variant="outline" onClick={async () => {
                const r = (await run(() => api.post(`/api/workspace/webhooks/${h.id}/test`))) as { data?: { status: string; responseStatus?: number } } | null;
                if (r?.data) toast[r.data.status === "succeeded" ? "success" : "error"](`Test event: ${r.data.status}${r.data.responseStatus ? ` (HTTP ${r.data.responseStatus})` : ""}`);
              }}>Send test</Button>
              <Button type="button" size="sm" variant="outline" onClick={async () => {
                const r = (await run(() => api.post(`/api/workspace/webhooks/${h.id}/rotate-secret`))) as { data?: { signingSecret: string } } | null;
                if (r?.data) setSecret(r.data.signingSecret);
              }}>Rotate secret</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => run(() => api.patch(`/api/workspace/webhooks/${h.id}`, { isActive: !h.isActive }), "Updated")}>{h.isActive ? "Turn off" : "Turn on"}</Button>
              <Button type="button" size="sm" variant="destructive" onClick={() => run(() => api.delete(`/api/workspace/webhooks/${h.id}`), "Endpoint removed")}>Delete</Button>
            </span>
          </li>
        ))}
      </ul>
      {secret && (
        <Modal open title="Signing secret" description="Copy it now: it is shown only once." onClose={() => setSecret(null)}>
          <pre className="break-all rounded-md bg-surface-muted p-3 text-xs">{secret}</pre>
          <div className="mt-4 flex justify-end"><Button type="button" onClick={() => void navigator.clipboard?.writeText(secret).then(() => toast.success("Copied"))}>Copy</Button></div>
        </Modal>
      )}
      {log && (
        <Modal open title="Delivery log" description={log.url} size="lg" onClose={() => setLog(null)}>
          <table className="w-full text-xs">
            <thead><tr className="text-left text-text-muted"><th className="py-1">When</th><th>Event</th><th>Status</th><th>Attempts</th><th>Response</th><th /></tr></thead>
            <tbody>
              {(deliveries.data?.data ?? []).map((d) => (
                <tr key={d.id} className="border-t border-border">
                  <td className="py-1.5">{formatDateTime(d.createdAt)}</td>
                  <td>{d.eventType}</td>
                  <td><Badge variant={d.status === "succeeded" ? "success" : d.status === "failed" ? "danger" : "neutral"}>{d.status}</Badge></td>
                  <td>{d.attempts}</td>
                  <td>{d.responseStatus ?? d.error ?? "—"}</td>
                  <td>{d.status === "failed" && <button type="button" className="underline" onClick={() => run(() => api.post(`/api/workspace/webhooks/deliveries/${d.id}/retry`), "Retry queued").then(deliveries.reload)}>Retry</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {deliveries.data?.data.length === 0 && <p className="mt-3 text-sm text-text-muted">No deliveries yet.</p>}
        </Modal>
      )}
    </Section>
  );
}
