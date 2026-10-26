import { useAsync } from "../hooks/useReport";
import { fetchAlerts, type Alert } from "@/services/insights";

/** Overview alerts (5.1): connector failing, no events in 24 hours, coverage dropped. */
export default function AlertsBanner({ workspaceId }: { workspaceId?: string }) {
  const alerts = useAsync<Alert[]>(() => fetchAlerts(workspaceId), [workspaceId]);
  if (!alerts.data?.length) return null;
  return (
    <div className="mb-6 flex flex-col gap-2">
      {alerts.data.map((a) => (
        <div
          key={a.type + a.message}
          role="alert"
          className={`rounded-lg border px-4 py-3 text-sm ${a.severity === "high" ? "border-danger/30 bg-danger/5 text-danger" : "border-warning/30 bg-warning/5 text-warning"}`}
        >
          <strong className="mr-2 font-semibold">{a.type === "connector_failing" ? "Integration failing" : a.type === "no_events_24h" ? "No events" : "Coverage dropped"}</strong>
          {a.message}
        </div>
      ))}
    </div>
  );
}
