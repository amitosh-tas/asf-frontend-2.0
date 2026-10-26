import { useState } from "react";
import type { KeyCredentials, TMode } from "@/services/apiService";
import {
  countUniqueOrigins,
  normalizeAllowedOrigin,
} from "../utils/origins";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Alert from "@/components/ui/Alert";

const MAX_COMPANY_ORIGINS = 20;

interface CreateApiKeyModalProps {
  open: boolean;
  creating: boolean;
  error: string;
  existingOrigins: string[];
  onCancel: () => void;
  onSubmit: (credentials: KeyCredentials) => Promise<boolean>;
}

function CreateApiKeyModal({
  open,
  creating,
  error,
  existingOrigins,
  onCancel,
  onSubmit,
}: CreateApiKeyModalProps) {
  const [name, setName] = useState("");
  const [mode, setMode] = useState<TMode>("live");
  const [keyType, setKeyType] = useState<"publishable" | "secret">("publishable");
  const [originInput, setOriginInput] = useState("");
  const [origins, setOrigins] = useState<string[]>([]);
  const [validationError, setValidationError] = useState("");

  if (!open) return null;

  const existingOriginKeys = new Set(
    existingOrigins.map(
      (origin) =>
        normalizeAllowedOrigin(origin.trim()) ?? origin.trim().toLowerCase(),
    ),
  );
  const companyOriginCount = countUniqueOrigins([
    ...existingOrigins,
    ...origins,
  ]);
  const canAddOrigin = (origin: string) =>
    existingOriginKeys.has(origin.toLowerCase()) ||
    countUniqueOrigins([...existingOrigins, ...origins, origin]) <=
      MAX_COMPANY_ORIGINS;

  const addOrigin = () => {
    const normalizedOrigin = normalizeAllowedOrigin(originInput.trim());
    if (!normalizedOrigin) {
      setValidationError("Enter a valid origin, such as https://example.com.");
      return;
    }
    if (
      origins.some((origin) => origin.toLowerCase() === normalizedOrigin.toLowerCase())
    ) {
      setValidationError("This origin has already been added.");
      return;
    }
    if (!canAddOrigin(normalizedOrigin)) {
      setValidationError(
        `A company can have up to ${MAX_COMPANY_ORIGINS} unique allowed origins.`,
      );
      return;
    }

    setOrigins((current) => [...current, normalizedOrigin]);
    setOriginInput("");
    setValidationError("");
  };

  const cancel = () => {
    setName("");
    setOrigins([]);
    setOriginInput("");
    setValidationError("");
    onCancel();
  };

  const submit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      setValidationError("Enter a name for this API key.");
      return;
    }
    if (keyType === "publishable" && origins.length === 0) {
      setValidationError("Add at least one allowed origin.");
      return;
    }
    if (
      countUniqueOrigins([...existingOrigins, ...origins]) >
      MAX_COMPANY_ORIGINS
    ) {
      setValidationError(
        `A company can have up to ${MAX_COMPANY_ORIGINS} unique allowed origins.`,
      );
      return;
    }

    if (await onSubmit({ name: name.trim(), mode, type: keyType, allowedOrigins: keyType === "publishable" ? origins : [] })) {
      setName("");
      setOrigins([]);
      setOriginInput("");
      setValidationError("");
      cancel();
    }
  };

  return (
    <Modal
      open={open}
      title="Generate an API key"
      description="Give the key a name and restrict it to the origins allowed to use it. The secret is shown only once."
      onClose={cancel}
    >
      <form
        onSubmit={(event) => void submit(event)}
        className="flex flex-col gap-5"
      >
        <FormField label="Key name" htmlFor="api-key-name">
          <Input
            id="api-key-name"
            required
            maxLength={100}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Production website"
          />
        </FormField>

        <FormField label="Key type" htmlFor="api-key-type">
          <Select id="api-key-type" value={keyType} onChange={(event) => setKeyType(event.target.value as "publishable" | "secret")}>
            <option value="publishable">Publishable — website tracking script (safe to show in page source)</option>
            <option value="secret">Secret — your server: orders, refunds, reports (never put it in a website)</option>
          </Select>
        </FormField>

        <FormField label="Mode" htmlFor="api-key-mode">
          <Select
            id="api-key-mode"
            value={mode}
            onChange={(event) => setMode(event.target.value as TMode)}
          >
            <option value="live">Live</option>
            <option value="test">Test (sandbox: data is marked as test and kept out of reports)</option>
          </Select>
        </FormField>

        <div className="flex items-center justify-between gap-3">
          <label
            htmlFor="api-key-origin"
            className="block text-xs font-medium text-text-muted"
          >
            Allowed origins
          </label>
          <span className="text-xs text-text-muted">
            {companyOriginCount} / {MAX_COMPANY_ORIGINS} after saving
          </span>
        </div>
        <div className="flex gap-2">
          <Input
            id="api-key-origin"
            type="url"
            value={originInput}
            onChange={(event) => setOriginInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addOrigin();
              }
            }}
            placeholder="https://example.com"
            className="min-w-0 flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={addOrigin}
            disabled={!originInput.trim()}
          >
            Add origin
          </Button>
        </div>
        {origins.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {origins.map((origin) => (
              <li
                key={origin}
                className="flex items-center gap-2 rounded-full border border-border bg-surface-muted px-3 py-1 text-xs"
              >
                <span className="max-w-72 truncate">{origin}</span>
                <button
                  type="button"
                  aria-label={`Remove ${origin}`}
                  onClick={() =>
                    setOrigins((current) =>
                      current.filter((item) => item !== origin),
                    )
                  }
                  className="cursor-pointer text-text-muted hover:text-danger"
                >
                  <i className="fi fi-rr-cross-small" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {(validationError || error) && <Alert>{validationError || error}</Alert>}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={cancel}
            disabled={creating}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={creating}
            disabled={!name.trim() || origins.length === 0}
          >
            Generate key
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CreateApiKeyModal;
