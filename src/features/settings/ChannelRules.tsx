import { useState } from "react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Section } from "@/features/insights/components/Kpi";
import { useAsync } from "@/features/insights/hooks/useReport";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";
import { api } from "@/services/api";

interface Rule { id: string; priority: number; match: Record<string, unknown>; channel: string; isActive: boolean }

/** Channel mapping rules (4.1 / 5.10): "utm_source contains newsletter → email". Saving re-runs attribution. */
export default function ChannelRules() {
  const rules = useAsync<Rule[]>(async () => (await api.get<{ data: Rule[] }>("/api/workspace/channel-rules")).data.data, []);
  const [draft, setDraft] = useState({ field: "source", value: "", channel: "", priority: "10" });
  const run = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn();
      toast.success(ok);
      rules.reload();
    } catch (e) {
      toast.error(getRequestErrorMessage(e));
    }
  };
  const add = () =>
    run(() => api.post("/api/workspace/channel-rules", { priority: Number(draft.priority), match: { [draft.field]: draft.value }, channel: draft.channel }), "Rule saved — attribution is being recalculated");

  return (
    <Section title="Channel mapping rules" subtitle="Rules run lowest priority first and win over the default channel classification">
      <div className="mb-4 flex flex-wrap items-end gap-2">
        <select aria-label="Field" value={draft.field} onChange={(e) => setDraft({ ...draft, field: e.target.value })} className="h-10 rounded-md border border-border px-2 text-sm">
          {["source", "medium", "campaign", "referrerHost", "landingPage", "content", "term"].map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <Input aria-label="contains" placeholder="contains…" value={draft.value} onChange={(e) => setDraft({ ...draft, value: e.target.value })} className="w-40" />
        <Input aria-label="channel" placeholder="→ channel (e.g. email)" value={draft.channel} onChange={(e) => setDraft({ ...draft, channel: e.target.value })} className="w-48" />
        <Input aria-label="priority" type="number" value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value })} className="w-24" />
        <Button type="button" disabled={!draft.value || !draft.channel} onClick={add}>Add rule</Button>
      </div>
      <ul className="divide-y divide-border text-sm">
        {(rules.data ?? []).map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-2 py-2">
            <span>
              <span className="text-text-muted">#{r.priority}</span> {Object.entries(r.match).map(([k, v]) => `${k} contains "${typeof v === "object" ? JSON.stringify(v) : String(v)}"`).join(" and ")} → <strong>{r.channel}</strong>
              {!r.isActive && <span className="text-text-muted"> (off)</span>}
            </span>
            <span className="flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => run(() => api.patch(`/api/workspace/channel-rules/${r.id}`, { isActive: !r.isActive }), "Rule updated")}>{r.isActive ? "Turn off" : "Turn on"}</Button>
              <Button type="button" size="sm" variant="destructive" onClick={() => run(() => api.delete(`/api/workspace/channel-rules/${r.id}`), "Rule deleted")}>Delete</Button>
            </span>
          </li>
        ))}
        {rules.data?.length === 0 && <li className="py-2 text-text-muted">No rules: the default classification is used.</li>}
      </ul>
    </Section>
  );
}
