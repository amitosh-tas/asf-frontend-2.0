import { useState } from "react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { updateConnector } from "@/services/connectorService";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";
import type { ConnectorSetup } from "../types";

interface ConnectorSetupModalProps {
  connectorId: string;
  connectorName: string;
  setup: ConnectorSetup;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

export default function ConnectorSetupModal({
  connectorId,
  connectorName,
  setup,
  onClose,
  onSaved,
}: ConnectorSetupModalProps) {
  const [secret, setSecret] = useState("");
  const [saving, setSaving] = useState(false);
  const [secretSaved, setSecretSaved] = useState(false);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(setup.webhookUrl);
      toast.success("Webhook URL copied.");
    } catch (error) {
      console.error("Failed to copy webhook URL:", error);
      toast.error("Unable to copy the webhook URL.");
    }
  };

  const saveSecret = async () => {
    const trimmedSecret = secret.trim();
    if (!trimmedSecret) return;

    setSaving(true);
    try {
      await updateConnector(connectorId, {
        type: setup.providerType,
        name: connectorName,
        config: { webhookSecret: trimmedSecret },
      });
      setSecret("");
      setSecretSaved(true);
      await onSaved();
      toast.success("Webhook signing secret saved.");
    } catch (error) {
      console.error("Failed to save webhook signing secret:", error);
      toast.error(getRequestErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const isStripe = setup.providerType === "stripe";

  return (
    <Modal
      open
      title={`${isStripe ? "Stripe" : "Connector"} setup`}
      description="Register the generated endpoint with your payment provider."
      onClose={() => {
        setSecret("");
        onClose();
      }}
    >
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-sm leading-6 text-text-muted">
            Copy this URL into the provider webhook endpoint configuration.
          </p>
          <code className="mt-2 block break-all rounded-lg border border-border bg-surface-muted p-3 text-xs text-text">
            {setup.webhookUrl}
          </code>
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            onClick={() => void copyUrl()}
            icon={<i className="fi fi-rr-copy" aria-hidden="true" />}
          >
            Copy URL
          </Button>
        </div>

        {isStripe ? (
          <div className="rounded-lg border border-border bg-surface-muted p-3 text-sm leading-6 text-text-muted">
            In Stripe Dashboard, create or edit the endpoint, subscribe it to
            the events you need, then reveal and copy its <code>whsec_...</code>{" "}
            signing secret. This is not a Stripe API secret key.
          </div>
        ) : (
          <p className="text-sm leading-6 text-text-muted">
            Use the same webhook secret entered during connector creation.
          </p>
        )}

        {isStripe && !secretSaved && (
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void saveSecret();
            }}
          >
            <FormField
              label="Stripe webhook signing secret"
              htmlFor="stripe-webhook-signing-secret"
            >
              <Input
                id="stripe-webhook-signing-secret"
                type="password"
                showPasswordToggle
                autoComplete="new-password"
                value={secret}
                onChange={(event) => setSecret(event.target.value)}
                placeholder="whsec_..."
              />
            </FormField>
            <Button type="submit" loading={saving} disabled={!secret.trim()}>
              Save signing secret
            </Button>
          </form>
        )}

        {isStripe && secretSaved && (
          <p className="text-sm font-medium text-success">
            Stripe signing secret update was accepted by the backend.
          </p>
        )}

        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSecret("");
              onClose();
            }}
          >
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}
