import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import PageLayout from "@/components/layout/PageLayout";
import DataTable from "@/components/ui/DataTable";
import Button from "@/components/ui/Button";
import ReportToolbar from "@/features/insights/components/ReportToolbar";
import TrendChart from "@/features/insights/components/TrendChart";
import { Kpi, KpiGrid, Section, Warnings, ErrorBox } from "@/features/insights/components/Kpi";
import { useAsync, useReport, useReportFilters, useViewWorkspaceId } from "@/features/insights/hooks/useReport";
import { formatMinorCompact, formatMinorUnits, formatNumber } from "@/features/reports/utils/formatting";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";
import { reportUrl, type CacReport, type SpendReport } from "@/services/insights";
import { api } from "@/services/api";
import { useAppSelector } from "@/app/hooks";

interface AdAccount { id: string; platform: string; name: string; externalAccountId: string; timezone: string | null; currency: string | null; status: string; lastSyncedAt: string | null; lastError: string | null }

/** Ad spend and CAC (scope 4.8 / 5.8). */
export default function AdSpend() {
  const workspaceId = useViewWorkspaceId();
  const role = useAppSelector((state: { auth: { user?: { role?: string } } }) => state.auth.user?.role);
  const canManage = !workspaceId && role === "company_admin";
  const { filters, update, query } = useReportFilters();
  const cac = useReport<CacReport>("cac", query, workspaceId);
  const spend = useReport<SpendReport>("spend", query, workspaceId);
  const accounts = useAsync<{ data: AdAccount[]; platforms: Record<string, boolean> }>(async () => (await api.get("/api/workspace/ad-accounts")).data, [], canManage);
  const fileRef = useRef<HTMLInputElement>(null);
  const [params, setParams] = useSearchParams();
  // result of the Meta / Google sign-in redirect (?adAccounts=connected|cancelled|error)
  useEffect(() => {
    const result = params.get("adAccounts");
    if (!result) return;
    if (result === "connected") toast.success(`Ad account connected (${params.get("count") ?? "1"}). The first sync is running.`);
    else if (result === "cancelled") toast("Connection cancelled.");
    else toast.error(params.get("message") ?? "Could not connect the ad account.");
    const next = new URLSearchParams(params);
    ["adAccounts", "count", "message"].forEach((k) => next.delete(k));
    setParams(next, { replace: true });
  }, [params, setParams]);
  const [uploading, setUploading] = useState(false);
  const cur = cac.data?.currency ?? "USD";
  const money = (v: string | null | undefined) => (v === null || v === undefined ? "—" : formatMinorUnits(v, cur));

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const { data } = await api.post("/api/workspace/ad-spend/upload", { csv: await file.text() });
      toast.success(`Spend saved: ${data.inserted} new, ${data.updated} updated${data.errors.length ? `, ${data.errors.length} rows skipped` : ""}`);
      if (data.errors.length) toast.error(`Line ${data.errors[0].line}: ${data.errors[0].message}`);
      cac.reload();
      spend.reload();
    } catch (e) {
      toast.error(getRequestErrorMessage(e));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };
  const connect = async (platform: "meta" | "google") => {
    try {
      const { data } = await api.post<{ url: string }>(`/api/workspace/ad-accounts/oauth/${platform}/start`);
      window.location.href = data.url;
    } catch (e) {
      toast.error(getRequestErrorMessage(e));
    }
  };
  const sync = async (id: string) => {
    try {
      const { data } = await api.post(`/api/workspace/ad-accounts/${id}/sync`, { days: 30 });
      toast.success(`Synced ${data.rows ?? 0} rows`);
      accounts.reload();
      cac.reload();
      spend.reload();
    } catch (e) {
      toast.error(getRequestErrorMessage(e));
    }
  };

  return (
    <PageLayout headTitle="Marketing" title="Ad spend & CAC" description="Spend by platform and campaign, blended and per-channel CAC, ROAS and cost per booking."
      actions={
        <ReportToolbar filters={filters} onChange={update} workspaceId={workspaceId} lastUpdated={cac.data?.lastUpdated} csv={{ url: reportUrl("spend", workspaceId), query, filename: "ad-spend.csv" }} />
      }
    >
      <ErrorBox error={cac.error ?? spend.error} onRetry={() => (cac.reload(), spend.reload())} />
      <Warnings warnings={[...(cac.data?.warnings ?? [])]} />
      <KpiGrid>
        <Kpi label="Ad spend" value={money(cac.data?.spendMinorUnits)} loading={cac.loading} hint={spend.data ? `${formatNumber(spend.data.impressions)} impressions · ${formatNumber(spend.data.clicks)} clicks` : undefined} />
        <Kpi label="Blended CAC" value={money(cac.data?.blendedCacMinorUnits)} loading={cac.loading} hint={cac.data ? `${cac.data.newCustomers} new customers` : undefined} />
        <Kpi label="ROAS" value={cac.data?.roas === null || !cac.data ? "—" : `${cac.data.roas}×`} loading={cac.loading} hint="attributed revenue ÷ spend" />
        <Kpi label="Cost per booking" value={money(cac.data?.costPerBookingMinorUnits)} loading={cac.loading} hint={cac.data ? `${cac.data.bookingsCreated} bookings` : undefined} />
      </KpiGrid>
      <Section title="Spend vs revenue" subtitle="Per local day">
        <TrendChart
          loading={spend.loading}
          data={(spend.data?.trend ?? []).map((d) => ({ date: d.date, spend: Number(d.spendMinorUnits), revenue: Number(d.netMinorUnits) }))}
          series={[{ key: "revenue", label: "Net revenue", color: "#111111" }, { key: "spend", label: "Spend", color: "#3b82f6" }]}
          format={(v) => formatMinorCompact(v, cur)}
        />
      </Section>
      <DataTable
        tableHead="CAC by channel"
        tableSubHead={cac.data?.definition}
        loading={cac.loading}
        data={cac.data?.byChannel ?? []}
        getRowKey={(r) => r.channel}
        emptyMessage="No spend recorded for this period. Connect an ad account or upload a CSV."
        columns={[
          { key: "ch", header: "Channel", render: (r) => r.label },
          { key: "sp", header: "Spend", align: "right", render: (r) => money(r.spendMinorUnits) },
          { key: "nc", header: "New customers", align: "right", render: (r) => formatNumber(r.newCustomers, 2) },
          { key: "cac", header: "CAC", align: "right", render: (r) => money(r.cacMinorUnits) },
          { key: "rev", header: "Revenue", align: "right", render: (r) => money(r.netMinorUnits) },
          { key: "roas", header: "ROAS", align: "right", render: (r) => (r.roas === null ? "—" : `${r.roas}×`) },
        ]}
      />
      <div className="mt-6">
        <DataTable
          tableHead="Campaigns"
          loading={spend.loading}
          data={spend.data?.campaigns ?? []}
          getRowKey={(r) => `${r.platform}-${r.campaign}`}
          columns={[
            { key: "c", header: "Campaign", render: (r) => r.campaign },
            { key: "p", header: "Platform", render: (r) => r.platform },
            { key: "s", header: "Spend", align: "right", render: (r) => money(r.spendMinorUnits) },
            { key: "i", header: "Impressions", align: "right", render: (r) => formatNumber(r.impressions) },
            { key: "k", header: "Clicks", align: "right", render: (r) => formatNumber(r.clicks) },
            { key: "ctr", header: "CTR", align: "right", render: (r) => (r.ctr === null ? "—" : `${r.ctr}%`) },
            { key: "cpc", header: "CPC", align: "right", render: (r) => money(r.cpcMinorUnits) },
          ]}
        />
      </div>
      {cac.data && cac.data.payback.length > 0 && (
        <Section title="Payback" subtitle={cac.data.paybackMonths === null ? "New customers have not yet paid back the blended CAC" : `New customers pay back the blended CAC in month ${cac.data.paybackMonths}`}>
          <TrendChart
            xKey="month"
            data={cac.data.payback.map((p) => ({ month: `M${p.monthsSinceAcquisition}`, revenue: Number(p.cumulativeRevenuePerCustomerMinorUnits), cac: Number(cac.data?.blendedCacMinorUnits ?? 0) }))}
            series={[{ key: "revenue", label: "Cumulative revenue per new customer", color: "#15803d" }, { key: "cac", label: "Blended CAC", color: "#b91c1c", dashed: true }]}
            format={(v) => formatMinorCompact(v, cur)}
          />
        </Section>
      )}
      {canManage && (
        <Section title="Spend sources" subtitle="Meta and Google Ads sync daily by OAuth; any other channel can be uploaded as CSV">
          <div className="mb-4 flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={!accounts.data?.platforms.meta} onClick={() => connect("meta")}>Connect Meta Ads</Button>
            <Button type="button" variant="outline" disabled={!accounts.data?.platforms.google} onClick={() => connect("google")}>Connect Google Ads</Button>
            <Button type="button" loading={uploading} onClick={() => fileRef.current?.click()}>Upload spend CSV</Button>
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          </div>
          <p className="mb-4 text-xs text-text-muted">CSV columns: date (YYYY-MM-DD), channel, campaign, spend, currency, impressions, clicks, ad_set, ad, location. Re-uploading a day replaces it.</p>
          {(accounts.data?.data ?? []).map((a) => (
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-border py-2 text-sm">
              <span>
                <strong>{a.name}</strong> <span className="text-text-muted">({a.platform} · {a.timezone ?? "tz ?"} · {a.currency ?? "?"})</span>
                {a.lastError && <span className="block text-xs text-danger">{a.lastError}</span>}
              </span>
              <span className="flex items-center gap-2 text-xs text-text-muted">
                {a.lastSyncedAt ? `synced ${new Date(a.lastSyncedAt).toLocaleString()}` : "never synced"}
                <Button type="button" size="sm" variant="outline" onClick={() => sync(a.id)}>Sync now</Button>
              </span>
            </div>
          ))}
        </Section>
      )}
    </PageLayout>
  );
}
