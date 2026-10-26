import { useState } from "react";
import toast from "react-hot-toast";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";
import { verifyConnector } from "@/services/connectorService";
import ConnectorEventsPanel from "./ConnectorEventsPanel";
import CopyField from "./CopyField";
import type { Connector, VerifyResult } from "../types";
import { CHECK_LABELS, formatDateTime, getConnectorLabel, getStatusInfo, isGatewayConnector } from "../utils/connectorStatus";

interface ConnectorDetailModalProps {
  connector: Connector;
  onClose: () => void;
  onChanged: () => void;
}

type Tab = "overview" | "events";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-border py-2 text-sm last:border-b-0">
      <dt className="text-text-muted">{label}</dt>
      <dd className="text-right text-text">{children}</dd>
    </div>
  );
}

export default function ConnectorDetailModal({ connector, onClose, onChanged }: ConnectorDetailModalProps) {
  const [tab, setTab] = useState<Tab>("overview");
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [stripeKey, setStripeKey] = useState("");

  const status = getStatusInfo(connector);
  const gateway = isGatewayConnector(connector);
  const connection = connector.connection;

  const runChecks = async () => {
    setVerifying(true);
    try {
      const response = await verifyConnector(
        connector.id,
        connector.type === "stripe" && stripeKey.trim() ? { secretKey: stripeKey.trim() } : undefined,
      );
      setVerifyResult(response.data);
      setStripeKey(""); // the key is only needed for this one call
      onChanged();
    } catch (requestError) {
      toast.error(getRequestErrorMessage(requestError));
    } finally {
      setVerifying(false);
    }
  };

  const close = () => {
    setStripeKey("");
    onClose();
  };

  return (
    <Modal open title={connector.name} description={`${getConnectorLabel(connector.type)} connector`} onClose={close} size="lg">
      <div className="flex flex-col gap-5">
        <div role="tablist" aria-label="Connector sections" className="inline-flex w-max rounded-full border border-border p-1">
          {(["overview", "events"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={[
                "rounded-full px-4 py-1.5 text-sm font-medium transition",
                tab === value ? "bg-primary text-white" : "text-text-muted hover:text-text",
              ].join(" ")}
            >
              {value === "overview" ? "Overview" : "Event log"}
            </button>
          ))}
        </div>

        {tab === "events" ? (
          <ConnectorEventsPanel connector={connector} onChanged={onChanged} />
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={status.variant}>{status.label}</Badge>
              <span className="text-sm text-text-muted">{status.hint}</span>
            </div>

            {connector.lastError && connector.status === "failing" && <Alert>Last error: {connector.lastError}</Alert>}

            <dl>
              <Row label="Gateway">{getConnectorLabel(connector.type)}</Row>
              {connection?.environment && <Row label="Environment">{connection.environment}</Row>}
              {connection?.businessName && <Row label="Account">{connection.businessName}</Row>}
              {connection?.accountId && <Row label="Account ID">{connection.accountId}</Row>}
              {connection && <Row label="Setup">{connection.mode === "auto" ? "Automatic (webhook created for you)" : "Manual (added in the gateway dashboard)"}</Row>}
              <Row label="Connected">{formatDateTime(connection?.connectedAt ?? connector.createdAt)}</Row>
              <Row label="Last event">{formatDateTime(connector.lastEventAt)}</Row>
              <Row label="Errors">{connector.errorCount ?? 0}</Row>
            </dl>

            {connector.webhookUrl && <CopyField label="Webhook URL" value={connector.webhookUrl} />}

            {connection && connection.enabledEvents.length > 0 && (
              <div>
                <p className="text-sm font-medium text-text">Events handled</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {connection.enabledEvents.map((event) => (
                    <li key={event}>
                      <code className="rounded-md border border-border bg-surface-muted px-2 py-1 text-xs">{event}</code>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {gateway && connector.status !== "disabled" && (
              <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
                <div>
                  <p className="text-sm font-medium text-text">Health check</p>
                  <p className="text-xs text-text-muted">Confirms the signing secret is stored and the webhook is set up correctly.</p>
                </div>

                {connector.type === "stripe" && (
                  <FormField
                    label="Stripe API key (optional)"
                    htmlFor="verify-stripe-key"
                    hint="Also checks the webhook inside Stripe. Used for this check only and never stored."
                  >
                    <Input id="verify-stripe-key" type="password" showPasswordToggle autoComplete="off" spellCheck={false} value={stripeKey} onChange={(event) => setStripeKey(event.target.value)} placeholder="sk_… or rk_…" />
                  </FormField>
                )}

                <div>
                  <Button type="button" variant="outline" loading={verifying} onClick={() => void runChecks()}>
                    Run health check
                  </Button>
                </div>

                {verifyResult && (
                  <ul className="flex flex-col gap-2" aria-live="polite">
                    {verifyResult.checks.map((check) => (
                      <li key={check.name} className="flex gap-2 text-sm">
                        <span aria-hidden="true" className={check.ok ? "text-success" : check.name === "first_event_received" ? "text-warning" : "text-danger"}>
                          {check.ok ? "✓" : check.name === "first_event_received" ? "…" : "✗"}
                        </span>
                        <span>
                          <span className="font-medium text-text">{CHECK_LABELS[check.name] ?? check.name}</span>
                          <span className="block text-xs text-text-muted">{check.detail}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}

        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={close}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
