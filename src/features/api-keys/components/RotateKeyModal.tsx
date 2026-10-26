import type { CompanyApiKey } from "../types/apiKey.types";

interface RotateKeyModalProps {
  apiKey: CompanyApiKey | null;
  rotating: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function RotateKeyModal({
  apiKey,
  rotating,
  onCancel,
  onConfirm,
}: RotateKeyModalProps) {
  if (!apiKey) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rotate-title"
        className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-5 sm:p-6"
      >
        <h3 id="rotate-title" className="font-heading text-lg font-medium">
          Rotate API key?
        </h3>

        <p className="mt-2 text-sm leading-6 text-text-muted">
          You're about to rotate{" "}
          <span className="font-medium text-text">
            {apiKey.name}
          </span>
          . Your integration may need the new key. Make sure you save it
          after rotation.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            disabled={rotating}
            onClick={onCancel}
            className="cursor-pointer rounded-lg border border-border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={rotating}
            onClick={onConfirm}
            className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {rotating ? "Rotating…" : "Confirm rotation"}
          </button>
        </div>
      </div>
    </div>
  );
}