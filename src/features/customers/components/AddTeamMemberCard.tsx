
import { useState } from "react";
import toast from "react-hot-toast";

import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import FormField from "@/components/ui/FormField";
import Button from "@/components/ui/Button";

import { useAppSelector } from "@/app/hooks";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";
import { addTeamUser } from "@/services/companyServices";

type CompanyRole = "company_admin" | "company_viewer";

interface AddTeamMemberCardProps {
  onUserCreated?: () => Promise<void>;
}

function AddTeamMemberCard({
  onUserCreated,
}: AddTeamMemberCardProps) {
  const currentRole = useAppSelector(
    (state) => state.auth.user?.role,
  );

  const canAddMember = currentRole === "company_admin";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<CompanyRole>("company_viewer");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (submitting) return;

    const payload = {
      name: name.trim(),
      email: email.trim(),
      password,
      role,
    };

    setSubmitting(true);

    try {
      await addTeamUser(payload);

      setName("");
      setEmail("");
      setPassword("");
      setRole("company_viewer");

      toast.success("Team member added successfully.");
      await onUserCreated?.();
    } catch (requestError: unknown) {
      toast.error(getRequestErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  if (!canAddMember) return null;

  return (
    <section className="w-full rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="mb-6">
        <h2 className="font-heading text-base font-semibold tracking-tight text-text">
          Add team member
        </h2>

        <p className="mt-1 text-xs text-text-muted">
          Create a workspace account and assign its access level.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 xl:grid-cols-5"
      >
        <FormField label="Name" htmlFor="team-member-name">
          <Input
            id="team-member-name"
            name="name"
            required
            disabled={submitting}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
          />
        </FormField>

        <FormField label="Email" htmlFor="team-member-email">
          <Input
            id="team-member-email"
            name="email"
            type="email"
            required
            disabled={submitting}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@example.com"
          />
        </FormField>

        <FormField label="Password" htmlFor="team-member-password">
          <Input
            id="team-member-password"
            name="password"
            type="password"
            showPasswordToggle
            minLength={8}
            required
            disabled={submitting}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
        </FormField>

        <FormField label="Role" htmlFor="team-member-role">
          <Select
            id="team-member-role"
            name="role"
            value={role}
            disabled={submitting}
            onChange={(e) =>
              setRole(e.target.value as CompanyRole)
            }
          >
            <option value="company_admin">Admin</option>
            <option value="company_viewer">Viewer</option>
          </Select>
        </FormField>

        <Button
          type="submit"
          loading={submitting}
          disabled={submitting}
        >
          Add member
        </Button>
      </form>
    </section>
  );
}

export default AddTeamMemberCard;
