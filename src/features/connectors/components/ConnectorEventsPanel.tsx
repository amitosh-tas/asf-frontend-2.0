import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { getRequestErrorData, getRequestErrorMessage } from "@/features/reports/utils/requestError";
import {
  getConnectorEvent,
  getConnectorEvents,
  replayConnectorEvent,
  replayFailedConnectorEvents,
} from "@/services/connectorService";
import type { Connector, ConnectorEvent, ConnectorEventsPage } from "../types";
import { eventStatusVariant, formatDateTime } from "../utils/connectorStatus";

const STATUS_FILTERS = [
  { value: "", label: "All events" },
  { value: "failed", label: "Failed" },
  { value: "dead", label: "Dead (gave up)" },
  { value: "pending", label: "Pending" },
  { value: "processed", label: "Processed" },
] as const;

interface ConnectorEventsPanelProps {
  connector: Connector;
  /** Called after a replay so the parent can refresh the connector's status. */
  onChanged: () => void;
}

const canReplay = (event: ConnectorEvent) => event.status !== "processed" && event.status !== "replaying";

export default function ConnectorEventsPanel({ connector, onChanged }: ConnectorEventsPanelProps) {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ConnectorEventsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [openPayloadId, setOpenPayloadId] = useState<string | null>(null);
  const [payload, setPayload] = useState<string>("");
  const [payloadLoading, setPayloadLoading] = useState(false);

  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((key) => key + 1);

  // `loading` is switched on by the handlers that change the filter / page (or press Refresh).
  useEffect(() => {
    let cancelled = false;
    getConnectorEvents(connector.id, { page, limit: 10, status: status || undefined })
      .then((response) => {
        if (cancelled) return;
        setData(response.data);
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
  }, [connector.id, page, status, reloadKey]);

  const replay = async (event: ConnectorEvent) => {
    if (busyId) return;
    setBusyId(event.id);
    try {
      // "dead" events need an explicit force: they already failed several times.
      const response = await replayConnectorEvent(connector.id, event.id, event.status === "dead");
      toast.success(response.data.message ?? "Event replayed.");
    } catch (requestError) {
      const info = getRequestErrorData(requestError);
      toast.error(info.message ?? getRequestErrorMessage(requestError));
    } finally {
      setBusyId(null);
      reload();
      onChanged();
    }
  };

  const replayAllFailed = async () => {
    if (bulkBusy) return;
    setBulkBusy(true);
    try {
      const { data: result } = await replayFailedConnectorEvents(connector.id);
      if (result.attempted === 0) toast("No failed events to replay.");
      else if (result.processed === result.attempted) toast.success(`Replayed ${result.processed} event${result.processed === 1 ? "" : "s"}.`);
      else toast.error(`${result.processed} of ${result.attempted} replayed; ${result.stillFailing + result.dead} still failing.`);
    } catch (requestError) {
      toast.error(getRequestErrorMessage(requestError));
    } finally {
      setBulkBusy(false);
      reload();
      onChanged();
    }
  };

  const togglePayload = async (event: ConnectorEvent) => {
    if (openPayloadId === event.id) {
      setOpenPayloadId(null);
      return;
    }
    setOpenPayloadId(event.id);
    setPayload("");
    setPayloadLoading(true);
    try {
      const response = await getConnectorEvent(connector.id, event.id);
      setPayload(JSON.stringify(response.data.payload, null, 2));
    } catch (requestError) {
      setPayload(`Could not load the payload: ${getRequestErrorMessage(requestError)}`);
    } finally {
      setPayloadLoading(false);
    }
  };

  const events = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Select
          aria-label="Filter events by status"
          value={status}
          onChange={(event) => {
            setLoading(true);
            setStatus(event.target.value);
            setPage(1);
          }}
        >
          {STATUS_FILTERS.map((filter) => (
            <option key={filter.value} value={filter.value}>
              {filter.label}
            </option>
          ))}
        </Select>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => { setLoading(true); reload(); }} disabled={loading}>
            Refresh
          </Button>
          <Button type="button" size="sm" loading={bulkBusy} onClick={() => void replayAllFailed()} disabled={connector.status === "disabled"}>
            Replay failed events
          </Button>
        </div>
      </div>

      {error && <Alert>{error}</Alert>}

      {loading && !data ? (
        <p className="text-sm text-text-muted">Loading events…</p>
      ) : events.length === 0 ? (
        <p className="rounded-lg border border-border p-4 text-sm text-text-muted">
          {status ? "No events with this status." : "No events yet. They appear here as soon as the gateway sends one."}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {events.map((event) => (
            <li key={event.id} className="rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="text-xs font-medium text-text">{event.eventType}</code>
                    <Badge variant={eventStatusVariant(event.status)}>{event.status}</Badge>
                    {event.replayCount > 0 && <span className="text-xs text-text-muted">replayed {event.replayCount}×</span>}
                  </div>
                  <span className="text-xs text-text-muted">Received {formatDateTime(event.receivedAt)}</span>
                </div>
                <div className="flex gap-2">
                  {event.hasPayload && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => void togglePayload(event)}>
                      {openPayloadId === event.id ? "Hide payload" : "Payload"}
                    </Button>
                  )}
                  {canReplay(event) && connector.status !== "disabled" && (
                    <Button type="button" variant="outline" size="sm" loading={busyId === event.id} onClick={() => void replay(event)}>
                      Replay
                    </Button>
                  )}
                </div>
              </div>
              {event.error && <p className="mt-2 text-xs text-danger">{event.error}</p>}
              {openPayloadId === event.id && (
                <pre className="mt-2 max-h-64 overflow-auto rounded-lg border border-border bg-surface-muted p-3 text-xs">
                  {payloadLoading ? "Loading…" : payload}
                </pre>
              )}
            </li>
          ))}
        </ul>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>
            Page {pagination.page} of {pagination.pages} · {pagination.total} events
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => { setLoading(true); setPage((current) => current - 1); }}>
              Previous
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={page >= pagination.pages || loading} onClick={() => { setLoading(true); setPage((current) => current + 1); }}>
              Next
            </Button>
          </div>
        </div>
      )}

      <p className="text-xs leading-5 text-text-muted">
        Payloads may contain customer details. Replaying is safe: orders and refunds are de-duplicated, so an event is never counted twice.
      </p>
    </div>
  );
}
