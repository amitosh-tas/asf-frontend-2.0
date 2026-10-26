import { useState } from "react";
import toast from "react-hot-toast";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";
import { mergeCustomers } from "@/services/companyServices";
import type { Customer } from "./CustomerTable";

interface MergeCustomersModalProps {
  /** The duplicate: it is merged INTO the customer you pick. */
  source: Customer;
  /** Candidates (customers on the current page). */
  candidates: Customer[];
  onClose: () => void;
  onMerged: () => void;
}

const label = (customer: Customer) => customer.email ?? `Customer ${customer.id.slice(0, 8)}`;

export default function MergeCustomersModal({ source, candidates, onClose, onMerged }: MergeCustomersModalProps) {
  const options = candidates.filter((customer) => customer.id !== source.id);
  const [targetId, setTargetId] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const target = options.find((customer) => customer.id === targetId);

  const submit = async () => {
    if (!target || !confirmed || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const { data } = await mergeCustomers(source.id, target.id);
      const { orders, bookings, visitors } = data.moved;
      toast.success(`Merged. Moved ${orders} order${orders === 1 ? "" : "s"}, ${bookings} booking${bookings === 1 ? "" : "s"} and ${visitors} visitor${visitors === 1 ? "" : "s"}.`);
      onMerged();
      onClose();
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open title="Merge duplicate customer" description={`Merge ${label(source)} into another customer.`} onClose={onClose}>
      <form
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <FormField label="Keep this customer" htmlFor="merge-target" hint="Only customers on the current page are listed. Go to the page that contains the customer you want to keep to merge across pages.">
          <Select id="merge-target" value={targetId} onChange={(event) => { setTargetId(event.target.value); setConfirmed(false); }} disabled={options.length === 0}>
            <option value="">{options.length === 0 ? "No other customers on this page" : "Select a customer…"}</option>
            {options.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {label(customer)}
              </option>
            ))}
          </Select>
        </FormField>

        {target && (
          <>
            <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-text-muted">
              <li>
                Orders, bookings and visits of <strong className="text-text">{label(source)}</strong> move to <strong className="text-text">{label(target)}</strong>.
              </li>
              <li>“New” vs “returning” is recalculated over the combined order history.</li>
              <li>The merged record is kept as an archived duplicate so history stays traceable. Attribution credit on past orders is not recalculated.</li>
            </ul>
            <label className="flex items-start gap-2 text-sm text-text">
              <input type="checkbox" className="mt-1" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
              <span>I understand this merge cannot be undone from the dashboard.</span>
            </label>
          </>
        )}

        {error && <Alert>{error}</Alert>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting} disabled={!target || !confirmed}>
            Merge customers
          </Button>
        </div>
      </form>
    </Modal>
  );
}
