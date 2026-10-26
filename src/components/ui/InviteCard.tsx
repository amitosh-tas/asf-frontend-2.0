import { useState } from "react";
import { useAppSelector } from "@/app/hooks";
import toast from "react-hot-toast";
// import { addTeamUser } from "@/services/companyServices";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";
import Input from "@/components/ui/Input";
import { addPlatformAdmin } from "@/services/platfromAdmin";

interface InviteCardProps {
  onUserCreated?: () => Promise<void>;
}

function InviteCard({ onUserCreated }: InviteCardProps) {
  const currentRole = useAppSelector((state) => state.auth.user?.role);
  const canInvite = currentRole === "platform_admin";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;

    const payload = {
      name,
      email,
      password,
      role: "platform_admin" as const,
    };

    setSubmitting(true);

    try {
      await addPlatformAdmin(payload);

      setName("");
      setEmail("");
      setPassword("");

      toast.success("Platform admin created successfully.");
      await onUserCreated?.();
    } catch (requestError: unknown) {
      toast.error(getRequestErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  if (!canInvite) return null;

  return (
    <section className="w-full rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-heading text-base font-semibold tracking-tight text-text">
          Add platform administrator
        </h2>

        <p className="text-xs text-text-muted">
          Create an administrator account for the platform.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted">
            Name
          </label>
          <Input
            required
            disabled={submitting}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted">
            Email
          </label>
          <Input
            required
            disabled={submitting}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted">
            Password
          </label>
          <Input
            required
            disabled={submitting}
            type="password"
            showPasswordToggle
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={submitting}
            className="h-10 rounded-lg w-full cursor-pointer bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Create admin"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default InviteCard;