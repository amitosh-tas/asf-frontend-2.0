import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import AuthShell from "@/components/auth/AuthShell";
import { verifyEmail } from "@/services/authService";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";

/** /verify-user?verifytoken=… — the link in the sign-up email. */
export default function VerifyEmail() {
  const [params] = useSearchParams();
  const { token: pathToken } = useParams();
  const token = params.get("verifytoken") ?? params.get("token") ?? pathToken ?? "";
  const [state, setState] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    verifyEmail(token).then(
      (r) => !cancelled && setState({ ok: true, message: r.message }),
      (e) => !cancelled && setState({ ok: false, message: getRequestErrorMessage(e) }),
    );
    return () => {
      cancelled = true;
    };
  }, [token]);

  const result = token ? state : { ok: false, message: "This link is missing its verification token." };
  return (
    <AuthShell title={!result ? "Verifying your email…" : result.ok ? "Email verified" : "Verification failed"} subtitle={result?.message}>
      {result && (
        <div className="flex flex-col gap-3 text-sm">
          <Link to="/signin" className="font-semibold underline underline-offset-4">Go to sign in</Link>
          {!result.ok && <p className="text-text-muted">Links expire after 24 hours. Sign in with your email and password to get a new one.</p>}
        </div>
      )}
    </AuthShell>
  );
}
