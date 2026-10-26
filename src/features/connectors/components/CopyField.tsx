import { useState } from "react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";

interface CopyFieldProps {
  label: string;
  value: string;
  /** Hide the value until the user chooses to reveal it (for secrets). */
  secret?: boolean;
}

export default function CopyField({ label, value, secret = false }: CopyFieldProps) {
  const [revealed, setRevealed] = useState(!secret);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied.`);
    } catch {
      toast.error(`Unable to copy the ${label.toLowerCase()}. Select and copy it manually.`);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-text">{label}</p>
      <code className="block break-all rounded-lg border border-border bg-surface-muted p-3 text-xs text-text">
        {revealed ? value : "•".repeat(Math.min(value.length, 32))}
      </code>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => void copy()} icon={<i className="fi fi-rr-copy" aria-hidden="true" />}>
          Copy
        </Button>
        {secret && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setRevealed((current) => !current)}>
            {revealed ? "Hide" : "Show"}
          </Button>
        )}
      </div>
    </div>
  );
}
