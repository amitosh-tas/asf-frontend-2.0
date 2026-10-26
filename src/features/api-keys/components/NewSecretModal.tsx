interface NewSecretModalProps {
  secret: string | null;
  copied: boolean;
  copyError: string;
  onCopy: () => void;
  onClose: () => void;
}

export default function NewSecretModal({
  secret,
  copied,
  copyError,
  onCopy,
  onClose,
}: NewSecretModalProps) {
  if (!secret) return null;

  const downloadSecret = () => {
    const file = new Blob([secret], { type: "text/plain;charset=utf-8" });
    const fileUrl = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = "api-key.txt";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(fileUrl), 0);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-secret-title"
        className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-5 sm:p-6"
      >
        <h3
          id="new-secret-title"
          className="font-heading text-xl font-semibold"
        >
          Your new API key is ready
        </h3>

        <p className="mt-2 text-sm leading-6 text-text-muted">
          Copy and securely save this key now. The full key won't be
          available from the key list after you close this window.
        </p>

        <div className="mt-5 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
          Never share this key publicly or commit it to source control.
        </div>

        <label
          htmlFor="new-api-secret"
          className="mt-5 block text-xs font-medium text-text-muted"
        >
          Your new secret key
        </label>

        <div className="mt-2 flex items-start gap-2">
          <textarea
            id="new-api-secret"
            readOnly
            value={secret}
            rows={3}
            onFocus={(event) => event.currentTarget.select()}
            className="min-w-0 flex-1 resize-none break-all rounded-lg border border-border bg-surface-muted p-3 font-mono text-sm focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>

        {copyError && (
          <p role="alert" className="mt-2 text-xs text-danger">
            {copyError}
          </p>
        )}

        <p className="mt-3 text-xs text-text-muted">
          Save this key in your password manager or secure secrets storage.
        </p>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCopy}
            className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium transition hover:bg-surface-muted"
          >
            <i
              className={` flex
                ${copied
                  ? "fi fi-rr-check text-green-600"
                  : "fi fi-rr-copy-alt"} ` 
              }
            />
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            type="button"
            onClick={downloadSecret}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition hover:bg-surface-muted"
          >
            <i className="fi fi-rr-download flex" aria-hidden="true" />
            Download key
          </button>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
          >
            I've saved my key
          </button>
        </div>
      </div>
    </div>
  );
}