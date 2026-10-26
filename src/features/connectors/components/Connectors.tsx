import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import DataTable, { type DataTableColumn } from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import { getRequestErrorData, getRequestErrorMessage } from "@/features/reports/utils/requestError";
import { API_BASE_URL } from "@/services/api";
import { deleteConnector, getConnectors, getGatewayCatalog } from "@/services/connectorService";
import ConnectGatewayModal from "./ConnectGatewayModal";
import ConnectorDetailModal from "./ConnectorDetailModal";
import ConnectorSetupModal from "./ConnectorSetupModal";
import DisconnectModal from "./DisconnectModal";
import ManualSetupModal from "./ManualSetupModal";
import type { ConnectResult, Connector, ConnectorSetup, GatewayCatalog } from "../types";
import { formatDateTime, getConnectorLabel, getStatusInfo, isGatewayConnector } from "../utils/connectorStatus";

function getConnectorList(data: unknown): Connector[] {
  const payload = (data as { data?: unknown })?.data;
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown })?.data)
      ? (payload as { data: unknown[] }).data
      : null;
  if (!list) throw new Error("Unexpected connectors API response format.");
  return list as Connector[];
}

/** Webhook URL for connectors created the old manual way (the backend now also returns `webhookUrl`). */
function legacyWebhookUrl(connector: Connector): string {
  return (
    connector.webhookUrl ??
    `${API_BASE_URL}/api/connectors/${connector.type}/webhook/${encodeURIComponent(connector.id)}`
  );
}

