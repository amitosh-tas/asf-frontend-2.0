import { useState } from "react";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import { getRequestErrorData, getRequestErrorMessage } from "@/features/reports/utils/requestError";
import { connectGateway, reconnectConnector } from "@/services/connectorService";
import type { ConnectResult, Connector, GatewayCatalog, GatewayField, GatewayType } from "../types";
import { isGatewayConnector } from "../utils/connectorStatus";

interface ConnectGatewayModalProps {
  catalog: GatewayCatalog;
  /** When set, the modal re-connects this connector (new credentials / rotate secret) instead of creating one. */
  connector?: Connector;
  onClose: () => void;
  onDone: (result: ConnectResult, reconnected: boolean) => void;
}

interface FormError {
  message: string;
  hint?: string;
}

export default function ConnectGatewayModal({ catalog, connector, onClose, onDone }: ConnectGatewayModalProps) {
  const reconnecting = Boolean(connector);
  const entries = catalog.data;

  const [type, setType] = useState<GatewayType>(
    connector && isGatewayConnector(connector) ? (connector.type as GatewayType) : (entries[0]?.type ?? "stripe"),
  );
  const [name, setName] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<FormError | null>(null);

  const entry = entries.find((candidate) => candidate.type === type);

  const valueOf = (field: GatewayField) =>
    values[field.name] ?? (field.type === "select" ? (field.options?.[0] ?? "") : "");

  const missingRequired = (entry?.fields ?? []).some((field) => field.required && !valueOf(field).trim());
  const canSubmit = Boolean(entry) && catalog.ready && !missingRequired && !submitting;

  const close = () => {
    setValues({}); // never keep credentials around after the dialog closes
    onClose();
  };

  const submit = async () => {
    if (!entry || !canSubmit) return;
    setSubmitting(true);
    setError(null);

    const credentials: Record<string, string> = {};
    for (const field of entry.fields) {
      const value = valueOf(field).trim();
      if (value) credentials[field.name] = value;
    }

    try {
      const response = connector
        ? await reconnectConnector(connector.id, credentials)
        : await connectGateway({ type: entry.type, name: name.trim() || undefined, credentials });
      setValues({});
      onDone(response.data, reconnecting);
    } catch (requestError) {
      const data = getRequestErrorData(requestError);
      setError({ message: data.message ?? getRequestErrorMessage(requestError), hint: data.hint });
    } finally {
      setSubmitting(false);
    }
  };

  const title = reconnecting ? `Reconnect ${entry?.label ?? "connector"}` : "Connect a payment gateway";
  const description = reconnecting
    ? "Use new credentials, or generate a new signing secret. The previous setup stops working."
    : "Connect your payment provider so paid orders and refunds are attributed automatically.";

  return (
    <Modal open title={title} description={description} onClose={close}>
      <form
        className="flex flex-col gap-5"
        autoComplete="off"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        {!catalog.ready && (
          <Alert>
            {catalog.problem ?? "The server is not ready to create gateway webhooks."} Ask your administrator to set
            the server&apos;s public HTTPS address.
          </Alert>
        )}

        {!reconnecting && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium text-text">Gateway</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {entries.map((candidate) => {
                const selected = candidate.type === type;
                return (
                  <button
                    key={candidate.type}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setType(candidate.type);
                      setValues({});
                      setError(null);
                    }}
                    className={[
                      "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition",
                      selected ? "border-primary ring-2 ring-primary/20" : "border-border hover:bg-hover",
                    ].join(" ")}
                  >
                    <span className="font-medium text-text">{candidate.label}</span>
                    <Badge variant={candidate.mode === "auto" ? "success" : "neutral"}>
                      {candidate.mode === "auto" ? "Automatic setup" : "You add the webhook"}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {entry && (
          <p className="rounded-lg border border-border bg-surface-muted p-3 text-sm leading-6 text-text-muted">
            {entry.mode === "auto"
              ? `We create the webhook in your ${entry.label} account for you and store its signing secret securely.`
              : `We generate a webhook URL and signing secret. You add them in your ${entry.label} dashboard — the secret is shown once.`}
          </p>
        )}

        {!reconnecting && (
          <FormField label="Name (optional)" htmlFor="gateway-name" hint="Helps you tell connectors apart, e.g. “Production payments”.">
            <Input id="gateway-name" type="text" maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder={entry?.label} />
          </FormField>
        )}

        {entry?.fields.map((field) => (
          <FormField key={`${entry.type}-${field.name}`} label={field.label} htmlFor={`gateway-${field.name}`} hint={field.help}>
            {field.type === "select" ? (
              <Select id={`gateway-${field.name}`} value={valueOf(field)} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}>
                {(field.options ?? []).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            ) : (
              <Input
                id={`gateway-${field.name}`}
                type={field.type}
                showPasswordToggle={field.type === "password"}
                required={field.required}
                autoComplete="off"
                spellCheck={false}
                value={valueOf(field)}
                onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
              />
            )}
          </FormField>
        ))}

        {entry && entry.notes.length > 0 && (
          <ul className="list-disc space-y-1 pl-5 text-xs leading-5 text-text-muted">
            {entry.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        )}

        {reconnecting && entry?.mode === "manual" && (
          <Alert>Generating a new secret stops the old one working. Update the webhook in {entry.label} right after.</Alert>
        )}

        {error && (
          <Alert>
            <p>{error.message}</p>
            {error.hint && <p className="mt-1 text-xs">{error.hint}</p>}
          </Alert>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={close} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting} disabled={!canSubmit}>
            {reconnecting
              ? entry?.mode === "manual"
                ? "Generate new secret"
                : "Reconnect"
              : entry?.mode === "manual"
                ? "Generate webhook details"
                : `Connect ${entry?.label ?? ""}`.trim()}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
