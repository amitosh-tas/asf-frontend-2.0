import { useState } from "react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import FormField from "@/components/ui/FormField";
import { Section } from "@/features/insights/components/Kpi";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";
import {
  deleteCompanyData,
  rebuildWorkspaceRollups,
  replayWorkspaceEvents,
  rerunWorkspaceAttribution,
  rotateCompanyKeyAdmin,
} from "@/services/platfromAdmin";

interface KeyOption {
  id: string;
  name: string;
  keyPrefix?: string;
  mode?: string;
}

/**
 * Support tools (scope 4.9): replay events, re-run attribution, rebuild reports, rotate a key,
 * reset a company's data. Each needs a written reason, which the company sees in its audit log.
 */
export default function SupportTools({ workspaceId, slug, apiKeys, onDone }: { workspaceId: string; slug: string; apiKeys: KeyOption[]; onDone?: () => void }) {
  const [reason, setReason] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [replayStatus, setReplayStatus] = useState<"failed" | "dead" | "all">("failed");
  const [keyId, setKeyId] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const okReason = reason.trim().length >= 5;
  const range = { from: from || undefined, to: to || undefined };

  const run = async (name: string, fn: () => Promise<unknown>, message: (r: unknown) => string) => {
    setBusy(name);
    try {
      const r = await fn();
      toast.success(message(r));
      onDone?.();
    } catch (e) {
      toast.error(getRequestErrorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Section title="Support tools" subtitle="Every action is audited with your reason and shown to the company.">
      <div className="flex flex-col gap-5">
        <FormField label="Reason (required, 5+ characters)" htmlFor="support-reason">
          <Input id="support-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Ticket #1234: Zenoti webhooks failed on 12 Oct" />
        </FormField>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <FormField label="From (optional)" htmlFor="support-from">
            <Input id="support-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </FormField>
          <FormField label="To (optional)" htmlFor="support-to">
            <Input id="support-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </FormField>
          <FormField label="Events to replay" htmlFor="support-status">
            <Select id="support-status" value={replayStatus} onChange={(e) => setReplayStatus(e.target.value as typeof replayStatus)} className="w-full">
              <option value="failed">Failed and waiting</option>
              <option value="dead">Dead letters</option>
              <option value="all">All received events</option>
            </Select>
          </FormField>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={!okReason || !!busy} loading={busy === "replay"}
            onClick={() => run("replay", async () => (await replayWorkspaceEvents(workspaceId, { reason: reason.trim(), status: replayStatus, ...range })).data, (r) => `Replay done: ${JSON.stringify(r)}`)}>
            Replay events
          </Button>
          <Button type="button" variant="outline" disabled={!okReason || !!busy} loading={busy === "rerun"}
            onClick={() => run("rerun", () => rerunWorkspaceAttribution(workspaceId, { reason: reason.trim(), ...range }), () => "Attribution re-run queued")}>
            Re-run attribution
          </Button>
          <Button type="button" variant="outline" disabled={!okReason || !!busy} loading={busy === "rebuild"}
            onClick={() => run("rebuild", () => rebuildWorkspaceRollups(workspaceId, reason.trim()), () => "Report rebuild queued")}>
            Rebuild reports
          </Button>
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <p className="text-sm font-medium">Rotate an API key</p>
          <p className="text-xs text-text-muted">The old key keeps working for 24 hours so the company can switch over.</p>
          <div className="flex flex-wrap gap-2">
            <Select aria-label="API key" value={keyId} onChange={(e) => setKeyId(e.target.value)} className="w-72">
              <option value="">Choose a key…</option>
              {apiKeys.map((k) => (
                <option key={k.id} value={k.id}>{k.name} {k.keyPrefix ? `(${k.keyPrefix}…)` : ""} {k.mode ?? ""}</option>
              ))}
            </Select>
            <Button type="button" variant="outline" disabled={!okReason || !keyId || !!busy} loading={busy === "rotate"}
              onClick={() => run("rotate", async () => {
                const { data } = await rotateCompanyKeyAdmin(keyId, reason.trim());
                setNewKey(data.key);
                return data;
              }, () => "Key rotated")}>
              Rotate key
            </Button>
          </div>
          {newKey && (
            <div className="rounded-md border border-border bg-surface-muted p-3 text-xs">
              <p className="mb-1 font-medium">New key: shown once. Send it to the company over a secure channel.</p>
              <code className="break-all">{newKey}</code>
              <div className="mt-2 flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => void navigator.clipboard?.writeText(newKey)}>Copy</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setNewKey(null)}>I saved it</Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <p className="text-sm font-medium text-danger">Reset company data</p>
          <p className="text-xs text-text-muted">Deletes every visit, customer, order, booking and report row. Users, keys, sites and settings stay. Type <code>{slug}</code> to confirm.</p>
          <div className="flex flex-wrap gap-2">
            <Input aria-label="Confirm slug" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={slug} className="w-56" />
            <Button type="button" variant="destructive" disabled={!okReason || confirm !== slug || !!busy} loading={busy === "purge"}
              onClick={() => run("purge", async () => {
                await deleteCompanyData(workspaceId, { reason: reason.trim(), confirm, keepAccount: true });
                setConfirm("");
              }, () => "Company data deleted")}>
              Delete data
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}
