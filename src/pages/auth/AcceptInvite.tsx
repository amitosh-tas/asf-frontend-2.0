import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import AuthShell from "@/components/auth/AuthShell";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import FormField from "@/components/ui/FormField";
import { acceptInvite } from "@/services/authService";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";
import { passwordProblem } from "@/features/auth/passwordPolicy";

/** /accept-invite?token=… — a teammate sets their name and password. */
export default function AcceptInvite() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const problem = password ? passwordProblem(password) : null;

  if (!token) {
    return (
      <AuthShell title="Invite link not valid" subtitle="Ask your company admin to send a new invite.">
        <Link to="/signin" className="text-sm font-semibold underline">Go to sign in</Link>
      </AuthShell>
    );
  }
  return (
    <AuthShell title="Join your team" subtitle="Set your name and a password to finish creating your account.">
      <form
        className="flex flex-col gap-6"
        onSubmit={async (e) => {
          e.preventDefault();
          if (problem) return toast.error(problem);
          setBusy(true);
          try {
            await acceptInvite(token, name.trim(), password);
            toast.success("Account created. Sign in to continue.");
            navigate("/signin", { replace: true });
          } catch (err) {
            toast.error(getRequestErrorMessage(err));
          } finally {
            setBusy(false);
          }
        }}
      >
        <FormField label="Your name" htmlFor="name">
          <Input id="name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <FormField label="Password" htmlFor="password" error={problem ?? undefined}>
          <Input id="password" type="password" showPasswordToggle autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </FormField>
        <Button type="submit" loading={busy} className="w-full">Create account</Button>
      </form>
    </AuthShell>
  );
}
