import React, { useState } from "react";
import type { KeyCredentials } from "@/services/apiService";
import type { CompanyApiKey } from "../types/apiKey.types";
import {
  countUniqueOrigins,
  normalizeAllowedOrigin,
} from "../utils/origins";

const MAX_COMPANY_ORIGINS = 20;

interface EditApiKeyModalProps {
  apiKey: CompanyApiKey;
  existingOrigins: string[];
  saving: boolean;
  onCancel: () => void;
  onSubmit: (id: string, credentials: KeyCredentials) => Promise<boolean>;
}

export default function EditApiKeyModal({
  apiKey,
  existingOrigins,
  saving,
  onCancel,
  onSubmit,
}: EditApiKeyModalProps) {
  const [name, setName] = useState(apiKey.name);
  const [originInput, setOriginInput] = useState("");
  const [origins, setOrigins] = useState(apiKey.allowedOrigins ?? []);
  const [validationError, setValidationError] = useState("");

  const currentOrigins = new Set(
    existingOrigins.map(
      (origin) =>
        normalizeAllowedOrigin(origin.trim()) ?? origin.trim().toLowerCase(),
    ),
  );
  const originCount = countUniqueOrigins([...existingOrigins, ...origins]);

  const addOrigin = () => {
    const origin = normalizeAllowedOrigin(originInput.trim());
    if (!origin) {
      setValidationError("Enter a valid origin, such as https://example.com.");
      return;
    }
    if (origins.some((item) => item.toLowerCase() === origin.toLowerCase())) {
      setValidationError("This origin has already been added.");
      return;
    }
    if (
      !currentOrigins.has(origin.toLowerCase()) &&
      countUniqueOrigins([...existingOrigins, ...origins, origin]) >
        MAX_COMPANY_ORIGINS
    ) {
      setValidationError(
        `A company can have up to ${MAX_COMPANY_ORIGINS} unique allowed origins.`,
      );
      return;
    }

    setOrigins((current) => [...current, origin]);
    setOriginInput("");
    setValidationError("");
  };

  const submit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      setValidationError("Enter a name for this API key.");
      return;
    }
    if (origins.length === 0) {
      setValidationError("Add at least one allowed origin.");
      return;
    }
    if (originCount > MAX_COMPANY_ORIGINS) {
      setValidationError(
        `A company can have up to ${MAX_COMPANY_ORIGINS} unique allowed origins.`,
      );
      return;
    }

    if (await onSubmit(apiKey.id, { name: name.trim(), allowedOrigins: origins })) {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-api-key-title"
        onSubmit={(event) => void submit(event)}
        className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-5 sm:p-6"
      >
        <h3
          id="edit-api-key-title"
          className="font-heading text-xl font-semibold"
        >
          Edit API key
        </h3>
        <p className="mt-2 text-sm leading-6 text-text-muted">
          Update the key name and allowed origins. Changes apply to this key
          only.
        </p>

        <label
          htmlFor="edit-api-key-name"
          className="mt-5 block text-xs font-medium text-text-muted"
        >
          Key name
        </label>
        <input
          id="edit-api-key-name"
          required
          maxLength={100}
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-2 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-text focus-visible:ring-2 focus-visible:ring-primary/40"
        />

        <div className="mt-5 flex items-center justify-between gap-3">
          <label
            htmlFor="edit-api-key-origin"
            className="block text-xs font-medium text-text-muted"
          >
            Allowed origins
          </label>
          <span className="text-xs text-text-muted">
            {originCount} / {MAX_COMPANY_ORIGINS} after saving
          </span>
        </div>
        <div className="mt-2 flex gap-2">
          <input
            id="edit-api-key-origin"
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
            className="min-w-0 flex-1 rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-text focus-visible:ring-2 focus-visible:ring-primary/40"
          />
          <button
            type="button"
            onClick={addOrigin}
            disabled={!originInput.trim()}
            className="cursor-pointer rounded-lg border border-border px-3 py-2 text-sm font-medium transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add origin
          </button>
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
                  <i className="fi fi-rr-cross-small" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {validationError && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {validationError}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="cursor-pointer rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !name.trim() || origins.length === 0}
            className="cursor-pointer rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
