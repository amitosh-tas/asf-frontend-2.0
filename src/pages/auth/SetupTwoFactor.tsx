import { useNavigate } from "react-router-dom";
import AuthShell from "@/components/auth/AuthShell";
import Button from "@/components/ui/Button";
import TwoFactor from "@/features/settings/TwoFactor";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { getMe, logoutUser } from "@/services/authService";
import { logout, setCredentials } from "@/store/slices/authSlice";

/**
 * Platform admins must use two-factor login (scope 4.9). The backend refuses every other call
 * until it is set up, so this page is all they can reach until then.
 */
export default function SetupTwoFactor() {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const enabled = Boolean(user?.twoFactorEnabled);
  return (
    <AuthShell
      title="Two-factor login required"
      subtitle={enabled ? "Your account has two-factor login on, but this session has not passed it. Sign out and sign in again with your code." : "Platform admin accounts must use an authenticator app. Set it up to continue."}
    >
      {!enabled && (
        <TwoFactor
          enabled={false}
          required
          onChanged={async () => {
            const me = await getMe();
            dispatch(setCredentials(me));
            navigate(me.role === "platform_admin" ? "/super" : "/", { replace: true });
          }}
        />
      )}
      <Button
        type="button"
        variant="ghost"
        className="mt-6"
        onClick={async () => {
          await logoutUser().catch(() => {});
          dispatch(logout());
          navigate("/signin", { replace: true });
        }}
      >
        Sign out
      </Button>
    </AuthShell>
  );
}
