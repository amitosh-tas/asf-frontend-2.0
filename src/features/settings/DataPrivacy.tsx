import { useState } from "react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Section } from "@/features/insights/components/Kpi";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";
import { api } from "@/services/api";
import ReasonDialog from "@/components/ui/ReasonDialog";

async function saveJson(url: string, filename: string) {
  const { data } = await api.get(url);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** Data (5.10): company export, customer export and deletion (GDPR / DPDP / CCPA requests). */
export default function DataPrivacy() {
  const [customerId, setCustomerId] = useState("");
  const [erasing, setErasing] = useState(false);
  const [busy, setBusy] = useState(false);
  const act = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
    } catch (e) {
      toast.error(getRequestErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Section title="Data & privacy" subtitle="Retention is set in the company profile above. Customer ids are on the Customers screen.">
      <div className="flex flex-col gap-4 text-sm">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" loading={busy} onClick={() => act(() => saveJson("/api/workspace/data/export?include=orders,bookings,refunds,customers,credits", "company-export.json"), "Export downloaded")}>Export company data (JSON)</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input aria-label="Customer id" placeholder="Customer id" value={customerId} onChange={(e) => setCustomerId(e.target.value.trim())} className="max-w-xs" />
          <Button type="button" variant="outline" disabled={!customerId || busy} onClick={() => act(() => saveJson(`/api/workspace/customers/${customerId}/export`, `customer-${customerId}.json`), "Customer data downloaded")}>Export customer</Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!customerId || busy}
            onClick={() => setErasing(true)}
          >
            Erase customer
          </Button>
        </div>
      </div>
      {erasing && (
        <ReasonDialog
          title="Erase this customer's personal data?"
          description="Their email, phone, visits and identifiers are deleted. Orders and revenue stay, without anything that identifies the person. This cannot be undone."
          reasonLabel="Reason (e.g. the request number)"
          confirmLabel="Erase personal data"
          destructive
          busy={busy}
          onClose={() => setErasing(false)}
          onConfirm={(reason) => {
            setErasing(false);
            void act(() => api.post(`/api/workspace/customers/${customerId}/erase`, { confirm: true, reason }), "Personal data erased; revenue history kept anonymously");
          }}
        />
      )}
    </Section>
  );
}