function Connectors() {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [catalog, setCatalog] = useState<GatewayCatalog | null>(null);
  const [catalogError, setCatalogError] = useState("");

  const [connectOpen, setConnectOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [reconnectTarget, setReconnectTarget] = useState<Connector | null>(null);
  const [disconnectTarget, setDisconnectTarget] = useState<Connector | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Connector | null>(null);
  const [legacySetup, setLegacySetup] = useState<{ connector: Connector; setup: ConnectorSetup } | null>(null);
  const [reveal, setReveal] = useState<ConnectResult | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Data is fetched inside effects keyed by a counter (same pattern as the Customers page);
  // bumping a counter reloads without flashing the table. Retry buttons also reset the loading/error flags.
  const [listKey, setListKey] = useState(0);
  const [catalogKey, setCatalogKey] = useState(0);
  const refresh = useCallback(() => setListKey((key) => key + 1), []);
  const refreshCatalog = useCallback(() => setCatalogKey((key) => key + 1), []);

  useEffect(() => {
    let cancelled = false;
    getConnectors()
      .then((response) => {
        if (cancelled) return;
        setConnectors(getConnectorList(response.data));
        setError("");
      })
      .catch((fetchError: unknown) => {
        if (cancelled) return;
        console.error("Failed to fetch connectors:", fetchError);
        setError("Unable to load connectors. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [listKey]);

  useEffect(() => {
    let cancelled = false;
    getGatewayCatalog()
      .then((response) => {
        if (cancelled) return;
        setCatalog(response.data);
        setCatalogError("");
      })
      .catch((fetchError: unknown) => {
        if (cancelled) return;
        console.error("Failed to fetch gateway catalog:", fetchError);
        setCatalogError(getRequestErrorMessage(fetchError));
      });
    return () => {
      cancelled = true;
    };
  }, [catalogKey]);

  // Keep the open detail modal on fresh data after a refresh / replay / health check.
  const detailConnector = detailId ? (connectors.find((connector) => connector.id === detailId) ?? null) : null;

  const handleConnected = async (result: ConnectResult, reconnected: boolean) => {
    setConnectOpen(false);
    setReconnectTarget(null);
    refresh();
    if (result.setup) {
      setReveal(result); // Razorpay: the one-time secret must be shown before anything else
      return;
    }
    toast.success(reconnected ? `${getConnectorLabel(result.type)} reconnected.` : `${getConnectorLabel(result.type)} connected.`);
    setDetailId(result.id);
  };

  const removeConnector = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteConnector(deleteTarget.id);
      setDeleteTarget(null);
      refresh();
      toast.success("Connector deleted.");
    } catch (deleteError) {
      const info = getRequestErrorData(deleteError);
      if (info.code === "connector_has_data") {
        // Connectors that already received data can only be disconnected, which keeps the history.
        const target = deleteTarget;
        setDeleteTarget(null);
        if (isGatewayConnector(target)) setDisconnectTarget(target);
        toast.error(info.message ?? "This connector has data and can only be disconnected.");
      } else {
        toast.error(getRequestErrorMessage(deleteError));
      }
    } finally {
      setDeleting(false);
    }
  };

  const columns: DataTableColumn<Connector>[] = [
    {
      key: "type",
      header: "Gateway",
      render: (connector) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium">{getConnectorLabel(connector.type)}</span>
          {connector.connection?.environment && <Badge variant="neutral">{connector.connection.environment}</Badge>}
        </div>
      ),
    },
    {
      key: "name",
      header: "Name",
      render: (connector) => (
        <div className="flex flex-col">
          <span>{connector.name}</span>
          {connector.connection?.businessName && <span className="text-xs text-text-muted">{connector.connection.businessName}</span>}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (connector) => {
        const info = getStatusInfo(connector);
        return (
          <span title={info.hint}>
            <Badge variant={info.variant}>{info.label}</Badge>
          </span>
        );
      },
    },
    {
      key: "lastEvent",
      header: "Last event",
      render: (connector) => <span className="whitespace-nowrap text-xs text-text-muted">{formatDateTime(connector.lastEventAt)}</span>,
    },
    {
      key: "errors",
      header: "Errors",
      render: (connector) => (
        <span className={connector.errorCount ? "text-xs font-medium text-danger" : "text-xs text-text-muted"} title={connector.lastError ?? undefined}>
          {connector.errorCount ?? 0}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (connector) => {
        const gateway = isGatewayConnector(connector);
        const disabled = connector.status === "disabled";
        return (
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setDetailId(connector.id)}>
              Details
            </Button>
            {gateway && catalog && (
              <Button type="button" variant="outline" size="sm" onClick={() => setReconnectTarget(connector)}>
                Reconnect
              </Button>
            )}
            {!gateway && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLegacySetup({ connector, setup: { providerType: connector.type, webhookUrl: legacyWebhookUrl(connector) } })}
              >
                Setup
              </Button>
            )}
            {gateway && !disabled ? (
              <Button type="button" variant="destructive" size="sm" onClick={() => setDisconnectTarget(connector)}>
                Disconnect
              </Button>
            ) : (
              <Button type="button" variant="destructive" size="sm" onClick={() => setDeleteTarget(connector)}>
                Delete
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const canConnect = Boolean(catalog) && catalog!.data.length > 0 && !loading && !error;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-lg font-semibold">Connectors</h2>
          <p className="text-sm text-text-muted">Connect Stripe, PayPal or Razorpay so paid orders and refunds are attributed automatically.</p>
        </div>
        <Button type="button" onClick={() => setConnectOpen(true)} disabled={!canConnect} icon={<i className="fi fi-rr-plus" aria-hidden="true" />}>
          Connect gateway
        </Button>
      </div>

      {catalogError && (
        <Alert>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>Couldn&apos;t load the list of supported gateways: {catalogError}</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setCatalogError(""); refreshCatalog(); }}>
              Retry
            </Button>
          </div>
        </Alert>
      )}
      {catalog && !catalog.ready && (
        <Alert>
          Gateway setup is unavailable right now: {catalog.problem ?? "the server's public address is not configured."} Contact your administrator.
        </Alert>
      )}

      {!error ? (
        <DataTable
          tableHead="Your connectors"
          tableSubHead={`${connectors.length} connector${connectors.length === 1 ? "" : "s"} found`}
          columns={columns}
          data={connectors}
          getRowKey={(connector) => connector.id}
          emptyMessage="No connectors yet. Connect a payment gateway to get started."
          loading={loading}
        />
      ) : (
        <div role="alert" className="flex items-center justify-between rounded-lg border border-danger/30 p-4 text-sm text-danger">
          <span>{error}</span>
          <Button type="button" variant="ghost" size="sm" onClick={() => { setLoading(true); setError(""); refresh(); }}>
            Retry
          </Button>
        </div>
      )}

      {connectOpen && catalog && <ConnectGatewayModal catalog={catalog} onClose={() => setConnectOpen(false)} onDone={(result, reconnected) => void handleConnected(result, reconnected)} />}

      {reconnectTarget && catalog && (
        <ConnectGatewayModal catalog={catalog} connector={reconnectTarget} onClose={() => setReconnectTarget(null)} onDone={(result, reconnected) => void handleConnected(result, reconnected)} />
      )}

      {reveal && <ManualSetupModal result={reveal} onClose={() => setReveal(null)} />}

      {detailConnector && <ConnectorDetailModal connector={detailConnector} onClose={() => setDetailId(null)} onChanged={refresh} />}

      {disconnectTarget && <DisconnectModal connector={disconnectTarget} onClose={() => setDisconnectTarget(null)} onDisconnected={refresh} />}

      {deleteTarget && (
        <Modal open title="Delete connector?" description={`This removes “${deleteTarget.name}” from your connectors.`} onClose={() => setDeleteTarget(null)} size="sm">
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" loading={deleting} onClick={() => void removeConnector()}>
              Delete connector
            </Button>
          </div>
        </Modal>
      )}

      {legacySetup && (
        <ConnectorSetupModal
          connectorId={legacySetup.connector.id}
          connectorName={legacySetup.connector.name}
          setup={legacySetup.setup}
          onClose={() => setLegacySetup(null)}
          onSaved={async () => {
            refresh();
          }}
        />
      )}
    </section>
  );
}

export default Connectors;
