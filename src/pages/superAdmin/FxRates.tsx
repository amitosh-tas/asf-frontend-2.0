import { useState } from "react";
import toast from "react-hot-toast";
import PageLayout from "@/components/layout/PageLayout";
import DataTable from "@/components/ui/DataTable";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { ErrorBox, Section } from "@/features/insights/components/Kpi";
import { useAsync } from "@/features/insights/hooks/useReport";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";
import { api } from "@/services/api";

interface Rate {
  id: string;
  date: string;
  base: string;
  quote: string;
  rate: number | string;
  source: string | null;
}
interface Page {
  data: Rate[];
  pagination: { page: number; limit: number; total: number; pages: number };
}
type Row = { date: string; base: string; quote: string; rate: number };

/** Parse "date,base,quote,rate" lines (header optional). */
export function parseRates(text: string): { rows: Row[]; errors: string[] } {
  const rows: Row[] = [];
  const errors: string[] = [];
  text.split(/\r?\n/).forEach((line, i) => {
    const cells = line.split(/[,;\t]/).map((c) => c.trim());
    if (!line.trim() || /^date$/i.test(cells[0])) return;
    const [date, base, quote, rate] = cells;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? "") || !/^[A-Za-z]{3}$/.test(base ?? "") || !/^[A-Za-z]{3}$/.test(quote ?? "") || !(Number(rate) > 0)) {
      errors.push(`Line ${i + 1}: ${line}`);
      return;
    }
    rows.push({ date, base: base.toUpperCase(), quote: quote.toUpperCase(), rate: Number(rate) });
  });
  return { rows, errors };
}

/**
 * Daily FX rates (scope 4.4): each order stores the rate of its order date, so a company that sells in
 * several currencies reports in one. Uploading fills in orders that had no rate yet; others never change.
 */
export default function FxRates() {
  const [page, setPage] = useState(1);
  const [date, setDate] = useState("");
  const [base, setBase] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const params = { page, limit: 50, date: date || undefined, base: base.trim() || undefined };
  const rates = useAsync<Page>(async () => (await api.get<Page>("/api/platform-admin/fx-rates", { params })).data, [JSON.stringify(params)]);
  const parsed = parseRates(text);

  return (
    <PageLayout headTitle="FX rates" title="Exchange rates" description="One rate per day and currency pair. 1 BASE = rate × QUOTE.">
      <Section title="Upload rates" subtitle="Paste CSV lines: date,base,quote,rate (e.g. 2026-10-01,USD,INR,83.12) or choose a file.">
        <div className="flex flex-col gap-3">
          <input
            type="file"
            accept=".csv,text/csv,text/plain"
            className="text-sm"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) setText(await file.text());
            }}
          />
          <textarea className="min-h-32 rounded-md border border-border bg-card p-3 font-mono text-xs" value={text} onChange={(e) => setText(e.target.value)} placeholder="date,base,quote,rate" />
          {parsed.errors.length > 0 && <p className="text-xs text-danger">{parsed.errors.length} line(s) not valid: {parsed.errors.slice(0, 3).join(" · ")}</p>}
          <div>
            <Button
              type="button"
              loading={busy}
              disabled={!parsed.rows.length || parsed.errors.length > 0}
              onClick={async () => {
                setBusy(true);
                try {
                  const { data } = await api.post<{ written: number; backfilled: number }>("/api/platform-admin/fx-rates", { rates: parsed.rows });
                  toast.success(`${data.written} rate(s) saved, ${data.backfilled} order(s) filled in`);
                  setText("");
                  rates.reload();
                } catch (err) {
                  toast.error(getRequestErrorMessage(err));
                } finally {
                  setBusy(false);
                }
              }}
            >
              Save {parsed.rows.length || ""} rate{parsed.rows.length === 1 ? "" : "s"}
            </Button>
          </div>
        </div>
      </Section>
      <div className="flex flex-wrap gap-3">
        <Input aria-label="Date" type="date" value={date} onChange={(e) => { setDate(e.target.value); setPage(1); }} className="w-44" />
        <Input aria-label="Base currency" placeholder="Base (e.g. USD)" maxLength={3} value={base} onChange={(e) => { setBase(e.target.value); setPage(1); }} className="w-36" />
      </div>
      <ErrorBox error={rates.error} onRetry={rates.reload} />
      <DataTable
        data={rates.data?.data ?? []}
        loading={rates.loading}
        getRowKey={(r) => r.id}
        emptyMessage="No rates yet."
        pagination={rates.data ? { ...rates.data.pagination, isLoading: rates.loading, onPageChange: setPage } : undefined}
        columns={[
          { key: "date", header: "Date", render: (r) => r.date },
          { key: "pair", header: "Pair", render: (r) => `${r.base} → ${r.quote}` },
          { key: "rate", header: "Rate", align: "right", render: (r) => String(r.rate) },
          { key: "src", header: "Source", render: (r) => r.source ?? "—" },
        ]}
      />
    </PageLayout>
  );
}
