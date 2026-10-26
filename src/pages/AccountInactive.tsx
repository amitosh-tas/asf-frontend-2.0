import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { logout } from "@/store/slices/authSlice";
import { logoutUser } from "@/services/authService";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";
import Title from "@/components/ui/Title";
import Button from "@/components/ui/Button";

function AccountInactive() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const accountStatus = useAppSelector((state) => state.auth.user?.status);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const isDeactivated = accountStatus?.toLowerCase() === "deactivated";

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await logoutUser();
      toast.success("Signed out successfully.");
    } catch (error) {
      console.error("Logout API failed:", error);
      toast.error(getRequestErrorMessage(error));
    } finally {
      dispatch(logout());
      navigate("/signin", { replace: true });
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-page-background px-5 py-12">
      <main className="w-full max-w-lg rounded-3xl border border-border bg-card px-6 py-10 text-center shadow-lg sm:px-10">
        <p className="font-heading text-lg font-bold tracking-tight text-text">
          <Title/>
        </p>

        <div
          aria-hidden="true"
          className="mx-auto mt-8 flex size-14 items-center justify-center rounded-full bg-surface-muted text-danger"
        >
          <span className="font-heading text-2xl font-semibold">!</span>
        </div>

        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-danger">
          Account status: {isDeactivated ? "deactivated" : "inactive"}
        </p>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-text">
          {isDeactivated
            ? "Your account has been deactivated"
            : "Your account is not active"}
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-text-muted">
          You can’t access your workspace while your account is inactive.
          Please contact your workspace administrator to have your access
          reviewed.
        </p>

        <Button
          type="button"
          onClick={() => void handleSignOut()}
          disabled={isSigningOut}
          className="mt-7"
        >
          {isSigningOut ? "Signing out..." : "Sign out"}
        </Button>
      </main>
    </div>
  );
}

export default AccountInactive;
