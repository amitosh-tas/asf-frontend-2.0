import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Section } from "@/features/insights/components/Kpi";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";
import { api } from "@/services/api";

/** Two-factor login (4.10; required for platform admins). Works with any authenticator app. */
export default function TwoFactor({ enabled, onChanged, required = false }: { enabled: boolean; onChanged?: () => void; required?: boolean }) {
  const [setup, setSetup] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const call = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
      setSetup(null);
      setCode("");
      onChanged?.();
    } catch (e) {
      toast.error(getRequestErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Section title="Two-factor login" subtitle={enabled ? "On: you sign in with your password and a 6-digit code." : required ? "Required for your account: set it up to continue." : "Add a 6-digit code from an authenticator app to your sign-in."}>
      {!enabled && !setup && (
        <Button type="button" loading={busy} onClick={async () => {
          try {
            const { data } = await api.post("/api/auth/2fa/setup");
            setSetup(data);
          } catch (e) {
            toast.error(getRequestErrorMessage(e));
          }
        }}>Set up two-factor login</Button>
      )}
      {setup && (
        <div className="flex flex-col gap-3 text-sm">
          <p>1. In your authenticator app, add an account with this key (or open the link on your phone):</p>
          <code className="w-max rounded bg-surface-muted px-2 py-1 font-mono tracking-wider">{setup.secret.match(/.{1,4}/g)?.join(" ")}</code>
          <a href={setup.otpauthUrl} className="text-xs underline">Open in authenticator app</a>
          <p>2. Enter the 6-digit code it shows:</p>
          <div className="flex gap-2">
            <Input aria-label="Code" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className="w-32" />
            <Button type="button" disabled={code.length !== 6} loading={busy} onClick={() => call(() => api.post("/api/auth/2fa/enable", { code }), "Two-factor login is on")}>Turn on</Button>
          </div>
        </div>
      )}
      {enabled && !required && (
        <div className="flex flex-wrap gap-2">
          <Input aria-label="Password" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-44" />
          <Input aria-label="Code" inputMode="numeric" placeholder="6-digit code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className="w-32" />
          <Button type="button" variant="destructive" disabled={!password || code.length !== 6} loading={busy} onClick={() => call(() => api.post("/api/auth/2fa/disable", { code, password }), "Two-factor login is off")}>Turn off</Button>
        </div>
      )}
    </Section>
  );
}

/** Reads the current 2FA state from the session, then renders the card. */
export function TwoFactorFromSession({ required = false }: { required?: boolean }) {
  const [version, setVersion] = useState(0);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    api.get<{ decoded: { twoFactorEnabled?: boolean } }>("/api/auth/me").then(
      (r) => !cancelled && setEnabled(Boolean(r.data.decoded?.twoFactorEnabled)),
      () => !cancelled && setEnabled(false),
    );
    return () => {
      cancelled = true;
    };
  }, [version]);
  if (enabled === null) return null;
  return <TwoFactor enabled={enabled} required={required} onChanged={() => setVersion((v) => v + 1)} />;
}
