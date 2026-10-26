import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import { Section } from "@/features/insights/components/Kpi";
import { useAsync } from "@/features/insights/hooks/useReport";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";
import { api } from "@/services/api";

interface Checklist { steps: { key: string; label: string; done: boolean; detail?: string | null; action?: string }[]; completed: number; total: number; live: boolean }
interface TestResult { ok: boolean; steps: { step: string; ok: boolean; message: string }[]; note?: string }

/** Setup checklist + test event tool (4.1): go live in under 30 minutes without help. */
export default function SetupChecklist({ canRunTest }: { canRunTest: boolean }) {
  const list = useAsync<Checklist>(async () => (await api.get<Checklist>("/api/workspace/setup-checklist")).data, []);
  const [result, setResult] = useState<TestResult | null>(null);
  const [running, setRunning] = useState(false);
  if (list.data?.live && !result) return null;
  const test = async () => {
    setRunning(true);
    try {
      const { data } = await api.post<TestResult>("/api/workspace/test-events", {});
      setResult(data);
    } catch (e) {
      const data = (e as { response?: { data?: TestResult } }).response?.data;
      if (data?.steps) setResult(data);
      else toast.error(getRequestErrorMessage(e));
    } finally {
      setRunning(false);
      list.reload();
    }
  };
  return (
    <Section title="Setup checklist" subtitle={list.data ? `${list.data.completed} of ${list.data.total} done` : undefined} actions={canRunTest ? <Button type="button" variant="outline" loading={running} onClick={test}>Send test event</Button> : undefined}>
      <ol className="flex flex-col gap-2 text-sm">
        {(list.data?.steps ?? []).map((s, i) => (
          <li key={s.key} className="flex items-start gap-3">
            <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${s.done ? "bg-success text-white" : "border border-border text-text-muted"}`}>{s.done ? "✓" : i + 1}</span>
            <span>
              {s.label}
              {s.action && !s.done && <Link to={s.action.split("#")[0]} className="ml-2 text-xs underline">Open</Link>}
              {s.detail && <span className="block text-xs text-text-muted">{s.detail}</span>}
            </span>
          </li>
        ))}
      </ol>
      {result && (
        <div className={`mt-4 rounded-md border p-3 text-sm ${result.ok ? "border-success/30 bg-success/5" : "border-danger/30 bg-danger/5"}`}>
          {result.steps.map((s) => <p key={s.step}>{s.ok ? "✓" : "✗"} {s.message}</p>)}
          {result.note && <p className="mt-1 text-xs text-text-muted">{result.note}</p>}
        </div>
      )}
    </Section>
  );
}
