import { useState } from "react";
import toast from "react-hot-toast";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import CopyField from "./CopyField";
import type { ConnectResult } from "../types";
import { getConnectorLabel } from "../utils/connectorStatus";

interface ManualSetupModalProps {
  result: ConnectResult;
  onClose: () => void;
}

/**
 * Razorpay (and any gateway where the merchant adds the webhook themselves).
 * The signing secret exists ONLY in this response, so closing is gated on an explicit confirmation.
 */
export default function ManualSetupModal({ result, onClose }: ManualSetupModalProps) {
  const [saved, setSaved] = useState(false);
  const setup = result.setup;
  const label = getConnectorLabel(result.type);

  if (!setup) return null;

  const requestClose = () => {
    if (!saved) {
      toast.error("Copy the secret and tick the box first — it cannot be shown again.");
      return;
    }
    onClose();
  };

  return (
    <Modal open title={`Finish ${label} setup`} description="Add this webhook in your gateway dashboard." onClose={requestClose} size="lg">
      <div className="flex flex-col gap-5">
        <Alert>
          <strong>This secret is shown only once.</strong> Copy it now. If you lose it, reconnect the connector to
          generate a new one.
        </Alert>

        <CopyField label="Webhook URL" value={setup.webhookUrl} />
        <CopyField label="Webhook secret" value={setup.webhookSecret} secret />

        <div>
          <p className="text-sm font-medium text-text">Events to enable</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {setup.events.map((event) => (
              <li key={event}>
                <code className="rounded-md border border-border bg-surface-muted px-2 py-1 text-xs">{event}</code>
              </li>
            ))}
          </ul>
          {setup.optionalEvents.length > 0 && (
            <p className="mt-2 text-xs text-text-muted">Optional: {setup.optionalEvents.join(", ")}</p>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-text">Steps</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-6 text-text-muted">
            {setup.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>

        <label className="flex items-start gap-2 text-sm text-text">
          <input type="checkbox" className="mt-1" checked={saved} onChange={(event) => setSaved(event.target.checked)} />
          <span>I have copied the secret and added the webhook in {label}.</span>
        </label>

        <div className="flex justify-end">
          <Button type="button" disabled={!saved} onClick={requestClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}
