import type { CompanyApiKey } from "../types/apiKey.types";

interface RevokeApiKeyModalProps {
  apiKey: Pick<CompanyApiKey, "id" | "name"> | null;
  revoking: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function RevokeApiKeyModal({
  apiKey,
  revoking,
  onCancel,
  onConfirm,
}: RevokeApiKeyModalProps) {
  if (!apiKey) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="revoke-api-key-title"
        className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-5 sm:p-6"
      >
        <h3
          id="revoke-api-key-title"
          className="font-heading text-lg font-medium"
        >
          Revoke API key?
        </h3>
        <p className="mt-2 text-sm leading-6 text-text-muted">
          Revoking{" "}
          <span className="font-medium text-text">{apiKey.name}</span>{" "}
          will stop integrations using it from authenticating. This action
          cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            disabled={revoking}
            onClick={onCancel}
            className="cursor-pointer rounded-lg border border-border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={revoking}
            onClick={onConfirm}
            className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {revoking ? "Revoking…" : "Revoke key"}
          </button>
        </div>
      </div>
    </div>
  );
}
