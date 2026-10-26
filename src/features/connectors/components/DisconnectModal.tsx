import { useState } from "react";
import toast from "react-hot-toast";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { getRequestErrorData, getRequestErrorMessage } from "@/features/reports/utils/requestError";
import { disconnectConnector } from "@/services/connectorService";
import type { Connector, DisconnectResult } from "../types";
import { getConnectorLabel } from "../utils/connectorStatus";

interface DisconnectModalProps {
  connector: Connector;
  onClose: () => void;
  onDisconnected: () => void;
}

export default function DisconnectModal({ connector, onClose, onDisconnected }: DisconnectModalProps) {
  const label = getConnectorLabel(connector.type);
  const [stripeKey, setStripeKey] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ message: string; canForce: boolean; hint?: string } | null>(null);
  const [result, setResult] = useState<DisconnectResult | null>(null);

  const submit = async (force = false) => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await disconnectConnector(connector.id, {
        ...(connector.type === "stripe" && stripeKey.trim() ? { credentials: { secretKey: stripeKey.trim() } } : {}),
        force,
      });
      setStripeKey("");
      onDisconnected();
      if (response.data.manualSteps?.length) {
        setResult(response.data); // show what is left to do by hand
      } else {
        toast.success(`${label} disconnected.`);
        onClose();
      }
    } catch (requestError) {
      const info = getRequestErrorData(requestError);
      setError({ message: info.message ?? getRequestErrorMessage(requestError), canForce: Boolean(info.canForce), hint: info.hint });
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <Modal open title={`${label} disconnected`} description="One more step to finish cleaning up." onClose={onClose}>
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-6 text-text-muted">
            The connector no longer accepts events and its stored secrets were erased. Your history is kept.
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-text">
            {result.manualSteps?.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
          <div className="flex justify-end">
            <Button type="button" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open title={`Disconnect ${label}?`} description={`“${connector.name}” will stop receiving events.`} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-text-muted">
          <li>New payments and refunds from this gateway will no longer be recorded.</li>
          <li>Existing orders, events and reports are kept.</li>
          <li>You can reconnect at any time.</li>
        </ul>

        {connector.type === "stripe" && (
          <FormField
            label="Stripe API key (optional)"
            htmlFor="disconnect-stripe-key"
            hint="Provide it to also delete the webhook in Stripe. We never stored your key, so without it you delete the webhook in Stripe yourself."
          >
            <Input id="disconnect-stripe-key" type="password" showPasswordToggle autoComplete="off" spellCheck={false} value={stripeKey} onChange={(event) => setStripeKey(event.target.value)} placeholder="sk_… or rk_…" />
          </FormField>
        )}
        {connector.type === "razorpay" && (
          <p className="text-sm text-text-muted">Razorpay webhooks are managed in your Razorpay dashboard, so you will need to remove it there.</p>
        )}

        {error && (
          <Alert>
            <p>{error.message}</p>
            {error.hint && <p className="mt-1 text-xs">{error.hint}</p>}
          </Alert>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          {error?.canForce && (
            <Button type="button" variant="destructive" loading={submitting} onClick={() => void submit(true)}>
              Disconnect anyway
            </Button>
          )}
          <Button type="button" variant="destructive" loading={submitting && !error?.canForce} onClick={() => void submit(false)}>
            Disconnect
          </Button>
        </div>
      </div>
    </Modal>
  );
}
