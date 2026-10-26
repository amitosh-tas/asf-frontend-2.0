import { useState } from "react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";
import DataTable from "@/components/ui/DataTable";
import { Section } from "@/features/insights/components/Kpi";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";
import { formatDateTime } from "@/features/reports/utils/formatting";
import { api } from "@/services/api";

export interface PendingInvite {
  id: string;
  email: string;
  role: string;
  allowedLocationIds?: string[];
  expiresAt: string;
  createdAt?: string;
}
export interface LocationOption {
  id: string;
  name: string;
}

/** Checkbox list of locations. Nothing ticked = every location. */
export function LocationPicker({ options, value, onChange }: { options: LocationOption[]; value: string[]; onChange: (ids: string[]) => void }) {
  if (!options.length) return <p className="text-xs text-text-muted">No locations yet. Add them under Settings → Locations to limit access.</p>;
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs text-text-muted">Leave all unticked to allow every location.</p>
      <div className="grid max-h-48 grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2">
        {options.map((l) => (
          <label key={l.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={value.includes(l.id)}
              onChange={(e) => onChange(e.target.checked ? [...value, l.id] : value.filter((id) => id !== l.id))}
            />
            {l.name}
          </label>
        ))}
      </div>
    </div>
  );
}

/** Invite by email (scope 4.11): the teammate sets their own password from the email link. */
export function InviteForm({ locations, onInvited }: { locations: LocationOption[]; onInvited: () => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("company_viewer");
  const [allowed, setAllowed] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  return (
    <Section title="Invite a teammate" subtitle="They get an email link to set their password. Invites expire after 7 days.">
      <form
        className="flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await api.post("/api/workspace/invites", { email: email.trim(), role, allowedLocationIds: role === "company_viewer" ? allowed : [] });
            toast.success(`Invite sent to ${email.trim()}`);
            setEmail("");
            setAllowed([]);
            onInvited();
          } catch (err) {
            toast.error(getRequestErrorMessage(err));
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_200px_auto] sm:items-end">
          <FormField label="Email" htmlFor="invite-email">
            <Input id="invite-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@company.com" />
          </FormField>
          <FormField label="Role" htmlFor="invite-role">
            <Select id="invite-role" value={role} onChange={(e) => setRole(e.target.value)} className="w-full">
              <option value="company_viewer">Viewer (read only)</option>
              <option value="company_admin">Admin</option>
            </Select>
          </FormField>
          <Button type="submit" loading={busy}>Send invite</Button>
        </div>
        {role === "company_viewer" && <LocationPicker options={locations} value={allowed} onChange={setAllowed} />}
      </form>
    </Section>
  );
}

export function PendingInvites({ invites, locations }: { invites: PendingInvite[]; locations: LocationOption[] }) {
  if (!invites.length) return null;
  const names = new Map(locations.map((l) => [l.id, l.name]));
  return (
    <DataTable
      tableHead="Pending invites"
      tableSubHead={`${invites.length} waiting to be accepted`}
      data={invites}
      getRowKey={(i) => i.id}
      columns={[
        { key: "email", header: "Email", render: (i) => i.email },
        { key: "role", header: "Role", render: (i) => i.role.replace("company_", "") },
        { key: "loc", header: "Locations", render: (i) => (i.allowedLocationIds?.length ? i.allowedLocationIds.map((id) => names.get(id) ?? id).join(", ") : "All") },
        { key: "exp", header: "Expires", render: (i) => formatDateTime(i.expiresAt) },
      ]}
    />
  );
}

/** Change which locations a teammate can see (viewers only; admins always see everything). */
export function LocationAccessModal({
  user,
  locations,
  onClose,
  onSaved,
}: {
  user: { id: string; name: string; allowedLocationIds?: string[] };
  locations: LocationOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [allowed, setAllowed] = useState<string[]>(user.allowedLocationIds ?? []);
  const [busy, setBusy] = useState(false);
  return (
    <Modal open onClose={onClose} title={`Locations for ${user.name}`}>
      <div className="flex flex-col gap-5">
        <LocationPicker options={locations} value={allowed} onChange={setAllowed} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            type="button"
            loading={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await api.patch(`/api/workspace/team/${user.id}`, { allowedLocationIds: allowed });
                toast.success("Location access updated");
                onSaved();
                onClose();
              } catch (err) {
                toast.error(getRequestErrorMessage(err));
              } finally {
                setBusy(false);
              }
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
