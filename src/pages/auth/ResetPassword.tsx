import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import AuthShell from "@/components/auth/AuthShell";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import FormField from "@/components/ui/FormField";
import { resetPassword } from "@/services/authService";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";
import { passwordProblem } from "@/features/auth/passwordPolicy";

/** /reset-password?token=… — set a new password (signs out every other session). */
export default function ResetPassword() {
  const [params] = useSearchParams();
  const { token: pathToken } = useParams();
  const token = params.get("token") ?? pathToken ?? "";
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const problem = password ? passwordProblem(password) : null;

  if (!token) {
    return (
      <AuthShell title="Link not valid" subtitle="This reset link is missing its token. Ask for a new one.">
        <Link to="/forgot-password" className="text-sm font-semibold underline">Request a new link</Link>
      </AuthShell>
    );
  }
  return (
    <AuthShell title="Choose a new password" subtitle="At least 10 characters, with a letter and a number.">
      <form
        className="flex flex-col gap-6"
        onSubmit={async (e) => {
          e.preventDefault();
          if (problem) return toast.error(problem);
          if (password !== confirm) return toast.error("The passwords do not match.");
          setBusy(true);
          try {
            await resetPassword(token, password);
            toast.success("Password changed. Sign in with your new password.");
            navigate("/signin", { replace: true });
          } catch (err) {
            toast.error(getRequestErrorMessage(err));
          } finally {
            setBusy(false);
          }
        }}
      >
        <FormField label="New password" htmlFor="password" error={problem ?? undefined}>
          <Input id="password" type="password" showPasswordToggle autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </FormField>
        <FormField label="Confirm password" htmlFor="confirm">
          <Input id="confirm" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </FormField>
        <Button type="submit" loading={busy} className="w-full">Save password</Button>
      </form>
    </AuthShell>
  );
}
