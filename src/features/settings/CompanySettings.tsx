import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import FormField from "@/components/ui/FormField";
import { Section } from "@/features/insights/components/Kpi";
import { useAsync } from "@/features/insights/hooks/useReport";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";
import { ATTRIBUTION_MODELS } from "@/services/insights";
import { api } from "@/services/api";

export interface WorkspaceSettings {
  id: string;
  name: string;
  slug: string;
  country: string;
  timezone: string;
  reportingCurrency: string;
  weekStart: number;
  defaultModel: string;
  lookbackDays: number;
  lookbackOverrides: Record<string, number> | null;
  consentMode: "off" | "opt_in" | "opt_out";
  rawRetentionMonths: number;
  taxIncludedInRevenue: boolean;
  /** absent until the database has the column (see backend manual-migrations) */
  fxRateMode?: "transaction_date" | "latest";
  websiteUrl: string | null;
  industry: string | null;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Company profile + attribution settings (5.10). Changing timezone / currency / model / lookback recalculates reports. */
export default function CompanySettings() {
  const settings = useAsync<WorkspaceSettings>(async () => (await api.get<{ data: WorkspaceSettings }>("/api/workspace/settings")).data.data, []);
  const [form, setForm] = useState<WorkspaceSettings | null>(null);
  const [overrides, setOverrides] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!settings.data) return;
    setForm(settings.data);
    setOverrides(Object.entries(settings.data.lookbackOverrides ?? {}).map(([k, v]) => `${k}=${v}`).join(", "));
  }, [settings.data]);

  if (!form) return <Section title="Company profile"><p className="text-sm text-text-muted">{settings.error ?? "Loading…"}</p></Section>;
  const set = <K extends keyof WorkspaceSettings>(key: K, value: WorkspaceSettings[K]) => setForm({ ...form, [key]: value });

  const save = async () => {
    let parsed: Record<string, number> | null = null;
    if (overrides.trim()) {
      parsed = {};
      for (const part of overrides.split(",")) {
        const [k, v] = part.split("=").map((x) => x.trim());
        if (!k || !Number.isInteger(Number(v))) {
          toast.error('Lookback overrides look like "email=7, meta=28"');
          return;
        }
        parsed[k] = Number(v);
      }
    }
    setSaving(true);
    try {
      const { data } = await api.patch("/api/workspace/settings", {
        name: form.name,
        country: form.country,
        timezone: form.timezone,
        reportingCurrency: form.reportingCurrency,
        weekStart: Number(form.weekStart),
        defaultModel: form.defaultModel,
        lookbackDays: Number(form.lookbackDays),
        lookbackOverrides: parsed,
        consentMode: form.consentMode,
        rawRetentionMonths: Number(form.rawRetentionMonths),
        taxIncludedInRevenue: form.taxIncludedInRevenue,
        ...(form.fxRateMode ? { fxRateMode: form.fxRateMode } : {}),
        websiteUrl: form.websiteUrl || null,
      });
      toast.success(data.message ?? "Settings saved");
      settings.reload();
    } catch (e) {
      toast.error(getRequestErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section title="Company profile & attribution" subtitle="Changing the timezone, currency, model, lookback or tax setting recalculates every report" actions={<Button type="button" loading={saving} onClick={save}>Save</Button>}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <FormField label="Company name" htmlFor="s-name"><Input id="s-name" value={form.name} onChange={(e) => set("name", e.target.value)} /></FormField>
        <FormField label="Website" htmlFor="s-web"><Input id="s-web" value={form.websiteUrl ?? ""} onChange={(e) => set("websiteUrl", e.target.value)} placeholder="https://example.com" /></FormField>
        <FormField label="Country (ISO-2)" htmlFor="s-country"><Input id="s-country" maxLength={2} value={form.country} onChange={(e) => set("country", e.target.value.toUpperCase())} /></FormField>
        <FormField label="Timezone (IANA)" htmlFor="s-tz" hint="Days in every report follow this timezone"><Input id="s-tz" value={form.timezone} onChange={(e) => set("timezone", e.target.value)} placeholder="Asia/Kolkata" /></FormField>
        <FormField label="Reporting currency" htmlFor="s-cur"><Input id="s-cur" maxLength={3} value={form.reportingCurrency} onChange={(e) => set("reportingCurrency", e.target.value.toUpperCase())} /></FormField>
        <FormField label="Week starts on" htmlFor="s-week">
          <Select id="s-week" value={form.weekStart} onChange={(e) => set("weekStart", Number(e.target.value))}>{DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}</Select>
        </FormField>
        <FormField label="Default attribution model" htmlFor="s-model">
          <Select id="s-model" value={form.defaultModel} onChange={(e) => set("defaultModel", e.target.value)}>{ATTRIBUTION_MODELS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}</Select>
        </FormField>
        <FormField label="Lookback window (days)" htmlFor="s-lb"><Input id="s-lb" type="number" min={1} max={365} value={form.lookbackDays} onChange={(e) => set("lookbackDays", Number(e.target.value))} /></FormField>
        <FormField label="Lookback per channel" htmlFor="s-lbo" hint='e.g. "email=7, meta=28"'><Input id="s-lbo" value={overrides} onChange={(e) => setOverrides(e.target.value)} /></FormField>
        <FormField label="Consent mode" htmlFor="s-consent" hint="Opt-in: nothing is tracked until the visitor agrees">
          <Select id="s-consent" value={form.consentMode} onChange={(e) => set("consentMode", e.target.value as WorkspaceSettings["consentMode"])}>
            <option value="off">Off (no consent banner)</option>
            <option value="opt_in">Opt-in (GDPR / UK GDPR / DPDP)</option>
            <option value="opt_out">Opt-out (CCPA)</option>
          </Select>
        </FormField>
        <FormField label="Keep raw payloads (months)" htmlFor="s-ret"><Input id="s-ret" type="number" min={1} max={120} value={form.rawRetentionMonths} onChange={(e) => set("rawRetentionMonths", Number(e.target.value))} /></FormField>
        <FormField label="Tax" htmlFor="s-tax">
          <Select id="s-tax" value={form.taxIncludedInRevenue ? "1" : "0"} onChange={(e) => set("taxIncludedInRevenue", e.target.value === "1")}>
            <option value="0">Exclude tax from revenue (recommended)</option>
            <option value="1">Include tax in revenue</option>
          </Select>
        </FormField>
        {form.fxRateMode && (
          <FormField label="Exchange rates (sales & bookings in other currencies)" htmlFor="s-fx">
            <Select id="s-fx" value={form.fxRateMode} onChange={(e) => set("fxRateMode", e.target.value as "transaction_date" | "latest")}>
              <option value="transaction_date">Rate of each sale's / booking's date (past totals stay stable)</option>
              <option value="latest">Today's rate (every sale and booking re-valued as rates move)</option>
            </Select>
            <p className="mt-1 text-xs text-text-muted">
              Rates update automatically every hour from the ECB reference rates. With "Rate of each date", a day's
              sales are corrected when that day's rate changes. With "Today's rate", all totals in {form.reportingCurrency} move
              with the latest rate.
            </p>
          </FormField>
        )}
      </div>
    </Section>
  );
}
