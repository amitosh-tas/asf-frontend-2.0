import { useState } from "react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Section } from "@/features/insights/components/Kpi";
import { useAsync } from "@/features/insights/hooks/useReport";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";
import { api } from "@/services/api";

interface Location { id: string; name: string; timezone: string; currency: string; externalIds: Record<string, string> | null; isActive: boolean }

/** Locations (4.1): name, timezone, currency, external ids (e.g. the Zenoti center id). */
export default function LocationsManager() {
  const list = useAsync<Location[]>(async () => (await api.get<{ data: Location[] }>("/api/workspace/locations")).data.data, []);
  const [draft, setDraft] = useState({ name: "", timezone: "", currency: "", zenoti: "" });
  const run = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn();
      toast.success(ok);
      list.reload();
    } catch (e) {
      toast.error(getRequestErrorMessage(e));
    }
  };
  return (
    <Section title="Locations" subtitle="Each location's timezone sets its own day boundaries in reports">
      <div className="mb-4 flex flex-wrap gap-2">
        <Input aria-label="Name" placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="w-44" />
        <Input aria-label="Timezone" placeholder="Timezone (Asia/Dubai)" value={draft.timezone} onChange={(e) => setDraft({ ...draft, timezone: e.target.value })} className="w-48" />
        <Input aria-label="Currency" placeholder="Currency" maxLength={3} value={draft.currency} onChange={(e) => setDraft({ ...draft, currency: e.target.value.toUpperCase() })} className="w-24" />
        <Input aria-label="Zenoti center id" placeholder="Zenoti center id (optional)" value={draft.zenoti} onChange={(e) => setDraft({ ...draft, zenoti: e.target.value })} className="w-56" />
        <Button
          type="button"
          disabled={!draft.name}
          onClick={() =>
            run(() => api.post("/api/workspace/locations", { name: draft.name, timezone: draft.timezone || undefined, currency: draft.currency || undefined, externalIds: draft.zenoti ? { zenoti: draft.zenoti } : null }), "Location added").then(() => setDraft({ name: "", timezone: "", currency: "", zenoti: "" }))
          }
        >
          Add location
        </Button>
      </div>
      <ul className="divide-y divide-border text-sm">
        {(list.data ?? []).map((l) => (
          <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <span>
              <strong>{l.name}</strong> <span className="text-text-muted">{l.timezone} · {l.currency}{l.externalIds ? ` · ${Object.entries(l.externalIds).map(([k, v]) => `${k}: ${v}`).join(", ")}` : ""}</span>
              {!l.isActive && <span className="text-text-muted"> (inactive)</span>}
            </span>
            <span className="flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => run(() => api.patch(`/api/workspace/locations/${l.id}`, { isActive: !l.isActive }), "Location updated")}>{l.isActive ? "Deactivate" : "Activate"}</Button>
              <Button type="button" size="sm" variant="destructive" onClick={() => run(() => api.delete(`/api/workspace/locations/${l.id}`), "Location deleted")}>Delete</Button>
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
