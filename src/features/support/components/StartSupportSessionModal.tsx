import { useState } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";
import { startSupportSession } from "@/services/supportSessionService";
import type { StoredSupportSession } from "@/services/supportSessionStore";

const REASON_MIN = 10;
const REASON_MAX = 500;
const DURATIONS = [15, 30, 60, 120] as const;

interface StartSupportSessionModalProps {
  workspaceId: string;
  workspaceName?: string;
  onStarted: (session: StoredSupportSession) => void;
  onCancel: () => void;
}

export default function StartSupportSessionModal({ workspaceId, workspaceName, onStarted, onCancel }: StartSupportSessionModalProps) {
  const [reason, setReason] = useState("");
  const [minutes, setMinutes] = useState<number>(30);
  const [maskPii, setMaskPii] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const trimmed = reason.trim();
  const reasonValid = trimmed.length >= REASON_MIN && trimmed.length <= REASON_MAX;

  const submit = async () => {
    if (!reasonValid || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const session = await startSupportSession({ workspaceId, reason: trimmed, durationMinutes: minutes, maskPii });
      onStarted(session);
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open
      title="Start a support session"
      description={`You are about to view ${workspaceName ? `“${workspaceName}”` : "this company"}'s data. The company can see this session, your reason and when it happened.`}
      onClose={onCancel}
    >
      <form
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <FormField
          label="Reason for access"
          htmlFor="support-reason"
          hint={`${trimmed.length}/${REASON_MAX} · at least ${REASON_MIN} characters. Shown to the company, e.g. “Investigating ticket 4821”.`}
          error={reason.length > 0 && trimmed.length < REASON_MIN ? `Please give at least ${REASON_MIN} characters.` : undefined}
        >
          <textarea
            id="support-reason"
            required
            rows={3}
            maxLength={REASON_MAX}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-text shadow-sm placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Why do you need to look at this company's data?"
          />
        </FormField>

        <FormField label="Session length" htmlFor="support-duration" hint="The session ends automatically. You can end it earlier.">
          <Select id="support-duration" value={minutes} onChange={(event) => setMinutes(Number(event.target.value))}>
            {DURATIONS.map((value) => (
              <option key={value} value={value}>
                {value < 60 ? `${value} minutes` : `${value / 60} hour${value === 60 ? "" : "s"}`}
              </option>
            ))}
          </Select>
        </FormField>

        <label className="flex items-start gap-2 text-sm text-text">
          <input type="checkbox" className="mt-1" checked={maskPii} onChange={(event) => setMaskPii(event.target.checked)} />
          <span>
            <span className="font-medium">Mask personal data</span>
            <span className="block text-xs text-text-muted">Hides customer emails. Recommended unless you need them to resolve the issue.</span>
          </span>
        </label>

        {!maskPii && <Alert>Personal data will be visible, and the company will see that this session was unmasked.</Alert>}
        {error && <Alert>{error}</Alert>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting} disabled={!reasonValid}>
            Start session
          </Button>
        </div>
      </form>
    </Modal>
  );
}
