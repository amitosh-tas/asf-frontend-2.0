import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import AuthShell from "@/components/auth/AuthShell";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import FormField from "@/components/ui/FormField";
import { requestPasswordReset } from "@/services/authService";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";

/** Ask for a reset link. The answer is the same whether or not the email exists. */
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <AuthShell title="Reset your password" subtitle={sent ? "If an account exists for that email, a reset link is on its way. It expires in one hour." : "Enter your work email and we'll send you a reset link."}>
      {!sent && (
        <form
          className="flex flex-col gap-6"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await requestPasswordReset(email.trim());
              setSent(true);
            } catch (err) {
              toast.error(getRequestErrorMessage(err));
            } finally {
              setBusy(false);
            }
          }}
        >
          <FormField label="Email address" htmlFor="email">
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </FormField>
          <Button type="submit" loading={busy} className="w-full">Send reset link</Button>
        </form>
      )}
      <p className="mt-8 text-center text-sm text-text-muted">
        <Link to="/signin" className="font-semibold text-text underline underline-offset-4">Back to sign in</Link>
      </p>
    </AuthShell>
  );
}
