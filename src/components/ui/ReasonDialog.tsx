import { useState, type ReactNode } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import FormField from "@/components/ui/FormField";

export interface ReasonDialogProps {
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  destructive?: boolean;
  /** ask for a written reason (min 5 characters) */
  requireReason?: boolean;
  reasonLabel?: string;
  /** the user must type this exactly (e.g. the company slug) */
  confirmText?: string;
  busy?: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

/** Confirmation with a written reason and/or typed confirmation (audited admin actions). */
export default function ReasonDialog({
  title,
  description,
  confirmLabel,
  destructive = false,
  requireReason = true,
  reasonLabel = "Reason (shown in the company's audit log)",
  confirmText,
  busy = false,
  onConfirm,
  onClose,
}: ReasonDialogProps) {
  const [reason, setReason] = useState("");
  const [typed, setTyped] = useState("");
  const reasonOk = !requireReason || reason.trim().length >= 5;
  const typedOk = !confirmText || typed.trim() === confirmText;
  return (
    <Modal open title={title} onClose={onClose} size="md">
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (reasonOk && typedOk && !busy) onConfirm(reason.trim());
        }}
      >
        {description && <div className="text-sm leading-6 text-text-muted">{description}</div>}
        {requireReason && (
          <FormField label={reasonLabel} htmlFor="reason-dialog-reason" error={reason && !reasonOk ? "At least 5 characters" : undefined}>
            <Input id="reason-dialog-reason" autoFocus value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Requested by the company in ticket #1234" />
          </FormField>
        )}
        {confirmText && (
          <FormField label={`Type ${confirmText} to confirm`} htmlFor="reason-dialog-confirm">
            <Input id="reason-dialog-confirm" autoFocus={!requireReason} value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={confirmText} autoComplete="off" />
          </FormField>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant={destructive ? "destructive" : "primary"} disabled={!reasonOk || !typedOk} loading={busy}>{confirmLabel}</Button>
        </div>
      </form>
    </Modal>
  );
}
