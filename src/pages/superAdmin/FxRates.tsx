import { useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import DataTable from "@/components/ui/DataTable";
import Input from "@/components/ui/Input";
import { ErrorBox, Section } from "@/features/insights/components/Kpi";
import { useAsync } from "@/features/insights/hooks/useReport";
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

/**
 * Daily FX rates are fetched and persisted by the backend from Frankfurter.
 * The platform admin only needs to inspect the rates here; rates must not be
 * entered manually in the frontend.
 */
export default function FxRates() {
  const [page, setPage] = useState(1);
  const [date, setDate] = useState("");
  const [base, setBase] = useState("");
  const params = { page, limit: 50, date: date || undefined, base: base.trim() || undefined };
  const rates = useAsync<Page>(async () => (await api.get<Page>("/api/platform-admin/fx-rates", { params })).data, [JSON.stringify(params)]);

  return (
    <PageLayout headTitle="FX rates" title="Exchange rates" description="Rates are fetched automatically from Frankfurter. 1 BASE = rate × QUOTE.">
      <Section title="Automatic exchange rates" subtitle="The backend fetches and stores daily rates from Frankfurter. No manual upload is required.">
        <p className="text-sm text-text-muted">
          Rates are applied by the backend when revenue and order values are converted to each workspace's reporting currency.
        </p>
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
